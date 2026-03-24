import express, { Request, Response } from 'express';
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');
const Business = require('../models/Business');
const router = express.Router();
const { isAuthenticated } = require('../middleware/isauthenticated');
const { isBusinessRole } = require('../middleware/isbusiness');
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import {
  validateCommonFields,
  validateBusinessFields,
  checkExistingEmailAndPhone,
  createUserAndBusiness,
  type RegisterInput,
} from '../services/registerService';


interface RegisterBody {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'business' | 'user' | 'governmentservices';
  avatarId?: string;
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
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_COOKIE_NAME = 'refreshToken';
const TOKEN_COOKIE_NAME = 'token';

function normalizePhoneInput(phone: string) {
  const trimmed = phone.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}

function parseSupportedPhoneNumber(phone: string) {
  const trimmed = phone.trim();
  if (!trimmed) return undefined;

  const internationalPhone = parsePhoneNumberFromString(normalizePhoneInput(trimmed));
  if (internationalPhone?.isValid()) {
    return internationalPhone;
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length === 10) {
    const nepaliPhone = parsePhoneNumberFromString(digitsOnly, 'NP');
    if (nepaliPhone?.isValid()) {
      return nepaliPhone;
    }
  }

  return internationalPhone;
}

function createAccessToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'default_secret_key', {
    expiresIn: '15m',
    jwtid: crypto.randomUUID(),
  });
}

function createRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge,
  };
}

function applyAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(TOKEN_COOKIE_NAME, accessToken, getCookieOptions(ACCESS_TOKEN_TTL_MS));
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getCookieOptions(REFRESH_TOKEN_TTL_MS));
}

function clearAuthCookies(res: Response) {
  const clearOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };
  res.clearCookie(TOKEN_COOKIE_NAME, clearOptions);
  res.clearCookie(REFRESH_COOKIE_NAME, clearOptions);
}

router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = (req.body ?? {}) as Partial<RegisterBody>;
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const email = typeof data.email === 'string' ? data.email.trim() : '';
    const password = typeof data.password === 'string' ? data.password : '';
    const phone = typeof data.phone === 'string' ? data.phone.trim() : '';
    const role =
      data.role === 'business' || data.role === 'governmentservices' ? data.role : 'user';
    const avatarId = typeof data.avatarId === 'string' ? data.avatarId.trim() : undefined;
    const location = typeof data.location === 'string' ? data.location.trim() : undefined;
    const description = typeof data.description === 'string' ? data.description.trim() : undefined;
    const businessname = typeof data.businessname === 'string' ? data.businessname.trim() : undefined;
    const pancardNumber =
      typeof data.pancardNumber === 'number'
        ? String(data.pancardNumber)
        : typeof data.pancardNumber === 'string' && data.pancardNumber.trim()
          ? data.pancardNumber.trim()
          : undefined;

    const phonenumber = parseSupportedPhoneNumber(phone);
    const normalizedPhone = phonenumber?.number ?? normalizePhoneInput(phone);
    if (phone && (!phonenumber || !phonenumber.isValid())) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: { phone: 'Invalid phone number' },
        error: 'Validation failed',
      });
    }

    const input: RegisterInput = {
      name,
      email,
      password,
      phone: normalizedPhone,
      role,
      ...(avatarId ? { avatarId } : {}),
      ...(businessname !== undefined && businessname !== '' ? { businessname } : {}),
      ...(description !== undefined && description !== '' ? { description } : {}),
      ...(location !== undefined && location !== '' ? { location } : {}),
      ...(pancardNumber !== undefined && pancardNumber !== '' ? { pancardNumber } : {}),
    };

    const commonErrors = validateCommonFields(input);
    const businessErrors = validateBusinessFields(input);
    const errors = { ...commonErrors, ...businessErrors };
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
        error: 'Validation failed',
      });
    }

    const conflict = await checkExistingEmailAndPhone(input.email, input.phone);
    if (conflict) {
      const field = conflict.conflict === 'email' ? 'email' : 'phone';
      const message = conflict.conflict === 'email' ? 'Email already registered' : 'Phone number already registered';
      return res.status(409).json({
        success: false,
        message: 'Validation failed',
        errors: { [field]: message },
        error: message,
      });
    }

    const result = await createUserAndBusiness(input);
    const businessnameForResponse = result.business?.businessname ?? null;

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        businessname: businessnameForResponse,
        phone: result.user.phone,
        avatarId: result.user.avatarId ?? null,
      },
      user: {
        _id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        businessname: businessnameForResponse,
        phone: result.user.phone,
        avatarId: result.user.avatarId ?? null,
      },
    });
  } catch (_err) {
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

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Account deactivated',
        errors: { general: 'Account deactivated' },
        error: 'Account deactivated',
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
    const token = createAccessToken(String(user._id));
    const refreshToken = createRefreshToken();
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          refreshToken,
          refreshTokenExpiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        },
      },
    );

    applyAuthCookies(res, token, refreshToken);
    return res.status(200).json({
      success: true,
      message: 'User logged in',
      data: { token },
      token,
    });
  } catch (_err) {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      errors: {},
      error: 'Something went wrong',
    });
  }
});

