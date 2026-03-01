const request = require('supertest');
const mongoose = require('mongoose');
const { connect, disconnect } = require('../db');
const app = require('../app');
const Business = require('../models/Business');
const { buildBusiness } = require('./factories/businessFactory');

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  try {
    await Business.deleteMany({});
  } catch {
    // Server may already be down when running in parallel workers
  }
  await disconnect();
});

describe('GET /api/v1/business', () => {
  afterEach(async () => {
    try {
      await Business.deleteMany({});
    } catch {
      // Ignore if connection already closed
    }
  });

  it('returns 200 with business API message and empty businesses array when no data', async () => {
    const res = await request(app).get('/api/v1/business').expect(200);
    expect(res.body).toMatchObject({ message: 'Business API v1', ok: true });
    expect(Array.isArray(res.body.businesses)).toBe(true);
    expect(res.body.businesses).toHaveLength(0);
  });

  it('returns 200 with businesses from database', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    await Business.create(
      buildBusiness({
        owner: ownerId,
        businessname: 'Acme Corp',
        location: 'Lalitpur',
        pancardNumber: 987654321,
        description: 'Acme description',
      })
    );

    const res = await request(app).get('/api/v1/business').expect(200);
    expect(res.body).toMatchObject({ message: 'Business API v1', ok: true });
    expect(res.body.businesses).toHaveLength(1);
    expect(res.body.businesses[0]).toMatchObject({
      businessname: 'Acme Corp',
      location: 'Lalitpur',
      pancardNumber: 987654321,
      description: 'Acme description',
    });
    expect(res.body.businesses[0]).toHaveProperty('id');
    expect(res.body.businesses[0]).toHaveProperty('owner', String(ownerId));
  });
});

describe('GET /api/v1/business/:id', () => {
  afterEach(async () => {
    try {
      await Business.deleteMany({});
    } catch {
      // Ignore if connection already closed
    }
  });

  it('should return 404 if business not found', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/v1/business/${nonExistentId}`)
      .expect(404);
    expect(res.body).toMatchObject({ message: 'Business not found', ok: false });
  });

  it('should return 200 with business if found', async () => {
    const created = await Business.create(
      buildBusiness({
        businessname: 'Acme Corp',
        location: 'Lalitpur',
        pancardNumber: 987654321,
        description: 'Acme description',
      })
    );

    const res = await request(app)
      .get(`/api/v1/business/${created._id}`)
      .expect(200);
    expect(res.body).toMatchObject({ message: 'Business found', ok: true });
    expect(res.body.business).toMatchObject({
      businessname: 'Acme Corp',
      location: 'Lalitpur',
      pancardNumber: 987654321,
      description: 'Acme description',
    });
    expect(res.body.business).toHaveProperty('id', String(created._id));
  });
});
