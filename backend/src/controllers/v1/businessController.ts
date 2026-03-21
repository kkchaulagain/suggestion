import type { Request, Response } from 'express';
import type { Types } from 'mongoose';
const Business = require('../../models/Business');
const CrmActivity = require('../../models/CrmActivity');
const CrmNote = require('../../models/CrmNote');
const CrmTask = require('../../models/CrmTask');
import type { BusinessDocument, BusinessListItem, GetBusinessesResponse, GetBusinessResponse, } from '../../types/business';
import type { ApiResponse } from '../../types/api';
import {
  deleteAllCrmForBusiness,
  loadCrmPayload,
  type BusinessCrmFields,
} from '../../services/crmForBusiness';
import {
  mapLocationFromCreateBody,
  mapLocationToApi,
  mergeMapLocationPatch,
} from '../../utils/businessMapLocation';

function toListItem(doc: BusinessDocument): BusinessListItem {
  const item: BusinessListItem = {
    id: String(doc._id),
    owner: doc.owner != null ? String(doc.owner) : '',
    type: doc.type,
    isPublicCompany: Boolean((doc as { isPublicCompany?: boolean }).isPublicCompany),
    businessname: doc.businessname,
    description: doc.description,
  };
  if (doc.location !== undefined && doc.location !== '') {
    item.location = doc.location;
  }
  if (doc.pancardNumber !== undefined && doc.pancardNumber !== '') {
    item.pancardNumber = doc.pancardNumber;
  }
  const map = mapLocationToApi(doc as { mapLocation?: unknown });
  if (map) {
    item.mapLocation = map;
  }
  return item;
}

async function createBusiness(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  const { businessname, description, location, pancardNumber, type, customFields, isPublicCompany } =
    body;
  const name = typeof businessname === 'string' ? businessname.trim() : '';
  const desc = typeof description === 'string' ? description.trim() : '';
  if (!name || !desc) {
    res.status(400).json({ message: 'businessname and description are required', ok: false });
    return;
  }
  const bizType =
    type === 'personal' || type === 'commercial' ? type : 'commercial';
  const isPublic =
    isPublicCompany === true ||
    isPublicCompany === 'true' ||
    String(isPublicCompany).toLowerCase() === 'true';
  const payload: Record<string, unknown> = {
    type: bizType,
    businessname: name,
    description: desc,
    isPublicCompany: Boolean(isPublic),
  };
  if (location != null && String(location).trim()) {
    payload.location = String(location).trim();
  }
  if (pancardNumber != null && String(pancardNumber).trim()) {
    payload.pancardNumber = String(pancardNumber).trim();
  }
  if (Array.isArray(customFields)) {
    const cleaned = customFields
      .filter(
        (row): row is { key: string; value: unknown; fieldType?: string } =>
          row != null &&
          typeof row === 'object' &&
          typeof (row as { key?: unknown }).key === 'string' &&
          String((row as { key: string }).key).trim() !== '',
      )
      .map((row) => ({
        key: String(row.key).trim(),
        value: row.value,
        fieldType: typeof row.fieldType === 'string' ? row.fieldType : 'text',
      }));
    if (cleaned.length > 0) {
      payload.customFields = cleaned;
    }
  }
  const { mapLocation: mlCreate, mapGeo: geoCreate } = mapLocationFromCreateBody(body.mapLocation);
  if (mlCreate) {
    payload.mapLocation = mlCreate;
    if (geoCreate) payload.mapGeo = geoCreate;
  }
  const business = await Business.create(payload);
  res.status(201).json({
    message: 'Business created successfully',
    ok: true,
    business: toListItem(business as BusinessDocument),
  });
}

async function getBusiness(req: Request, res: Response): Promise<void> {
  const businesses = await Business.find();
  const businessesResponse: BusinessListItem[] = businesses.map(toListItem);
  const payload: GetBusinessesResponse = {
    message: 'Business API v1',
    ok: true,
    businesses: businessesResponse,
  };
  res.json(payload);
}
async function findBusinessById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const business = await Business.findById(id);
  if (!business) {
    res.status(404).json({ message: 'Business not found', ok: false });
    return;
  }
  const payload: GetBusinessResponse = {
    message: 'Business found',
    ok: true,
    business: toListItem(business),
  };
  res.json(payload);
  return;
}

