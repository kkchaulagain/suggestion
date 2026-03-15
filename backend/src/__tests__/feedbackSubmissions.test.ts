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
    phone: '+9779812345678',
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
          { name: 'comment', label: 'Comment', type: 'text', required: true },
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
          { name: 'comment', label: 'Comment', type: 'text', required: true },
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
        fields: [{ name: 'comment', label: 'Comment', type: 'text' }],
      });

      const res = await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send([])
        .expect(400);

      expect(res.body.error).toBeTruthy();
    });

    it('returns 400 when required checkbox has empty array', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Checkbox required',
        fields: [{ name: 'agree', label: 'I agree', type: 'checkbox', required: true }],
      });

      const res = await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send({ agree: [] })
        .expect(400);

      expect(res.body.error).toMatch(/required/);
    });

    it('returns 400 when required text is empty string', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Text required',
        fields: [{ name: 'comment', label: 'Comment', type: 'text', required: true }],
      });

      const res = await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send({ comment: '   ' })
        .expect(400);

      expect(res.body.error).toMatch(/required/);
    });

    it('accepts empty name when allowAnonymous is true on name field', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Anonymous form',
        fields: [
          { name: 'fullName', label: 'Your Name', type: 'text', required: true, allowAnonymous: true },
          { name: 'comment', label: 'Comment', type: 'text', required: false },
        ],
      });

      const res = await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send({ fullName: '', comment: 'Great' })
        .expect(201);

      expect(res.body).toHaveProperty('submissionId');
      const submission = await FeedbackSubmission.findById(res.body.submissionId).lean();
      expect(submission.responses.fullName).toBe('');
    });

    it('accepts "Anonymous" as name value when allowAnonymous is true', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Anonymous form',
        fields: [
          { name: 'fullName', label: 'Your Name', type: 'text', required: true, allowAnonymous: true },
        ],
      });

      const res = await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send({ fullName: 'Anonymous' })
        .expect(201);

      const submission = await FeedbackSubmission.findById(res.body.submissionId).lean();
      expect(submission.responses.fullName).toBe('Anonymous');
    });

    it('accepts "Anonymous" as email value when allowAnonymous is true', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Anonymous email form',
        fields: [
          { name: 'email', label: 'Email Address', type: 'email', required: true, allowAnonymous: true },
        ],
      });

      const res = await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send({ email: 'Anonymous' })
        .expect(201);

      const submission = await FeedbackSubmission.findById(res.body.submissionId).lean();
      expect(submission.responses.email).toBe('Anonymous');
    });

    it('accepts empty email when allowAnonymous is true on email field', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Anonymous email form',
        fields: [
          { name: 'email', label: 'Email Address', type: 'email', required: true, allowAnonymous: true },
          { name: 'comment', label: 'Comment', type: 'text', required: false },
        ],
      });

      const res = await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send({ email: '', comment: 'Great' })
        .expect(201);

      expect(res.body).toHaveProperty('submissionId');
      const submission = await FeedbackSubmission.findById(res.body.submissionId).lean();
      expect(submission.responses.email).toBe('');
    });

    it('still requires name when allowAnonymous is false', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Required name form',
        fields: [
          { name: 'fullName', label: 'Your Name', type: 'text', required: true, allowAnonymous: false },
        ],
      });

      const res = await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send({ fullName: '' })
        .expect(400);

      expect(res.body.error).toMatch(/required/);
    });

    it('accepts optional checkbox with single value (normalized to array)', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Optional tags',
        fields: [{ name: 'tags', label: 'Tags', type: 'checkbox', options: ['A', 'B'], required: false }],
      });

      const res = await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send({ tags: 'A' })
        .expect(201);

      const submission = await FeedbackSubmission.findById(res.body.submissionId).lean();
      expect(submission.responses.tags).toEqual(['A']);
    });

    it('accepts optional non-checkbox field with value', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Optional comment',
        fields: [{ name: 'comment', label: 'Comment', type: 'text', required: false }],
      });

      const res = await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send({ comment: 'Optional text' })
        .expect(201);

      expect((await FeedbackSubmission.findById(res.body.submissionId).lean()).responses.comment).toBe('Optional text');
    });

    it('accepts required checkbox with valid string values', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Required CB',
        fields: [{ name: 'colors', label: 'Colors', type: 'checkbox', options: ['R', 'G', 'B'], required: true }],
      });

      const res = await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send({ colors: ['R', 'B'] })
        .expect(201);

      const sub = await FeedbackSubmission.findById(res.body.submissionId).lean();
      expect(sub.responses.colors).toEqual(['R', 'B']);
    });

    it('defaults optional missing fields to empty value', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Optional defaults',
        fields: [
          { name: 'tags', label: 'Tags', type: 'checkbox', options: ['A'], required: false },
          { name: 'note', label: 'Note', type: 'text', required: false },
        ],
      });

      const res = await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send({})
        .expect(201);

      const sub = await FeedbackSubmission.findById(res.body.submissionId).lean();
      expect(sub.responses.tags).toEqual([]);
      expect(sub.responses.note).toBe('');
    });

    it('returns 500 when submission save fails', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Survey',
        fields: [{ name: 'comment', label: 'Comment', type: 'text' }],
      });

      const createSpy = jest.spyOn(FeedbackSubmission, 'create').mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send({ comment: 'Hi' })
        .expect(500);

      expect(res.body.error).toMatch(/save submission|failed/i);
      createSpy.mockRestore();
    });
  });

  describe('GET /api/feedback-forms/:id/submissions', () => {
    it('returns submissions for form owned by business', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Survey',
        fields: [{ name: 'comment', label: 'Comment', type: 'text' }],
      });
      const older = new Date(Date.now() - 10000);
      const newer = new Date(Date.now() - 1000);
      await FeedbackSubmission.create({
        formId: form._id,
        businessId,
        formSnapshot: [{ name: 'comment', label: 'Comment', type: 'text' }],
        responses: { comment: 'First' },
        submittedAt: older,
      });
      await FeedbackSubmission.create({
        formId: form._id,
        businessId,
        formSnapshot: [{ name: 'comment', label: 'Comment', type: 'text' }],
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
        fields: [{ name: 'comment', label: 'Comment', type: 'text' }],
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
        fields: [{ name: 'comment', label: 'Comment', type: 'text' }],
      });
      for (let i = 0; i < 5; i++) {
        await FeedbackSubmission.create({
          formId: form._id,
          businessId,
          formSnapshot: [{ name: 'comment', label: 'Comment', type: 'text' }],
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

    it('returns 500 when fetch fails', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Survey',
        fields: [{ name: 'comment', label: 'Comment', type: 'text' }],
      });

      const findSpy = jest.spyOn(FeedbackSubmission, 'find').mockReturnValueOnce({
        sort: () => ({ skip: () => ({ limit: () => ({ lean: () => Promise.reject(new Error('DB error')) }) }) }),
      } as never);

      const res = await request(app)
        .get(`/api/feedback-forms/${form._id}/submissions`)
        .set(authHeader)
        .expect(500);

      expect(res.body.error).toMatch(/submissions|failed/i);
      findSpy.mockRestore();
    });
  });

  describe('GET /api/feedback-forms/submissions (business submissions list)', () => {
    it('returns submissions with formTitle for business', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'My Survey',
        fields: [{ name: 'comment', label: 'Comment', type: 'text' }],
      });
      await FeedbackSubmission.create({
        formId: form._id,
        businessId,
        formSnapshot: [{ name: 'comment', label: 'Comment', type: 'text' }],
        responses: { comment: 'First' },
      });

      const res = await request(app)
        .get('/api/feedback-forms/submissions')
        .set(authHeader)
        .expect(200);

      expect(res.body.submissions).toHaveLength(1);
      expect(res.body.total).toBe(1);
      expect(res.body.submissions[0].formTitle).toBe('My Survey');
      expect(res.body.submissions[0].formId).toBe(form._id.toString());
    });

    it('filters by formId when provided', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const form1 = await FeedbackForm.create({
        businessId,
        title: 'Form 1',
        fields: [{ name: 'c', label: 'C', type: 'text' }],
      });
      const form2 = await FeedbackForm.create({
        businessId,
        title: 'Form 2',
        fields: [{ name: 'c', label: 'C', type: 'text' }],
      });
      await FeedbackSubmission.create({
        formId: form1._id,
        businessId,
        formSnapshot: [{ name: 'c', label: 'C', type: 'text' }],
        responses: { c: 'a' },
      });
      await FeedbackSubmission.create({
        formId: form2._id,
        businessId,
        formSnapshot: [{ name: 'c', label: 'C', type: 'text' }],
        responses: { c: 'b' },
      });

      const res = await request(app)
        .get('/api/feedback-forms/submissions')
        .query({ formId: form1._id.toString() })
        .set(authHeader)
        .expect(200);

      expect(res.body.submissions).toHaveLength(1);
      expect(res.body.submissions[0].formTitle).toBe('Form 1');
    });

    it('returns 400 when formId query is invalid', async () => {
      const { authHeader } = await createBusinessAuth();

      const res = await request(app)
        .get('/api/feedback-forms/submissions')
        .query({ formId: 'not-valid-id' })
        .set(authHeader)
        .expect(400);

      expect(res.body.error).toMatch(/invalid form id/i);
    });

    it('filters by dateFrom and dateTo', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Survey',
        fields: [{ name: 'c', label: 'C', type: 'text' }],
      });
      const oldDate = new Date('2024-01-01');
      const midDate = new Date('2024-06-15');
      const newDate = new Date('2024-12-31');
      await FeedbackSubmission.create({
        formId: form._id,
        businessId,
        formSnapshot: [{ name: 'c', label: 'C', type: 'text' }],
        responses: { c: 'old' },
        submittedAt: oldDate,
      });
      await FeedbackSubmission.create({
        formId: form._id,
        businessId,
        formSnapshot: [{ name: 'c', label: 'C', type: 'text' }],
        responses: { c: 'mid' },
        submittedAt: midDate,
      });
      await FeedbackSubmission.create({
        formId: form._id,
        businessId,
        formSnapshot: [{ name: 'c', label: 'C', type: 'text' }],
        responses: { c: 'new' },
        submittedAt: newDate,
      });

      const res = await request(app)
        .get('/api/feedback-forms/submissions')
        .query({ dateFrom: '2024-06-01', dateTo: '2024-07-01' })
        .set(authHeader)
        .expect(200);

      expect(res.body.submissions).toHaveLength(1);
      expect(res.body.submissions[0].responses.c).toBe('mid');
    });

    it('filters by response field when formId and field_ param are provided', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Survey',
        fields: [{ name: 'rating', label: 'Rating', type: 'radio', options: ['Good', 'Bad'] }],
      });
      await FeedbackSubmission.create({
        formId: form._id,
        businessId,
        formSnapshot: [{ name: 'rating', label: 'Rating', type: 'radio', options: ['Good', 'Bad'] }],
        responses: { rating: 'Good' },
      });
      await FeedbackSubmission.create({
        formId: form._id,
        businessId,
        formSnapshot: [{ name: 'rating', label: 'Rating', type: 'radio', options: ['Good', 'Bad'] }],
        responses: { rating: 'Bad' },
      });

      const res = await request(app)
        .get('/api/feedback-forms/submissions')
        .query({ formId: form._id.toString(), field_rating: 'Good' })
        .set(authHeader)
        .expect(200);

      expect(res.body.submissions).toHaveLength(1);
      expect(res.body.submissions[0].responses.rating).toBe('Good');
    });

    it('applies page and pageSize', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Survey',
        fields: [{ name: 'c', label: 'C', type: 'text' }],
      });
      for (let i = 0; i < 5; i++) {
        await FeedbackSubmission.create({
          formId: form._id,
          businessId,
          formSnapshot: [{ name: 'c', label: 'C', type: 'text' }],
          responses: { c: `Sub ${i}` },
        });
      }

      const res = await request(app)
        .get('/api/feedback-forms/submissions')
        .query({ page: 2, pageSize: 2 })
        .set(authHeader)
        .expect(200);

      expect(res.body.submissions).toHaveLength(2);
      expect(res.body.total).toBe(5);
    });

    it('returns 500 when list submissions fails', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      await FeedbackForm.create({
        businessId,
        title: 'Survey',
        fields: [{ name: 'c', label: 'C', type: 'text' }],
      });

      const findSpy = jest.spyOn(FeedbackSubmission, 'find').mockReturnValueOnce({
        sort: () => ({ skip: () => ({ limit: () => ({ lean: () => Promise.reject(new Error('DB error')) }) }) }),
      } as never);

      const res = await request(app)
        .get('/api/feedback-forms/submissions')
        .set(authHeader)
        .expect(500);

      expect(res.body.error).toMatch(/submissions|failed/i);
      findSpy.mockRestore();
    });
  });
});
