const request = require('supertest');
const { connect, disconnect } = require('../db');
const app = require('../app');
const { FeedbackForm } = require('../models/FeedbackForm');
const { FeedbackSubmission } = require('../models/FeedbackSubmission');
const { Page } = require('../models/Page');
const Business = require('../models/Business');
const User = require('../models/User');

async function createBusinessAuth() {
  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const email = `onb_biz_${suffix}@example.com`;
  const password = 'Password123!';
  const phone = `+97798${String(10000000 + Math.floor(Math.random() * 90000000))}`;
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Onboarding Biz Owner',
      email,
      password,
      phone,
      role: 'business',
      location: 'City',
      description: 'Test business',
      businessname: 'Onboarding Test Biz',
    });
  if (registerRes.status !== 201) {
    throw new Error(`Register failed: ${registerRes.status} ${JSON.stringify(registerRes.body)}`);
  }
  const loginRes = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
  const token = loginRes.body?.token || loginRes.body?.data?.token;
  const userId = registerRes.body?.data?._id || registerRes.body?.user?._id;
  const business = await Business.findOne({ owner: userId }).lean();
  if (!business?._id) throw new Error('Business not found after register');
  return {
    authHeader: { Authorization: `Bearer ${token}` },
    businessId: business._id.toString(),
  };
}

describe('Onboarding API', () => {
  beforeAll(async () => {
    await connect();
  });
  afterAll(async () => {
    await disconnect();
  });

  describe('GET /api/onboarding/counts', () => {
    it('returns 401 without auth', async () => {
      await request(app).get('/api/onboarding/counts').expect(401);
    });

    it('returns counts for business user', async () => {
      const { authHeader } = await createBusinessAuth();
      const res = await request(app)
        .get('/api/onboarding/counts')
        .set(authHeader)
        .expect(200);
      expect(res.body).toHaveProperty('formsCount', 0);
      expect(res.body).toHaveProperty('pagesCount', 0);
      expect(res.body).toHaveProperty('submissionsCount', 0);
    });
  });

  describe('POST /api/onboarding/business-setup', () => {
    it('returns 401 without auth', async () => {
      await request(app)
        .post('/api/onboarding/business-setup')
        .send({ resetExistingData: true, forms: [], pages: [] })
        .expect(401);
    });

    it('returns 400 when business profile not found', async () => {
      const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const email = `user_nobiz_${suffix}@example.com`;
      const password = 'UserPass123!';
      const phone = `+97798${String(30000000 + Math.floor(Math.random() * 70000000))}`;
      await User.create({
        name: 'User No Business',
        email,
        password,
        phone,
        role: 'user',
        isActive: true,
      });
      const loginRes = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
      const token = loginRes.body?.token || loginRes.body?.data?.token;
      await request(app)
        .post('/api/onboarding/business-setup')
        .set({ Authorization: `Bearer ${token}` })
        .send({ resetExistingData: false, forms: [], pages: [] })
        .expect(404);
    });

    it('resets and scaffolds forms and pages, sets onboardingCompleted', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const formsPayload = [
        {
          title: 'Contact Form',
          description: 'Get in touch',
          fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
          ],
        },
      ];
      const pagesPayload = [
        {
          title: 'Contact Us',
          slug: 'contact-us',
          blocks: [
            { type: 'hero', payload: { headline: 'Contact', subheadline: 'Get in touch' } },
            { type: 'form', payload: { formIndex: 0 } },
          ],
        },
      ];
      const res = await request(app)
        .post('/api/onboarding/business-setup')
        .set(authHeader)
        .send({
          resetExistingData: true,
          forms: formsPayload,
          pages: pagesPayload,
        })
        .expect(200);
      expect(res.body.onboardingCompleted).toBe(true);
      expect(Array.isArray(res.body.forms)).toBe(true);
      expect(res.body.forms.length).toBe(1);
      expect(res.body.forms[0]).toHaveProperty('title', 'Contact Form');
      expect(Array.isArray(res.body.pages)).toBe(true);
      expect(res.body.pages.length).toBe(1);
      expect(res.body.pages[0]).toHaveProperty('title', 'Contact Us');
      expect(res.body.pages[0]).toHaveProperty('slug');

      const forms = await FeedbackForm.find({ businessId }).lean();
      expect(forms.length).toBe(1);
      expect(forms[0].title).toBe('Contact Form');

      const pages = await Page.find({ businessId }).lean();
      expect(pages.length).toBe(1);
      expect(pages[0].blocks.some((b: { type: string }) => b.type === 'form')).toBe(true);
      const formBlock = pages[0].blocks.find((b: { type: string }) => b.type === 'form');
      expect(formBlock.payload.formId).toBe(res.body.forms[0]._id);

      const business = await Business.findById(businessId).lean();
      expect(business?.onboardingCompleted).toBe(true);
      expect(business?.onboardingCompletedAt).toBeDefined();
    });

    it('deletes existing forms, pages, and submissions on reset', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      await FeedbackForm.create({
        businessId,
        title: 'Old Form',
        fields: [{ name: 'q', label: 'Q', type: 'text', required: true }],
      });
      await Page.create({
        businessId,
        slug: `old-page-${Date.now()}`,
        title: 'Old Page',
        blocks: [],
      });
      const formId = (await FeedbackForm.findOne({ businessId }).lean())?._id;
      if (formId) {
        await FeedbackSubmission.create({
          formId,
          businessId,
          formSnapshot: [{ name: 'q', label: 'Q', type: 'text' }],
          responses: { q: 'a' },
        });
      }

      await request(app)
        .post('/api/onboarding/business-setup')
        .set(authHeader)
        .send({
          resetExistingData: true,
          forms: [
            {
              title: 'New Form',
              description: '',
              fields: [{ name: 'x', label: 'X', type: 'text', required: true }],
            },
          ],
          pages: [],
        })
        .expect(200);

      const formCount = await FeedbackForm.countDocuments({ businessId });
      const pageCount = await Page.countDocuments({ businessId });
      const submissionCount = await FeedbackSubmission.countDocuments({ businessId });
      expect(formCount).toBe(1);
      expect(pageCount).toBe(0);
      expect(submissionCount).toBe(0);
      const form = await FeedbackForm.findOne({ businessId }).lean();
      expect(form?.title).toBe('New Form');
    });
  });
});
