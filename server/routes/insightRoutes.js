const express = require('express');
const router = express.Router();
const Insight = require('../models/Insight');

// Get all insights
router.get('/', async (req, res) => {
  try {
    const insights = await Insight.find().sort({ timestamp: -1 });
    res.json(insights);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create an insight (called by AI background process)
router.post('/', async (req, res) => {
  const insight = new Insight({
    type: req.body.type,
    message: req.body.message,
  });

  try {
    const newInsight = await insight.save();
    res.status(201).json(newInsight);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
