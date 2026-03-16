const request = require('supertest');
const { connect, disconnect } = require('../db');
const app = require('../app');
const { FeedbackForm } = require('../models/FeedbackForm');
const { FeedbackSubmission } = require('../models/FeedbackSubmission');
const User = require('../models/User');
const Business = require('../models/Business');

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
    businessId: business?._id?.toString(),
  };
}

async function createAdminAuth() {
  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const email = `admin_${suffix}@example.com`;
  const password = 'AdminPass123!';
  const phone = `+97798${String(20000000 + Math.floor(Math.random() * 80000000))}`;
  await User.create({
    name: 'Admin User',
    email,
    password,
    phone,
    role: 'admin',
    isActive: true,
  });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
  const token = loginRes.body?.token || loginRes.body?.data?.token;
  return { authHeader: { Authorization: `Bearer ${token}` } };
}

describe('Feedback Forms API', () => {
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
          { name: 'headline', label: 'Headline', type: 'text' },
          { name: 'details', label: 'Details', type: 'text' },
          { name: 'story', label: 'Story', type: 'textarea' },
          { name: 'screenshot', label: 'Upload screenshot', type: 'image' },
          { name: 'fullName', label: 'Full Name', type: 'text' },
          { name: 'email', label: 'Email Address', type: 'email' },
        ],
      })
      .expect(201);

    expect(res.body).toHaveProperty('message', 'Feedback form created');
    expect(res.body.feedbackForm.title).toBe('Customer feedback');
    expect(res.body.feedbackForm.fields).toHaveLength(8);
    interface FeedbackFormField { type: string }
    expect(res.body.feedbackForm.fields.map((field: FeedbackFormField) => field.type)).toEqual([
      'checkbox',
      'radio',
      'text',
      'text',
      'textarea',
      'image',
      'text',
      'email',
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

  it('persists and returns field options for checkbox and radio (GET by id)', async () => {
    const { authHeader } = await createBusinessAuth();

    const createRes = await request(app)
      .post('/api/feedback-forms')
      .set(authHeader)
      .send({
        title: 'Survey with options',
        fields: [
          { name: 'choice', label: 'Choose one', type: 'radio', options: ['Yes', 'No', 'Maybe'] },
          { name: 'tags', label: 'Select tags', type: 'checkbox', options: ['Tag A', 'Tag B'] },
        ],
      })
      .expect(201);

    const formId = createRes.body.feedbackForm._id;
    const getRes = await request(app).get(`/api/feedback-forms/${formId}`).expect(200);

    expect(getRes.body.feedbackForm.title).toBe('Survey with options');
    const fields = getRes.body.feedbackForm.fields;
    expect(fields).toHaveLength(2);
    const radioField = fields.find((f: { type?: string; options?: string[] }) => f.type === 'radio');
    expect(radioField?.options).toEqual(['Yes', 'No', 'Maybe']);
    const checkboxField = fields.find((f: { type?: string; options?: string[] }) => f.type === 'checkbox');
    expect(checkboxField?.options).toEqual(['Tag A', 'Tag B']);
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

  it('admin can list all feedback forms without a business', async () => {
    const { authHeader } = await createAdminAuth();
    const res = await request(app).get('/api/feedback-forms').set(authHeader).expect(200);
    expect(Array.isArray(res.body.feedbackForms)).toBe(true);
  });

  it('admin gets 400 when creating a form without a business profile', async () => {
    const { authHeader } = await createAdminAuth();
    const res = await request(app)
      .post('/api/feedback-forms')
      .set(authHeader)
      .send({ title: 'Admin form', fields: [{ name: 'q', label: 'Q', type: 'text' }] })
      .expect(400);
    expect(res.body.error).toMatch(/business profile required/i);
  });

  it('updates an existing feedback form', async () => {
    const { authHeader, businessId } = await createBusinessAuth();

    const created = await FeedbackForm.create({
      businessId,
      title: 'Old form name',
      fields: [{ name: 'comment', label: 'Comment', type: 'text' }],
    });

    const res = await request(app)
      .put(`/api/feedback-forms/${created._id}`)
      .set(authHeader)
      .send({
        title: 'Updated form name',
        fields: [{ name: 'comment', label: 'Comment', type: 'text' }],
      })
      .expect(200);

    expect(res.body).toHaveProperty('message', 'Feedback form updated');
    expect(res.body.feedbackForm.title).toBe('Updated form name');
    expect(res.body.feedbackForm.fields[0].type).toBe('text');
  });

  it('updates form with metaTitle, metaDescription, landing fields, formStyle, and showResultsPublic', async () => {
    const { authHeader, businessId } = await createBusinessAuth();

    const created = await FeedbackForm.create({
      businessId,
      title: 'Base form',
      fields: [{ name: 'q', label: 'Q', type: 'text' }],
    });

    const res = await request(app)
      .put(`/api/feedback-forms/${created._id}`)
      .set(authHeader)
      .send({
        title: 'Base form',
        fields: [{ name: 'q', label: 'Q', type: 'text' }],
        metaTitle: '  SEO Title Here  ',
        metaDescription: '  SEO description for the form  ',
        landingHeadline: 'Vote now',
        thankYouHeadline: 'Thanks!',
        formStyle: 'drawer',
        showResultsPublic: true,
      })
      .expect(200);

    expect(res.body.feedbackForm.metaTitle).toBe('SEO Title Here');
    expect(res.body.feedbackForm.metaDescription).toBe('SEO description for the form');
    expect(res.body.feedbackForm.landingHeadline).toBe('Vote now');
    expect(res.body.feedbackForm.thankYouHeadline).toBe('Thanks!');
    expect(res.body.feedbackForm.formStyle).toBe('drawer');
    expect(res.body.feedbackForm.showResultsPublic).toBe(true);
  });

  it('generates a QR code that points to the frontend form URL', async () => {
    const { authHeader, businessId } = await createBusinessAuth();

    const created = await FeedbackForm.create({
      businessId,
      title: 'QR form',
      fields: [{ name: 'comment', label: 'Comment', type: 'text' }],
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
      fields: [{ name: 'comment', label: 'Comment', type: 'text' }],
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

    expect(res.body.error).toMatch(/feedback form not found|not found/i);
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
      fields: [{ name: 'comment', label: 'Comment', type: 'text' }],
    });

    await request(app).delete(`/api/feedback-forms/${created._id}`).set(authHeader).expect(200);
    await request(app).get(`/api/feedback-forms/${created._id}`).expect(404);
  });

  it('creates a feedback form with email field type', async () => {
    const { authHeader } = await createBusinessAuth();

    const res = await request(app)
      .post('/api/feedback-forms')
      .set(authHeader)
      .send({
        title: 'Contact form',
        fields: [
          { name: 'email', label: 'Email Address', type: 'email', required: true },
        ],
      })
      .expect(201);

    expect(res.body.feedbackForm.fields[0].type).toBe('email');
    expect(res.body.feedbackForm.fields[0].required).toBe(true);
  });

  it('creates a feedback form with phone, date, number, dropdown, url, and time field types', async () => {
    const { authHeader } = await createBusinessAuth();

    const res = await request(app)
      .post('/api/feedback-forms')
      .set(authHeader)
      .send({
        title: 'Extended types form',
        fields: [
          { name: 'phoneNumber', label: 'Phone', type: 'phone' },
          { name: 'eventDate', label: 'Date', type: 'date' },
          { name: 'quantity', label: 'Quantity', type: 'number' },
          { name: 'source', label: 'Source', type: 'dropdown', options: ['Web', 'App', 'Other'] },
          { name: 'website', label: 'Website', type: 'url' },
          { name: 'preferredTime', label: 'Preferred time', type: 'time' },
        ],
      })
      .expect(201);

    expect(res.body.feedbackForm.title).toBe('Extended types form');
    expect(res.body.feedbackForm.fields).toHaveLength(6);
    const types = res.body.feedbackForm.fields.map((f: { type: string }) => f.type);
    expect(types).toEqual(['phone', 'date', 'number', 'dropdown', 'url', 'time']);
    const dropdownField = res.body.feedbackForm.fields.find((f: { type: string }) => f.type === 'dropdown');
    expect(dropdownField.options).toEqual(['Web', 'App', 'Other']);
  });

  it('creates a feedback form with text field type and allowAnonymous', async () => {
    const { authHeader } = await createBusinessAuth();

    const res = await request(app)
      .post('/api/feedback-forms')
      .set(authHeader)
      .send({
        title: 'Anonymous survey',
        fields: [
          { name: 'fullName', label: 'Your Name', type: 'text', allowAnonymous: true },
          { name: 'comment', label: 'Comment', type: 'text' },
        ],
      })
      .expect(201);

    expect(res.body.feedbackForm.fields[0].type).toBe('text');
    expect(res.body.feedbackForm.fields[0].allowAnonymous).toBe(true);
  });

  it('creates a feedback form with email field type and allowAnonymous', async () => {
    const { authHeader } = await createBusinessAuth();

    const res = await request(app)
      .post('/api/feedback-forms')
      .set(authHeader)
      .send({
        title: 'Anonymous email survey',
        fields: [
          { name: 'email', label: 'Email Address', type: 'email', required: true, allowAnonymous: true },
        ],
      })
      .expect(201);

    expect(res.body.feedbackForm.fields[0].type).toBe('email');
    expect(res.body.feedbackForm.fields[0].allowAnonymous).toBe(true);
  });

  it('defaults allowAnonymous to false for text field when not provided', async () => {
    const { authHeader } = await createBusinessAuth();

    const res = await request(app)
      .post('/api/feedback-forms')
      .set(authHeader)
      .send({
        title: 'Name form',
        fields: [
          { name: 'fullName', label: 'Your Name', type: 'text' },
        ],
      })
      .expect(201);

    expect(res.body.feedbackForm.fields[0].type).toBe('text');
    expect(res.body.feedbackForm.fields[0].allowAnonymous).toBe(false);
  });

  describe('steps', () => {
    it('creates a form with valid steps and stores them', async () => {
      const { authHeader } = await createBusinessAuth();

      const res = await request(app)
        .post('/api/feedback-forms')
        .set(authHeader)
        .send({
          title: 'Multistep form',
          fields: [
            { name: 'q1', label: 'Q1', type: 'text', stepId: 'step-1', stepOrder: 0 },
            { name: 'q2', label: 'Q2', type: 'text', stepId: 'step-2', stepOrder: 0 },
          ],
          steps: [
            { id: 'step-1', title: 'Step 1', description: 'First', order: 0 },
            { id: 'step-2', title: 'Step 2', order: 1 },
          ],
        })
        .expect(201);

      expect(res.body.feedbackForm.title).toBe('Multistep form');
      expect(res.body.feedbackForm.steps).toHaveLength(2);
      expect(res.body.feedbackForm.steps[0]).toMatchObject({ id: 'step-1', title: 'Step 1', order: 0 });
      expect(res.body.feedbackForm.steps[1]).toMatchObject({ id: 'step-2', title: 'Step 2', order: 1 });
    });

    it('returns 400 when step ids are duplicated', async () => {
      const { authHeader } = await createBusinessAuth();

      const res = await request(app)
        .post('/api/feedback-forms')
        .set(authHeader)
        .send({
          title: 'Bad steps',
          fields: [{ name: 'f1', label: 'F1', type: 'text' }],
          steps: [
            { id: 'same-id', title: 'Step A', order: 0 },
            { id: 'same-id', title: 'Step B', order: 1 },
          ],
        })
        .expect(400);

      expect(res.body.error).toMatch(/step ids must be unique/i);
    });

    it('returns 400 when step order values are duplicated', async () => {
      const { authHeader } = await createBusinessAuth();

      const res = await request(app)
        .post('/api/feedback-forms')
        .set(authHeader)
        .send({
          title: 'Bad steps',
          fields: [{ name: 'f1', label: 'F1', type: 'text' }],
          steps: [
            { id: 'step-a', title: 'Step A', order: 0 },
            { id: 'step-b', title: 'Step B', order: 0 },
          ],
        })
        .expect(400);

      expect(res.body.error).toMatch(/step order values must be unique/i);
    });

    it('accepts create with steps not an array without setting payload.steps', async () => {
      const { authHeader } = await createBusinessAuth();

      const res = await request(app)
        .post('/api/feedback-forms')
        .set(authHeader)
        .send({
          title: 'Form without steps array',
          fields: [{ name: 'f1', label: 'F1', type: 'text' }],
          steps: null,
        })
        .expect(201);

      expect(res.body.feedbackForm.title).toBe('Form without steps array');
      expect(res.body.feedbackForm.steps).toBeUndefined();
    });
  });

  describe('form kind (form | poll | survey)', () => {
    it('creates a form with kind poll and stores it', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const res = await request(app)
        .post('/api/feedback-forms')
        .set(authHeader)
        .send({
          title: 'Quick poll',
          kind: 'poll',
          fields: [{ name: 'vote', label: 'Your vote', type: 'radio', options: ['A', 'B'] }],
        })
        .expect(201);
      expect(res.body.feedbackForm.kind).toBe('poll');
      expect(res.body.feedbackForm.title).toBe('Quick poll');
      expect(res.body.feedbackForm.businessId).toBe(businessId);
      const doc = await FeedbackForm.findById(res.body.feedbackForm._id).lean();
      expect(doc).toBeTruthy();
      expect(doc.kind).toBe('poll');
    });

    it('creates a form with kind survey and stores it', async () => {
      const { authHeader } = await createBusinessAuth();
      const res = await request(app)
        .post('/api/feedback-forms')
        .set(authHeader)
        .send({
          title: 'Survey',
          kind: 'survey',
          fields: [
            { name: 'q1', label: 'Q1', type: 'radio', options: ['Yes', 'No'] },
            { name: 'q2', label: 'Q2', type: 'text' },
          ],
        })
        .expect(201);
      expect(res.body.feedbackForm.kind).toBe('survey');
      const doc = await FeedbackForm.findById(res.body.feedbackForm._id).lean();
      expect(doc.kind).toBe('survey');
    });

    it('defaults kind to form when omitted (backward compatibility)', async () => {
      const { authHeader } = await createBusinessAuth();
      const res = await request(app)
        .post('/api/feedback-forms')
        .set(authHeader)
        .send({
          title: 'Legacy form',
          fields: [{ name: 'comment', label: 'Comment', type: 'text' }],
        })
        .expect(201);
      expect(res.body.feedbackForm.kind).toBe('form');
      const doc = await FeedbackForm.findById(res.body.feedbackForm._id).lean();
      expect(doc.kind).toBe('form');
    });

    it('defaults showResultsPublic to false and accepts true on create', async () => {
      const { authHeader } = await createBusinessAuth();
      const res = await request(app)
        .post('/api/feedback-forms')
        .set(authHeader)
        .send({
          title: 'Form without flag',
          fields: [{ name: 'q', label: 'Q', type: 'text' }],
        })
        .expect(201);
      expect(res.body.feedbackForm.showResultsPublic).toBe(false);
      const withPublic = await request(app)
        .post('/api/feedback-forms')
        .set(authHeader)
        .send({
          title: 'Form with public results',
          showResultsPublic: true,
          fields: [{ name: 'q', label: 'Q', type: 'text' }],
        })
        .expect(201);
      expect(withPublic.body.feedbackForm.showResultsPublic).toBe(true);
      const doc = await FeedbackForm.findById(withPublic.body.feedbackForm._id).lean();
      expect(doc.showResultsPublic).toBe(true);
    });

    it('returns kind in GET by id and list', async () => {
      const { authHeader } = await createBusinessAuth();
      const created = await request(app)
        .post('/api/feedback-forms')
        .set(authHeader)
        .send({
          title: 'Poll form',
          kind: 'poll',
          fields: [{ name: 'choice', label: 'Choice', type: 'radio', options: ['X', 'Y'] }],
        })
        .expect(201);
      const formId = created.body.feedbackForm._id;
      const getRes = await request(app).get(`/api/feedback-forms/${formId}`).expect(200);
      expect(getRes.body.feedbackForm.kind).toBe('poll');
      const listRes = await request(app).get('/api/feedback-forms').set(authHeader).expect(200);
      const found = listRes.body.feedbackForms.find((f: { _id: string }) => f._id === formId);
      expect(found).toBeTruthy();
      expect(found.kind).toBe('poll');
    });
  });

  describe('GET /api/feedback-forms/:id/results', () => {
    it('returns 404 for missing form', async () => {
      const res = await request(app)
        .get('/api/feedback-forms/507f1f77bcf86cd799439011/results')
        .expect(404);
      expect(res.body.error).toBe('Feedback form not found');
    });

    it('returns 400 for invalid form id', async () => {
      await request(app)
        .get('/api/feedback-forms/not-valid-id/results')
        .expect(400);
    });

    it('returns aggregated results with no submissions (empty)', async () => {
      const { authHeader } = await createBusinessAuth();
      const createRes = await request(app)
        .post('/api/feedback-forms')
        .set(authHeader)
        .send({
          title: 'Empty poll',
          kind: 'poll',
          fields: [
            { name: 'vote', label: 'Vote', type: 'radio', options: ['A', 'B'] },
            { name: 'comment', label: 'Comment', type: 'text' },
          ],
        })
        .expect(201);
      const formId = createRes.body.feedbackForm._id;
      const res = await request(app).get(`/api/feedback-forms/${formId}/results`).set(authHeader).expect(200);
      expect(res.body.formId).toBe(formId.toString());
      expect(res.body.formTitle).toBe('Empty poll');
      expect(res.body.totalResponses).toBe(0);
      expect(res.body.byField).toBeDefined();
      expect(res.body.byField.vote).toEqual({ label: 'Vote', type: 'radio', options: [{ option: 'A', count: 0, percentage: 0 }, { option: 'B', count: 0, percentage: 0 }] });
      expect(res.body.byField.comment).toEqual({ label: 'Comment', type: 'text', responseCount: 0, sampleAnswers: [] });
      expect(Array.isArray(res.body.responsesOverTime)).toBe(true);
      expect(res.body.responsesOverTime).toHaveLength(0);
    });

    it('returns correct counts and percentages for radio and checkbox', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Poll',
        kind: 'poll',
        fields: [
          { name: 'choice', label: 'Choice', type: 'radio', options: ['Yes', 'No'] },
          { name: 'tags', label: 'Tags', type: 'checkbox', options: ['T1', 'T2'] },
        ],
      });
      const formSnapshot = [
        { name: 'choice', label: 'Choice', type: 'radio', options: ['Yes', 'No'] },
        { name: 'tags', label: 'Tags', type: 'checkbox', options: ['T1', 'T2'] },
      ];
      await FeedbackSubmission.create([
        { formId: form._id, businessId, formSnapshot, responses: { choice: 'Yes', tags: ['T1'] }, submittedAt: new Date() },
        { formId: form._id, businessId, formSnapshot, responses: { choice: 'Yes', tags: ['T2'] }, submittedAt: new Date() },
        { formId: form._id, businessId, formSnapshot, responses: { choice: 'No', tags: ['T1', 'T2'] }, submittedAt: new Date() },
      ]);
      const res = await request(app).get(`/api/feedback-forms/${form._id}/results`).set(authHeader).expect(200);
      expect(res.body.totalResponses).toBe(3);
      expect(res.body.byField.choice.options).toEqual(
        expect.arrayContaining([
          { option: 'Yes', count: 2, percentage: 67 },
          { option: 'No', count: 1, percentage: 33 },
        ])
      );
      expect(res.body.byField.tags.options).toEqual(
        expect.arrayContaining([
          { option: 'T1', count: 2, percentage: 67 },
          { option: 'T2', count: 2, percentage: 67 },
        ])
      );
      expect(res.body.responsesOverTime.length).toBeGreaterThanOrEqual(1);
    });

    it('returns responseCount and sampleAnswers for text fields', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Survey',
        fields: [
          { name: 'comment', label: 'Comment', type: 'text' },
        ],
      });
      const formSnapshot = [{ name: 'comment', label: 'Comment', type: 'text' }];
      await FeedbackSubmission.create([
        { formId: form._id, businessId, formSnapshot, responses: { comment: 'First' }, submittedAt: new Date() },
        { formId: form._id, businessId, formSnapshot, responses: { comment: 'Second' }, submittedAt: new Date() },
      ]);
      const res = await request(app).get(`/api/feedback-forms/${form._id}/results`).set(authHeader).expect(200);
      expect(res.body.totalResponses).toBe(2);
      expect(res.body.byField.comment.responseCount).toBe(2);
      expect(res.body.byField.comment.sampleAnswers).toEqual(expect.arrayContaining(['First', 'Second']));
    });

    it('allows unauthenticated access when showResultsPublic is true', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Public poll',
        showResultsPublic: true,
        fields: [{ name: 'v', label: 'V', type: 'radio', options: ['A'] }],
      });
      const res = await request(app)
        .get(`/api/feedback-forms/${form._id}/results`)
        .expect(200);
      expect(res.body.formTitle).toBe('Public poll');
      expect(res.body.totalResponses).toBe(0);
    });

    it('returns 403 when showResultsPublic is false and request has no auth', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Private results poll',
        showResultsPublic: false,
        fields: [{ name: 'v', label: 'V', type: 'radio', options: ['A'] }],
      });
      const res = await request(app)
        .get(`/api/feedback-forms/${form._id}/results`)
        .expect(403);
      expect(res.body.error).toMatch(/not publicly available/i);
    });

    it('allows owner to get results when showResultsPublic is false', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Owner-only results',
        showResultsPublic: false,
        fields: [{ name: 'v', label: 'V', type: 'radio', options: ['A'] }],
      });
      const res = await request(app)
        .get(`/api/feedback-forms/${form._id}/results`)
        .set(authHeader)
        .expect(200);
      expect(res.body.formTitle).toBe('Owner-only results');
      expect(res.body.totalResponses).toBe(0);
    });

    it('allows admin to get results when showResultsPublic is false', async () => {
      const { businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Private form',
        showResultsPublic: false,
        fields: [{ name: 'v', label: 'V', type: 'radio', options: ['A'] }],
      });
      const { authHeader: adminHeader } = await createAdminAuth();
      const res = await request(app)
        .get(`/api/feedback-forms/${form._id}/results`)
        .set(adminHeader)
        .expect(200);
      expect(res.body.formTitle).toBe('Private form');
      expect(res.body.totalResponses).toBe(0);
    });

    it('filters results by dateFrom and dateTo when provided', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Dated poll',
        fields: [{ name: 'v', label: 'V', type: 'radio', options: ['A', 'B'] }],
      });
      const formSnapshot = [{ name: 'v', label: 'V', type: 'radio', options: ['A', 'B'] }];
      const baseDate = new Date('2025-03-01T12:00:00Z');
      await FeedbackSubmission.create([
        { formId: form._id, businessId, formSnapshot, responses: { v: 'A' }, submittedAt: new Date(baseDate.getTime() + 86400000) },
        { formId: form._id, businessId, formSnapshot, responses: { v: 'B' }, submittedAt: new Date(baseDate.getTime() + 86400000 * 2) },
      ]);
      const dateFrom = '2025-03-01T00:00:00.000Z';
      const dateTo = '2025-03-05T00:00:00.000Z';
      const res = await request(app)
        .get(`/api/feedback-forms/${form._id}/results`)
        .query({ dateFrom, dateTo })
        .set(authHeader)
        .expect(200);
      expect(res.body.totalResponses).toBe(2);
    });

    it('filters results when dateTo is YYYY-MM-DD format', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const form = await FeedbackForm.create({
        businessId,
        title: 'Date filter poll',
        fields: [{ name: 'v', label: 'V', type: 'radio', options: ['A', 'B'] }],
      });
      const formSnapshot = [{ name: 'v', label: 'V', type: 'radio', options: ['A', 'B'] }];
      await FeedbackSubmission.create([
        { formId: form._id, businessId, formSnapshot, responses: { v: 'A' }, submittedAt: new Date('2025-03-02T10:00:00Z') },
        { formId: form._id, businessId, formSnapshot, responses: { v: 'B' }, submittedAt: new Date('2025-03-04T22:00:00Z') },
      ]);
      const res = await request(app)
        .get(`/api/feedback-forms/${form._id}/results`)
        .query({ dateFrom: '2025-03-01', dateTo: '2025-03-05' })
        .set(authHeader)
        .expect(200);
      expect(res.body.totalResponses).toBe(2);
    });

    it('returns aggregated results for scale and rating field types', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const starOptions = ['★ 1 Star', '★★ 2 Stars', '★★★ 3 Stars', '★★★★ 4 Stars', '★★★★★ 5 Stars'];
      const form = await FeedbackForm.create({
        businessId,
        title: 'Scale and rating',
        kind: 'survey',
        fields: [
          { name: 'score', label: 'Score', type: 'scale', options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
          { name: 'stars', label: 'Stars', type: 'rating', options: starOptions },
        ],
      });
      const formSnapshot = form.fields.map((f: { name: string; label: string; type: string; options?: string[] }) => ({ name: f.name, label: f.label, type: f.type, options: f.options }));
      await FeedbackSubmission.create([
        { formId: form._id, businessId, formSnapshot, responses: { score: '7', stars: '★★★ 3 Stars' }, submittedAt: new Date() },
        { formId: form._id, businessId, formSnapshot, responses: { score: '7', stars: '★★★★★ 5 Stars' }, submittedAt: new Date() },
        { formId: form._id, businessId, formSnapshot, responses: { score: '8', stars: '★★★ 3 Stars' }, submittedAt: new Date() },
      ]);
      const res = await request(app).get(`/api/feedback-forms/${form._id}/results`).set(authHeader).expect(200);
      expect(res.body.totalResponses).toBe(3);
      expect(res.body.byField.score).toBeDefined();
      expect(res.body.byField.score.type).toBe('scale');
      expect(res.body.byField.score.options).toEqual(
        expect.arrayContaining([
          { option: '7', count: 2, percentage: 67 },
          { option: '8', count: 1, percentage: 33 },
        ])
      );
      expect(res.body.byField.stars).toBeDefined();
      expect(res.body.byField.stars.type).toBe('rating');
      expect(res.body.byField.stars.options).toEqual(
        expect.arrayContaining([
          { option: '★★★ 3 Stars', count: 2, percentage: 67 },
          { option: '★★★★★ 5 Stars', count: 1, percentage: 33 },
        ])
      );
    });
  });
});
