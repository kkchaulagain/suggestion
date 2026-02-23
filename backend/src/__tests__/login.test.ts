const request = require('supertest');
const { connect, disconnect } = require('../db');
const app = require('../app');
const User = require('../models/User');
const Business = require('../models/Business');

describe('POST /api/auth/login', () => {
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

  it('returns 200 with token when email and password are valid', async () => {
    await User.create({
      email: '123456@gmail.com',
      password: 'secret123',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '123456@gmail.com', password: 'secret123' })
      .expect(200);

    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('message', 'User logged in');
  });

  it('returns 400 when email is wrong', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@gmail.com', password: 'secret123' })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when password is wrong', async () => {
    await User.create({
      email: '123456@gmail.com',
      password: 'secret123',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '123456@gmail.com', password: 'pass12345' })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'secret123' })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '123456@gmail.com' })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  it('returns 200 with token for business user login', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'business-login@example.com',
        password: 'secret123',
        role: 'business',
        businessname: 'Acme Traders',
        location: 'jorpati',
        pancardNumber: 12345678,
        description: 'Retail store',
      })
      .expect(201);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'business-login@example.com', password: 'secret123' })
      .expect(200);

    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('message', 'User logged in');
  });
});
