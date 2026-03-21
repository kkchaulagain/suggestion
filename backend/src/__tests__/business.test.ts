import type { Types } from 'mongoose';
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { connect, disconnect } = require('../db');
const app = require('../app');
const Business = require('../models/Business');
const CrmNote = require('../models/CrmNote');
const CrmTask = require('../models/CrmTask');
const CrmActivity = require('../models/CrmActivity');
const Contact = require('../models/Contact');
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
    await CrmNote.deleteMany({});
    await CrmTask.deleteMany({});
    await CrmActivity.deleteMany({});
    await Contact.deleteMany({});
    await Business.deleteMany({});
    await User.deleteMany({});
  } catch {
    // Server may already be down when running in parallel workers
  }
  await disconnect();
});

async function cleanBusinessAndCrm() {
  await CrmNote.deleteMany({});
  await CrmTask.deleteMany({});
  await CrmActivity.deleteMany({});
  await Contact.deleteMany({});
  await Business.deleteMany({});
}

const authGet = (path: string) =>
  request(app).get(path).set('Authorization', `Bearer ${adminToken}`);
const authPut = (path: string) =>
  request(app).put(path).set('Authorization', `Bearer ${adminToken}`);
const authDelete = (path: string) =>
  request(app).delete(path).set('Authorization', `Bearer ${adminToken}`);
const authPost = (path: string) =>
  request(app).post(path).set('Authorization', `Bearer ${adminToken}`);
const authPatch = (path: string) =>
  request(app).patch(path).set('Authorization', `Bearer ${adminToken}`);

describe('Business model', () => {
  afterEach(async () => {
    try {
      await cleanBusinessAndCrm();
    } catch {
      /* ignore */
    }
  });

  it('defaults missing type to commercial on save', async () => {
    const b = new Business({ businessname: 'ImplicitType', description: 'D' });
    await b.save();
    expect(b.type).toBe('commercial');
  });
});

describe('GET /api/v1/business/:id/detail', () => {
  afterEach(async () => {
    try {
      await cleanBusinessAndCrm();
    } catch {
      // Ignore if connection already closed
    }
  });

  it('returns 404 when business missing', async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await authGet(`/api/v1/business/${id}/detail`).expect(404);
    expect(res.body.ok).toBe(false);
  });

  it('returns business and empty CRM defaults', async () => {
    const created = await Business.create(
      buildBusiness({
        businessname: 'CRM Co',
        description: 'Desc',
      }),
    );
    const res = await authGet(`/api/v1/business/${created._id}/detail`).expect(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.business.businessname).toBe('CRM Co');
    expect(res.body.crm).toMatchObject({
      tags: [],
      customFields: [],
      notes: [],
      tasks: [],
      timeline: [],
      contacts: [],
    });
  });
});

