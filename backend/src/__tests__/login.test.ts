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
      name: 'Test User',
      email: '123456@gmail.com',
      password: 'secret123',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '123456@gmail.com', password: 'secret123' })
      .expect(200);

    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('message', 'User logged in');
    expect(res.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('refreshToken='),
        expect.stringContaining('token='),
      ]),
    );
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
      name: 'Test User',
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
        phone: '+9779812345678',
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

  it('refreshes the access token and rotates the refresh token', async () => {
    await User.create({
      name: 'Refresh User',
      email: 'refresh@example.com',
      password: 'secret123',
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'refresh@example.com', password: 'secret123' })
      .expect(200);

    const refreshCookie = loginRes.headers['set-cookie'].find((cookie) =>
      cookie.startsWith('refreshToken='),
    );

    expect(refreshCookie).toBeDefined();

    const refreshRes = await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', [refreshCookie])
      .expect(200);

    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.token).toBeDefined();
    expect(refreshRes.body.token).not.toBe(loginRes.body.token);
    expect(refreshRes.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('refreshToken='),
        expect.stringContaining('token='),
      ]),
    );
  });

  it('logs out and invalidates the stored refresh token', async () => {
    await User.create({
      name: 'Logout User',
      email: 'logout@example.com',
      password: 'secret123',
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'logout@example.com', password: 'secret123' })
      .expect(200);

    const refreshCookie = loginRes.headers['set-cookie'].find((cookie) =>
      cookie.startsWith('refreshToken='),
    );

    await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [refreshCookie])
      .expect(200);

    await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', [refreshCookie])
      .expect(401);
  });
});
