const request = require('supertest');
const { connect, disconnect } = require('../db');
const app = require('../app');
const { FeedbackForm } = require('../models/FeedbackForm');
const { FeedbackSubmission } = require('../models/FeedbackSubmission');
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
    businessId: business?._id,
  };
}

describe('Feedback Submissions API', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await FeedbackSubmission.deleteMany({});
    await FeedbackForm.deleteMany({});
    await Business.deleteMany({});
    await User.deleteMany({});
    await disconnect();
  });

  afterEach(async () => {
    await FeedbackSubmission.deleteMany({});
    await FeedbackForm.deleteMany({});
    await Business.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/feedback-forms/:id/submit', () => {
    it('creates a submission with formSnapshot and responses (no auth required)', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Survey',
        fields: [
          { name: 'rating', label: 'Rating', type: 'radio', options: ['1', '2', '3'] },
          { name: 'comment', label: 'Comment', type: 'short_text', required: true },
        ],
      });

      const res = await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send({ rating: '2', comment: 'Great service' })
        .expect(201);

      expect(res.body).toHaveProperty('message', 'Submission received');
      expect(res.body).toHaveProperty('submissionId');

      const submission = await FeedbackSubmission.findById(res.body.submissionId).lean();
      expect(submission).toBeTruthy();
      expect(submission.formId.toString()).toBe(form._id.toString());
      expect(submission.businessId.toString()).toBe(businessId.toString());
      expect(submission.formSnapshot).toHaveLength(2);
      expect(submission.formSnapshot.map((f: { name: string }) => f.name)).toEqual(['rating', 'comment']);
      expect(submission.responses).toEqual({ rating: '2', comment: 'Great service' });
      expect(submission.submittedAt).toBeTruthy();
    });

    it('stores checkbox values as array', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Checkbox form',
        fields: [
          { name: 'tags', label: 'Tags', type: 'checkbox', options: ['A', 'B', 'C'] },
        ],
      });

      const res = await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send({ tags: ['A', 'C'] })
        .expect(201);

      const submission = await FeedbackSubmission.findById(res.body.submissionId).lean();
      expect(submission.responses.tags).toEqual(['A', 'C']);
    });

    it('returns 400 when required field is missing', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Required field',
        fields: [
          { name: 'comment', label: 'Comment', type: 'short_text', required: true },
        ],
      });

      const res = await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send({})
        .expect(400);

      expect(res.body.error).toContain('required');
    });

    it('returns 404 when form does not exist', async () => {
      const missingId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .post(`/api/feedback-forms/${missingId}/submit`)
        .send({ comment: 'Hi' })
        .expect(404);

      expect(res.body.error).toBe('Feedback form not found');
    });

    it('returns 400 when form id is invalid', async () => {
      const res = await request(app)
        .post('/api/feedback-forms/not-an-id/submit')
        .send({ comment: 'Hi' })
        .expect(400);

      expect(res.body.error).toBe('Invalid feedback form id');
    });

    it('returns 400 when body is not an object', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Survey',
        fields: [{ name: 'comment', label: 'Comment', type: 'short_text' }],
      });

      const res = await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send([])
        .expect(400);

      expect(res.body.error).toBeTruthy();
    });
  });

  describe('GET /api/feedback-forms/:id/submissions', () => {
    it('returns submissions for form owned by business', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Survey',
        fields: [{ name: 'comment', label: 'Comment', type: 'short_text' }],
      });
      const older = new Date(Date.now() - 10000);
      const newer = new Date(Date.now() - 1000);
      await FeedbackSubmission.create({
        formId: form._id,
        businessId,
        formSnapshot: [{ name: 'comment', label: 'Comment', type: 'short_text' }],
        responses: { comment: 'First' },
        submittedAt: older,
      });
      await FeedbackSubmission.create({
        formId: form._id,
        businessId,
        formSnapshot: [{ name: 'comment', label: 'Comment', type: 'short_text' }],
        responses: { comment: 'Second' },
        submittedAt: newer,
      });

      const res = await request(app)
        .get(`/api/feedback-forms/${form._id}/submissions`)
        .set(authHeader)
        .expect(200);

      expect(res.body.submissions).toHaveLength(2);
      expect(res.body.total).toBe(2);
      expect(res.body.submissions[0].formSnapshot).toHaveLength(1);
      expect(res.body.submissions[0].responses).toEqual({ comment: 'Second' });
      expect(res.body.submissions[1].responses).toEqual({ comment: 'First' });
    });

    it('returns 401 when not authenticated', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Survey',
        fields: [{ name: 'comment', label: 'Comment', type: 'short_text' }],
      });

      await request(app)
        .get(`/api/feedback-forms/${form._id}/submissions`)
        .expect(401);
    });

    it('returns 404 when form does not exist', async () => {
      const { authHeader } = await createBusinessAuth();
      const missingId = '507f1f77bcf86cd799439011';

      const res = await request(app)
        .get(`/api/feedback-forms/${missingId}/submissions`)
        .set(authHeader)
        .expect(404);

      expect(res.body.error).toBe('Feedback form not found');
    });

    it('returns 400 when form id is invalid', async () => {
      const { authHeader } = await createBusinessAuth();

      const res = await request(app)
        .get('/api/feedback-forms/invalid-id/submissions')
        .set(authHeader)
        .expect(400);

      expect(res.body.error).toBe('Invalid feedback form id');
    });

    it('applies pagination', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Survey',
        fields: [{ name: 'comment', label: 'Comment', type: 'short_text' }],
      });
      for (let i = 0; i < 5; i++) {
        await FeedbackSubmission.create({
          formId: form._id,
          businessId,
          formSnapshot: [{ name: 'comment', label: 'Comment', type: 'short_text' }],
          responses: { comment: `Submission ${i}` },
        });
      }

      const res = await request(app)
        .get(`/api/feedback-forms/${form._id}/submissions`)
        .query({ page: 2, pageSize: 2 })
        .set(authHeader)
        .expect(200);

      expect(res.body.submissions).toHaveLength(2);
      expect(res.body.total).toBe(5);
    });
  });
});
