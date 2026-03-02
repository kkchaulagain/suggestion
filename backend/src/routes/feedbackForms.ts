import type { Request, Response, NextFunction } from 'express';
import type { Types } from 'mongoose';
const express = require('express');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const { FeedbackForm } = require('../models/FeedbackForm');
const { FeedbackSubmission } = require('../models/FeedbackSubmission');
const Business = require('../models/Business');
const { isAuthenticated } = require('../middleware/isauthenticated');
const { isBusinessRole } = require('../middleware/isbusiness');
const router = express.Router();
const DEFAULT_FRONTEND_FORM_BASE_URL = 'http://localhost:3001/feedback-forms';

interface BusinessProfileDoc {
  _id: Types.ObjectId;
}

interface AuthenticatedRequest extends Request {
  id?: string;
  businessProfile?: BusinessProfileDoc;
}

interface FeedbackFieldInput {
  name?: string;
  type?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  [key: string]: string | boolean | undefined;
}

function normalizeFieldType(type: string | FeedbackFieldInput[keyof FeedbackFieldInput]): string | FeedbackFieldInput[keyof FeedbackFieldInput] {
  if (typeof type !== 'string') return type;
  return type.toLowerCase().trim().replace(/[\s-]+/g, '_');
}

function normalizeFields(fields: FeedbackFieldInput[] | null | undefined): FeedbackFieldInput[] {
  if (!Array.isArray(fields)) return [];
  return fields.map((field) => {
    if (!field || typeof field !== 'object') return field as FeedbackFieldInput;
    const obj = field as FeedbackFieldInput;
    return { ...obj, type: normalizeFieldType(obj.type) } as FeedbackFieldInput;
  });
}

interface FeedbackFormPayload {
  title?: string;
  description?: string;
  fields?: FeedbackFieldInput[];
  businessId?: Types.ObjectId;
}

interface RequestBody {
  title?: string;
  description?: string;
  fields?: FeedbackFieldInput[];
}

function buildPayload(body: RequestBody): FeedbackFormPayload {
  const payload: FeedbackFormPayload = {};

  if (Object.prototype.hasOwnProperty.call(body, 'title') && typeof body.title === 'string') {
    payload.title = body.title;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'description') && typeof body.description === 'string') {
    payload.description = body.description;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'fields')) {
    payload.fields = normalizeFields(body.fields);
  }

  return payload;
}

interface MongooseValidationError extends Error {
  name: 'ValidationError';
  errors?: Record<string, { message?: string }>;
}

function getValidationErrorMessage(err: MongooseValidationError | Error | null): string | null {
  if (!err || (err as MongooseValidationError).name !== 'ValidationError') return null;
  const validationErr = err as MongooseValidationError;
  const messages = Object.values(validationErr.errors || {})
    .map((fieldErr) => fieldErr?.message)
    .filter(Boolean);
  return messages.length ? (messages as string[]).join(', ') : 'Validation failed';
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/, '');
}

function getFrontendFormUrl(formId: string, frontendBaseUrlOverride?: string) {
  if (typeof frontendBaseUrlOverride === 'string' && frontendBaseUrlOverride.trim()) {
    return `${normalizeBaseUrl(frontendBaseUrlOverride)}/${encodeURIComponent(formId)}`;
  }

  const configuredBaseUrl = process.env.FRONTEND_FORM_BASE_URL;
  const baseUrl =
    typeof configuredBaseUrl === 'string' && configuredBaseUrl.trim()
      ? configuredBaseUrl
      : DEFAULT_FRONTEND_FORM_BASE_URL;

  return `${normalizeBaseUrl(baseUrl)}/${encodeURIComponent(formId)}`;
}

interface FormFieldDoc {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
}

interface FormSnapshotField {
  name: string;
  label: string;
  type: string;
  options?: string[];
}

function buildFormSnapshot(form: { fields: FormFieldDoc[] }): FormSnapshotField[] {
  if (!Array.isArray(form.fields)) return [];
  return form.fields.map((f) => ({
    name: f.name,
    label: f.label,
    type: f.type,
    ...(Array.isArray(f.options) && f.options.length > 0 ? { options: f.options } : {}),
  }));
}

type SubmissionBody = Record<string, string | string[]>;

