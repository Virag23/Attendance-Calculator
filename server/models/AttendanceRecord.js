const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: false },
  detectedCount: { type: Number, required: true },
  totalStrength: { type: Number, required: true },
  present: { type: Number, required: true },
  absent: { type: Number, required: true },
  attendancePercentage: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: false },
  imageUrl: { type: String },
  standingCount: { type: Number, default: 0 },
  sittingCount: { type: Number, default: 0 },
  teacherPresent: { type: Boolean, default: false },
  lowLight: { type: Boolean, default: false },
  institution: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
