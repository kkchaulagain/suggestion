import type { Request, Response, NextFunction } from 'express';
import type { Types } from 'mongoose';
const express = require('express');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const { FeedbackForm } = require('../models/FeedbackForm');
const { FeedbackSubmission } = require('../models/FeedbackSubmission');
const Business = require('../models/Business');
const User = require('../models/User');
const { isAuthenticated } = require('../middleware/isauthenticated');
const { authorize } = require('../middleware/authorize');
const router = express.Router();
const DEFAULT_FRONTEND_FORM_BASE_URL = 'http://localhost:3001/feedback-forms';

interface BusinessProfileDoc {
  _id: Types.ObjectId;
}

interface AuthenticatedRequest extends Request {
  id?: string;
  user?: { role?: string };
  businessProfile?: BusinessProfileDoc | null;
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

const FORM_KINDS = ['form', 'poll', 'survey'] as const;
type FormKind = (typeof FORM_KINDS)[number];

interface FeedbackFormPayload {
  title?: string;
  description?: string;
  fields?: FeedbackFieldInput[];
  kind?: FormKind;
  showResultsPublic?: boolean;
  businessId?: Types.ObjectId;
}

interface RequestBody {
  title?: string;
  description?: string;
  fields?: FeedbackFieldInput[];
  kind?: string;
  showResultsPublic?: boolean;
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
  if (Object.prototype.hasOwnProperty.call(body, 'kind') && typeof body.kind === 'string') {
    const k = body.kind.toLowerCase().trim();
    if (FORM_KINDS.includes(k as FormKind)) {
      payload.kind = k as FormKind;
    }
  }
  if (Object.prototype.hasOwnProperty.call(body, 'showResultsPublic') && typeof body.showResultsPublic === 'boolean') {
    payload.showResultsPublic = body.showResultsPublic;
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
  const responses: SubmissionBody = {};

  for (const field of form.fields || []) {
    const name = field.name;
    const value = raw[name];

    const isAnonymousAllowed = field.type === 'name' && (field as { allowAnonymous?: boolean }).allowAnonymous;

    if (field.required && !isAnonymousAllowed) {
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

  return { valid: true, responses };
}

async function resolveBusinessProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.id) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }
    // Admin can access without a business profile (e.g. list all forms/submissions)
    if (req.user?.role === 'admin') {
      req.businessProfile = null;
      return next();
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

/** Optionally attach user and businessProfile when valid token is present; never returns 401. */
async function optionalAuthAndBusiness(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const headerToken = (req.headers?.cookie ?? '')
      .split(';')
      .map((part: string) => part.trim())
      .find((part: string) => part.startsWith('token='))
      ?.split('=')[1];
    const authHeader = (req.headers?.authorization ?? '').toString();
    const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : undefined;
    const cookieToken = (req as Request & { cookies?: { token?: string } }).cookies?.token;
    const token = bearerToken || cookieToken || headerToken;
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key') as { userId?: string };
    if (!decoded?.userId) return next();
    req.id = decoded.userId;
    const user = await User.findById(decoded.userId).select('role').lean();
    if (user) (req as AuthenticatedRequest).user = user as { role?: string };
    if (req.user?.role === 'admin') {
      req.businessProfile = null;
      return next();
    }
    const businessProfile = await Business.findOne({ owner: decoded.userId }).select('_id').lean();
    if (businessProfile) req.businessProfile = businessProfile as BusinessProfileDoc;
    next();
  } catch (_err) {
    next();
  }
}

router.post('/', isAuthenticated, authorize('business', 'admin', 'governmentservices'), resolveBusinessProfile, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.businessProfile) {
      return res.status(400).json({ error: 'Business profile required to create forms' });
    }
    const payload = buildPayload((req.body || {}) as RequestBody);
    payload.businessId = req.businessProfile._id;
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

router.get('/', isAuthenticated, authorize('business', 'admin', 'governmentservices'), resolveBusinessProfile, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filter = req.businessProfile
      ? { businessId: req.businessProfile._id }
      : {};
    const feedbackForms = await FeedbackForm.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ feedbackForms });
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to fetch feedback forms' });
  }
});