function validateSubmissionPayload(
  form: { fields: FormFieldDoc[] },
  body: unknown
): { valid: true; responses: SubmissionBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, error: 'Request body must be an object with field names as keys' };
  }
  const raw = body as Record<string, unknown>;
  const formFieldNames = new Set((form.fields || []).map((f) => f.name));
  const responses: SubmissionBody = {};

  for (const field of form.fields || []) {
    const name = field.name;
    const value = raw[name];

    if (field.required) {
      if (value === undefined || value === null) {
        return { valid: false, error: `${field.label} is required` };
      }
      if (field.type === 'checkbox') {
        const arr = Array.isArray(value) ? value : [value];
        const strArr = arr.filter((v) => typeof v === 'string').map((v) => String(v).trim());
        if (strArr.length === 0) {
          return { valid: false, error: `${field.label} is required` };
        }
        responses[name] = strArr;
      } else {
        const str = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
        if (str === '') {
          return { valid: false, error: `${field.label} is required` };
        }
        responses[name] = str;
      }
    } else {
      if (value === undefined || value === null) {
        responses[name] = field.type === 'checkbox' ? [] : '';
      } else if (field.type === 'checkbox') {
        const arr = Array.isArray(value) ? value : [value];
        responses[name] = arr.filter((v) => typeof v === 'string').map((v) => String(v).trim());
      } else {
        responses[name] = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
      }
    }
  }

  for (const key of Object.keys(raw)) {
    if (!formFieldNames.has(key)) continue;
    if (responses[key] !== undefined) continue;
    const value = raw[key];
    const field = form.fields.find((f) => f.name === key);
    if (!field) continue;
    if (field.required) {
      if (value === undefined || value === null) {
        return { valid: false, error: `${field.label} is required` };
      }
    }
    if (field.type === 'checkbox') {
      responses[key] = Array.isArray(value)
        ? (value as string[]).map((v) => String(v).trim())
        : value !== undefined && value !== null && value !== ''
          ? [String(value).trim()]
          : [];
    } else {
      responses[key] =
        typeof value === 'string' ? value.trim() : value !== undefined && value !== null ? String(value).trim() : '';
    }
  }

  return { valid: true, responses };
}

async function resolveBusinessProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.id) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    const businessProfile = await Business.findOne({ owner: req.id }).select('_id owner');
    if (!businessProfile) {
      return res.status(404).json({ error: 'Business profile not found' });
    }

    req.businessProfile = businessProfile;
    return next();
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to verify business profile' });
  }
}

router.post('/', isAuthenticated, isBusinessRole, resolveBusinessProfile, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload = buildPayload((req.body || {}) as RequestBody);
    payload.businessId = req.businessProfile!._id;
    const feedbackForm = await FeedbackForm.create(payload);
    return res.status(201).json({
      message: 'Feedback form created',
      feedbackForm,
    });
  } catch (_err) {
    const validationMessage = getValidationErrorMessage(_err as Error);
    if (validationMessage) {
      return res.status(400).json({ error: validationMessage });
    }
    return res.status(500).json({ error: 'Failed to create feedback form' });
  }
});

router.get('/', isAuthenticated, isBusinessRole, resolveBusinessProfile, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const feedbackForms = await FeedbackForm.find({ businessId: req.businessProfile!._id }).sort({ createdAt: -1 });
    return res.status(200).json({ feedbackForms });
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to fetch feedback forms' });
  }
});

router.get('/submissions', isAuthenticated, isBusinessRole, resolveBusinessProfile, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.businessProfile!._id;
    const formIdRaw = req.query.formId;
    const dateFromRaw = req.query.dateFrom;
    const dateToRaw = req.query.dateTo;
    if (formIdRaw && typeof formIdRaw === 'string' && !mongoose.Types.ObjectId.isValid(formIdRaw)) {
      return res.status(400).json({ error: 'Invalid form id' });
    }
    const query: Record<string, unknown> = { businessId };
    if (formIdRaw && typeof formIdRaw === 'string') {
      query.formId = new mongoose.Types.ObjectId(formIdRaw);
    }
    const dateFrom = dateFromRaw && typeof dateFromRaw === 'string' ? new Date(dateFromRaw) : null;
    const dateTo = dateToRaw && typeof dateToRaw === 'string' ? new Date(dateToRaw) : null;
    if (dateFrom && !Number.isNaN(dateFrom.getTime())) {
      query.submittedAt = query.submittedAt || {};
      (query.submittedAt as Record<string, Date>).$gte = dateFrom;
    }
    if (dateTo && !Number.isNaN(dateTo.getTime())) {
      query.submittedAt = query.submittedAt || {};
      (query.submittedAt as Record<string, Date>).$lte = dateTo;
    }
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize), 10) || 20));
    const skip = (page - 1) * pageSize;
    const [submissions, total] = await Promise.all([
      FeedbackSubmission.find(query).sort({ submittedAt: -1 }).skip(skip).limit(pageSize).lean(),
      FeedbackSubmission.countDocuments(query),
    ]);
    const formIds = [...new Set(
      (submissions as { formId?: { toString: () => string } }[]).map((s) => s.formId?.toString()).filter(Boolean) as string[],
    )];
    const formTitles: Record<string, string> = {};
    if (formIds.length > 0) {
      const forms = await FeedbackForm.find({ _id: { $in: formIds.map((id) => new mongoose.Types.ObjectId(id)) } }).select('_id title').lean();
      for (const f of forms as { _id: { toString: () => string }; title: string }[]) {
        formTitles[f._id.toString()] = f.title || '';
      }
    }
    const submissionsWithTitle = (submissions as { formId?: { toString: () => string }; [key: string]: unknown }[]).map((s) => {
      const id = s.formId ? s.formId.toString() : '';
      return { ...s, formId: id, formTitle: formTitles[id] ?? '' };
    });
    return res.status(200).json({ submissions: submissionsWithTitle, total });
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