describe('PATCH /api/v1/business/:id/detail', () => {
  afterEach(async () => {
    try {
      await cleanBusinessAndCrm();
    } catch {
      // Ignore if connection already closed
    }
  });

  it('returns 400 when no valid CRM update', async () => {
    const created = await Business.create(buildBusiness({}));
    const res = await authPatch(`/api/v1/business/${created._id}/detail`).send({}).expect(400);
    expect(res.body.ok).toBe(false);
  });

  it('adds note and returns updated CRM', async () => {
    const created = await Business.create(buildBusiness({}));
    const res = await authPatch(`/api/v1/business/${created._id}/detail`)
      .send({ addNote: { text: 'First note' } })
      .expect(200);
    expect(res.body.crm.notes).toHaveLength(1);
    expect(res.body.crm.notes[0].text).toBe('First note');
    expect(res.body.crm.timeline.length).toBeGreaterThanOrEqual(1);
  });

  it('updates profile fields', async () => {
    const created = await Business.create(
      buildBusiness({ businessname: 'Old', description: 'D' }),
    );
    const res = await authPatch(`/api/v1/business/${created._id}/detail`)
      .send({
        profile: { businessname: 'New Name', description: 'New desc', location: 'Ktm' },
      })
      .expect(200);
    expect(res.body.business.businessname).toBe('New Name');
    expect(res.body.business.description).toBe('New desc');
    expect(res.body.business.location).toBe('Ktm');
  });

  it('patch profile updates mapLocation and mapGeo', async () => {
    const created = await Business.create(buildBusiness({}));
    const res = await authPatch(`/api/v1/business/${created._id}/detail`)
      .send({
        profile: {
          mapLocation: {
            googleMapsUrl: 'https://maps.app.goo.gl/x',
            latitude: 28.2,
            longitude: 83.9,
          },
        },
      })
      .expect(200);
    expect(res.body.business.mapLocation?.latitude).toBe(28.2);
    expect(res.body.business.mapLocation?.googleMapsUrl).toContain('maps');
    const doc = await Business.findById(created._id).lean();
    expect(doc?.mapGeo?.coordinates).toEqual([83.9, 28.2]);
  });

  it('patch profile clears mapLocation and mapGeo when map fields emptied', async () => {
    const created = await Business.create(
      buildBusiness({
        mapLocation: {
          googleMapsUrl: 'https://maps.example/x',
          latitude: 27,
          longitude: 85,
        },
      }),
    );
    await Business.findByIdAndUpdate(created._id, {
      mapGeo: { type: 'Point', coordinates: [85, 27] },
    });
    const res = await authPatch(`/api/v1/business/${created._id}/detail`)
      .send({
        profile: {
          mapLocation: {
            googleMapsUrl: '',
            googleReviewsUrl: '',
            placeId: '',
            latitude: '',
            longitude: '',
          },
        },
      })
      .expect(200);
    expect(res.body.business.mapLocation == null || res.body.business.mapLocation === undefined).toBe(
      true,
    );
    const doc = await Business.findById(created._id).lean();
    expect(doc?.mapLocation == null || Object.keys(doc.mapLocation || {}).length === 0).toBe(true);
    expect(doc?.mapGeo).toBeUndefined();
  });

  it('patch profile sets isPublicCompany', async () => {
    const created = await Business.create(buildBusiness({ isPublicCompany: false }));
    const res = await authPatch(`/api/v1/business/${created._id}/detail`)
      .send({ profile: { isPublicCompany: true } })
      .expect(200);
    expect(res.body.business.isPublicCompany).toBe(true);
    const doc = await Business.findById(created._id).lean();
    expect(doc?.isPublicCompany).toBe(true);
  });

  it('adds task and updateTask toggles completed', async () => {
    const created = await Business.create(buildBusiness({}));
    const addRes = await authPatch(`/api/v1/business/${created._id}/detail`)
      .send({ addTask: { title: 'Follow up' } })
      .expect(200);
    expect(addRes.body.crm.tasks).toHaveLength(1);
    const taskId = addRes.body.crm.tasks[0].id;
    expect(addRes.body.crm.tasks[0].completed).toBe(false);

    const upRes = await authPatch(`/api/v1/business/${created._id}/detail`)
      .send({ updateTask: { taskId, completed: true } })
      .expect(200);
    const t = upRes.body.crm.tasks.find((x: { id: string }) => x.id === taskId);
    expect(t.completed).toBe(true);
  });

  it('returns 404 when patching missing business', async () => {
    const id = new mongoose.Types.ObjectId();
    const res = await authPatch(`/api/v1/business/${id}/detail`)
      .send({ addNote: { text: 'n' } })
      .expect(404);
    expect(res.body.ok).toBe(false);
  });

  it('normalizes crmTags when missing on document and sets tags via patch', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const _id = new mongoose.Types.ObjectId();
    await Business.collection.insertOne({
      _id,
      type: 'commercial',
      businessname: 'RawBiz',
      description: 'D',
      owner: ownerId,
      crmTags: null,
    });
    const res = await authPatch(`/api/v1/business/${_id}/detail`)
      .send({ tags: ['vip', 'lead'] })
      .expect(200);
    expect(res.body.crm.tags).toEqual(['vip', 'lead']);
  });

  it('patch profile updates location clears pancard and description', async () => {
    const created = await Business.create(
      buildBusiness({
        businessname: 'N',
        description: 'OldDesc',
        location: 'OldLoc',
        pancardNumber: '111',
      }),
    );
    const res = await authPatch(`/api/v1/business/${created._id}/detail`)
      .send({
        profile: {
          location: 'NewLoc',
          pancardNumber: '',
          description: 'NewDesc',
        },
      })
      .expect(200);
    expect(res.body.business.location).toBe('NewLoc');
    expect(res.body.business.description).toBe('NewDesc');
    const doc = await Business.findById(created._id).lean();
    expect(doc.pancardNumber).toBeFalsy();
  });

  it('patch profile sets pancardNumber when provided', async () => {
    const created = await Business.create(
      buildBusiness({
        businessname: 'PanTest',
        description: 'D',
        pancardNumber: '',
      }),
    );
    const res = await authPatch(`/api/v1/business/${created._id}/detail`)
      .send({ profile: { pancardNumber: '777777777' } })
      .expect(200);
    expect(res.body.business.pancardNumber).toBe('777777777');
  });

  it('addTask with dueDate and addTimeline', async () => {
    const created = await Business.create(buildBusiness({}));
    const due = new Date('2030-01-15').toISOString();
    const res = await authPatch(`/api/v1/business/${created._id}/detail`)
      .send({
        addTask: { title: 'Due task', dueDate: due },
        addTimeline: { eventType: 'call', summary: 'Customer called' },
      })
      .expect(200);
    expect(res.body.crm.tasks.some((t: { title: string }) => t.title === 'Due task')).toBe(true);
    const task = res.body.crm.tasks.find((t: { title: string }) => t.title === 'Due task');
    expect(task.dueDate).toBeDefined();
    expect(res.body.crm.timeline.some((e: { summary: string }) => e.summary === 'Customer called')).toBe(true);
  });

  it('returns 404 when business disappears after patch operations', async () => {
    const created = await Business.create(buildBusiness({}));
    const origFind = Business.findById.bind(Business);
    let calls = 0;
    jest.spyOn(Business, 'findById').mockImplementation(function mockFind(this: unknown, id: unknown) {
      calls += 1;
      if (calls === 1) {
        return origFind(id as Types.ObjectId);
      }
      return Promise.resolve(null);
    } as typeof Business.findById);
    const res = await authPatch(`/api/v1/business/${created._id}/detail`)
      .send({ addNote: { text: 'x' } })
      .expect(404);
    expect(res.body.message).toMatch(/not found/i);
    (Business.findById as jest.Mock).mockRestore();
  });
});