async function deleteBusiness(req:Request,res:Response):Promise<void>{
  const {id}= req.params;
  const business = await Business.findById(id);
  if(!business){
    const payload:ApiResponse={
      message:'Business not found',
      ok:false,
    };
    res.status(404).json(payload);
    return;
  }
  const bid = business._id as Types.ObjectId;
  await deleteAllCrmForBusiness(bid);
  await Business.findByIdAndDelete(id);
  const payload:ApiResponse={
    message:'Business deleted successfully',
    ok:true,
  };
  res.status(200).json(payload);
}
async function updateBusiness(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
 //geting form the body cause we wanna change that
  const { businessname, location, pancardNumber, description, isPublicCompany } = req.body;

  //checking empty body FIRST
  const updateFields: Partial<BusinessListItem> = {};
  if (businessname) updateFields.businessname = businessname;
  if (location) updateFields.location = location;
  if (pancardNumber != null && String(pancardNumber).trim()) updateFields.pancardNumber = String(pancardNumber).trim();
  if (description) updateFields.description = description;
  if (typeof isPublicCompany === 'boolean') {
    updateFields.isPublicCompany = isPublicCompany;
  }

  if (Object.keys(updateFields).length === 0) {
    res.status(400).json({
      message: 'No valid fields to update',
      ok: false,
    });
    return;
  }

  // check if business exists
  const business = await Business.findByIdAndUpdate(id, updateFields, { new: true });

  if (!business) {
    res.status(404).json({
      message: 'Business not found',
      ok: false,
    });
    return;
  }

  res.status(200).json({
    message: 'Business updated successfully',
    ok: true,
    business: toListItem(business),
  });
}

async function getPublicBusinessMapPins(req: Request, res: Response): Promise<void> {
  const rows = await Business.find({
    isPublicCompany: true,
    mapGeo: { $exists: true, $ne: null },
  })
    .select('businessname mapGeo mapLocation')
    .lean();
  res.json({
    ok: true,
    pins: rows.map((b: { _id: Types.ObjectId; businessname: string; mapGeo?: { coordinates: number[] }; mapLocation?: { googleMapsUrl?: string } }) => ({
      id: String(b._id),
      name: b.businessname,
      latitude: b.mapGeo?.coordinates?.[1],
      longitude: b.mapGeo?.coordinates?.[0],
      googleMapsUrl: b.mapLocation?.googleMapsUrl,
    })),
  });
}

async function getBusinessDetail(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const business = await Business.findById(id);
  if (!business) {
    res.status(404).json({ message: 'Business not found', ok: false });
    return;
  }
  const bid = business._id as Types.ObjectId;
  const crm = await loadCrmPayload(bid, business as unknown as BusinessCrmFields);
  res.json({
    ok: true,
    business: toListItem(business as BusinessDocument),
    crm,
  });
}

