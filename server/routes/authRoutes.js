const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const sign = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'attendai_secret', { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, institution, role } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: 'All fields are required' });

  try {
    if (await User.findOne({ email }))
      return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, institution, role });
    res.status(201).json({
      token: sign(user._id),
      user: { id: user._id, name: user.name, email: user.email, institution: user.institution, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password required' });

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    res.json({
      token: sign(user._id),
      user: { id: user._id, name: user.name, email: user.email, institution: user.institution, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/auth/me (Delete account)
const auth = require('../middleware/auth');
router.delete('/me', auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account permanently deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
