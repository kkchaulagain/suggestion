const request = require('supertest');
const jwt = require('jsonwebtoken');
const { connect, disconnect } = require('../db');
const app = require('../app');
const User = require('../models/User');
const Business = require('../models/Business');

function signToken(userId) {
  return jwt.sign({ userId: String(userId) }, process.env.JWT_SECRET || 'default_secret_key', {
    expiresIn: '1h',
  });
}

describe('Auth profile routes and error paths', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Business.deleteMany({});
    await disconnect();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await User.deleteMany({});
    await Business.deleteMany({});
  });

  it('returns validation errors for missing business registration fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'gov@example.com',
        password: 'secret123',
        role: 'governmentservices',
      })
      .expect(400);

    expect(res.body.errors).toMatchObject({
      location: expect.any(String),
      description: expect.any(String),
      pancardNumber: expect.any(String),
      businessname: expect.any(String),
    });
  });

  it('returns 500 when registration persistence fails', async () => {
    jest.spyOn(User, 'create').mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'broken@example.com', password: 'secret123' })
      .expect(500);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Something went wrong',
    });
  });

  it('returns 400 when login email format is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'secret123' })
      .expect(400);

    expect(res.body.errors.email).toBe('Invalid email format');
  });

  it('returns 500 when login lookup fails', async () => {
    jest.spyOn(User, 'findOne').mockImplementationOnce(() => {
      throw new Error('lookup failed');
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'secret123' })
      .expect(500);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Something went wrong',
    });
  });

  it('returns current user data from /api/auth/me', async () => {
    const user = await User.create({
      email: 'me@example.com',
      password: 'secret123',
      role: 'user',
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${signToken(user._id)}`)
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      message: 'User retrieved successfully',
      data: {
        _id: String(user._id),
        email: 'me@example.com',
        role: 'user',
      },
    });
  });

  it('returns 404 from /api/auth/me when the user no longer exists', async () => {
    const user = await User.create({
      email: 'missing-me@example.com',
      password: 'secret123',
      role: 'user',
    });
    const token = signToken(user._id);
    await User.deleteOne({ _id: user._id });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'User not found',
    });
  });

  it('returns 500 from /api/auth/me when user lookup fails', async () => {
    const user = await User.create({
      email: 'me-error@example.com',
      password: 'secret123',
      role: 'user',
    });

    jest.spyOn(User, 'findById').mockReturnValueOnce({
      select: () => Promise.reject(new Error('lookup failed')),
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${signToken(user._id)}`)
      .expect(500);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Something went wrong',
    });
  });

  it('returns the business profile from /api/auth/business', async () => {
    const user = await User.create({
      email: 'biz-profile@example.com',
      password: 'secret123',
      role: 'business',
    });
    const business = await Business.create({
      owner: user._id,
      businessname: 'Acme Traders',
      location: 'Kathmandu',
      pancardNumber: 12345678,
      description: 'Retail store',
    });

    const res = await request(app)
      .get('/api/auth/business')
      .set('Authorization', `Bearer ${signToken(user._id)}`)
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      message: 'Business profile retrieved successfully',
      data: {
        _id: String(business._id),
        owner: String(user._id),
        businessname: 'Acme Traders',
      },
    });
  });

  it('returns 404 from /api/auth/business when no profile exists', async () => {
    const user = await User.create({
      email: 'biz-missing@example.com',
      password: 'secret123',
      role: 'business',
    });

    const res = await request(app)
      .get('/api/auth/business')
      .set('Authorization', `Bearer ${signToken(user._id)}`)
      .expect(404);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Business profile not found',
    });
  });

  it('returns 500 from /api/auth/business when profile lookup fails', async () => {
    const user = await User.create({
      email: 'biz-error@example.com',
      password: 'secret123',
      role: 'business',
    });

    jest.spyOn(Business, 'findOne').mockRejectedValueOnce(new Error('lookup failed'));

    const res = await request(app)
      .get('/api/auth/business')
      .set('Authorization', `Bearer ${signToken(user._id)}`)
      .expect(500);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Something went wrong',
    });
  });
});
