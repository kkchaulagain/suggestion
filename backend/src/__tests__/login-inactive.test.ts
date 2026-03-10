const request = require('supertest');
const { connect, disconnect } = require('../db');
const app = require('../app');
const User = require('../models/User');

describe('POST /api/auth/login - inactive user', () => {
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

  it('returns 403 when user is deactivated', async () => {
    await User.create({
      name: 'Deactivated User',
      email: 'inactive@example.com',
      password: 'secret123',
      phone: '+9779812345650',
      role: 'user',
      isActive: false,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inactive@example.com', password: 'secret123' })
      .expect(403);

    expect(res.body.error).toBe('Account deactivated');
    expect(res.body).not.toHaveProperty('token');
  });
});
