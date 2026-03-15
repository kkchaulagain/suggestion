import request from 'supertest';
import type { Application, NextFunction, Request, Response } from 'express';
const { connect, disconnect } = require('../db');
const User = require('../models/User');

// Mock the middleware BEFORE importing the app/routes
// We need to use jest.mock before any imports that use the module
jest.mock('../middleware/isauthenticated', () => ({
  isAuthenticated: (_req: Request, _res: Response, next: NextFunction) => {
    // Intentionally do NOT set req.id to test error handling
    next();
  }
}));

// Mock isBusinessRole as well since we might hit it
jest.mock('../middleware/isbusiness', () => ({
  isBusinessRole: (_req: Request, _res: Response, next: NextFunction) => {
    next();
  }
}));

describe('Auth Route Coverage (Mocked Middleware)', () => {
  let app: Application;

  beforeAll(async () => {
    await connect();
    // We need to require app inside the test to ensure mocks are applied
    // But since app is a singleton exported from app.ts, we might need to rely on jest.resetModules()
    // However, app.ts imports routes at the top level.
    // So we need to isolate this test suite.
    jest.resetModules();
    app = require('../app');
  });

  afterAll(async () => {
    await User.deleteMany({});
    await disconnect();
    jest.restoreAllMocks();
  });

  it('GET /me returns 401 when req.id is missing (middleware failure simulation)', async () => {
    // The mocked isAuthenticated calls next() but doesn't set req.id
    // So the controller should see !req.id and return 401
    const res = await request(app)
      .get('/api/auth/me')
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Unauthorized access');
  });

  it('PUT /me returns 401 when req.id is missing (middleware failure simulation)', async () => {
    const res = await request(app)
      .put('/api/auth/me')
      .send({ name: 'New Name' })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Unauthorized access');
  });
});
