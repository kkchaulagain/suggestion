import express, { Request, Response } from 'express';
const bcrypt = require('bcrypt');
const User = require('../models/User');

const router = express.Router();

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!name) {
      return res.status(400).json({ field: 'name', error: 'Name is required' });
    }

    if (!email) {
      return res.status(400).json({ field: 'email', error: 'Email is required' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ field: 'email', error: 'Invalid email format' });
    }

    if (!password) {
      return res.status(400).json({ field: 'password', error: 'Password is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ field: 'password', error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ field: 'email', error: 'Email already registered' });
    }

    const user = await User.create({
      name,
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
    if ((err as any).code === 11000) {
      return res.status(409).json({ field: 'email', error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ field: 'email', error: 'Email is required' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ field: 'email', error: 'Invalid email format' });
    }

    if (!password) {
      return res.status(400).json({ field: 'password', error: 'Password is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(400).json({ field: 'email', error: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(400).json({ field: 'password', error: 'Invalid email or password' });
    }

    const token = Buffer.from(`${user._id}:${Date.now()}`).toString('base64url');
    return res.status(200).json({ message: 'User logged in', token });
  } catch (err) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;