async function patchBusinessDetail(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const body = req.body as Record<string, unknown>;
  const business = await Business.findById(id);
  if (!business) {
    res.status(404).json({ message: 'Business not found', ok: false });
    return;
  }

  const businessId = business._id as Types.ObjectId;
  let applied = false;
  let businessDirty = false;

  const doc = business as unknown as {
    businessname: string;
    location?: string;
    pancardNumber?: string;
    description: string;
    crmTags: string[];
  };
  if (!Array.isArray(doc.crmTags)) {
    (business as { crmTags: string[] }).crmTags = [];
  }

  const profile = body.profile;
  if (profile != null && typeof profile === 'object' && !Array.isArray(profile)) {
    const p = profile as Record<string, unknown>;
    if (typeof p.businessname === 'string' && p.businessname.trim()) {
      doc.businessname = p.businessname.trim();
      businessDirty = true;
    }
    if (typeof p.location === 'string') {
      doc.location = p.location.trim();
      businessDirty = true;
    }
    if (p.pancardNumber !== undefined) {
      const pan = String(p.pancardNumber ?? '').trim();
      if (pan) {
        doc.pancardNumber = pan;
      } else {
        business.set('pancardNumber', undefined);
      }
      businessDirty = true;
    }
    if (typeof p.description === 'string' && p.description.trim()) {
      doc.description = p.description.trim();
      businessDirty = true;
    }
    if (typeof p.isPublicCompany === 'boolean') {
      (business as { isPublicCompany: boolean }).isPublicCompany = p.isPublicCompany;
      businessDirty = true;
    }
    if (p.mapLocation != null && typeof p.mapLocation === 'object' && !Array.isArray(p.mapLocation)) {
      const { mapLocation: ml, mapGeo } = mergeMapLocationPatch(
        (business as { mapLocation?: unknown }).mapLocation,
        p.mapLocation as Record<string, unknown>,
      );
      if (ml == null) {
        business.set('mapLocation', undefined);
        business.set('mapGeo', undefined);
      } else {
        business.set('mapLocation', ml);
        business.set('mapGeo', mapGeo ?? undefined);
      }
      businessDirty = true;
    }
    await CrmActivity.create({
      businessId,
      eventType: 'profile',
      summary: 'Profile updated',
      createdAt: new Date(),
    });
    applied = true;
  }

  if (Array.isArray(body.tags)) {
    (business as { crmTags: string[] }).crmTags = (body.tags as unknown[])
      .filter((t): t is string => typeof t === 'string')
      .map((t) => t.trim())
      .filter(Boolean);
    businessDirty = true;
    await CrmActivity.create({
      businessId,
      eventType: 'tags',
      summary: 'Tags updated',
      createdAt: new Date(),
    });
    applied = true;
  }

  const addNote = body.addNote;
  if (addNote != null && typeof addNote === 'object' && typeof (addNote as { text?: unknown }).text === 'string') {
    const text = String((addNote as { text: string }).text).trim();
    if (text) {
      await CrmNote.create({ businessId, text, createdAt: new Date() });
      await CrmActivity.create({
        businessId,
        eventType: 'note',
        summary: 'Note added',
        createdAt: new Date(),
      });
      applied = true;
    }
  }

  const addTask = body.addTask;
  if (addTask != null && typeof addTask === 'object' && typeof (addTask as { title?: unknown }).title === 'string') {
    const title = String((addTask as { title: string }).title).trim();
    if (title) {
      const due = (addTask as { dueDate?: string }).dueDate;
      if (due) {
        await CrmTask.create({
          businessId,
          title,
          completed: false,
          dueDate: new Date(due),
          createdAt: new Date(),
        });
      } else {
        await CrmTask.create({
          businessId,
          title,
          completed: false,
          createdAt: new Date(),
        });
      }
      await CrmActivity.create({
        businessId,
        eventType: 'task',
        summary: `Task added: ${title}`,
        createdAt: new Date(),
      });
      applied = true;
    }
  }

  const updateTask = body.updateTask;
  if (
    updateTask != null &&
    typeof updateTask === 'object' &&
    typeof (updateTask as { taskId?: unknown }).taskId === 'string'
  ) {
    const taskId = (updateTask as { taskId: string }).taskId;
    const updatedTask = await CrmTask.findOneAndUpdate(
      { _id: taskId, businessId },
      { completed: !!(updateTask as { completed?: boolean }).completed },
      { new: true },
    );
    if (updatedTask) {
      await CrmActivity.create({
        businessId,
        eventType: 'task',
        summary: 'Task status updated',
        createdAt: new Date(),
      });
      applied = true;
    }
  }

  const addTimeline = body.addTimeline;
  if (
    addTimeline != null &&
    typeof addTimeline === 'object' &&
    typeof (addTimeline as { eventType?: unknown }).eventType === 'string' &&
    typeof (addTimeline as { summary?: unknown }).summary === 'string'
  ) {
    await CrmActivity.create({
      businessId,
      eventType: String((addTimeline as { eventType: string }).eventType).slice(0, 64),
      summary: String((addTimeline as { summary: string }).summary).slice(0, 500),
      createdAt: new Date(),
    });
    applied = true;
  }

  if (!applied) {
    res.status(400).json({ message: 'No valid CRM update in body', ok: false });
    return;
  }

  if (businessDirty) {
    await business.save();
  }

  const saved = await Business.findById(id);
  if (!saved) {
    res.status(404).json({ message: 'Business not found', ok: false });
    return;
  }
  const crm = await loadCrmPayload(saved._id as Types.ObjectId, saved as unknown as BusinessCrmFields);
  res.json({
    ok: true,
    business: toListItem(saved as BusinessDocument),
    crm,
  });
}

module.exports = {
  getBusiness,
  findBusinessById,
  deleteBusiness,
  updateBusiness,
  createBusiness,
  getPublicBusinessMapPins,
  getBusinessDetail,
  patchBusinessDetail,
};
