import type { Request, Response, NextFunction } from 'express';
import type { Types } from 'mongoose';
const express = require('express');
const { FeedbackForm } = require('../models/FeedbackForm');
const { FeedbackSubmission } = require('../models/FeedbackSubmission');
const { Page } = require('../models/Page');
const Business = require('../models/Business');
const { isAuthenticated } = require('../middleware/isauthenticated');
const { authorize } = require('../middleware/authorize');
const router = express.Router();

interface BusinessProfileDoc {
  _id: Types.ObjectId;
}

interface AuthenticatedRequest extends Request {
  id?: string;
  user?: { role?: string };
  businessProfile?: BusinessProfileDoc | null;
}

/** Wrap async route handlers so rejections are passed to next(err). Express 4 does not await async middleware. */
function asyncHandler(
  fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<unknown>
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/** GET /api/onboarding/counts - return current forms, pages, submissions counts for the business (for confirmation UI). */
async function getCountsHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.businessProfile) {
      res.status(400).json({ error: 'Business profile required' });
      return;
    }
    const businessId = req.businessProfile._id;
    const [formsCount, pagesCount, submissionsCount] = await Promise.all([
      FeedbackForm.countDocuments({ businessId }),
      Page.countDocuments({ businessId }),
      FeedbackSubmission.countDocuments({ businessId }),
    ]);
    res.status(200).json({ formsCount, pagesCount, submissionsCount });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch counts' });
  }
}

router.get(
  '/counts',
  isAuthenticated,
  authorize('business', 'admin', 'governmentservices', 'user'),
  asyncHandler(resolveBusinessProfile),
  asyncHandler((req, res, _next) => getCountsHandler(req, res))
);

/** Resolve business profile; onboarding requires a business (no admin bypass). */
async function resolveBusinessProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
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

