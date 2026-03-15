const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { connect, disconnect } = require('../db');
const app = require('../app');
const Business = require('../models/Business');
const User = require('../models/User');
const { buildBusiness } = require('./factories/businessFactory');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';
let adminToken: string;

beforeAll(async () => {
  await connect();
  const admin = await User.create({
    name: 'Admin',
    email: 'admin-business-test@example.com',
    password: 'adminpass123',
    phone: '+9779812345630',
    role: 'admin',
    isActive: true,
  });
  adminToken = jwt.sign({ userId: admin._id }, JWT_SECRET);
});

afterAll(async () => {
  try {
    await Business.deleteMany({});
    await User.deleteMany({});
  } catch {
    // Server may already be down when running in parallel workers
  }
  await disconnect();
});

const authGet = (path: string) =>
  request(app).get(path).set('Authorization', `Bearer ${adminToken}`);
const authPut = (path: string) =>
  request(app).put(path).set('Authorization', `Bearer ${adminToken}`);
const authDelete = (path: string) =>
  request(app).delete(path).set('Authorization', `Bearer ${adminToken}`);

describe('GET /api/v1/business', () => {
  afterEach(async () => {
    try {
      await Business.deleteMany({});
    } catch {
      // Ignore if connection already closed
    }
  });

  it('returns 200 with business API message and empty businesses array when no data', async () => {
    const res = await authGet('/api/v1/business').expect(200);
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
        pancardNumber: '987654321',
        description: 'Acme description',
      })
    );

    const res = await authGet('/api/v1/business').expect(200);
    expect(res.body).toMatchObject({ message: 'Business API v1', ok: true });
    expect(res.body.businesses).toHaveLength(1);
    expect(res.body.businesses[0]).toMatchObject({
      businessname: 'Acme Corp',
      location: 'Lalitpur',
      pancardNumber: '987654321',
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
    const res = await authGet(`/api/v1/business/${nonExistentId}`).expect(404);
    expect(res.body).toMatchObject({ message: 'Business not found', ok: false });
  });

  it('should return 200 with business if found', async () => {
    const created = await Business.create(
      buildBusiness({
        businessname: 'Acme Corp',
        location: 'Lalitpur',
        pancardNumber: '987654321',
        description: 'Acme description',
      })
    );

    const res = await authGet(`/api/v1/business/${created._id}`).expect(200);
    expect(res.body).toMatchObject({ message: 'Business found', ok: true });
    expect(res.body.business).toMatchObject({
      businessname: 'Acme Corp',
      location: 'Lalitpur',
      pancardNumber: '987654321',
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
      const res=await authDelete(`/api/v1/business/${nonExistentId}`).expect(404);
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
          pancardNumber: '90090902',
          description:'Tryinging to do ',
        })
      );
      const res=await authDelete(`/api/v1/business/${created._id}`).expect(200);

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
    } catch (_e)  {
      
      //igonre 
    }
  });
  //if business not found 
  it('should return 404 if not found',async()=>
  {
    const nonExistId=new mongoose.Types.ObjectId();
    const res=await authPut(`/api/v1/business/${nonExistId}`)
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
      pancardNumber: '123456789',
      description: 'Trading company in Kathmandu',
    })
  );

  const res = await authPut(`/api/v1/business/${created._id}`)
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
      pancardNumber: '987654321',
      description: 'Trekking and tourism company',
    })
  );

  const hackedOwnerId = new mongoose.Types.ObjectId();

  await authPut(`/api/v1/business/${created._id}`)
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
      pancardNumber: '456789123',
      description: 'Traditional handicrafts from Bhaktapur',
    })
  );

  const res = await authPut(`/api/v1/business/${created._id}`)
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