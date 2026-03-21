import type { Types } from 'mongoose';
const CrmNote = require('../models/CrmNote');
const CrmTask = require('../models/CrmTask');
const CrmActivity = require('../models/CrmActivity');
const Contact = require('../models/Contact');

export const CRM_LIST_LIMIT = 200;

export type CrmNoteDto = { id: string; text: string; createdAt: string };
export type CrmTaskDto = {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
};
export type CrmTimelineDto = { id: string; eventType: string; summary: string; createdAt: string };

export type CrmContactDto = {
  id: string;
  email?: string;
  phone?: string;
  displayName?: string;
  submissionCount: number;
  lastSubmittedAt: string;
};

export type CrmPayload = {
  tags: string[];
  customFields: Array<{ key: string; value: unknown; fieldType: string }>;
  notes: CrmNoteDto[];
  tasks: CrmTaskDto[];
  timeline: CrmTimelineDto[];
  contacts: CrmContactDto[];
};

export type BusinessCrmFields = {
  crmTags?: string[];
  customFields?: Array<{ key: string; value: unknown; fieldType?: string }> | unknown[];
};

export async function loadCrmPayload(
  businessId: Types.ObjectId,
  business: BusinessCrmFields,
): Promise<CrmPayload> {
  const bid = businessId;
  const [noteDocs, taskDocs, activityDocs, contactDocs] = await Promise.all([
    CrmNote.find({ businessId: bid }).sort({ createdAt: -1 }).limit(CRM_LIST_LIMIT).lean(),
    CrmTask.find({ businessId: bid }).sort({ createdAt: -1 }).limit(CRM_LIST_LIMIT).lean(),
    CrmActivity.find({ businessId: bid }).sort({ createdAt: -1 }).limit(CRM_LIST_LIMIT).lean(),
    Contact.find({ businessId: bid }).sort({ lastSubmittedAt: -1 }).limit(CRM_LIST_LIMIT).lean(),
  ]);

  const tags = Array.isArray(business.crmTags) ? business.crmTags : [];
  const rawCf = business.customFields ?? [];
  const customFields = (Array.isArray(rawCf) ? rawCf : []).map((cf: unknown) => {
    const row = cf as { key?: string; value: unknown; fieldType?: string };
    return {
      key: String(row.key ?? ''),
      value: row.value,
      fieldType: row.fieldType ?? 'text',
    };
  }).filter((cf) => cf.key !== '');

  const notes: CrmNoteDto[] = noteDocs.map(
    (n: { _id: Types.ObjectId; text: string; createdAt?: Date }) => ({
      id: String(n._id),
      text: n.text,
      createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt ?? ''),
    }),
  );

  const tasks: CrmTaskDto[] = taskDocs.map(
    (t: {
      _id: Types.ObjectId;
      title: string;
      completed?: boolean;
      dueDate?: Date;
      createdAt?: Date;
    }) => ({
      id: String(t._id),
      title: t.title,
      completed: !!t.completed,
      dueDate: t.dueDate instanceof Date ? t.dueDate.toISOString() : undefined,
      createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt ?? ''),
    }),
  );

  const timeline: CrmTimelineDto[] = activityDocs.map(
    (ev: { _id: Types.ObjectId; eventType: string; summary: string; createdAt?: Date }) => ({
      id: String(ev._id),
      eventType: ev.eventType,
      summary: ev.summary,
      createdAt: ev.createdAt instanceof Date ? ev.createdAt.toISOString() : String(ev.createdAt ?? ''),
    }),
  );

  const contacts: CrmContactDto[] = contactDocs.map(
    (c: {
      _id: Types.ObjectId;
      email?: string;
      phone?: string;
      displayName?: string;
      submissionCount?: number;
      lastSubmittedAt?: Date;
    }) => ({
      id: String(c._id),
      ...(c.email ? { email: c.email } : {}),
      ...(c.phone ? { phone: c.phone } : {}),
      ...(c.displayName ? { displayName: c.displayName } : {}),
      submissionCount: typeof c.submissionCount === 'number' ? c.submissionCount : 0,
      lastSubmittedAt:
        c.lastSubmittedAt instanceof Date
          ? c.lastSubmittedAt.toISOString()
          : String(c.lastSubmittedAt ?? ''),
    }),
  );

  return { tags, customFields, notes, tasks, timeline, contacts };
}

export async function deleteAllCrmForBusiness(businessId: Types.ObjectId): Promise<void> {
  await Promise.all([
    CrmNote.deleteMany({ businessId }),
    CrmTask.deleteMany({ businessId }),
    CrmActivity.deleteMany({ businessId }),
    Contact.deleteMany({ businessId }),
  ]);
}
