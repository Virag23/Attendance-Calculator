const express = require('express');
const router  = express.Router();
const Room    = require('../models/Room');
const auth    = require('../middleware/auth');

// All room routes require authentication
router.use(auth);

router.get('/', async (req, res) => {
  try {
    // Filter by institution
    const rooms = await Room.find({ institution: req.user.institution })
      .populate('teacher', 'name subject');
    res.json(rooms);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const room = await new Room({
      name:        req.body.name,
      capacity:    req.body.capacity,
      teacher:     req.body.teacherId || null,
      subject:     req.body.subject    || '',
      schedule:    req.body.schedule   || '',
      institution: req.user.institution, // Auto-assign institution
    }).save();
    res.status(201).json(room);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const room = await Room.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution }, // Isolation check
      { name: req.body.name, capacity: req.body.capacity,
        teacher: req.body.teacherId || null,
        subject: req.body.subject  || '',
        schedule: req.body.schedule || '' },
      { new: true }
    ).populate('teacher', 'name subject');
    if (!room) return res.status(404).json({ message: 'Room not found or unauthorized' });
    res.json(room);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const room = await Room.findOneAndDelete({ _id: req.params.id, institution: req.user.institution });
    if (!room) return res.status(404).json({ message: 'Room not found or unauthorized' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/:id/count', async (req, res) => {
  try {
    const room = await Room.findOne({ _id: req.params.id, institution: req.user.institution });
    if (!room) return res.status(404).json({ message: 'Room not found or unauthorized' });
    room.currentCount = req.body.count;
    const pct = (room.currentCount / room.capacity) * 100;
    room.status = pct > 100 ? 'Overcrowded' : pct > 66 ? 'High' : pct > 33 ? 'Medium' : 'Low';
    await room.save();
    res.json(room);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

module.exports = router;
