const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth',       require('./routes/authRoutes'));
app.use('/api/rooms',      require('./routes/roomRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/teachers',   require('./routes/teacherRoutes'));
app.use('/api/insights',   require('./routes/insightRoutes'));
app.use('/api/alerts',     require('./routes/alertRoutes'));

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_db')
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log(err));

app.get('/', (req, res) => res.send('AttendAI API'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
