const express = require('express');
const router = express.Router();
const AttendanceRecord = require('../models/AttendanceRecord');
const Room = require('../models/Room');
const Alert = require('../models/Alert');
const auth = require('../middleware/auth');
const { jsPDF } = require('jspdf');
const ExcelJS = require('exceljs');

router.use(auth);

// Get all attendance records for the institution
router.get('/', async (req, res) => {
  try {
    const records = await AttendanceRecord.find({ institution: req.user.institution })
      .populate('room')
      .populate('teacher')
      .sort({ timestamp: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Post a new attendance record
router.post('/', async (req, res) => {
  const { 
    roomId, teacherId, detectedCount, totalStrength, imageUrl,
    standingCount, sittingCount, teacherPresent, lowLight
  } = req.body;

  if (detectedCount === undefined || !totalStrength)
    return res.status(400).json({ message: 'detectedCount and totalStrength are required' });

  const present = detectedCount;
  const absent = Math.max(0, totalStrength - detectedCount);
  const attendancePercentage = totalStrength > 0 ? (present / totalStrength) * 100 : 0;

  const recordData = {
    detectedCount,
    totalStrength,
    present,
    absent,
    attendancePercentage,
    imageUrl: imageUrl || '',
    standingCount: standingCount || 0,
    sittingCount: sittingCount || 0,
    teacherPresent: !!teacherPresent,
    lowLight: !!lowLight,
    institution: req.user.institution,
    timestamp: new Date(),
  };

  if (roomId) recordData.room = roomId;
  if (teacherId) recordData.teacher = teacherId;

  try {
    const newRecord = await new AttendanceRecord(recordData).save();
    
    // Update Room current count and status
    if (roomId) {
      const room = await Room.findOne({ _id: roomId, institution: req.user.institution });
      if (room) {
        room.currentCount = detectedCount;
        const pct = (detectedCount / room.capacity) * 100;
        room.status = pct > 100 ? 'Overcrowded' : pct > 66 ? 'High' : pct > 33 ? 'Medium' : 'Low';
        await room.save();

        // 🔔 TRIGGER ALERTS
        if (pct > 100) {
          await new Alert({
            type: 'Overcrowded',
            message: `Room ${room.name} is overcrowded (${detectedCount}/${room.capacity} students).`,
            room: room._id,
            severity: 'critical',
            institution: req.user.institution
          }).save();
        } else if (attendancePercentage < 30 && totalStrength > 10) {
          await new Alert({
            type: 'Low Attendance',
            message: `Room ${room.name} has critically low attendance (${attendancePercentage.toFixed(1)}%).`,
            room: room._id,
            severity: 'warning',
            institution: req.user.institution
          }).save();
        }
        
        if (!teacherPresent) {
          await new Alert({
            type: 'Teacher Absent',
            message: `No teacher detected in Room ${room.name} during active session.`,
            room: room._id,
            severity: 'warning',
            institution: req.user.institution
          }).save();
        }
      }
    }
    
    // Update teacher average
    if (teacherId) {
      const Teacher = require('../models/Teacher');
      const teacherRecords = await AttendanceRecord.find({ teacher: teacherId, institution: req.user.institution });
      const totalPct = teacherRecords.reduce((sum, rec) => sum + rec.attendancePercentage, 0);
      const newAvg = totalPct / teacherRecords.length;
      await Teacher.findOneAndUpdate({ _id: teacherId, institution: req.user.institution }, { attendanceAverage: newAvg });
    }
    
    res.status(201).json(newRecord);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Analytics Scoped
router.get('/analytics', async (req, res) => {
  try {
    const records = await AttendanceRecord.find({ institution: req.user.institution }).sort({ timestamp: 1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reports Generation Scoped
router.get('/reports/pdf', async (req, res) => {
  try {
    const records = await AttendanceRecord.find({ institution: req.user.institution }).populate('room').populate('teacher');
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`${req.user.institution} Attendance Audit`, 20, 20);
    doc.setFontSize(10);
    let y = 40;
    records.slice(0, 40).forEach(rec => {
      doc.text(`${new Date(rec.timestamp).toLocaleDateString()} | ${rec.room?.name || 'N/A'} | ${rec.detectedCount} students | ${rec.attendancePercentage.toFixed(1)}%`, 20, y);
      y += 6;
    });
    const pdfData = doc.output();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(pdfData, 'binary'));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/reports/excel', async (req, res) => {
  try {
    const records = await AttendanceRecord.find({ institution: req.user.institution }).populate('room').populate('teacher');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance');
    worksheet.columns = [
      { header: 'Date', key: 'date' },
      { header: 'Room', key: 'room' },
      { header: 'Present', key: 'present' },
      { header: 'Percentage', key: 'pct' }
    ];
    records.forEach(rec => {
      worksheet.addRow({
        date: new Date(rec.timestamp).toLocaleString(),
        room: rec.room?.name || 'N/A',
        present: rec.detectedCount,
        pct: `${rec.attendancePercentage.toFixed(1)}%`
      });
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/predict/:roomId', async (req, res) => {
  try {
    const records = await AttendanceRecord.find({ room: req.params.roomId, institution: req.user.institution }).sort({ timestamp: 1 });
    if (records.length < 2) return res.json({ prediction: null });
    const n = records.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    records.forEach((r, i) => {
      const x = i; const y = r.detectedCount;
      sumX += x; sumY += y; sumXY += x * y; sumXX += x * x;
    });
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const prediction = Math.round(slope * n + intercept);
    res.json({ prediction: Math.max(0, prediction), trend: slope > 0 ? 'increasing' : 'decreasing' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
