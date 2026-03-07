const request = require('supertest');
const { connect, disconnect } = require('../db');
const app = require('../app');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

describe('Users CRUD API', () => {
  let adminToken;
  let adminId;
  let regularUserId;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await disconnect();
  });

  beforeEach(async () => {
    await User.deleteMany({});

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'adminpass123',
      role: 'admin',
      isActive: true,
    });
    adminId = admin._id.toString();
    adminToken = jwt.sign({ userId: admin._id }, JWT_SECRET);

    const regular = await User.create({
      name: 'Regular User',
      email: 'regular@example.com',
      password: 'userpass123',
      role: 'user',
      isActive: true,
    });
    regularUserId = regular._id.toString();
  });

  const withAuth = (token, method, path) =>
    request(app)[method](path).set('Authorization', `Bearer ${token}`);

  describe('GET /api/users', () => {
    it('returns 401 without token', async () => {
      await request(app).get('/api/users').expect(401);
    });

    it('returns 403 for non-admin', async () => {
      const userToken = jwt.sign(
        { userId: regularUserId },
        JWT_SECRET,
      );
      await withAuth(userToken, 'get', '/api/users').expect(403);
    });

    it('returns 200 and paginated users for admin', async () => {
      const res = await withAuth(adminToken, 'get', '/api/users').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users).toBeInstanceOf(Array);
      expect(res.body.data.users.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.pagination).toEqual(
        expect.objectContaining({
          page: 1,
          pageSize: 20,
          total: expect.any(Number),
          totalPages: expect.any(Number),
        }),
      );
      const first = res.body.data.users[0];
      expect(first).not.toHaveProperty('password');
      expect(first).toHaveProperty('_id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('email');
      expect(first).toHaveProperty('role');
      expect(first).toHaveProperty('isActive');
    });

    it('supports search and filters', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'Admin', page: 1, pageSize: 10 })
        .expect(200);
      expect(res.body.data.users.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.users.some((u: { email: string }) => u.email === 'admin@example.com')).toBe(true);
    });
  });

  describe('GET /api/users/:id', () => {
    it('returns 401 without token', async () => {
      await request(app).get(`/api/users/${regularUserId}`).expect(401);
    });

    it('returns 403 for non-admin', async () => {
      const userToken = jwt.sign({ userId: regularUserId }, JWT_SECRET);
      await withAuth(userToken, 'get', `/api/users/${adminId}`).expect(403);
    });

    it('returns 404 for invalid id', async () => {
      const res = await withAuth(adminToken, 'get', '/api/users/507f1f77bcf86cd799439011').expect(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 200 and user for admin', async () => {
      const res = await withAuth(adminToken, 'get', `/api/users/${regularUserId}`).expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(regularUserId);
      expect(res.body.data.email).toBe('regular@example.com');
      expect(res.body.data).not.toHaveProperty('password');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('returns 401 without token', async () => {
      await request(app)
        .put(`/api/users/${regularUserId}`)
        .send({ name: 'Updated' })
        .expect(401);
    });

    it('returns 403 for non-admin', async () => {
      const userToken = jwt.sign({ userId: regularUserId }, JWT_SECRET);
      await request(app)
        .put(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Updated' })
        .expect(403);
    });

    it('returns 400 when no valid fields', async () => {
      const res = await request(app)
        .put(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 200 and updated user when name/role updated', async () => {
      const res = await request(app)
        .put(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Name', role: 'business' })
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Name');
      expect(res.body.data.role).toBe('business');
    });

    it('returns 409 when email is already in use', async () => {
      await User.create({
        name: 'Other',
        email: 'taken@example.com',
        password: 'pass123',
        role: 'user',
        isActive: true,
      });
      const res = await request(app)
        .put(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'taken@example.com' })
        .expect(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already in use/i);
    });
  });

  describe('PATCH /api/users/:id/deactivate', () => {
    it('returns 401 without token', async () => {
      await request(app).patch(`/api/users/${regularUserId}/deactivate`).expect(401);
    });

    it('returns 403 for non-admin', async () => {
      const userToken = jwt.sign({ userId: regularUserId }, JWT_SECRET);
      await withAuth(userToken, 'patch', `/api/users/${regularUserId}/deactivate`).expect(403);
    });

    it('returns 400 when admin deactivates self', async () => {
      const res = await withAuth(adminToken, 'patch', `/api/users/${adminId}/deactivate`).expect(400);
      expect(res.body.message).toMatch(/cannot deactivate your own/i);
    });

    it('returns 200 and sets isActive false', async () => {
      const res = await withAuth(adminToken, 'patch', `/api/users/${regularUserId}/deactivate`).expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false);
      const updated = await User.findById(regularUserId).lean();
      expect(updated.isActive).toBe(false);
    });
  });

  describe('PATCH /api/users/:id/activate', () => {
    it('returns 200 and sets isActive true', async () => {
      await User.findByIdAndUpdate(regularUserId, { isActive: false });
      const res = await withAuth(adminToken, 'patch', `/api/users/${regularUserId}/activate`).expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(true);
    });
  });

  describe('error handling', () => {
    it('GET /api/users returns 500 when list fails', async () => {
      const chain = {
        select: () => chain,
        sort: () => chain,
        skip: () => chain,
        limit: () => chain,
        lean: () => Promise.reject(new Error('DB error')),
      };
      const findSpy = jest.spyOn(User, 'find').mockReturnValueOnce(chain);
      const countSpy = jest.spyOn(User, 'countDocuments').mockResolvedValueOnce(0);

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/something went wrong/i);
      findSpy.mockRestore();
      countSpy.mockRestore();
    });

    it('GET /api/users/:id returns 500 when findById throws in handler', async () => {
      const rejectChain = { select: () => rejectChain, lean: () => Promise.reject(new Error('DB error')) };
      const spy = jest
        .spyOn(User, 'findById')
        .mockResolvedValueOnce({ _id: adminId, role: 'admin', isActive: true })
        .mockReturnValueOnce(rejectChain);

      const res = await withAuth(adminToken, 'get', `/api/users/${regularUserId}`).expect(500);
      expect(res.body.success).toBe(false);
      spy.mockRestore();
    });

    it('PUT /api/users/:id returns 500 when update throws', async () => {
      const rejectChain = { select: () => rejectChain, lean: () => Promise.reject(new Error('DB error')) };
      const updateSpy = jest.spyOn(User, 'findByIdAndUpdate').mockImplementation(() => rejectChain);
      try {
        const res = await request(app)
          .put(`/api/users/${regularUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Updated' });
        expect(updateSpy).toHaveBeenCalled();
        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
      } finally {
        updateSpy.mockRestore();
      }
    });

    it('PATCH /api/users/:id/deactivate returns 500 when update throws', async () => {
      const rejectChain = { select: () => rejectChain, lean: () => Promise.reject(new Error('DB error')) };
      const spy = jest.spyOn(User, 'findByIdAndUpdate').mockReturnValueOnce(rejectChain);

      const res = await withAuth(adminToken, 'patch', `/api/users/${regularUserId}/deactivate`).expect(500);
      expect(res.body.success).toBe(false);
      spy.mockRestore();
    });

    it('PATCH /api/users/:id/activate returns 500 when update throws', async () => {
      const rejectChain = { select: () => rejectChain, lean: () => Promise.reject(new Error('DB error')) };
      const spy = jest.spyOn(User, 'findByIdAndUpdate').mockReturnValueOnce(rejectChain);

      const res = await withAuth(adminToken, 'patch', `/api/users/${regularUserId}/activate`).expect(500);
      expect(res.body.success).toBe(false);
      spy.mockRestore();
    });
  });
});
