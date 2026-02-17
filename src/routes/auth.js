const express = require('express');
const User = require('../models/User');

const router = express.Router();

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password,
    });

    const userObj = user.toObject();
    delete userObj.password;
    res.status(201).json({
      message: 'User registered',
      user: { _id: userObj._id.toString(), email: userObj.email },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

module.exports = router;