router.get('/submissions', isAuthenticated, authorize('business', 'admin', 'governmentservices'), resolveBusinessProfile, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query: Record<string, unknown> = {};
    if (req.businessProfile) {
      query.businessId = req.businessProfile._id;
    }
    const formIdRaw = req.query.formId;
    const dateFromRaw = req.query.dateFrom;
    const dateToRaw = req.query.dateTo;
    if (formIdRaw && typeof formIdRaw === 'string' && !mongoose.Types.ObjectId.isValid(formIdRaw)) {
      return res.status(400).json({ error: 'Invalid form id' });
    }
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
    // When a form is selected, allow filtering by response field values (field_<name>=<value>)
    const fieldNameRegex = /^[a-zA-Z0-9_]+$/;
    if (formIdRaw && typeof formIdRaw === 'string' && req.query && typeof req.query === 'object') {
      for (const [key, val] of Object.entries(req.query)) {
        if (key.startsWith('field_') && typeof val === 'string' && val.trim() !== '') {
          const fieldName = key.slice(6);
          if (fieldNameRegex.test(fieldName)) {
            (query as Record<string, unknown>)['responses.' + fieldName] = val.trim();
          }
        }
      }
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

router.get('/:id/submissions', isAuthenticated, authorize('business', 'admin', 'governmentservices'), resolveBusinessProfile, async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid feedback form id' });
  }
  try {
    const formFilter: Record<string, unknown> = { _id: id };
    if (req.businessProfile) {
      formFilter.businessId = req.businessProfile._id;
    }
    const form = await FeedbackForm.findOne(formFilter).select('_id');
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

router.get('/:id/results', optionalAuthAndBusiness, async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid feedback form id' });
  }
  try {
    const form = await FeedbackForm.findById(id).lean();
    if (!form) {
      return res.status(404).json({ error: 'Feedback form not found' });
    }
    const formDoc = form as {
      _id: unknown;
      title?: string;
      businessId?: Types.ObjectId;
      showResultsPublic?: boolean;
      fields?: Array<{ name: string; label: string; type: string; options?: string[] }>;
    };
    const showResultsPublic = formDoc.showResultsPublic === true;
    const authReq = req as AuthenticatedRequest;
    const isOwner =
      authReq.businessProfile &&
      formDoc.businessId &&
      authReq.businessProfile._id.toString() === formDoc.businessId.toString();
    const isAdmin = authReq.user?.role === 'admin';
    if (!showResultsPublic && !isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Results are not publicly available for this form' });
    }
    const query: Record<string, unknown> = { formId: new mongoose.Types.ObjectId(id) };
    const dateFromRaw = req.query.dateFrom;
    const dateToRaw = req.query.dateTo;
    const dateFrom = dateFromRaw && typeof dateFromRaw === 'string' ? new Date(dateFromRaw) : null;
    const dateTo = dateToRaw && typeof dateToRaw === 'string' ? new Date(dateToRaw) : null;
    const submittedAtFilter: Record<string, Date> = {};
    if (dateFrom && !Number.isNaN(dateFrom.getTime())) submittedAtFilter.$gte = dateFrom;
    if (dateTo && !Number.isNaN(dateTo.getTime())) submittedAtFilter.$lte = dateTo;
    if (Object.keys(submittedAtFilter).length > 0) {
      query.submittedAt = submittedAtFilter;
    }
    const submissions = await FeedbackSubmission.find(query).select('responses submittedAt').lean();
    const totalResponses = submissions.length;
    const byField: Record<string, { label: string; type: string; options?: { option: string; count: number; percentage: number }[]; responseCount?: number; sampleAnswers?: string[] }> = {};
    const choiceTypes = ['radio', 'checkbox', 'scale_1_10', 'rating'];
    const textTypes = ['short_text', 'long_text', 'big_text', 'name', 'image_upload'];
    const fields = formDoc.fields || [];
    for (const field of fields) {
      const fname = field.name;
      const label = field.label || fname;
      const ftype = field.type;
      if (choiceTypes.includes(ftype)) {
        const counts: Record<string, number> = {};
        const optionsList = Array.isArray(field.options) ? field.options : [];
        optionsList.forEach((opt) => { counts[opt] = 0; });
        for (const sub of submissions as { responses?: Record<string, unknown> }[]) {
          const val = sub.responses?.[fname];
          if ((ftype === 'radio' || ftype === 'scale_1_10' || ftype === 'rating') && typeof val === 'string' && val.trim() !== '') {
            counts[val] = (counts[val] ?? 0) + 1;
          } else if (ftype === 'checkbox' && Array.isArray(val)) {
            for (const v of val) {
              if (typeof v === 'string' && v.trim() !== '') {
                counts[v] = (counts[v] ?? 0) + 1;
              }
            }
          }
        }
        const total = totalResponses;
        const allOptions = [...new Set([...optionsList, ...Object.keys(counts).filter((k) => (counts[k] ?? 0) > 0)])];
        const options = allOptions.map((option) => {
          const count = counts[option] ?? 0;
          const percentage = total > 0 ? Math.round((100 * count) / total) : 0;
          return { option, count, percentage };
        });
        byField[fname] = { label, type: ftype, options };
      } else if (textTypes.includes(ftype)) {
        const sampleAnswers: string[] = [];
        for (const sub of submissions as { responses?: Record<string, unknown> }[]) {
          const val = sub.responses?.[fname];
          const s = typeof val === 'string' ? val.trim() : '';
          if (s !== '' && sampleAnswers.length < 20) sampleAnswers.push(s);
        }
        byField[fname] = { label, type: ftype, responseCount: totalResponses, sampleAnswers };
      }
    }
    const dayCounts: Record<string, number> = {};
    for (const sub of submissions as { submittedAt?: Date }[]) {
      const d = sub.submittedAt;
      if (d) {
        const key = new Date(d).toISOString().slice(0, 10);
        dayCounts[key] = (dayCounts[key] ?? 0) + 1;
      }
    }
    const responsesOverTime = Object.entries(dayCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    return res.status(200).json({
      formId: id,
      formTitle: formDoc.title ?? '',
      totalResponses,
      byField,
      responsesOverTime,
    });
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to fetch results' });
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

router.post('/:id/qr', isAuthenticated, authorize('business', 'admin', 'governmentservices'), resolveBusinessProfile, async (req: AuthenticatedRequest, res: Response) => {
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
    const formFilter: Record<string, unknown> = { _id: req.params.id };
    if (req.businessProfile) {
      formFilter.businessId = req.businessProfile._id;
    }
    const feedbackForm = await FeedbackForm.findOne(formFilter).select('_id');
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

router.put('/:id', isAuthenticated, authorize('business', 'admin', 'governmentservices'), resolveBusinessProfile, async (req: AuthenticatedRequest, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid feedback form id' });
  }

  const payload = buildPayload((req.body || {}) as RequestBody);
  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ error: 'At least one field is required to update' });
  }

  try {
    const updateFilter: Record<string, unknown> = { _id: req.params.id };
    if (req.businessProfile) {
      updateFilter.businessId = req.businessProfile._id;
    }
    const feedbackForm = await FeedbackForm.findOneAndUpdate(updateFilter, payload, {
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

router.delete('/:id', isAuthenticated, authorize('business', 'admin', 'governmentservices'), resolveBusinessProfile, async (req: AuthenticatedRequest, res: Response) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid feedback form id' });
  }

  try {
    const deleteFilter: Record<string, unknown> = { _id: req.params.id };
    if (req.businessProfile) {
      deleteFilter.businessId = req.businessProfile._id;
    }
    const feedbackForm = await FeedbackForm.findOneAndDelete(deleteFilter);
    if (!feedbackForm) {
      return res.status(404).json({ error: 'Feedback form not found' });
    }
    return res.status(200).json({ message: 'Feedback form deleted' });
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to delete feedback form' });
  }
});

module.exports = router;