router.post('/refresh-token', async (req: Request, res: Response) => {
  try {
    const refreshToken =
      (req as Request & { cookies?: Record<string, string | undefined> }).cookies?.[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      clearAuthCookies(res);
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }

    const user = await User.findOne({
      refreshToken,
      refreshTokenExpiresAt: { $gt: new Date() },
    }).select('+refreshToken +refreshTokenExpiresAt');

    if (!user || user.isActive === false) {
      clearAuthCookies(res);
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const nextAccessToken = createAccessToken(String(user._id));
    const nextRefreshToken = createRefreshToken();
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          refreshToken: nextRefreshToken,
          refreshTokenExpiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        },
      },
    );

    applyAuthCookies(res, nextAccessToken, nextRefreshToken);
    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: { token: nextAccessToken },
      token: nextAccessToken,
    });
  } catch (_error) {
    clearAuthCookies(res);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  try {
    const refreshToken =
      (req as Request & { cookies?: Record<string, string | undefined> }).cookies?.[REFRESH_COOKIE_NAME];

    if (refreshToken) {
      await User.updateOne(
        { refreshToken },
        { $set: { refreshToken: null, refreshTokenExpiresAt: null } },
      );
    }

    clearAuthCookies(res);
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (_error) {
    clearAuthCookies(res);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
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
    isActive: user.isActive !== false,
    avatarId: user.avatarId ?? null,
  };
    return res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: userdata,
      
    });
  } catch (_error) {
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
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
});

router.put('/business', isAuthenticated, isBusinessRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.id;
    if (!id) {
      return res.status(401).json({ success: false, message: 'Unauthorized access' });
    }

    const data = (req.body ?? {}) as {
      type?: 'personal' | 'commercial';
      businessname?: string;
      location?: string;
      pancardNumber?: string | number;
      description?: string;
      emailNotificationsEnabled?: boolean;
    };

    const updatePayload: Record<string, unknown> = {};

    if (data.type !== undefined) {
      if (data.type !== 'personal' && data.type !== 'commercial') {
        return res.status(400).json({ success: false, message: 'Invalid business type' });
      }
      updatePayload.type = data.type;
    }

    if (typeof data.businessname === 'string') {
      const businessname = data.businessname.trim();
      if (!businessname) {
        return res.status(400).json({ success: false, message: 'Business name is required' });
      }
      updatePayload.businessname = businessname;
    }

    if (typeof data.location === 'string') {
      updatePayload.location = data.location.trim();
    }

    if (data.pancardNumber !== undefined) {
      updatePayload.pancardNumber = String(data.pancardNumber).trim();
    }

    if (typeof data.description === 'string') {
      const description = data.description.trim();
      if (!description) {
        return res.status(400).json({ success: false, message: 'Description is required' });
      }
      updatePayload.description = description;
    }

    if (typeof data.emailNotificationsEnabled === 'boolean') {
      updatePayload.emailNotificationsEnabled = data.emailNotificationsEnabled;
    }

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const business = await Business.findOneAndUpdate(
      { owner: id },
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business profile not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Business profile updated successfully',
      data: business,
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
});

