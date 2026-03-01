const request = require('supertest');
const { connect, disconnect } = require('../db');
const app = require('../app');
const { FeedbackForm } = require('../models/FeedbackForm');
const User = require('../models/User');
const Business = require('../models/Business');

async function createBusinessAuth() {
  const email = `biz_${Date.now()}_${Math.random().toString(16).slice(2)}@example.com`;
  const password = 'Password123!';

  await request(app).post('/api/auth/register').send({
    name: 'Business Owner',
    email,
    password,
    role: 'business',
    location: 'City Center',
    pancardNumber: 1234567,
    description: 'Business profile',
    businessname: 'Acme Business',
  });

  const loginRes = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
  const token = loginRes.body?.token || loginRes.body?.data?.token;
  const business = await Business.findOne({ businessname: 'Acme Business', location: 'City Center' }).sort({ createdAt: -1 });

  return {
    authHeader: { Authorization: `Bearer ${token}` },
    businessId: business?._id?.toString(),
  };
}

describe('Feedback Forms API', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await FeedbackForm.deleteMany({});
    await Business.deleteMany({});
    await User.deleteMany({});
    await disconnect();
  });

  afterEach(async () => {
    await FeedbackForm.deleteMany({});
    await Business.deleteMany({});
    await User.deleteMany({});
  });

  it('creates a feedback form with supported field types', async () => {
    const { authHeader, businessId } = await createBusinessAuth();

    const res = await request(app)
      .post('/api/feedback-forms')
      .set(authHeader)
      .send({
        title: 'Customer feedback',
        description: 'Collect customer feedback',
        fields: [
          { name: 'wouldRecommend', label: 'Would you recommend us?', type: 'checkbox' },
          { name: 'serviceChannel', label: 'Service Channel', type: 'radio' },
          { name: 'headline', label: 'Headline', type: 'short text' },
          { name: 'details', label: 'Details', type: 'long-text' },
          { name: 'story', label: 'Story', type: 'big text' },
          { name: 'screenshot', label: 'Upload screenshot', type: 'image upload' },
        ],
      })
      .expect(201);

    expect(res.body).toHaveProperty('message', 'Feedback form created');
    expect(res.body.feedbackForm.title).toBe('Customer feedback');
    expect(res.body.feedbackForm.fields).toHaveLength(6);
    expect(res.body.feedbackForm.fields.map((field: any) => field.type)).toEqual([
      'checkbox',
      'radio',
      'short_text',
      'long_text',
      'big_text',
      'image_upload',
    ]);
    expect(res.body.feedbackForm.businessId).toBe(businessId);
  });

  it('returns 400 when a field type is unsupported', async () => {
    const { authHeader } = await createBusinessAuth();

    const res = await request(app)
      .post('/api/feedback-forms')
      .set(authHeader)
      .send({
        title: 'Customer feedback',
        fields: [{ name: 'rating', label: 'Rating', type: 'stars' }],
      })
      .expect(400);

    expect(res.body.error).toContain('not supported');
  });

  it('lists saved feedback forms', async () => {
    const { authHeader, businessId } = await createBusinessAuth();

    await FeedbackForm.create({
      businessId,
      title: 'Support feedback',
      fields: [{ name: 'isResolved', label: 'Issue resolved?', type: 'checkbox' }],
    });

    const res = await request(app).get('/api/feedback-forms').set(authHeader).expect(200);
    expect(Array.isArray(res.body.feedbackForms)).toBe(true);
    expect(res.body.feedbackForms).toHaveLength(1);
    expect(res.body.feedbackForms[0].title).toBe('Support feedback');
  });

  it('updates an existing feedback form', async () => {
    const { authHeader, businessId } = await createBusinessAuth();

    const created = await FeedbackForm.create({
      businessId,
      title: 'Old form name',
      fields: [{ name: 'comment', label: 'Comment', type: 'short_text' }],
    });

    const res = await request(app)
      .put(`/api/feedback-forms/${created._id}`)
      .set(authHeader)
      .send({
        title: 'Updated form name',
        fields: [{ name: 'comment', label: 'Comment', type: 'long text' }],
      })
      .expect(200);

    expect(res.body).toHaveProperty('message', 'Feedback form updated');
    expect(res.body.feedbackForm.title).toBe('Updated form name');
    expect(res.body.feedbackForm.fields[0].type).toBe('long_text');
  });

  it('generates a QR code that points to the frontend form URL', async () => {
    const { authHeader, businessId } = await createBusinessAuth();

    const created = await FeedbackForm.create({
      businessId,
      title: 'QR form',
      fields: [{ name: 'comment', label: 'Comment', type: 'short_text' }],
    });

    const previousBaseUrl = process.env.FRONTEND_FORM_BASE_URL;
    process.env.FRONTEND_FORM_BASE_URL = 'https://frontend.example.com/forms/';

    try {
      const res = await request(app)
        .post(`/api/feedback-forms/${created._id}/qr`)
        .set(authHeader)
        .expect(200);

      expect(res.body).toHaveProperty('message', 'Feedback form QR generated');
      expect(res.body.formUrl).toBe(`https://frontend.example.com/forms/${created._id.toString()}`);
      expect(res.body.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    } finally {
      process.env.FRONTEND_FORM_BASE_URL = previousBaseUrl;
    }
  });

  it('returns 400 when frontendBaseUrl is invalid', async () => {
    const { authHeader, businessId } = await createBusinessAuth();

    const created = await FeedbackForm.create({
      businessId,
      title: 'QR form',
      fields: [{ name: 'comment', label: 'Comment', type: 'short_text' }],
    });

    const res = await request(app)
      .post(`/api/feedback-forms/${created._id}/qr`)
      .set(authHeader)
      .send({ frontendBaseUrl: '' })
      .expect(400);

    expect(res.body.error).toBe('frontendBaseUrl must be a non-empty string');
  });

  it('returns 404 when generating QR for non-existing form', async () => {
    const { authHeader } = await createBusinessAuth();
    const missingId = '507f1f77bcf86cd799439011';

    const res = await request(app)
      .post(`/api/feedback-forms/${missingId}/qr`)
      .set(authHeader)
      .expect(404);

    expect(res.body.error).toBe('Feedback form not found');
  });

  it('returns 400 when generating QR with invalid form id', async () => {
    const { authHeader } = await createBusinessAuth();

    const res = await request(app)
      .post('/api/feedback-forms/not-an-object-id/qr')
      .set(authHeader)
      .expect(400);

    expect(res.body.error).toBe('Invalid feedback form id');
  });

  it('deletes a feedback form', async () => {
    const { authHeader, businessId } = await createBusinessAuth();

    const created = await FeedbackForm.create({
      businessId,
      title: 'Delete me',
      fields: [{ name: 'comment', label: 'Comment', type: 'short_text' }],
    });

    await request(app).delete(`/api/feedback-forms/${created._id}`).set(authHeader).expect(200);
    await request(app).get(`/api/feedback-forms/${created._id}`).expect(404);
  });
});
