const request = require('supertest');
const _mongoose = require('mongoose');
const { connect, disconnect } = require('../db');
const app = require('../app');
const User = require('../models/User');
const Business = require('../models/Business');
const VALID_PHONE = '+9779812345678';

describe('POST /api/auth/register', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Business.deleteMany({});
    await disconnect();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Business.deleteMany({});
  });

  it('returns 201 and user (no password) when email and password are valid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'secret123', phone: VALID_PHONE })
      .expect(201);

    expect(res.body).toMatchObject({
      user: {
        email: 'test@example.com',
        _id: expect.any(String),
      },
    });
    expect(res.body.user.password).toBeUndefined();
    expect(res.body).toHaveProperty('message');
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'secret123', phone: VALID_PHONE })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', phone: VALID_PHONE })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when password is shorter than 6 characters', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: '12345', phone: VALID_PHONE })
      .expect(400);
  });

  it('returns 400 when email is invalid', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'secret123', phone: VALID_PHONE })
      .expect(400);
  });

  it('returns 400 when phone number is empty', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'empty-phone@example.com', password: 'secret123', phone: '' })
      .expect(400);

    expect(res.body.errors.phone).toBe('Phone number is required');
  });

  it('returns 400 when phone number has fewer than 10 digits', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'short-phone@example.com', password: 'secret123', phone: '98123' })
      .expect(400);

    expect(res.body.errors.phone).toBe('Phone number must be at least 10 digits');
  });

  it('returns 409 when email already exists', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'secret123', phone: VALID_PHONE })
      .expect(201);

    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'other456', phone: '+9779800000000' })
      .expect(409);
  });

  it('persists user with hashed password in database', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'hash@example.com', password: 'secret123', phone: VALID_PHONE })
      .expect(201);

    const user = await User.findOne({ email: 'hash@example.com' }).select('+password');
    expect(user).not.toBeNull();
    expect(user.password).not.toBe('secret123');
    expect(user.password).toMatch(/^\$2[aby]\$/);
  });

  it('creates a business profile when role is business', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'biz@example.com',
        password: 'secret123',
        phone: VALID_PHONE,
        role: 'business',
        businessname: 'Acme Traders',
        location: 'jorpati',
        pancardNumber: 12345678,
        description: 'Retail store',
      })
      .expect(201);

    const user = await User.findOne({ email: 'biz@example.com' });
    const business = await Business.findOne({ owner: user._id });

    expect(user).not.toBeNull();
    expect(user.role).toBe('business');
    expect(business).not.toBeNull();
    expect(business.businessname).toBe('Acme Traders');
    expect(res.body.user.businessname).toBe('Acme Traders');
  });

  it('returns 400 when business role is missing businessname', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'biz-missing-name@example.com',
        password: 'secret123',
        phone: VALID_PHONE,
        role: 'business',
        location: 'jorpati',
        pancardNumber: 12345678,
        description: 'Retail store',
      })
      .expect(400);

    expect(res.body.errors.businessname).toBeDefined();
  });

  it('returns 400 when business role is missing location', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'biz-missing-loc@example.com',
        password: 'secret123',
        phone: VALID_PHONE,
        role: 'business',
        businessname: 'Acme',
        pancardNumber: 12345678,
        description: 'Retail store',
      })
      .expect(400);

    expect(res.body.errors.location).toBeDefined();
  });

  it('returns 400 when business role is missing description', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'biz-missing-desc@example.com',
        password: 'secret123',
        phone: VALID_PHONE,
        role: 'business',
        businessname: 'Acme',
        location: 'jorpati',
        pancardNumber: 12345678,
      })
      .expect(400);

    expect(res.body.errors.description).toBeDefined();
  });

  it('returns 400 when business role is missing pancardNumber', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'biz-missing-pan@example.com',
        password: 'secret123',
        phone: VALID_PHONE,
        role: 'business',
        businessname: 'Acme',
        location: 'jorpati',
        description: 'Retail store',
      })
      .expect(400);

    expect(res.body.errors.pancardNumber).toBeDefined();
  });
});
