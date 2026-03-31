const express = require('express');
const router  = express.Router();
const Alert   = require('../models/Alert');
const auth    = require('../middleware/auth');

router.use(auth);

// Get all recent alerts for the institution
router.get('/', async (req, res) => {
  try {
    const alerts = await Alert.find({ institution: req.user.institution })
      .populate('room', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark alert as read
router.patch('/:id/read', async (req, res) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      { isRead: true },
      { new: true }
    );
    if (!alert) return res.status(404).json({ message: 'Alert not found or unauthorized' });
    res.json(alert);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Clear all alerts
router.delete('/clear', async (req, res) => {
  try {
    await Alert.deleteMany({ institution: req.user.institution });
    res.json({ message: 'All alerts cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