router.put('/me', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.id
    if (!id) {
      return res.status(401).json({ success: false, message: 'Unauthorized access' })
    }

    const data = (req.body ?? {}) as { name?: string; avatarId?: string | null }
    const name = typeof data.name === 'string' ? data.name.trim() : ''
    const avatarIdSentAsNull = data.avatarId === null
    const avatarIdValue =
      typeof data.avatarId === 'string' && data.avatarId.trim()
        ? data.avatarId.trim()
        : undefined

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' })
    }

    const updatePayload: Record<string, unknown> = { $set: { name } }
    if (avatarIdSentAsNull) {
      (updatePayload.$unset as Record<string, number>) = { avatarId: 1 }
    } else if (avatarIdValue) {
      (updatePayload.$set as Record<string, unknown>).avatarId = avatarIdValue
    }

    const user = await User.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true, select: '-password' }
    )

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarId: user.avatarId ?? null,
      },
    })
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Something went wrong' })
  }
})

router.put('/me/change-password',isAuthenticated,async(req:AuthenticatedRequest,res:Response)=>
{
 try {
    const id=req.id
      const data=(req.body??{})as {currentPassword?:string,newPassword?:string,confirmPassword?:string}
      const currentPassword=typeof data.currentPassword==='string'?data.currentPassword:''
      const newPassword=typeof data.newPassword==='string'?data.newPassword:''
      const confirmPassword=typeof data.confirmPassword==='string'?data.confirmPassword:''
      if(!currentPassword||!newPassword||!confirmPassword)
      {
        return res.status(400).json({success:false,message:'All Password fields are required'})
      }
      if(newPassword!==confirmPassword)
      {
        return res.status(400).json({success:false,message:'New passwords do not match'})
      }
      if(newPassword.length<6)
      {
        return res.status(400).json({success:false,message:'Password must be at least 6 characters long'})
      }
      const user=await User.findById(id).select('+password') //+is used to fetch hashed password
      if(!user)
      {
        return res.status(404).json({success:false,message:'User not found'})
      }
      const passwordMatches=await bcrypt.compare(currentPassword,user.password)
      if(!passwordMatches)
      {
        return res.status(400).json({success:false,message:'Current password is incorrect'})
      }
      if (newPassword === currentPassword)
      {
        return res.status(400).json({ success: false, message: 'New password must be different from current password' });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      await User.updateOne(
        { _id: id },
        { $set: { password: hashedPassword, refreshToken: null, refreshTokenExpiresAt: null } },
      )
      clearAuthCookies(res)
      return res.status(200).json({success:true,message:'Password Changed Successfully'})
 } catch (_error) {
  return res.status(500).json({message:'Something went Wrong',success:false})
 }
})

router.post('/verify-password',isAuthenticated,async(req:AuthenticatedRequest,res:Response)=>
{
  try{
    const id=req.id
    const password=req.body.password
    if(typeof password!=='string'|| !password.trim())
    {
      return res.status(400).json({success:false,message:'password is required'})

    }
     const user=await User.findById(id).select('+password')
     if(!user)
     {
      return res.status(404).json({success:false,message:'user not found'})

     }
      const passwordMatches=await bcrypt.compare(password,user.password)
      if(!passwordMatches)
      {
        return res.status(404).json({success:false,message:'Incorrect Password'})

      }
      return res.status(200).json({success:true,message:'Password is correct'})
    }
    catch(_error)
    {
      return res.status(500).json({success:false,message:'Something went wrong'})
    }   
  }
)
module.exports = router;
