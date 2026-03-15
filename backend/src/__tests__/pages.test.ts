const request = require('supertest');
const { connect, disconnect } = require('../db');
const app = require('../app');
const { Page } = require('../models/Page');
const User = require('../models/User');
const Business = require('../models/Business');

async function createBusinessAuth() {
  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const email = `biz_pages_${suffix}@example.com`;
  const password = 'Password123!';
  const phone = `+97798${String(10000000 + Math.floor(Math.random() * 90000000))}`;

  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({
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
    throw new Error(`Register failed: ${registerRes.status} ${JSON.stringify(registerRes.body)}`);
  }

  const loginRes = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
  const token = loginRes.body?.token || loginRes.body?.data?.token;
  const user = await User.findOne({ email: email.toLowerCase() }).select('_id').lean();
  const business = user ? await Business.findOne({ owner: user._id }).lean() : null;
  if (!business?._id) {
    throw new Error('Business not found after register');
  }

  return {
    authHeader: { Authorization: `Bearer ${token}` },
    businessId: business._id.toString(),
  };
}

async function createAdminAuth() {
  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const email = `admin_pages_${suffix}@example.com`;
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

/** User with role that requires business profile but has none (no Business document). */
async function createUserAuthNoBusiness() {
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
  return { authHeader: { Authorization: `Bearer ${token}` } };
}

describe('Pages API', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await Page.deleteMany({});
    await Business.deleteMany({});
    await User.deleteMany({});
    await disconnect();
  });

  afterEach(async () => {
    await Page.deleteMany({});
    await Business.deleteMany({});
    await User.deleteMany({});
  });

  describe('GET /api/pages', () => {
    it('returns 401 when not authenticated', async () => {
      await request(app).get('/api/pages').expect(401);
    });

    it('returns 200 with empty pages array for business with no pages', async () => {
      const { authHeader } = await createBusinessAuth();
      const res = await request(app).get('/api/pages').set(authHeader).expect(200);
      expect(res.body).toHaveProperty('pages');
      expect(Array.isArray(res.body.pages)).toBe(true);
      expect(res.body.pages).toHaveLength(0);
    });

    it('returns pages scoped to business', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      await Page.create({
        businessId,
        slug: 'contact-us',
        title: 'Contact Us',
        status: 'published',
        blocks: [],
      });
      const res = await request(app).get('/api/pages').set(authHeader).expect(200);
      expect(res.body.pages).toHaveLength(1);
      expect(res.body.pages[0].slug).toBe('contact-us');
      expect(res.body.pages[0].title).toBe('Contact Us');
    });

    it('admin can list all pages without business profile', async () => {
      const { authHeader } = await createAdminAuth();
      const res = await request(app).get('/api/pages').set(authHeader).expect(200);
      expect(res.body).toHaveProperty('pages');
      expect(Array.isArray(res.body.pages)).toBe(true);
    });

    it('returns 404 when user has no business profile', async () => {
      const { authHeader } = await createUserAuthNoBusiness();
      const res = await request(app).get('/api/pages').set(authHeader).expect(404);
      expect(res.body.error).toMatch(/business profile not found/i);
    });
  });

  describe('POST /api/pages', () => {
    it('returns 401 when not authenticated', async () => {
      await request(app)
        .post('/api/pages')
        .send({ title: 'Test', slug: 'test' })
        .expect(401);
    });

    it('creates a page with title and slug', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const res = await request(app)
        .post('/api/pages')
        .set(authHeader)
        .send({ title: 'About Us', slug: 'about-us' })
        .expect(201);
      expect(res.body).toHaveProperty('message', 'Page created');
      expect(res.body.page).toMatchObject({
        title: 'About Us',
        slug: 'about-us',
        status: 'draft',
      });
      expect(res.body.page.businessId).toBe(businessId);
    });

    it('normalizes slug from title when slug omitted', async () => {
      const { authHeader } = await createBusinessAuth();
      const res = await request(app)
        .post('/api/pages')
        .set(authHeader)
        .send({ title: 'Get In Touch' })
        .expect(201);
      expect(res.body.page.slug).toBe('get-in-touch');
    });

    it('returns 400 when slug is invalid after normalization', async () => {
      const { authHeader } = await createBusinessAuth();
      await request(app)
        .post('/api/pages')
        .set(authHeader)
        .send({ title: 'Test', slug: '---' })
        .expect(400);
    });

    it('returns 400 when slug already exists', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      await Page.create({
        businessId,
        slug: 'taken',
        title: 'Taken',
        status: 'draft',
        blocks: [],
      });
      await request(app)
        .post('/api/pages')
        .set(authHeader)
        .send({ title: 'Other', slug: 'taken' })
        .expect(400);
    });

    it('returns 400 when creating as admin (no business profile)', async () => {
      const { authHeader } = await createAdminAuth();
      const res = await request(app)
        .post('/api/pages')
        .set(authHeader)
        .send({ title: 'Admin Page', slug: 'admin-page' })
        .expect(400);
      expect(res.body.error).toMatch(/business profile required/i);
    });

    it('returns 400 on validation error when blocks have invalid type', async () => {
      const { authHeader } = await createBusinessAuth();
      const res = await request(app)
        .post('/api/pages')
        .set(authHeader)
        .send({
          title: 'Invalid Blocks',
          slug: 'invalid-blocks',
          blocks: [{ type: 'invalid_type', payload: {} }],
        })
        .expect(400);
      expect(res.body.error).toMatch(/validation failed/i);
    });
  });

  describe('GET /api/pages/public/:id', () => {
    it('returns 400 for invalid id', async () => {
      await request(app).get('/api/pages/public/not-an-id').expect(400);
    });

    it('returns 404 when page does not exist', async () => {
      const mongoose = require('mongoose');
      const id = new mongoose.Types.ObjectId();
      await request(app).get(`/api/pages/public/${id}`).expect(404);
    });

    it('returns 404 when page is draft', async () => {
      const { businessId } = await createBusinessAuth();
      const page = await Page.create({
        businessId,
        slug: 'draft-page',
        title: 'Draft',
        status: 'draft',
        blocks: [],
      });
      await request(app).get(`/api/pages/public/${page._id}`).expect(404);
    });

    it('returns 200 with page when published', async () => {
      const { businessId } = await createBusinessAuth();
      const page = await Page.create({
        businessId,
        slug: 'public-page',
        title: 'Public Page',
        status: 'published',
        blocks: [{ type: 'heading', payload: { level: 1, text: 'Hi' } }],
      });
      const res = await request(app).get(`/api/pages/public/${page._id}`).expect(200);
      expect(res.body.page).toMatchObject({
        _id: page._id.toString(),
        slug: 'public-page',
        title: 'Public Page',
        status: 'published',
      });
      expect(res.body.page.blocks).toHaveLength(1);
    });
  });

  describe('GET /api/pages/by-slug/:slug', () => {
    it('returns 404 when slug not found', async () => {
      await request(app).get('/api/pages/by-slug/no-such-page').expect(404);
    });

    it('returns 200 with page when published', async () => {
      const { businessId } = await createBusinessAuth();
      await Page.create({
        businessId,
        slug: 'contact',
        title: 'Contact',
        status: 'published',
        blocks: [],
      });
      const res = await request(app).get('/api/pages/by-slug/contact').expect(200);
      expect(res.body.page.slug).toBe('contact');
      expect(res.body.page.title).toBe('Contact');
    });
  });

  describe('GET /api/pages/:id', () => {
    it('returns 401 when not authenticated', async () => {
      const mongoose = require('mongoose');
      const id = new mongoose.Types.ObjectId();
      await request(app).get(`/api/pages/${id}`).expect(401);
    });

    it('returns 400 for invalid page id', async () => {
      const { authHeader } = await createBusinessAuth();
      const res = await request(app).get('/api/pages/not-a-valid-id').set(authHeader).expect(400);
      expect(res.body.error).toMatch(/invalid page id/i);
    });

    it('returns 200 with page for owner', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const page = await Page.create({
        businessId,
        slug: 'my-page',
        title: 'My Page',
        status: 'draft',
        blocks: [],
      });
      const res = await request(app).get(`/api/pages/${page._id}`).set(authHeader).expect(200);
      expect(res.body.page._id).toBe(page._id.toString());
      expect(res.body.page.slug).toBe('my-page');
    });

    it('returns 404 when page does not belong to business', async () => {
      const { authHeader } = await createBusinessAuth();
      const mongoose = require('mongoose');
      const otherBizId = new mongoose.Types.ObjectId();
      const page = await Page.create({
        businessId: otherBizId,
        slug: 'other-page',
        title: 'Other',
        status: 'draft',
        blocks: [],
      });
      await request(app).get(`/api/pages/${page._id}`).set(authHeader).expect(404);
    });
  });

  describe('PUT /api/pages/:id', () => {
    it('returns 400 for invalid page id', async () => {
      const { authHeader } = await createBusinessAuth();
      const res = await request(app)
        .put('/api/pages/invalid-id')
        .set(authHeader)
        .send({ title: 'Updated' })
        .expect(400);
      expect(res.body.error).toMatch(/invalid page id/i);
    });

    it('returns 400 when new slug already exists', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      await Page.create({
        businessId,
        slug: 'existing-slug',
        title: 'Existing',
        status: 'draft',
        blocks: [],
      });
      const page = await Page.create({
        businessId,
        slug: 'my-page',
        title: 'My Page',
        status: 'draft',
        blocks: [],
      });
      const res = await request(app)
        .put(`/api/pages/${page._id}`)
        .set(authHeader)
        .send({ slug: 'existing-slug' })
        .expect(400);
      expect(res.body.error).toMatch(/slug already exists/i);
    });

    it('updates page title and status', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const page = await Page.create({
        businessId,
        slug: 'edit-me',
        title: 'Edit Me',
        status: 'draft',
        blocks: [],
      });
      const res = await request(app)
        .put(`/api/pages/${page._id}`)
        .set(authHeader)
        .send({ title: 'Updated Title', status: 'published' })
        .expect(200);
      expect(res.body.page.title).toBe('Updated Title');
      expect(res.body.page.status).toBe('published');
    });

    it('updates blocks', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const page = await Page.create({
        businessId,
        slug: 'blocks-page',
        title: 'Blocks',
        status: 'draft',
        blocks: [],
      });
      const newBlocks = [
        { type: 'heading', payload: { level: 1, text: 'Hello' } },
        { type: 'paragraph', payload: { text: 'Content' } },
        { type: 'image', payload: { imageUrl: 'https://example.com/a.jpg', alt: 'Example image', caption: 'Screenshot' } },
      ];
      const res = await request(app)
        .put(`/api/pages/${page._id}`)
        .set(authHeader)
        .send({ blocks: newBlocks })
        .expect(200);
      expect(res.body.page.blocks).toHaveLength(3);
      expect(res.body.page.blocks[0].type).toBe('heading');
      expect(res.body.page.blocks[1].type).toBe('paragraph');
      expect(res.body.page.blocks[2].type).toBe('image');
    });

    it('updates slug when new slug is valid and unique', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const page = await Page.create({
        businessId,
        slug: 'old-slug',
        title: 'Old Slug',
        status: 'draft',
        blocks: [],
      });
      const res = await request(app)
        .put(`/api/pages/${page._id}`)
        .set(authHeader)
        .send({ slug: 'new-slug' })
        .expect(200);
      expect(res.body.page.slug).toBe('new-slug');
    });

    it('updates metaTitle, metaDescription, and status to draft', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const page = await Page.create({
        businessId,
        slug: 'meta-page',
        title: 'Meta Page',
        status: 'published',
        blocks: [],
      });
      const res = await request(app)
        .put(`/api/pages/${page._id}`)
        .set(authHeader)
        .send({
          metaTitle: 'SEO Title',
          metaDescription: 'SEO description for the page.',
          status: 'draft',
        })
        .expect(200);
      expect(res.body.page.metaTitle).toBe('SEO Title');
      expect(res.body.page.metaDescription).toBe('SEO description for the page.');
      expect(res.body.page.status).toBe('draft');
    });

    it('returns 400 on validation error when updating with invalid blocks', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const page = await Page.create({
        businessId,
        slug: 'valid-page',
        title: 'Valid',
        status: 'draft',
        blocks: [{ type: 'heading', payload: { level: 1, text: 'Hi' } }],
      });
      const res = await request(app)
        .put(`/api/pages/${page._id}`)
        .set(authHeader)
        .send({ blocks: [{ type: 'invalid_type', payload: {} }] })
        .expect(400);
      expect(res.body.error).toMatch(/validation failed/i);
    });
  });

  describe('DELETE /api/pages/:id', () => {
    it('returns 401 when not authenticated', async () => {
      const mongoose = require('mongoose');
      const id = new mongoose.Types.ObjectId();
      await request(app).delete(`/api/pages/${id}`).expect(401);
    });

    it('returns 400 for invalid page id', async () => {
      const { authHeader } = await createBusinessAuth();
      const res = await request(app).delete('/api/pages/invalid-id').set(authHeader).expect(400);
      expect(res.body.error).toMatch(/invalid page id/i);
    });

    it('deletes page for owner', async () => {
      const { authHeader, businessId } = await createBusinessAuth();
      const page = await Page.create({
        businessId,
        slug: 'delete-me',
        title: 'Delete Me',
        status: 'draft',
        blocks: [],
      });
      await request(app).delete(`/api/pages/${page._id}`).set(authHeader).expect(200);
      const found = await Page.findById(page._id);
      expect(found).toBeNull();
    });

    it('returns 404 when page does not belong to business', async () => {
      const { authHeader } = await createBusinessAuth();
      const mongoose = require('mongoose');
      const otherBizId = new mongoose.Types.ObjectId();
      const page = await Page.create({
        businessId: otherBizId,
        slug: 'other-delete',
        title: 'Other',
        status: 'draft',
        blocks: [],
      });
      await request(app).delete(`/api/pages/${page._id}`).set(authHeader).expect(404);
      const found = await Page.findById(page._id);
      expect(found).not.toBeNull();
    });
  });
});
