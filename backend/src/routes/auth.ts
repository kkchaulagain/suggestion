import express, { Request, Response } from 'express';
const jwt = require('jsonwebtoken'); 
const bcrypt = require('bcrypt');
const User = require('../models/User');
const router = express.Router();
const { isAuthenticated } = require('../middleware/isauthenticated');

interface RegisterBody {
  name: string;
  email: string;
  password: string;
}
interface LoginBody {
  email: string;
  password: string;
}
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = (req.body ?? {}) as Partial<RegisterBody>;
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const email = typeof data.email === 'string' ? data.email.trim() : '';
    const password = typeof data.password === 'string' ? data.password : '';

    const errors: Record<string, string> = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Invalid email format';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
        error: 'Validation failed',
      });
    }

    const existing = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Validation failed',
        errors: {
          email: 'Email already registered',
        },
        error: 'Email already registered',
      });
    }

    const user = await User.create({
      name: name || 'User',
      email: email.toLowerCase().trim(),
      password,
    });

    const userObj = user.toObject();
    delete userObj.password;

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: userObj._id,
        email: userObj.email,
      },
      user: {
        _id: userObj._id,
        email: userObj.email,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      errors: {},
      error: 'Something went wrong',
    });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = (req.body ?? {}) as Partial<LoginBody>;
    const email = typeof data.email === 'string' ? data.email.trim() : '';
    const password = typeof data.password === 'string' ? data.password : '';
    const errors: Record<string, string> = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Invalid email format';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
        error: 'Validation failed',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: {
          general: 'Invalid email or password',
        },
        error: 'Invalid email or password',
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: {
          general: 'Invalid email or password',
        },
        error: 'Invalid email or password',
      });
    }
    const tokendata = { userId: user._id };
    const token = jwt.sign(tokendata, process.env.JWT_SECRET || 'default_secret_key', { expiresIn: '1h' });
    return res.status(200).cookie('token', token, { httpOnly: true }).json({
      success: true,
      message: 'User logged in',
      data: { token },
      token,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      errors: {},
      error: 'Something went wrong',
    });
  }
});

router.get('/me', isAuthenticated, async (req: Request, res: Response) => {
     try {
       const id=req.id;
       const user = await User.findById(id).select('-password');
       if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
       }
       return res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user,
      });
     } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Something went wrong',
      });
     }
});


module.exports = router;
