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

// Mock authorize so we can test resolveBusinessProfile and route handlers in isolation
jest.mock('../middleware/authorize', () => ({
  authorize: () => (req, res, next) => next(),
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

  it('returns 500 when update fails (PUT catch, line 235)', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const business = await Business.create({
      owner: ownerId,
      businessname: 'Coverage Biz',
      location: 'City',
      pancardNumber: 1234567,
      description: 'Desc',
    });
    mockIsAuthenticated.mockImplementationOnce((req, res, next) => {
      req.id = ownerId.toString();
      next();
    });

    const form = await FeedbackForm.create({
      businessId: business._id,
      title: 'To Update',
      fields: [{ name: 'f1', label: 'F1', type: 'short_text' }],
    });

    jest.spyOn(FeedbackForm, 'findOneAndUpdate').mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .put(`/api/feedback-forms/${form._id}`)
      .send({ title: 'Updated', fields: [{ name: 'f1', label: 'F1', type: 'long_text' }] })
      .expect(500);

    expect(res.body.error).toBe('Failed to update feedback form');
  });

  it('returns 500 when listing feedback forms fails (GET / catch)', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    await Business.create({
      owner: ownerId,
      businessname: 'Biz',
      location: 'City',
      pancardNumber: 1234567,
      description: 'Desc',
    });
    mockIsAuthenticated.mockImplementationOnce((req, res, next) => {
      req.id = ownerId.toString();
      next();
    });

    jest.spyOn(FeedbackForm, 'find').mockReturnValueOnce({
      sort: () => Promise.reject(new Error('DB error')),
    } as never);

    const res = await request(app)
      .get('/api/feedback-forms')
      .expect(500);

    expect(res.body.error).toBe('Failed to fetch feedback forms');
  });

  it('returns 500 when fetching feedback form by id fails (GET /:id catch)', async () => {
    jest.spyOn(FeedbackForm, 'findById').mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .get(`/api/feedback-forms/${new mongoose.Types.ObjectId()}`)
      .expect(500);

    expect(res.body.error).toBe('Failed to fetch feedback form');
  });

  it('returns 400 with validation message when create fails Mongoose validation (getValidationErrorMessage)', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    await Business.create({
      owner: ownerId,
      businessname: 'Biz',
      location: 'City',
      pancardNumber: 1234567,
      description: 'Desc',
    });
    mockIsAuthenticated.mockImplementationOnce((req, res, next) => {
      req.id = ownerId.toString();
      next();
    });

    const res = await request(app)
      .post('/api/feedback-forms')
      .send({
        title: 'Test',
        fields: [{ name: '1invalid', label: 'Field', type: 'short_text' }],
      })
      .expect(400);

    expect(res.body.error).toMatch(/field name|required|supported/i);
  });

  it('returns 400 when PUT payload is empty (at least one field required)', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const business = await Business.create({
      owner: ownerId,
      businessname: 'Biz',
      location: 'City',
      pancardNumber: 1234567,
      description: 'Desc',
    });
    mockIsAuthenticated.mockImplementationOnce((req, res, next) => {
      req.id = ownerId.toString();
      next();
    });
    const form = await FeedbackForm.create({
      businessId: business._id,
      title: 'Form',
      fields: [{ name: 'f1', label: 'F1', type: 'short_text' }],
    });

    const res = await request(app)
      .put(`/api/feedback-forms/${form._id}`)
      .send({})
      .expect(400);

    expect(res.body.error).toMatch(/at least one field|required/i);
  });

  it('returns 500 when QR generation fails (QR catch)', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const business = await Business.create({
      owner: ownerId,
      businessname: 'Biz',
      location: 'City',
      pancardNumber: 1234567,
      description: 'Desc',
    });
    mockIsAuthenticated.mockImplementationOnce((req, res, next) => {
      req.id = ownerId.toString();
      next();
    });
    const form = await FeedbackForm.create({
      businessId: business._id,
      title: 'Form',
      fields: [{ name: 'f1', label: 'F1', type: 'short_text' }],
    });
    const QRCode = require('qrcode');
    jest.spyOn(QRCode, 'toDataURL').mockRejectedValueOnce(new Error('QR error'));

    const res = await request(app)
      .post(`/api/feedback-forms/${form._id}/qr`)
      .send({})
      .expect(500);

    expect(res.body.error).toMatch(/generate|QR|feedback form/i);
  });

  it('returns 500 when delete fails (DELETE catch)', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const business = await Business.create({
      owner: ownerId,
      businessname: 'Biz',
      location: 'City',
      pancardNumber: 1234567,
      description: 'Desc',
    });
    mockIsAuthenticated.mockImplementationOnce((req, res, next) => {
      req.id = ownerId.toString();
      next();
    });
    const form = await FeedbackForm.create({
      businessId: business._id,
      title: 'Form',
      fields: [{ name: 'f1', label: 'F1', type: 'short_text' }],
    });
    jest.spyOn(FeedbackForm, 'findOneAndDelete').mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app)
      .delete(`/api/feedback-forms/${form._id}`)
      .expect(500);

    expect(res.body.error).toMatch(/delete|failed/i);
  });
});
