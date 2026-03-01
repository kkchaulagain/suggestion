const request = require('supertest');
const mongoose = require('mongoose');
const { buildBusiness } = require('./factories/businessFactory');

jest.mock('../models/Business');

const app = require('../app');
const Business = require('../models/Business');

describe('GET /api/v1/business', () => {
  afterEach(() => {
    Business.find.mockReset();
  });

  it('returns 200 with business API message and empty businesses array when no data', async () => {
    Business.find.mockResolvedValue([]);

    const res = await request(app).get('/api/v1/business').expect(200);
    expect(res.body).toMatchObject({ message: 'Business API v1', ok: true });
    expect(Array.isArray(res.body.businesses)).toBe(true);
    expect(res.body.businesses).toHaveLength(0);
    expect(Business.find).toHaveBeenCalledTimes(1);
  });

  it('returns 200 with businesses from mocked database', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const mockDoc = {
      _id: new mongoose.Types.ObjectId(),
      ...buildBusiness({
        owner: ownerId,
        businessname: 'Acme Corp',
        location: 'Lalitpur',
        pancardNumber: 987654321,
        description: 'Acme description',
      }),
    };
    Business.find.mockResolvedValue([mockDoc]);

    const res = await request(app).get('/api/v1/business').expect(200);
    expect(res.body).toMatchObject({ message: 'Business API v1', ok: true });
    expect(res.body.businesses).toHaveLength(1);
    expect(res.body.businesses[0]).toMatchObject({
      businessname: 'Acme Corp',
      location: 'Lalitpur',
      pancardNumber: 987654321,
      description: 'Acme description',
    });
    expect(res.body.businesses[0]).toHaveProperty('id', String(mockDoc._id));
    expect(res.body.businesses[0]).toHaveProperty('owner', String(ownerId));
    expect(Business.find).toHaveBeenCalledTimes(1);
  });
});
