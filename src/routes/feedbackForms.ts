const express = require('express');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const { FeedbackForm } = require('../models/FeedbackForm');
const router = express.Router();
const DEFAULT_FRONTEND_FORM_BASE_URL = 'http://localhost:5173/feedback-forms';

function normalizeFieldType(type: any) {
  if (typeof type !== 'string') return type;
  return type.toLowerCase().trim().replace(/[\s-]+/g, '_');
}

function normalizeFields(fields: any[]) {
  if (!Array.isArray(fields)) return fields;
  return fields.map((field) => {
    if (!field || typeof field !== 'object') return field;
    return { ...field, type: normalizeFieldType(field.type) };
  });
}

function buildPayload(body: any) {
  const payload: any = {};

  if (Object.prototype.hasOwnProperty.call(body, 'title')) {
    payload.title = body.title;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'description')) {
    payload.description = body.description;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'fields')) {
    payload.fields = normalizeFields(body.fields);
  }

  return payload;
}

function getValidationErrorMessage(err:any) {
  if (!err || err.name !== 'ValidationError') return null;
  const messages = Object.values(err.errors || {})
    .map((fieldErr) => (fieldErr as any).message)
    .filter(Boolean);
  return messages.length ? messages.join(', ') : 'Validation failed';
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

router.post('/', async (req: any, res: any) => {
  try {
    const payload = buildPayload(req.body || {});
    const feedbackForm = await FeedbackForm.create(payload);
    return res.status(201).json({
      message: 'Feedback form created',
      feedbackForm,
    });
  } catch (err) {
    const validationMessage = getValidationErrorMessage(err);
    if (validationMessage) {
      return res.status(400).json({ error: validationMessage });
    }
    return res.status(500).json({ error: 'Failed to create feedback form' });
  }
});

router.get('/', async (req: any, res: any) => {
  try {
    const feedbackForms = await FeedbackForm.find().sort({ createdAt: -1 });
    return res.status(200).json({ feedbackForms });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch feedback forms' });
  }
});

router.get('/:id', async (req: any, res: any) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid feedback form id' });
  }

  try {
    const feedbackForm = await FeedbackForm.findById(req.params.id);
    if (!feedbackForm) {
      return res.status(404).json({ error: 'Feedback form not found' });
    }
    return res.status(200).json({ feedbackForm });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch feedback form' });
  }
});

router.post('/:id/qr', async (req: any, res: any) => {
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
    const feedbackForm = await FeedbackForm.findById(req.params.id).select('_id');
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
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate feedback form QR' });
  }
});

router.put('/:id', async (req: any, res: any) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid feedback form id' });
  }

  const payload = buildPayload(req.body || {});
  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ error: 'At least one field is required to update' });
  }

  try {
    const feedbackForm = await FeedbackForm.findByIdAndUpdate(req.params.id, payload, {
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
  } catch (err) {
    const validationMessage = getValidationErrorMessage(err);
    if (validationMessage) {
      return res.status(400).json({ error: validationMessage });
    }
    return res.status(500).json({ error: 'Failed to update feedback form' });
  }
});

router.delete('/:id', async (req: any, res: any) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid feedback form id' });
  }

  try {
    const feedbackForm = await FeedbackForm.findByIdAndDelete(req.params.id);
    if (!feedbackForm) {
      return res.status(404).json({ error: 'Feedback form not found' });
    }
    return res.status(200).json({ message: 'Feedback form deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete feedback form' });
  }
});

module.exports = router;
