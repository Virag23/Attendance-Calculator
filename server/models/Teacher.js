const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  attendanceAverage: { type: Number, default: 0 }, // Average attendance in their lectures
  institution:       { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);
