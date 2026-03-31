const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  capacity:     { type: Number, required: true },
  teacher:      { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
  subject:      { type: String, default: '' },
  schedule:     { type: String, default: '' },
  status:       { type: String, enum: ['Low', 'Medium', 'High', 'Overcrowded'], default: 'Low' },
  currentCount: { type: Number, default: 0 },
  institution:  { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