function randomSlugSuffix(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 6; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Ensure slug is unique; if taken, append -xxxxxx until unique. */
async function ensureUniqueSlug(slug: string): Promise<string> {
  let base = slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (!base) base = 'page';
  if (!SLUG_REGEX.test(base)) base = 'page';
  let candidate = base;
  let exists = await Page.findOne({ slug: candidate }).lean();
  while (exists) {
    candidate = `${base}-${randomSlugSuffix()}`;
    exists = await Page.findOne({ slug: candidate }).lean();
  }
  return candidate;
}

/**
 * POST /api/onboarding/business-setup
 * Body: { resetExistingData: boolean, forms: FormPayload[], pages: PagePayload[] }
 * - FormPayload: same shape as POST /api/feedback-forms (title, description, fields, steps, kind, ...)
 * - PagePayload: { title, slug?, blocks?, status? }. In blocks, form block payload may use formIndex (0-based) to reference created forms.
 * Order: delete pages -> submissions -> forms; create forms; create pages (resolving formIndex -> formId); set onboardingCompleted.
 */
async function postBusinessSetupHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.businessProfile) {
      res.status(400).json({ error: 'Business profile required' });
      return;
    }
    const businessId = req.businessProfile._id as Types.ObjectId;
      const body = req.body || {};
      const resetExistingData = body.resetExistingData === true;
      const formsInput = Array.isArray(body.forms) ? body.forms : [];
      const pagesInput = Array.isArray(body.pages) ? body.pages : [];

      if (resetExistingData) {
        await Page.deleteMany({ businessId });
        await FeedbackSubmission.deleteMany({ businessId });
        await FeedbackForm.deleteMany({ businessId });
      }

      const createdForms: { _id: Types.ObjectId; title: string }[] = [];
      for (let i = 0; i < formsInput.length; i++) {
        const f = formsInput[i];
        if (!f || typeof f !== 'object' || !f.title || !Array.isArray(f.fields) || f.fields.length === 0) {
          res.status(400).json({ error: `Form at index ${i} must have title and at least one field` });
          return;
        }
        const payload = {
          title: String(f.title).trim().slice(0, 120),
          description: typeof f.description === 'string' ? f.description.trim().slice(0, 1000) : '',
          metaTitle: typeof f.metaTitle === 'string' ? f.metaTitle.trim().slice(0, 120) : undefined,
          metaDescription: typeof f.metaDescription === 'string' ? f.metaDescription.trim().slice(0, 160) : undefined,
          landingHeadline: typeof f.landingHeadline === 'string' ? f.landingHeadline.trim().slice(0, 120) : undefined,
          landingDescription: typeof f.landingDescription === 'string' ? f.landingDescription.trim().slice(0, 300) : undefined,
          landingCtaText: typeof f.landingCtaText === 'string' ? f.landingCtaText.trim().slice(0, 40) : undefined,
          landingEmoji: typeof f.landingEmoji === 'string' ? f.landingEmoji.trim().slice(0, 4) : undefined,
          thankYouHeadline: typeof f.thankYouHeadline === 'string' ? f.thankYouHeadline.trim().slice(0, 120) : undefined,
          thankYouMessage: typeof f.thankYouMessage === 'string' ? f.thankYouMessage.trim().slice(0, 300) : undefined,
          showResultsPublic: f.showResultsPublic === true,
          kind: (f.kind === 'poll' || f.kind === 'survey') ? f.kind : 'form',
          formStyle: f.formStyle === 'drawer' ? 'drawer' : 'default',
          drawerDefaultOpen: f.drawerDefaultOpen !== false,
          fields: Array.isArray(f.fields) ? f.fields : [],
          steps: Array.isArray(f.steps) ? f.steps : undefined,
          businessId,
        };
        const doc = await FeedbackForm.create(payload);
        createdForms.push({ _id: doc._id, title: doc.title });
      }

      const formIdByIndex: Record<number, string> = {};
      createdForms.forEach((form, idx) => {
        formIdByIndex[idx] = form._id.toString();
      });

      const createdPages: { _id: Types.ObjectId; title: string; slug: string }[] = [];
      for (let i = 0; i < pagesInput.length; i++) {
        const p = pagesInput[i];
        if (!p || typeof p !== 'object' || !p.title) {
          res.status(400).json({ error: `Page at index ${i} must have title` });
          return;
        }
        const rawSlug = typeof p.slug === 'string' ? p.slug : p.title;
        const slug = await ensureUniqueSlug(rawSlug);
        const blocks = Array.isArray(p.blocks) ? p.blocks : [];
        const resolvedBlocks = blocks.map((block: { type?: string; payload?: Record<string, unknown> }) => {
          if (block?.type === 'form' && block.payload && typeof block.payload === 'object') {
            const formIndex = (block.payload as { formIndex?: number }).formIndex;
            if (typeof formIndex === 'number' && formIdByIndex[formIndex]) {
              return {
                ...block,
                payload: { ...block.payload, formId: formIdByIndex[formIndex] },
              };
            }
          }
          return block;
        });
        const page = await Page.create({
          businessId,
          slug,
          title: String(p.title).trim().slice(0, 200),
          metaTitle: typeof p.metaTitle === 'string' ? p.metaTitle.trim().slice(0, 120) : undefined,
          metaDescription: typeof p.metaDescription === 'string' ? p.metaDescription.trim().slice(0, 160) : undefined,
          status: p.status === 'published' ? 'published' : 'draft',
          blocks: resolvedBlocks,
        });
        createdPages.push({ _id: page._id, title: page.title, slug: page.slug });
      }

      await Business.updateOne(
        { _id: businessId },
        { $set: { onboardingCompleted: true, onboardingCompletedAt: new Date() } }
      );

      res.status(200).json({
        message: 'Business setup completed',
        forms: createdForms.map((f) => ({ _id: f._id.toString(), title: f.title })),
        pages: createdPages.map((p) => ({ _id: p._id.toString(), title: p.title, slug: p.slug })),
        onboardingCompleted: true,
      });
    } catch (err: unknown) {
      const name = (err as { name?: string }).name;
      if (name === 'ValidationError') {
        res.status(400).json({ error: 'Validation failed' });
        return;
      }
      res.status(500).json({ error: 'Failed to complete business setup' });
    }
}

router.post(
  '/business-setup',
  isAuthenticated,
  authorize('business', 'admin', 'governmentservices', 'user'),
  asyncHandler(resolveBusinessProfile),
  asyncHandler((req, res, _next) => postBusinessSetupHandler(req, res))
);

module.exports = router;
module.exports.getCountsHandler = getCountsHandler;
module.exports.postBusinessSetupHandler = postBusinessSetupHandler;
module.exports.resolveBusinessProfile = resolveBusinessProfile;