describe('POST /api/v1/business', () => {
  afterEach(async () => {
    try {
      await cleanBusinessAndCrm();
    } catch {
      // Ignore if connection already closed
    }
  });

  it('returns 400 when businessname or description missing', async () => {
    const res = await authPost('/api/v1/business').send({ businessname: 'X' }).expect(400);
    expect(res.body).toMatchObject({ ok: false });
    const res2 = await authPost('/api/v1/business').send({ description: 'Y' }).expect(400);
    expect(res2.body).toMatchObject({ ok: false });
  });

  it('returns 201 and creates commercial business without owner', async () => {
    const res = await authPost('/api/v1/business')
      .send({
        businessname: 'Admin Created Co',
        description: 'Created by admin',
        location: 'Pokhara',
        pancardNumber: '111222333',
        type: 'commercial',
      })
      .expect(201);

    expect(res.body).toMatchObject({ ok: true, message: expect.stringMatching(/created/i) });
    expect(res.body.business).toMatchObject({
      businessname: 'Admin Created Co',
      description: 'Created by admin',
      location: 'Pokhara',
      pancardNumber: '111222333',
      type: 'commercial',
      isPublicCompany: false,
    });
    expect(res.body.business).toHaveProperty('id');
    const doc = await Business.findById(res.body.business.id);
    expect(doc).not.toBeNull();
    expect(doc.owner).toBeUndefined();
  });

  it('new business appears in GET list', async () => {
    await authPost('/api/v1/business').send({
      businessname: 'Listed Biz',
      description: 'For list test',
    });

    const listRes = await authGet('/api/v1/business').expect(200);
    expect(listRes.body.businesses.some((b: { businessname: string }) => b.businessname === 'Listed Biz')).toBe(
      true,
    );
  });

  it('creates public company when isPublicCompany true', async () => {
    const res = await authPost('/api/v1/business')
      .send({
        businessname: 'Listed PLC',
        description: 'Listed entity',
        isPublicCompany: true,
      })
      .expect(201);
    expect(res.body.business.isPublicCompany).toBe(true);
    const doc = await Business.findById(res.body.business.id).lean();
    expect(doc?.isPublicCompany).toBe(true);
  });

  it('creates business with mapLocation and mapGeo when lat/lng set', async () => {
    const res = await authPost('/api/v1/business')
      .send({
        businessname: 'Geo Co',
        description: 'Pinned',
        mapLocation: {
          googleMapsUrl: 'https://maps.google.com/?q=here',
          googleReviewsUrl: 'https://maps.google.com/reviews',
          latitude: 27.5,
          longitude: 85.2,
          placeId: 'ChIJtest',
        },
      })
      .expect(201);
    expect(res.body.business.mapLocation).toMatchObject({
      latitude: 27.5,
      longitude: 85.2,
      placeId: 'ChIJtest',
    });
    const doc = await Business.findById(res.body.business.id).lean();
    expect(doc.mapGeo?.type).toBe('Point');
    expect(doc.mapGeo?.coordinates).toEqual([85.2, 27.5]);
  });

  it('creates business with personal type and customFields', async () => {
    const res = await authPost('/api/v1/business')
      .send({
        businessname: 'Personal Biz',
        description: 'About me',
        type: 'personal',
        pancardNumber: '999',
        customFields: [
          { key: 'website', value: 'https://x.com', fieldType: 'url' },
          { key: 'note', value: 'hello' },
          { key: '', value: 'skip' },
          null,
        ],
      })
      .expect(201);
    expect(res.body.business.type).toBe('personal');
    expect(res.body.business.pancardNumber).toBe('999');
    const doc = await Business.findById(res.body.business.id).lean();
    expect(doc.customFields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'website', fieldType: 'url' }),
        expect.objectContaining({ key: 'note', fieldType: 'text' }),
      ]),
    );
    expect(doc.customFields).toHaveLength(2);
  });
});

