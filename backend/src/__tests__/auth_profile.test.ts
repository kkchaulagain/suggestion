const request = require('supertest');
const { connect, disconnect } = require('../db');
const app = require('../app');
const User = require('../models/User');
const Business = require('../models/Business');
const jwt = require('jsonwebtoken');
import type { Types } from 'mongoose';

/** Send request with both Cookie and Authorization so auth works in all environments. */
function withAuth(req: ReturnType<typeof request>, token: string) {
  return req.set('Cookie', [`token=${token}`]).set('Authorization', `Bearer ${token}`);
}

describe('Auth Profile Endpoints', () => {
  let userToken: string;
  let businessToken: string;
  let userId: Types.ObjectId;
  let businessUserId: Types.ObjectId;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Business.deleteMany({});
    await disconnect();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Business.deleteMany({});

    // Create a regular user
    const user = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'password123',
      phone: '+9779812345601',
      role: 'user',
    });
    userId = user._id;
    userToken = jwt.sign({ userId: String(user._id) }, process.env.JWT_SECRET || 'default_secret_key');

    // Create a business user
    const businessUser = await User.create({
      name: 'Business User',
      email: 'business@example.com',
      password: 'password123',
      phone: '+9779812345602',
      role: 'business',
    });
    businessUserId = businessUser._id;
    businessToken = jwt.sign({ userId: String(businessUser._id) }, process.env.JWT_SECRET || 'default_secret_key');

    await Business.create({
      owner: businessUser._id,
      type: 'commercial',
      businessname: 'Test Business',
      location: 'Test Location',
      pancardNumber: '12345678',
      description: 'Test Description',
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 200 and user data for authenticated user', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`token=${userToken}`])
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('user@example.com');
      expect(res.body.data.name).toBe('Regular User');
      expect(res.body.data).toHaveProperty('avatarId');
    });

    it('returns avatarId when user has avatarId set', async () => {
      await User.findByIdAndUpdate(userId, { avatarId: 'avatar-2' });
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`token=${userToken}`])
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.avatarId).toBe('avatar-2');
    });

    it('returns 404 if user not found', async () => {
      await User.findByIdAndDelete(userId);
      
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`token=${userToken}`])
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });

    it('returns 500 if database error occurs', async () => {
      const originalFindById = User.findById;
      User.findById = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`token=${userToken}`])
        .expect(500);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Something went wrong');

      User.findById = originalFindById;
    });
  });

  describe('GET /api/auth/business', () => {
    it('returns 200 and business data for business user', async () => {
      const res = await request(app)
        .get('/api/auth/business')
        .set('Cookie', [`token=${businessToken}`])
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.businessname).toBe('Test Business');
    });

    it('returns 404 if business profile not found', async () => {
      await Business.deleteMany({ owner: businessUserId });

      const res = await request(app)
        .get('/api/auth/business')
        .set('Cookie', [`token=${businessToken}`])
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Business profile not found');
    });

    it('returns 500 if database error occurs', async () => {
      const originalFindOne = Business.findOne;
      Business.findOne = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      const res = await request(app)
        .get('/api/auth/business')
        .set('Cookie', [`token=${businessToken}`])
        .expect(500);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Something went wrong');

      Business.findOne = originalFindOne;
    });
  });

  describe('POST /api/auth/verify-password', () => {
    it('returns 400 if password field is missing', async () => {
      const res = await withAuth(request(app).post('/api/auth/verify-password'), userToken)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('password is required');
    });

    it('returns 400 if password is empty string', async () => {
      const res = await withAuth(request(app).post('/api/auth/verify-password'), userToken)
        .send({ password: '   ' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('password is required');
    });

    it('returns 404 if user not found', async () => {
      await User.findByIdAndDelete(userId);

      const res = await withAuth(request(app).post('/api/auth/verify-password'), userToken)
        .send({ password: 'password123' })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('user not found');
    });

    it('returns 404 if password is incorrect', async () => {
      const res = await withAuth(request(app).post('/api/auth/verify-password'), userToken)
        .send({ password: 'wrongpassword' })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Incorrect Password');
    });

    it('returns 200 if password is correct', async () => {
      const res = await withAuth(request(app).post('/api/auth/verify-password'), userToken)
        .send({ password: 'password123' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Password is correct');
    });

    it('returns 500 if database error occurs', async () => {
      const originalFindById = User.findById;
      User.findById = jest.fn().mockImplementation(() => ({
        select: () => { throw new Error('Database error'); },
      }));

      const res = await withAuth(request(app).post('/api/auth/verify-password'), userToken)
        .send({ password: 'password123' })
        .expect(500);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Something went wrong');

      User.findById = originalFindById;
    });
  });

  describe('PUT /api/auth/business', () => {
    it('returns 200 and updates business profile for business user', async () => {
      const res = await withAuth(request(app).put('/api/auth/business'), businessToken)
        .send({
          type: 'commercial',
          businessname: 'Updated Business',
          location: 'New Location',
          pancardNumber: '99887766',
          description: 'Updated Description',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Business profile updated successfully');
      expect(res.body.data.businessname).toBe('Updated Business');
      expect(res.body.data.location).toBe('New Location');
    });

    it('returns 400 if no valid fields are provided', async () => {
      const res = await withAuth(request(app).put('/api/auth/business'), businessToken)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('No valid fields to update');
    });

    it('returns 400 for invalid business type', async () => {
      const res = await withAuth(request(app).put('/api/auth/business'), businessToken)
        .send({ type: 'invalid-type' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid business type');
    });

    it('returns 404 if business profile does not exist', async () => {
      await Business.deleteMany({ owner: businessUserId });

      const res = await withAuth(request(app).put('/api/auth/business'), businessToken)
        .send({ businessname: 'Any Name' })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Business profile not found');
    });

    it('returns 400 if businessname is blank whitespace', async () => {
      const res = await withAuth(request(app).put('/api/auth/business'), businessToken)
        .send({ businessname: '   ' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Business name is required');
    });

    it('returns 400 if description is blank whitespace', async () => {
      const res = await withAuth(request(app).put('/api/auth/business'), businessToken)
        .send({ description: '   ' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Description is required');
    });

    it('returns 200 and updates only location and pancardNumber', async () => {
      const res = await withAuth(request(app).put('/api/auth/business'), businessToken)
        .send({ location: 'Updated City', pancardNumber: 11223344 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.location).toBe('Updated City');
      expect(res.body.data.pancardNumber).toBe('11223344');
    });

    it('returns 500 if database error occurs', async () => {
      const originalFindOneAndUpdate = Business.findOneAndUpdate;
      Business.findOneAndUpdate = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      const res = await withAuth(request(app).put('/api/auth/business'), businessToken)
        .send({ businessname: 'Any Name' })
        .expect(500);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Something went wrong');

      Business.findOneAndUpdate = originalFindOneAndUpdate;
    });
  });

  describe('PUT /api/auth/me', () => {
    it('returns 200 and updates user name', async () => {
      const res = await withAuth(request(app).put('/api/auth/me'), userToken)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Name');

      const updatedUser = await User.findById(userId);
      expect(updatedUser.name).toBe('Updated Name');
    });

    it('returns 200 and updates avatarId when provided', async () => {
      const res = await withAuth(request(app).put('/api/auth/me'), userToken)
        .send({ name: 'Regular User', avatarId: 'avatar-3' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.avatarId).toBe('avatar-3');

      const updatedUser = await User.findById(userId);
      expect(updatedUser.avatarId).toBe('avatar-3');
    });

    it('returns 200 and clears avatarId when set to null', async () => {
      await User.findByIdAndUpdate(userId, { avatarId: 'avatar-1' });
      const res = await withAuth(request(app).put('/api/auth/me'), userToken)
        .send({ name: 'Regular User', avatarId: null })
        .expect(200);

      expect(res.body.success).toBe(true);
      const updatedUser = await User.findById(userId);
      expect(updatedUser.avatarId).toBeUndefined();
    });

    it('returns 400 if name is missing', async () => {
      const res = await withAuth(request(app).put('/api/auth/me'), userToken)
        .send({ name: '' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Name is required');
    });

    it('returns 404 if user not found', async () => {
      await User.findByIdAndDelete(userId);

      const res = await withAuth(request(app).put('/api/auth/me'), userToken)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });

    it('returns 500 if database error occurs', async () => {
      const originalFindByIdAndUpdate = User.findByIdAndUpdate;
      User.findByIdAndUpdate = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      const res = await withAuth(request(app).put('/api/auth/me'), userToken)
        .send({ name: 'Updated Name' })
        .expect(500);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Something went wrong');

      User.findByIdAndUpdate = originalFindByIdAndUpdate;
    });
  });

  // ✅ No nested beforeEach — uses the outer one which already creates
  // a fresh user with password 'password123' before each test
  describe('PUT /api/auth/me/change-password', () => {
    it('should return 401 if unauthenticated', async () => {
      const res = await request(app)
        .put('/api/auth/me/change-password')
        .send({ currentPassword: 'password123', newPassword: 'newPassword', confirmPassword: 'newPassword' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Unauthorized access');
    });

    it('should return 400 if any field missing', async () => {
      const res = await withAuth(request(app).put('/api/auth/me/change-password'), userToken)
        .send({ currentPassword: '', newPassword: '', confirmPassword: '' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('All Password fields are required');
    });

    it('should return 400 if passwords do not match', async () => {
      const res = await withAuth(request(app).put('/api/auth/me/change-password'), userToken)
        .send({ currentPassword: 'password123', newPassword: 'newPassword', confirmPassword: 'differentPassword' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('New passwords do not match');
    });

    it('should return 400 if newPassword is short', async () => {
      const res = await withAuth(request(app).put('/api/auth/me/change-password'), userToken)
        .send({ currentPassword: 'password123', newPassword: 'new', confirmPassword: 'new' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Password must be at least 6 characters long');
    });

    it('should return 400 if current password is incorrect', async () => {
      const res = await withAuth(request(app).put('/api/auth/me/change-password'), userToken)
        .send({ currentPassword: 'wrongPassword', newPassword: 'newPassword', confirmPassword: 'newPassword' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Current password is incorrect');
    });

    it('should return 404 if user not found', async () => {
      await User.findByIdAndDelete(userId);

      const res = await withAuth(request(app).put('/api/auth/me/change-password'), userToken)
        .send({ currentPassword: 'password123', newPassword: 'newPassword', confirmPassword: 'newPassword' })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User not found');
    });

    it('should return 400 if new password matches current password', async () => {
      const res = await request(app)
        .put('/api/auth/me/change-password')
        .set('Cookie', [`token=${userToken}`])
        .send({ currentPassword: 'password123', newPassword: 'password123', confirmPassword: 'password123' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('New password must be different from current password');
    });

    it('should return 500 if database error occurs', async () => {
      const originalFindById = User.findById;
      User.findById = jest.fn().mockImplementation(() => ({
        select: () => {
          throw new Error('Database error');
        },
      }));

      const res = await withAuth(request(app).put('/api/auth/me/change-password'), userToken)
        .send({ currentPassword: 'password123', newPassword: 'newPassword', confirmPassword: 'newPassword' })
        .expect(500);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Something went Wrong');

      User.findById = originalFindById;
    });

    it('should return 200 if password changed successfully', async () => {
      const res = await withAuth(request(app).put('/api/auth/me/change-password'), userToken)
        .send({ currentPassword: 'password123', newPassword: 'newPassword123', confirmPassword: 'newPassword123' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Password Changed Successfully');
    });

    it('should return 200 even when user document has missing optional fields ( already existing user)', async () => {
      
      const bcrypt = require('bcrypt');
      const mongoose = require('mongoose');
      const hashed = await bcrypt.hash('oldpass123', 10);
      const legacyUser = await mongoose.connection.db.collection('users').insertOne({
        email: 'legacy@example.com',
        password: hashed,
        role: 'user',
        isActive: true,
      });
      const legacyToken = require('jsonwebtoken').sign(
        { userId: legacyUser.insertedId },
        process.env.JWT_SECRET || 'default_secret_key',
      );

      const res = await withAuth(request(app).put('/api/auth/me/change-password'), legacyToken)
        .send({ currentPassword: 'oldpass123', newPassword: 'newpass123', confirmPassword: 'newpass123' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Password Changed Successfully');

     
      const updated = await mongoose.connection.db
        .collection('users')
        .findOne({ _id: legacyUser.insertedId });
      const matches = await bcrypt.compare('newpass123', updated.password);
      expect(matches).toBe(true);
    });
  });
});