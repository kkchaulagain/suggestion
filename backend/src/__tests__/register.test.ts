const request = require('supertest');
const mongoose = require('mongoose');
const { connect, disconnect } = require('../db');
const app = require('../app');
const User = require('../models/User');

describe('POST /api/auth/register', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await disconnect();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  it('returns 201 and user (no password) when email and password are valid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'secret123' })
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
      .send({ password: 'secret123' })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com' })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when password is shorter than 6 characters', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: '12345' })
      .expect(400);
  });

  it('returns 400 when email is invalid', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'secret123' })
      .expect(400);
  });

  it('returns 409 when email already exists', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'secret123' })
      .expect(201);

    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'other456' })
      .expect(409);
  });

  it('persists user with hashed password in database', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'hash@example.com', password: 'secret123' })
      .expect(201);

    const user = await User.findOne({ email: 'hash@example.com' }).select('+password');
    expect(user).not.toBeNull();
    expect(user.password).not.toBe('secret123');
    expect(user.password).toMatch(/^\$2[aby]\$/);
  });
});