router.get('/:id/submissions', isAuthenticated, isBusinessRole, resolveBusinessProfile, async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid feedback form id' });
  }
  try {
    const form = await FeedbackForm.findOne({
      _id: id,
      businessId: req.businessProfile!._id,
    }).select('_id');
    if (!form) {
      return res.status(404).json({ error: 'Feedback form not found' });
    }
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize), 10) || 20));
    const skip = (page - 1) * pageSize;
    const [submissions, total] = await Promise.all([
      FeedbackSubmission.find({ formId: id }).sort({ submittedAt: -1 }).skip(skip).limit(pageSize).lean(),
      FeedbackSubmission.countDocuments({ formId: id }),
    ]);
    return res.status(200).json({ submissions, total });
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

router.post('/:id/submit', async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid feedback form id' });
  }
  try {
    const form = await FeedbackForm.findById(id);
    if (!form) {
      return res.status(404).json({ error: 'Feedback form not found' });
    }
    const validation = validateSubmissionPayload(form, req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    const formSnapshot = buildFormSnapshot(form);
    const doc = await FeedbackSubmission.create({
      formId: form._id,
      businessId: form.businessId,
      formSnapshot,
      responses: validation.responses,
      submittedAt: new Date(),
    });
    return res.status(201).json({ message: 'Submission received', submissionId: doc._id });
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to save submission' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid feedback form id' });
  }

  try {
    const feedbackForm = await FeedbackForm.findById(req.params.id);
    if (!feedbackForm) {
      return res.status(404).json({ error: 'Feedback form not found' });
    }
    return res.status(200).json({ feedbackForm });
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to fetch feedback form' });
  }
});

router.post('/:id/qr', isAuthenticated, isBusinessRole, resolveBusinessProfile, async (req: AuthenticatedRequest, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid feedback form id' });
  }

  const { frontendBaseUrl } = req.body || {};
  if (
    Object.prototype.hasOwnProperty.call(req.body || {}, 'frontendBaseUrl') &&
    (typeof frontendBaseUrl !== 'string' || !frontendBaseUrl.trim())
  ) {
    return res.status(400).json({ error: 'frontendBaseUrl must be a non-empty string' });
  }

  try {
    const feedbackForm = await FeedbackForm.findOne({
      _id: req.params.id,
      businessId: req.businessProfile!._id,
    }).select('_id');
    if (!feedbackForm) {
      return res.status(404).json({ error: 'Feedback form not found' });
    }

    const formUrl = getFrontendFormUrl(feedbackForm._id.toString(), frontendBaseUrl);
    const qrCodeDataUrl = await QRCode.toDataURL(formUrl, {
      type: 'image/png',
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
    });

    return res.status(200).json({
      message: 'Feedback form QR generated',
      formUrl,
      qrCodeDataUrl,
    });
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to generate feedback form QR' });
  }
});

router.put('/:id', isAuthenticated, isBusinessRole, resolveBusinessProfile, async (req: AuthenticatedRequest, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid feedback form id' });
  }

  const payload = buildPayload((req.body || {}) as RequestBody);
  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ error: 'At least one field is required to update' });
  }

  try {
    const feedbackForm = await FeedbackForm.findOneAndUpdate({
      _id: req.params.id,
      businessId: req.businessProfile!._id,
    }, payload, {
      new: true,
      runValidators: true,
    });

    if (!feedbackForm) {
      return res.status(404).json({ error: 'Feedback form not found' });
    }

    return res.status(200).json({
      message: 'Feedback form updated',
      feedbackForm,
    });
  } catch (_err) {
    const validationMessage = getValidationErrorMessage(_err as Error);
    if (validationMessage) {
      return res.status(400).json({ error: validationMessage });
    }
    return res.status(500).json({ error: 'Failed to update feedback form' });
  }
});

router.delete('/:id', isAuthenticated, isBusinessRole, resolveBusinessProfile, async (req: AuthenticatedRequest, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid feedback form id' });
  }

  try {
    const feedbackForm = await FeedbackForm.findOneAndDelete({
      _id: req.params.id,
      businessId: req.businessProfile!._id,
    });
    if (!feedbackForm) {
      return res.status(404).json({ error: 'Feedback form not found' });
    }
    return res.status(200).json({ message: 'Feedback form deleted' });
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to delete feedback form' });
  }
});

module.exports = router;
