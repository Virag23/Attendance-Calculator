const express = require('express');
const router  = express.Router();
const Teacher = require('../models/Teacher');
const auth    = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const teachers = await Teacher.find({ institution: req.user.institution });
    res.json(teachers);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const teacher = await new Teacher({
      name:        req.body.name,
      subject:     req.body.subject,
      institution: req.user.institution,
    }).save();
    res.status(201).json(teacher);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      { name: req.body.name, subject: req.body.subject },
      { new: true }
    );
    if (!teacher) return res.status(404).json({ message: 'Teacher not found or unauthorized' });
    res.json(teacher);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findOneAndDelete({ _id: req.params.id, institution: req.user.institution });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found or unauthorized' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
