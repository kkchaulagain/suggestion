import type { Request, Response, NextFunction } from 'express';
import type { Types } from 'mongoose';
const express = require('express');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const { FeedbackForm } = require('../models/FeedbackForm');
const Business = require('../models/Business');
const { isAuthenticated } = require('../middleware/isauthenticated');
const { isBusinessRole } = require('../middleware/isbusiness');
const router = express.Router();
const DEFAULT_FRONTEND_FORM_BASE_URL = 'http://localhost:5173/feedback-forms';

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
