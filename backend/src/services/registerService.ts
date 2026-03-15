import mongoose from 'mongoose';
const User = require('../models/User');
const Business = require('../models/Business');

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'user' | 'business' | 'governmentservices';
  avatarId?: string;
  businessname?: string;
  description?: string;
  location?: string;
  pancardNumber?: string;
}

export interface RegisterResult {
  user: { _id: unknown; name: string; email: string; role: string; phone: string; avatarId?: string | null };
  business?: { _id: unknown; type: string; businessname: string } | null;
}

export function generatePersonalBusinessName(userName: string): string {
  const sanitized = userName.trim().replace(/\s+/g, ' ');
  return `${sanitized}-business`;
}

export function validateCommonFields(input: RegisterInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.email) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(input.email)) {
    errors.email = 'Invalid email format';
  }
  if (!input.password) {
    errors.password = 'Password is required';
  } else if (input.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  if (!input.phone) {
    errors.phone = 'Phone number is required';
  } else if (input.phone.replace(/\D/g, '').length < 10) {
    errors.phone = 'Phone number must be at least 10 digits';
  }
  return errors;
}

export function validateBusinessFields(input: RegisterInput): Record<string, string> {
  if (input.role === 'user') return {};
  const errors: Record<string, string> = {};
  if (!input.businessname || !String(input.businessname).trim()) {
    errors.businessname = 'Business name is required';
  }
  if (!input.description || !String(input.description).trim()) {
    errors.description = 'Description is required';
  }
  return errors;
}

export async function checkExistingEmailAndPhone(
  email: string,
  normalizedPhone: string,
): Promise<{ conflict: 'email' | 'phone' } | null> {
  const existingEmail = await User.findOne({ email: email.toLowerCase().trim() }).lean();
  if (existingEmail) return { conflict: 'email' };
  const existingPhone = await User.findOne({ phone: normalizedPhone }).lean();
  if (existingPhone) return { conflict: 'phone' };
  return null;
}

async function runWithSession(
  input: RegisterInput,
  session: mongoose.mongo.ClientSession | null,
): Promise<RegisterResult> {
  const opts = session ? { session } : {};
  const userPayload: Record<string, unknown> = {
    name: input.name?.trim() || 'User',
    email: input.email.toLowerCase().trim(),
    password: input.password,
    phone: input.phone,
    role: input.role,
  };
  if (input.avatarId != null && String(input.avatarId).trim()) {
    userPayload.avatarId = String(input.avatarId).trim();
  }

  const created = await User.create([userPayload], opts);
  const user = created[0];
  if (!user) throw new Error('User creation failed');

  const businessPayload: Record<string, unknown> = {
    owner: user._id,
    businessname: '',
    description: '',
  };

  if (input.role === 'user') {
    businessPayload.type = 'personal';
    businessPayload.businessname = generatePersonalBusinessName(input.name);
    businessPayload.description = 'Personal account';
  } else {
    businessPayload.type = 'commercial';
    businessPayload.businessname = (input.businessname ?? '').trim();
    businessPayload.description = (input.description ?? '').trim();
    if (input.location != null && String(input.location).trim()) {
      businessPayload.location = String(input.location).trim();
    }
    if (input.pancardNumber != null && String(input.pancardNumber).trim()) {
      businessPayload.pancardNumber = String(input.pancardNumber).trim();
    }
  }

  const bizCreated = await Business.create([businessPayload], opts);
  const business = bizCreated[0];
  if (!business) throw new Error('Business creation failed');

  const userObj = user.toObject();
  delete userObj.password;
  return {
    user: {
      _id: userObj._id,
      name: userObj.name,
      email: userObj.email,
      role: userObj.role,
      phone: userObj.phone,
      avatarId: userObj.avatarId ?? null,
    },
    business: business
      ? { _id: business._id, type: business.type, businessname: business.businessname }
      : null,
  };
}

export async function createUserAndBusiness(input: RegisterInput): Promise<RegisterResult> {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await runWithSession(input, session);
      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (txErr: unknown) {
    const msg = txErr instanceof Error ? txErr.message : String(txErr);
    if (msg.includes('replica set') || msg.includes('Transaction numbers')) {
      return runWithSession(input, null);
    }
    throw txErr;
  }
}
