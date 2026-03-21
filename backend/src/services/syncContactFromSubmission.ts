import type { Types } from 'mongoose';
const Contact = require('../models/Contact');
const CrmActivity = require('../models/CrmActivity');
import { extractContactFromSubmission, type FormFieldLike } from '../utils/contactFromSubmission';

type LeanContact = {
  _id: Types.ObjectId;
  email?: string;
  phone?: string;
  displayName?: string;
  submissionCount?: number;
  firstSubmittedAt?: Date;
};

function submittedAtTime(d: LeanContact): number {
  const t = d.firstSubmittedAt;
  if (t instanceof Date) return t.getTime();
  return 0;
}

/**
 * Upsert or merge a Contact after a feedback form submission. Idempotent per submission flow.
 */
export async function syncContactFromSubmission(
  businessId: Types.ObjectId,
  fields: FormFieldLike[],
  responses: Record<string, string | string[]>,
  submissionId: Types.ObjectId,
): Promise<void> {
  const extracted = extractContactFromSubmission(fields, responses);
  if (!extracted) return;

  const { email, phone, displayName } = extracted;
  const or: Array<{ email?: string; phone?: string }> = [];
  if (email) or.push({ email });
  if (phone) or.push({ phone });
  if (or.length === 0) return;

  const now = new Date();
  const matches = (await Contact.find({ businessId, $or: or }).lean()) as LeanContact[];

  if (matches.length === 0) {
    await Contact.create({
      businessId,
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(displayName ? { displayName } : {}),
      lastSubmissionId: submissionId,
      submissionCount: 1,
      firstSubmittedAt: now,
      lastSubmittedAt: now,
    });
    await CrmActivity.create({
      businessId,
      eventType: 'contact',
      summary: 'Contact added from form submission',
      createdAt: now,
    });
    return;
  }

  if (matches.length === 1) {
    const m = matches[0]!;
    const setDoc: Record<string, unknown> = {
      lastSubmissionId: submissionId,
      lastSubmittedAt: now,
    };
    if (email) setDoc.email = email;
    if (phone) setDoc.phone = phone;
    if (displayName) setDoc.displayName = displayName;
    await Contact.updateOne({ _id: m._id }, { $set: setDoc, $inc: { submissionCount: 1 } });
    await CrmActivity.create({
      businessId,
      eventType: 'contact',
      summary: 'Contact updated from form submission',
      createdAt: now,
    });
    return;
  }

  const sorted = [...matches].sort((a, b) => submittedAtTime(a) - submittedAtTime(b));
  const canonical = sorted[0]!;
  const toRemove = sorted.slice(1).map((d) => d._id);

  let mergedEmail: string | undefined;
  let mergedPhone: string | undefined;
  let mergedName: string | undefined;
  for (const doc of sorted) {
    mergedEmail = mergedEmail || doc.email;
    mergedPhone = mergedPhone || doc.phone;
    mergedName = mergedName || doc.displayName;
  }
  if (email) mergedEmail = email;
  if (phone) mergedPhone = phone;
  if (displayName) mergedName = displayName;

  let submissionCount = 0;
  for (const doc of sorted) {
    submissionCount += doc.submissionCount ?? 0;
  }
  submissionCount += 1;

  await Contact.deleteMany({ _id: { $in: toRemove } });

  const setMerged: Record<string, unknown> = {
    lastSubmissionId: submissionId,
    lastSubmittedAt: now,
    submissionCount,
  };
  if (mergedEmail) setMerged.email = mergedEmail;
  if (mergedPhone) setMerged.phone = mergedPhone;
  if (mergedName) setMerged.displayName = mergedName;

  await Contact.updateOne({ _id: canonical._id }, { $set: setMerged });

  await CrmActivity.create({
    businessId,
    eventType: 'contact',
    summary: 'Contacts merged from form submission',
    createdAt: now,
  });
}
