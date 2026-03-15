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

    expect(res.body.errors.phone).toBeDefined();
    expect(['Phone number must be at least 10 digits', 'Invalid phone number']).toContain(res.body.errors.phone);
  });

  it('accepts a valid Nepali mobile number in national format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'nepali-phone@example.com', password: 'secret123', phone: '9812345678' })
      .expect(201);

    expect(res.body.user.phone).toBe('+9779812345678');
  });

  it('returns 400 when phone number format is invalid after length check', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bad-phone@example.com', password: 'secret123', phone: '1234567890' })
      .expect(400);

    expect(res.body.errors.phone).toBe('Invalid phone number');
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

  it('succeeds when business role omits optional location', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'biz-no-loc@example.com',
        password: 'secret123',
        phone: VALID_PHONE,
        role: 'business',
        businessname: 'Acme',
        description: 'Retail store',
      })
      .expect(201);

    const business = await Business.findOne({ owner: (await User.findOne({ email: 'biz-no-loc@example.com' }))._id });
    expect(business).not.toBeNull();
    expect(business.type).toBe('commercial');
    expect(res.body.user.businessname).toBe('Acme');
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

  it('succeeds when business role omits optional pancardNumber', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'biz-no-pan@example.com',
        password: 'secret123',
        phone: VALID_PHONE,
        role: 'business',
        businessname: 'Acme',
        description: 'Retail store',
      })
      .expect(201);

    const business = await Business.findOne({ owner: (await User.findOne({ email: 'biz-no-pan@example.com' }))._id });
    expect(business).not.toBeNull();
    expect(business.type).toBe('commercial');
  });

  it('personal signup creates user and business with type personal and name-based businessname', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Doe',
        email: 'personal@example.com',
        password: 'secret123',
        phone: VALID_PHONE,
        role: 'user',
      })
      .expect(201);

    const user = await User.findOne({ email: 'personal@example.com' });
    const business = await Business.findOne({ owner: user._id });

    expect(user).not.toBeNull();
    expect(user.role).toBe('user');
    expect(business).not.toBeNull();
    expect(business.type).toBe('personal');
    expect(business.businessname).toBe('Jane Doe-business');
    expect(res.body.user.businessname).toBe('Jane Doe-business');
  });

  it('personal signup with avatarId stores it on user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane',
        email: 'avatar@example.com',
        password: 'secret123',
        phone: VALID_PHONE,
        role: 'user',
        avatarId: 'avatar-1',
      })
      .expect(201);

    const user = await User.findOne({ email: 'avatar@example.com' });
    expect(user.avatarId).toBe('avatar-1');
    expect(res.body.user.avatarId).toBe('avatar-1');
  });

  it('personal signup ignores business fields in request body', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Solo',
        email: 'solo@example.com',
        password: 'secret123',
        phone: VALID_PHONE,
        role: 'user',
        businessname: 'Ignored Corp',
        description: 'Ignored',
      })
      .expect(201);

    const business = await Business.findOne({ owner: (await User.findOne({ email: 'solo@example.com' }))._id });
    expect(business.businessname).toBe('Solo-business');
    expect(business.type).toBe('personal');
  });

  it('business signup creates business with type commercial', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'commercial@example.com',
        password: 'secret123',
        phone: VALID_PHONE,
        role: 'business',
        businessname: 'Acme Corp',
        description: 'A company',
      })
      .expect(201);

    const business = await Business.findOne({ owner: (await User.findOne({ email: 'commercial@example.com' }))._id });
    expect(business.type).toBe('commercial');
    expect(business.businessname).toBe('Acme Corp');
  });
});
