const request = require('supertest');
const { connect, disconnect } = require('../db');
const app = require('../app');
const User = require('../models/User');
const Business = require('../models/Business');
const jwt = require('jsonwebtoken');

describe('Auth Profile Endpoints', () => {
  let userToken;
  let businessToken;
  let userId;
  let businessUserId;

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
      role: 'user',
    });
    userId = user._id;
    userToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'default_secret_key');

    // Create a business user
    const businessUser = await User.create({
      name: 'Business User',
      email: 'business@example.com',
      password: 'password123',
      role: 'business',
    });
    businessUserId = businessUser._id;
    businessToken = jwt.sign({ userId: businessUser._id }, process.env.JWT_SECRET || 'default_secret_key');

    await Business.create({
      owner: businessUser._id,
      businessname: 'Test Business',
      location: 'Test Location',
      pancardNumber: 12345678,
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

  describe('PUT /api/auth/me', () => {
    it('returns 200 and updates user name', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Cookie', [`token=${userToken}`])
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Name');

      const updatedUser = await User.findById(userId);
      expect(updatedUser.name).toBe('Updated Name');
    });

    it('returns 400 if name is missing', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Cookie', [`token=${userToken}`])
        .send({ name: '' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Name is required');
    });

    it('returns 404 if user not found', async () => {
      await User.findByIdAndDelete(userId);

      const res = await request(app)
        .put('/api/auth/me')
        .set('Cookie', [`token=${userToken}`])
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

      const res = await request(app)
        .put('/api/auth/me')
        .set('Cookie', [`token=${userToken}`])
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
      const res = await request(app)
        .put('/api/auth/me/change-password')
        .set('Cookie', [`token=${userToken}`])
        .send({ currentPassword: '', newPassword: '', confirmPassword: '' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('All Password fields are required');
    });

    it('should return 400 if passwords do not match', async () => {
      const res = await request(app)
        .put('/api/auth/me/change-password')
        .set('Cookie', [`token=${userToken}`])
        .send({ currentPassword: 'password123', newPassword: 'newPassword', confirmPassword: 'differentPassword' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('New passwords do not match');
    });

    it('should return 400 if newPassword is short', async () => {
      const res = await request(app)
        .put('/api/auth/me/change-password')
        .set('Cookie', [`token=${userToken}`])
        .send({ currentPassword: 'password123', newPassword: 'new', confirmPassword: 'new' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Password must be at least 6 characters long');
    });

    it('should return 400 if current password is incorrect', async () => {
      const res = await request(app)
        .put('/api/auth/me/change-password')
        .set('Cookie', [`token=${userToken}`])
        .send({ currentPassword: 'wrongPassword', newPassword: 'newPassword', confirmPassword: 'newPassword' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Current password is incorrect');
    });

    it('should return 200 if password changed successfully', async () => {
      const res = await request(app)
        .put('/api/auth/me/change-password')
        .set('Cookie', [`token=${userToken}`])
        .send({ currentPassword: 'password123', newPassword: 'newPassword123', confirmPassword: 'newPassword123' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Password Changed Successfully');
    });
  });
});