describe('GET /api/v1/business/map-pins', () => {
  afterEach(async () => {
    try {
      await cleanBusinessAndCrm();
    } catch {
      /* ignore */
    }
  });

  it('returns only public businesses that have map coordinates', async () => {
    await Business.create({
      ...buildBusiness({ businessname: 'Listed Pin' }),
      isPublicCompany: true,
      mapLocation: { latitude: 27.71, longitude: 85.32 },
      mapGeo: { type: 'Point', coordinates: [85.32, 27.71] },
    });
    await Business.create({
      ...buildBusiness({ businessname: 'Private Pin' }),
      isPublicCompany: false,
      mapLocation: { latitude: 1, longitude: 2 },
      mapGeo: { type: 'Point', coordinates: [2, 1] },
    });
    await Business.create({
      ...buildBusiness({ businessname: 'Public No Geo' }),
      isPublicCompany: true,
    });

    const res = await authGet('/api/v1/business/map-pins').expect(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.pins).toHaveLength(1);
    expect(res.body.pins[0].name).toBe('Listed Pin');
    expect(res.body.pins[0].latitude).toBe(27.71);
    expect(res.body.pins[0].longitude).toBe(85.32);
  });
});

describe('GET /api/v1/business', () => {
  afterEach(async () => {
    try {
      await cleanBusinessAndCrm();
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
      await cleanBusinessAndCrm();
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
      await cleanBusinessAndCrm();
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
    });

    it('deletes CRM documents when business is deleted', async () => {
      const created = await Business.create(buildBusiness({}));
      await authPatch(`/api/v1/business/${created._id}/detail`)
        .send({ addNote: { text: 'orphan check' } })
        .expect(200);
      expect(await CrmNote.countDocuments({ businessId: created._id })).toBe(1);
      await Contact.create({
        businessId: created._id,
        email: 'orphan-contact@example.com',
        lastSubmissionId: new mongoose.Types.ObjectId(),
        submissionCount: 1,
        firstSubmittedAt: new Date(),
        lastSubmittedAt: new Date(),
      });
      expect(await Contact.countDocuments({ businessId: created._id })).toBe(1);

      await authDelete(`/api/v1/business/${created._id}`).expect(200);
      expect(await CrmNote.countDocuments({ businessId: created._id })).toBe(0);
      expect(await CrmActivity.countDocuments({ businessId: created._id })).toBe(0);
      expect(await Contact.countDocuments({ businessId: created._id })).toBe(0);
    });
});
describe('Update /api/v1/business/:id',()=>
{
  afterEach(async()=>{
    try {
      await cleanBusinessAndCrm();
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

  it('updates isPublicCompany via PUT', async () => {
    const created = await Business.create(buildBusiness({ isPublicCompany: false }));
    const res = await authPut(`/api/v1/business/${created._id}`)
      .send({ isPublicCompany: true })
      .expect(200);
    expect(res.body.business.isPublicCompany).toBe(true);
  });
})