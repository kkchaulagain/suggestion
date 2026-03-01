const request = require('supertest');
const { connect, disconnect } = require('../db');
const app = require('../app');
const Business = require('../models/Business');
const { FeedbackForm } = require('../models/FeedbackForm');

const mongoose = require('mongoose');

// Mock isAuthenticated middleware to control req.id
const mockIsAuthenticated = jest.fn((req, res, next) => {
  req.id = new mongoose.Types.ObjectId().toString();
  next();
});

jest.mock('../middleware/isauthenticated', () => ({
  isAuthenticated: (req, res, next) => mockIsAuthenticated(req, res, next),
}));

// Mock isBusinessRole to pass
jest.mock('../middleware/isbusiness', () => ({
  isBusinessRole: (req, res, next) => next(),
}));

describe('Feedback Forms API Coverage', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await disconnect();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await Business.deleteMany({});
    await FeedbackForm.deleteMany({});
  });

  it('returns 401 when req.id is missing (Line 75)', async () => {
    // Mock isAuthenticated to NOT set req.id
    mockIsAuthenticated.mockImplementationOnce((req, res, next) => {
      // req.id is undefined
      next();
    });

    const res = await request(app)
      .post('/api/feedback-forms')
      .send({ title: 'Test' })
      .expect(401);

    expect(res.body.error).toBe('Unauthorized access');
  });

  it('returns 404 when business profile is not found (Line 80)', async () => {
    const nonExistentUserId = new mongoose.Types.ObjectId().toString();
    // Mock isAuthenticated to set a req.id that doesn't exist in Business
    mockIsAuthenticated.mockImplementationOnce((req, res, next) => {
      req.id = nonExistentUserId;
      next();
    });

    // Ensure no business exists for this user
    await Business.deleteMany({ owner: nonExistentUserId });

    const res = await request(app)
      .post('/api/feedback-forms')
      .send({ title: 'Test' })
      .expect(404);

    expect(res.body.error).toBe('Business profile not found');
  });

  it('returns 500 when verifying business profile fails (Line 86)', async () => {
    // Mock isAuthenticated to set a valid req.id
    mockIsAuthenticated.mockImplementationOnce((req, res, next) => {
      req.id = new mongoose.Types.ObjectId().toString();
      next();
    });

    // Mock Business.findOne to throw an error
    jest.spyOn(Business, 'findOne').mockImplementationOnce(() => {
      throw new Error('Database error');
    });

    const res = await request(app)
      .post('/api/feedback-forms')
      .send({ title: 'Test' })
      .expect(500);

    expect(res.body.error).toBe('Failed to verify business profile');
  });
});
