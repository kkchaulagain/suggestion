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
describe('Delete /api/v1/bussines/:id',()=>
{afterEach(async () => {
    try {
      await Business.deleteMany({});
    } catch {
      // Ignore if connection already closed
    }
  });
    //bussiness dont exits
    it('should return 404 if business not found',async()=>
    {
      const nonExistentId=new mongoose.Types.ObjectId();
      const res=await request(app)
      .delete(`/api/v1/business/${nonExistentId}`)
      .expect(404);
      expect(res.body).toMatchObject({
        message: 'Business not found',
        ok:false,
      });
    });
    //business exits then
    it('should return 200 and delete business',async()=>
    {
      //creating a bussiness in Db so we have something to create
      const created=await Business.create(
        buildBusiness({
          businessname:'aaru group',
          location:'Nepal',
          pancardNumber:90090902,
          description:'Tryinging to do ',
        })
      );
      const res=await request(app)
      .delete(`/api/v1/business/${created._id}`).expect(200);

      expect(res.body).toMatchObject({
          message:'Business deleted successfully',
          ok:true,
      });
      //is deleted from DB
      const deleted=await Business.findById(created._id);
      expect(deleted).toBeNull();
    })
});
describe('Update /api/v1/business/:id',()=>
{
  afterEach(async()=>{
    try {
      await Business.deleteMany({});
    } catch (error) {
      
    }
  });
  //if business not found 
  it('should return 404 if not found',async()=>
  {
    const nonExistId=new mongoose.Types.ObjectId();
    const res=await request(app)
    .put(`/api/v1/business/${nonExistId}`)
    .send({ businessname: 'Himalayan Traders' })
    .expect(404);
    expect(res.body).toMatchObject(
      {
        message:'Business not found',
        ok:false,
      }
    );
  })
 // empty body sent
it('should return 400 if no valid fields sent', async () => {
  const created = await Business.create(
    buildBusiness({
      businessname: 'Himalayan Traders',
      location: 'Kathmandu',
      pancardNumber: 123456789,
      description: 'Trading company in Kathmandu',
    })
  );

  const res = await request(app)
    .put(`/api/v1/business/${created._id}`)
    .send({})  
    .expect(400);

  expect(res.body).toMatchObject({
    message: 'No valid fields to update',
    ok: false,
  });
});

//  trying to change owner 
it('should not allow owner to be changed', async () => {
  const created = await Business.create(
    buildBusiness({
      businessname: 'Everest Enterprises',
      location: 'Pokhara',
      pancardNumber: 987654321,
      description: 'Trekking and tourism company',
    })
  );

  const hackedOwnerId = new mongoose.Types.ObjectId();

  await request(app)
    .put(`/api/v1/business/${created._id}`)
    .send({ owner: hackedOwnerId, businessname: 'Hacked Business' })
    .expect(200);

  // owner should still be original 
  const updated = await Business.findById(created._id);
  expect(String(updated.owner)).not.toBe(String(hackedOwnerId));
});

// valid update
it('should return 200 and update only sent fields', async () => {
  const created = await Business.create(
    buildBusiness({
      businessname: 'Pashupatinath Handicrafts',
      location: 'Bhaktapur',
      pancardNumber: 456789123,
      description: 'Traditional handicrafts from Bhaktapur',
    })
  );

  const res = await request(app)
    .put(`/api/v1/business/${created._id}`)
    .send({ businessname: 'Pashupatinath Arts' })  // only updating name
    .expect(200);

  expect(res.body).toMatchObject({
    message: 'Business updated successfully',
    ok: true,
  });

  // location should still be Bhaktapur 
  expect(res.body.business.businessname).toBe('Pashupatinath Arts');
  expect(res.body.business.location).toBe('Bhaktapur');
});
})