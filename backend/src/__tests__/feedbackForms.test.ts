const request = require('supertest');
const { connect, disconnect } = require('../db');
const app = require('../app');
const { FeedbackForm } = require('../models/FeedbackForm');

describe('Feedback Forms API', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await FeedbackForm.deleteMany({});
    await disconnect();
  });

  afterEach(async () => {
    await FeedbackForm.deleteMany({});
  });

  it('creates a feedback form with supported field types', async () => {
    const res = await request(app)
      .post('/api/feedback-forms')
      .send({
        title: 'Customer feedback',
        description: 'Collect customer feedback',
        fields: [
          { name: 'wouldRecommend', label: 'Would you recommend us?', type: 'checkbox' },
          { name: 'headline', label: 'Headline', type: 'short text' },
          { name: 'details', label: 'Details', type: 'long-text' },
          { name: 'story', label: 'Story', type: 'big text' },
          { name: 'screenshot', label: 'Upload screenshot', type: 'image upload' },
        ],
      })
      .expect(201);

    expect(res.body).toHaveProperty('message', 'Feedback form created');
    expect(res.body.feedbackForm.title).toBe('Customer feedback');
    expect(res.body.feedbackForm.fields).toHaveLength(5);
    expect(res.body.feedbackForm.fields.map((field: any) => field.type)).toEqual([
      'checkbox',
      'short_text',
      'long_text',
      'big_text',
      'image_upload',
    ]);
  });

  it('returns 400 when a field type is unsupported', async () => {
    const res = await request(app)
      .post('/api/feedback-forms')
      .send({
        title: 'Customer feedback',
        fields: [{ name: 'rating', label: 'Rating', type: 'stars' }],
      })
      .expect(400);

    expect(res.body.error).toContain('not supported');
  });

  it('lists saved feedback forms', async () => {
    await FeedbackForm.create({
      title: 'Support feedback',
      fields: [{ name: 'isResolved', label: 'Issue resolved?', type: 'checkbox' }],
    });

    const res = await request(app).get('/api/feedback-forms').expect(200);
    expect(Array.isArray(res.body.feedbackForms)).toBe(true);
    expect(res.body.feedbackForms).toHaveLength(1);
    expect(res.body.feedbackForms[0].title).toBe('Support feedback');
  });

  it('updates an existing feedback form', async () => {
    const created = await FeedbackForm.create({
      title: 'Old form name',
      fields: [{ name: 'comment', label: 'Comment', type: 'short_text' }],
    });

    const res = await request(app)
      .put(`/api/feedback-forms/${created._id}`)
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
    const created = await FeedbackForm.create({
      title: 'QR form',
      fields: [{ name: 'comment', label: 'Comment', type: 'short_text' }],
    });

    const previousBaseUrl = process.env.FRONTEND_FORM_BASE_URL;
    process.env.FRONTEND_FORM_BASE_URL = 'https://frontend.example.com/forms/';

    try {
      const res = await request(app)
        .post(`/api/feedback-forms/${created._id}/qr`)
        .expect(200);

      expect(res.body).toHaveProperty('message', 'Feedback form QR generated');
      expect(res.body.formUrl).toBe(`https://frontend.example.com/forms/${created._id.toString()}`);
      expect(res.body.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    } finally {
      process.env.FRONTEND_FORM_BASE_URL = previousBaseUrl;
    }
  });

  it('returns 400 when frontendBaseUrl is invalid', async () => {
    const created = await FeedbackForm.create({
      title: 'QR form',
      fields: [{ name: 'comment', label: 'Comment', type: 'short_text' }],
    });

    const res = await request(app)
      .post(`/api/feedback-forms/${created._id}/qr`)
      .send({ frontendBaseUrl: '' })
      .expect(400);

    expect(res.body.error).toBe('frontendBaseUrl must be a non-empty string');
  });

  it('returns 404 when generating QR for non-existing form', async () => {
    const missingId = '507f1f77bcf86cd799439011';

    const res = await request(app)
      .post(`/api/feedback-forms/${missingId}/qr`)
      .expect(404);

    expect(res.body.error).toBe('Feedback form not found');
  });

  it('returns 400 when generating QR with invalid form id', async () => {
    const res = await request(app)
      .post('/api/feedback-forms/not-an-object-id/qr')
      .expect(400);

    expect(res.body.error).toBe('Invalid feedback form id');
  });

  it('deletes a feedback form', async () => {
    const created = await FeedbackForm.create({
      title: 'Delete me',
      fields: [{ name: 'comment', label: 'Comment', type: 'short_text' }],
    });

    await request(app).delete(`/api/feedback-forms/${created._id}`).expect(200);
    await request(app).get(`/api/feedback-forms/${created._id}`).expect(404);
  });
});
