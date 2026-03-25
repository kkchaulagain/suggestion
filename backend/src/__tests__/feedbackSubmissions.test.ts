const request = require('supertest');
const { connect, disconnect } = require('../db');
const app = require('../app');
const { FeedbackForm } = require('../models/FeedbackForm');
const { FeedbackSubmission } = require('../models/FeedbackSubmission');
const User = require('../models/User');
const Business = require('../models/Business');
const Contact = require('../models/Contact');
const CrmActivity = require('../models/CrmActivity');
const { EmailNotification } = require('../notification/email.notifiaction');

async function createBusinessAuth() {
  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const email = `biz_${suffix}@example.com`;
  const password = 'Password123!';
  const phone = `+97798${String(10000000 + Math.floor(Math.random() * 90000000))}`;

  const registerRes = await request(app).post('/api/auth/register').send({
    name: 'Business Owner',
    email,
    password,
    phone,
    role: 'business',
    location: 'City Center',
    pancardNumber: 1234567,
    description: 'Business profile',
    businessname: 'Acme Business',
  });
  if (registerRes.status !== 201) {
    throw new Error(`Failed to register business test user: ${JSON.stringify(registerRes.body)}`);
  }

  const loginRes = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
  const token = loginRes.body?.token || loginRes.body?.data?.token;
  if (!token) {
    throw new Error('Missing auth token for business test user');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('_id').lean();
  if (!user?._id) {
    throw new Error('Failed to locate business test user after login');
  }

  let business = await Business.findOne({ owner: user._id }).select('_id').lean();
  if (!business?._id) {
    business = await Business.create({
      owner: user._id,
      type: 'commercial',
      businessname: 'Acme Business',
      description: 'Business profile',
      location: 'City Center',
      pancardNumber: '1234567',
    });
  }

  return {
    authHeader: { Authorization: `Bearer ${token}` },
    businessId: business?._id,
    ownerEmail: email.toLowerCase(),
  };
}

describe('Feedback Submissions API', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await FeedbackSubmission.deleteMany({});
    await FeedbackForm.deleteMany({});
    await Contact.deleteMany({});
    await CrmActivity.deleteMany({});
    await Business.deleteMany({});
    await User.deleteMany({});
    await disconnect();
  });

  afterEach(async () => {
    await FeedbackSubmission.deleteMany({});
    await FeedbackForm.deleteMany({});
    await Contact.deleteMany({});
    await CrmActivity.deleteMany({});
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

    it('creates a Contact when submission includes email', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Lead',
        fields: [
          { name: 'name', label: 'Name', type: 'name' },
          { name: 'email', label: 'Email', type: 'email', required: true },
        ],
      });

      await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send({ name: 'Pat', email: 'Pat@EXAMPLE.com' })
        .expect(201);

      const contacts = await Contact.find({ businessId });
      expect(contacts).toHaveLength(1);
      expect(contacts[0].email).toBe('pat@example.com');
      expect(contacts[0].displayName).toBe('Pat');
      expect(contacts[0].submissionCount).toBe(1);
    });

    it('increments submissionCount for same email on repeat submit', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Lead',
        fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
      });

      await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send({ email: 'same@example.com' })
        .expect(201);
      await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send({ email: 'same@example.com' })
        .expect(201);

      const contacts = await Contact.find({ businessId });
      expect(contacts).toHaveLength(1);
      expect(contacts[0].submissionCount).toBe(2);
    });

    it('dedupes phone-only submissions', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Phone lead',
        fields: [{ name: 'phone', label: 'Phone', type: 'phone', required: true }],
      });

      await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send({ phone: '+99  111  222' })
        .expect(201);
      await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send({ phone: '+99 111 222' })
        .expect(201);

      const contacts = await Contact.find({ businessId });
      expect(contacts).toHaveLength(1);
      expect(contacts[0].phone).toBe('+99 111 222');
      expect(contacts[0].submissionCount).toBe(2);
    });

    it('merges separate email-only and phone-only contacts when submission has both', async () => {
      const { businessId } = await createBusinessAuth();
      const formEmail = await FeedbackForm.create({
        businessId,
        title: 'E',
        fields: [{ name: 'email', label: 'E', type: 'email', required: true }],
      });
      await request(app)
        .post(`/api/feedback-forms/${formEmail._id}/submit`)
        .send({ email: 'merge@test.com' })
        .expect(201);

      const formPhone = await FeedbackForm.create({
        businessId,
        title: 'P',
        fields: [{ name: 'phone', label: 'P', type: 'phone', required: true }],
      });
      await request(app)
        .post(`/api/feedback-forms/${formPhone._id}/submit`)
        .send({ phone: '+1 555 000' })
        .expect(201);

      expect(await Contact.countDocuments({ businessId })).toBe(2);

      const formBoth = await FeedbackForm.create({
        businessId,
        title: 'B',
        fields: [
          { name: 'email', label: 'E', type: 'email', required: true },
          { name: 'phone', label: 'P', type: 'phone', required: true },
        ],
      });
      await request(app)
        .post(`/api/feedback-forms/${formBoth._id}/submit`)
        .send({ email: 'merge@test.com', phone: '+1 555 000' })
        .expect(201);

      expect(await Contact.countDocuments({ businessId })).toBe(1);
      const merged = await Contact.findOne({ businessId }).lean();
      expect(merged?.email).toBe('merge@test.com');
      expect(merged?.phone).toBe('+1 555 000');
      expect(merged?.submissionCount).toBe(3);
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
          { name: 'comment', label: 'Comment', type: 'short_text', required: false },
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

    it('still requires checkbox values even when allowAnonymous is true', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Required checkbox form',
        fields: [
          { name: 'choices', label: 'Choices', type: 'checkbox', required: true, allowAnonymous: true },
        ],
      });

      const res = await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send({ choices: [] })
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

    it('sends business notification with form title and submitter name', async () => {
      const { businessId, ownerEmail } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Customer Experience Survey',
        fields: [
          { name: 'fullName', label: 'Full Name', type: 'name', required: false },
          { name: 'email', label: 'Email', type: 'email', required: false },
          { name: 'comment', label: 'Comment', type: 'text', required: false },
        ],
      });

      const calls: Array<{ recipient: string; message: string }> = [];
      const sendSpy = jest.spyOn(EmailNotification.prototype, 'send').mockImplementation(function (this: { recepient: string; message: string }) {
        calls.push({ recipient: this.recepient, message: this.message });
        return Promise.resolve();
      });

      await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send({ fullName: 'Jane Doe', email: 'jane@example.com', comment: 'Great service' })
        .expect(201);

      const businessCall = calls.find((c) => c.recipient === ownerEmail);
      expect(businessCall).toBeTruthy();
      expect(businessCall?.message).toContain('New form submission received.');
      expect(businessCall?.message).toContain('Form: Customer Experience Survey');
      expect(businessCall?.message).toContain('Submitted by: Jane Doe');

      sendSpy.mockRestore();
    });

    it('uses Anonymous in business notification when submitter is anonymous', async () => {
      const { businessId, ownerEmail } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Anonymous Feedback',
        fields: [
          { name: 'fullName', label: 'Your Name', type: 'name', required: false, allowAnonymous: true },
          { name: 'comment', label: 'Comment', type: 'text', required: false },
        ],
      });

      const calls: Array<{ recipient: string; message: string }> = [];
      const sendSpy = jest.spyOn(EmailNotification.prototype, 'send').mockImplementation(function (this: { recepient: string; message: string }) {
        calls.push({ recipient: this.recepient, message: this.message });
        return Promise.resolve();
      });

      await request(app)
        .post(`/api/feedback-forms/${form._id}/submit`)
        .send({ fullName: 'Anonymous', comment: 'No name provided' })
        .expect(201);

      const businessCall = calls.find((c) => c.recipient === ownerEmail);
      expect(businessCall).toBeTruthy();
      expect(businessCall?.message).toContain('Form: Anonymous Feedback');
      expect(businessCall?.message).toContain('Submitted by: Anonymous');

      sendSpy.mockRestore();
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

  describe('Feedback notification recipients and campaign routes', () => {
    it('returns deduped recipients with pagination and multiple email extraction strategies', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Notification Survey',
        fields: [{ name: 'comment', label: 'Comment', type: 'text' }],
      });

      await FeedbackSubmission.create({
        formId: form._id,
        businessId,
        formSnapshot: [{ name: 'comment', label: 'Comment', type: 'text' }],
        submitterEmail: 'Direct@Example.com ',
        responses: { comment: 'one' },
      });
      await FeedbackSubmission.create({
        formId: form._id,
        businessId,
        formSnapshot: [{ name: 'comment', label: 'Comment', type: 'text' }],
        responses: { contactEmail: 'secondary@example.com' },
      });
      await FeedbackSubmission.create({
        formId: form._id,
        businessId,
        formSnapshot: [{ name: 'comment', label: 'Comment', type: 'text' }],
        responses: { message: 'third@example.com' },
      });
      await FeedbackSubmission.create({
        formId: form._id,
        businessId,
        formSnapshot: [{ name: 'comment', label: 'Comment', type: 'text' }],
        responses: { email: 'direct@example.com' },
      });
      await FeedbackSubmission.create({
        formId: form._id,
        businessId,
        formSnapshot: [{ name: 'comment', label: 'Comment', type: 'text' }],
        responses: { message: 'not-an-email' },
      });

      const page1 = await request(app)
        .get(`/api/feedback-forms/${form._id}/notification-recipients`)
        .query({ page: 1, pageSize: 2 })
        .set(authHeader)
        .expect(200);

      expect(page1.body.formId).toBe(form._id.toString());
      expect(page1.body.formTitle).toBe('Notification Survey');
      expect(page1.body.totalRecipients).toBe(3);
      expect(page1.body.recipients).toHaveLength(2);

      const page2 = await request(app)
        .get(`/api/feedback-forms/${form._id}/notification-recipients`)
        .query({ page: 2, pageSize: 2 })
        .set(authHeader)
        .expect(200);

      expect(page2.body.recipients).toHaveLength(1);
      expect(page2.body.recipients[0].email).toContain('@example.com');
    });

    it('skips entries with missing submission id even if an email exists', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Skip Missing ID',
        fields: [{ name: 'comment', label: 'Comment', type: 'text' }],
      });

      const findSpy = jest.spyOn(FeedbackSubmission, 'find').mockReturnValueOnce({
        select: () => ({
          sort: () => ({
            lean: () => Promise.resolve([
              { submitterEmail: 'missing-id@example.com', responses: {} },
              {
                _id: new (require('mongoose').Types.ObjectId)(),
                submitterEmail: 'valid@example.com',
                responses: {},
                submittedAt: new Date(),
              },
            ]),
          }),
        }),
      } as never);

      const res = await request(app)
        .get(`/api/feedback-forms/${form._id}/notification-recipients`)
        .set(authHeader)
        .expect(200);

      expect(res.body.totalRecipients).toBe(1);
      expect(res.body.recipients[0].email).toBe('valid@example.com');
      findSpy.mockRestore();
    });

    it('returns 400/404 for invalid recipient route inputs', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Existing',
        fields: [{ name: 'comment', label: 'Comment', type: 'text' }],
      });

      await request(app)
        .get('/api/feedback-forms/not-an-id/notification-recipients')
        .set(authHeader)
        .expect(400);

      await request(app)
        .get(`/api/feedback-forms/${new (require('mongoose').Types.ObjectId)()}/notification-recipients`)
        .set(authHeader)
        .expect(404);

      const okRes = await request(app)
        .get(`/api/feedback-forms/${form._id}/notification-recipients`)
        .set(authHeader)
        .expect(200);
      expect(okRes.body.formId).toBe(form._id.toString());
    });

    it('returns 500 when recipient fetch throws', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Recipient Error',
        fields: [{ name: 'comment', label: 'Comment', type: 'text' }],
      });

      const findSpy = jest.spyOn(FeedbackSubmission, 'find').mockReturnValueOnce({
        select: () => ({
          sort: () => ({
            lean: () => Promise.reject(new Error('recipient fetch failed')),
          }),
        }),
      } as never);

      const res = await request(app)
        .get(`/api/feedback-forms/${form._id}/notification-recipients`)
        .set(authHeader)
        .expect(500);

      expect(res.body.error).toMatch(/recipients/i);
      findSpy.mockRestore();
    });

    it('validates campaign payload and scheduleAt', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Campaign Form',
        fields: [{ name: 'email', label: 'Email', type: 'email' }],
      });

      await request(app)
        .post('/api/feedback-forms/not-an-id/notifications/campaign')
        .set(authHeader)
        .send({ subject: 'x', htmlBody: '<p>x</p>' })
        .expect(400);

      await request(app)
        .post(`/api/feedback-forms/${form._id}/notifications/campaign`)
        .set(authHeader)
        .send({ subject: '   ', htmlBody: '<p>x</p>' })
        .expect(400);

      await request(app)
        .post(`/api/feedback-forms/${form._id}/notifications/campaign`)
        .set(authHeader)
        .send({ subject: 'Subject', htmlBody: '   ' })
        .expect(400);

      await request(app)
        .post(`/api/feedback-forms/${form._id}/notifications/campaign`)
        .set(authHeader)
        .send({ subject: 'Subject', htmlBody: '<p>x</p>', scheduleAt: 'not-a-date' })
        .expect(400);

      await request(app)
        .post(`/api/feedback-forms/${form._id}/notifications/campaign`)
        .set(authHeader)
        .send({ subject: 'Subject', htmlBody: '<p>x</p>', scheduleAt: new Date(Date.now() - 60_000).toISOString() })
        .expect(400);
    });

    it('returns 404 and 400 for campaign target/recipient failures', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Campaign Form',
        fields: [{ name: 'email', label: 'Email', type: 'email' }],
      });

      await request(app)
        .post(`/api/feedback-forms/${new (require('mongoose').Types.ObjectId)()}/notifications/campaign`)
        .set(authHeader)
        .send({ subject: 'Subject', htmlBody: '<p>x</p>' })
        .expect(404);

      const noRecipients = await request(app)
        .post(`/api/feedback-forms/${form._id}/notifications/campaign`)
        .set(authHeader)
        .send({ subject: 'Subject', htmlBody: '<p>x</p>' })
        .expect(400);

      expect(noRecipients.body.error).toMatch(/no valid recipient/i);
    });

    it('schedules campaign for future delivery', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Scheduled Campaign',
        fields: [{ name: 'email', label: 'Email', type: 'email' }],
      });

      await FeedbackSubmission.create({
        formId: form._id,
        businessId,
        formSnapshot: [{ name: 'email', label: 'Email', type: 'email' }],
        responses: { email: 'scheduled@example.com' },
      });

      const sendSpy = jest.spyOn(EmailNotification.prototype, 'send').mockResolvedValue(undefined);

      const scheduledAt = new Date(Date.now() + 60_000).toISOString();
      const res = await request(app)
        .post(`/api/feedback-forms/${form._id}/notifications/campaign`)
        .set(authHeader)
        .send({ subject: 'Campaign', htmlBody: '<p>Body</p>', scheduleAt: scheduledAt })
        .expect(202);

      expect(res.body.message).toBe('Campaign scheduled successfully');
      expect(res.body.formId).toBe(form._id.toString());
      expect(res.body.recipientCount).toBe(1);
      expect(typeof res.body.campaignId).toBe('string');

      sendSpy.mockRestore();
    });

    it('sends campaign immediately and reports per-recipient failures', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Immediate Campaign',
        fields: [{ name: 'email', label: 'Email', type: 'email' }],
      });

      await FeedbackSubmission.create({
        formId: form._id,
        businessId,
        formSnapshot: [{ name: 'email', label: 'Email', type: 'email' }],
        responses: { email: 'ok@example.com' },
      });
      await FeedbackSubmission.create({
        formId: form._id,
        businessId,
        formSnapshot: [{ name: 'email', label: 'Email', type: 'email' }],
        responses: { email: 'fail@example.com' },
      });

      const sendSpy = jest.spyOn(EmailNotification.prototype, 'send').mockImplementation(function (this: { recepient: string }) {
        if (this.recepient === 'fail@example.com') {
          return Promise.reject(new Error('smtp failed'));
        }
        return Promise.resolve();
      });

      const res = await request(app)
        .post(`/api/feedback-forms/${form._id}/notifications/campaign`)
        .set(authHeader)
        .send({ subject: 'Campaign', htmlBody: '<p>Body</p>' })
        .expect(200);

      expect(res.body.message).toBe('Campaign sent');
      expect(res.body.recipientCount).toBe(2);
      expect(res.body.sent).toBe(1);
      expect(res.body.failed).toBe(1);
      expect(res.body.failures).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: 'fail@example.com', reason: 'smtp failed' }),
        ]),
      );

      sendSpy.mockRestore();
    });

    it('returns 500 when campaign send flow throws unexpectedly', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Campaign Error',
        fields: [{ name: 'email', label: 'Email', type: 'email' }],
      });

      await FeedbackSubmission.create({
        formId: form._id,
        businessId,
        formSnapshot: [{ name: 'email', label: 'Email', type: 'email' }],
        responses: { email: 'ok@example.com' },
      });

      const shareSpy = jest.spyOn(require('qrcode'), 'toDataURL').mockRejectedValueOnce(new Error('qr failed'));

      const res = await request(app)
        .post(`/api/feedback-forms/${form._id}/notifications/campaign`)
        .set(authHeader)
        .send({ subject: 'Campaign', htmlBody: '<p>Body</p>' })
        .expect(500);

      expect(res.body.error).toMatch(/failed to send campaign/i);
      shareSpy.mockRestore();
    });
  });
});
