import express, { Request, Response } from 'express';
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Business = require('../models/Business');
const router = express.Router();
const { isAuthenticated } = require('../middleware/isauthenticated');
const { isBusinessRole } = require('../middleware/isbusiness');

interface RegisterBody {
  name: string;
  email: string;
  password: string;
  role?: 'business' | 'user' | 'governmentservices';
  location?: string;
  pancardNumber?: number | string;
  description?: string;
  businessname?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface AuthenticatedRequest extends Request {
  id?: string;
}

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = (req.body ?? {}) as Partial<RegisterBody>;
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const email = typeof data.email === 'string' ? data.email.trim() : '';
    const password = typeof data.password === 'string' ? data.password : '';
    const role = data.role === 'business' || data.role === 'governmentservices' ? data.role : 'user';
    const location = typeof data.location === 'string' ? data.location.trim() : '';
    const description = typeof data.description === 'string' ? data.description.trim() : '';
    const pancardNumber =
      typeof data.pancardNumber === 'number'
        ? data.pancardNumber
        : typeof data.pancardNumber === 'string' && data.pancardNumber.trim()
          ? Number(data.pancardNumber)
          : undefined;
    const businessname = typeof data.businessname === 'string' ? data.businessname.trim() : '';
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

    if (role !== 'user') {
      if (!location) {
        errors.location = 'Location is required';
      }
      if (!description) {
        errors.description = 'Description is required';
      }
      if (typeof pancardNumber !== 'number' || Number.isNaN(pancardNumber) || pancardNumber <= 0) {
        errors.pancardNumber = 'Valid PAN card number is required';
      }
      if (!businessname) {
        errors.businessname = 'Business name is required';
      }
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
      role,
    });

    if (role !== 'user') {
      await Business.create({
        owner: user._id,
        location,
        pancardNumber,
        description,
        businessname,
      });
    }

    const userObj = user.toObject();
    delete userObj.password;

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: userObj._id,
        email: userObj.email,
        role: userObj.role,
        businessname: userObj.businessname || null,
      },
      user: {
        _id: userObj._id,
        email: userObj.email,
        role: userObj.role,
        businessname: businessname || null,
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

router.get('/me', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.id;
    if (!id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

  const user = await User.findById(id).select('-password');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }
  const userdata = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
    return res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: userdata,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
});

router.get('/business',isAuthenticated,isBusinessRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const business = await Business.findOne({ owner: req.id });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Business profile retrieved successfully',
      data: business,

    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
});

module.exports = router;
