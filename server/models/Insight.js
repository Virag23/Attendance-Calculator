const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema({
  type: { type: String, enum: ['Trend', 'Alert', 'Success'], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Insight', insightSchema);
