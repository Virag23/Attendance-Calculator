const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type:       { type: String, required: true }, // 'Overcrowded', 'Low Attendance', 'Offline', etc.
  message:    { type: String, required: true },
  room:       { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: false },
  severity:   { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
  institution: { type: String, required: true },
  isRead:     { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
