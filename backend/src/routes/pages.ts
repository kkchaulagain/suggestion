import type { Request, Response, NextFunction } from 'express';
import type { Types } from 'mongoose';
const express = require('express');
const mongoose = require('mongoose');
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

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeSlug(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

async function resolveBusinessProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.id) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }
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

/** List pages: for business user scoped by businessId; for admin all. */
router.get(
  '/',
  isAuthenticated,
  authorize('business', 'admin', 'governmentservices', 'user'),
  resolveBusinessProfile,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const filter = req.businessProfile ? { businessId: req.businessProfile._id } : {};
      const pages = await Page.find(filter).sort({ updatedAt: -1 }).lean();
      return res.status(200).json({ pages });
    } catch (_err) {
      return res.status(500).json({ error: 'Failed to fetch pages' });
    }
  }
);

/** Create page: requires business profile. */
router.post(
  '/',
  isAuthenticated,
  authorize('business', 'admin', 'governmentservices', 'user'),
  resolveBusinessProfile,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.businessProfile) {
        return res.status(400).json({ error: 'Business profile required to create pages' });
      }
      const body = req.body || {};
      let slug = typeof body.slug === 'string' ? normalizeSlug(body.slug) : '';
      if (!slug) {
        const title = typeof body.title === 'string' ? body.title : 'Untitled';
        slug = normalizeSlug(title) || 'page';
      }
      if (!SLUG_REGEX.test(slug)) {
        return res.status(400).json({ error: 'Slug must contain only lowercase letters, numbers, and hyphens' });
      }
      const existing = await Page.findOne({ slug });
      if (existing) {
        return res.status(400).json({ error: 'A page with this slug already exists' });
      }
      const showInNav = body.showInNav !== false;
      const page = await Page.create({
        businessId: req.businessProfile._id,
        slug,
        title: typeof body.title === 'string' ? body.title.trim().slice(0, 200) : 'Untitled',
        metaTitle: typeof body.metaTitle === 'string' ? body.metaTitle.trim().slice(0, 120) : undefined,
        metaDescription: typeof body.metaDescription === 'string' ? body.metaDescription.trim().slice(0, 160) : undefined,
        status: body.status === 'published' ? 'published' : 'draft',
        showInNav,
        blocks: Array.isArray(body.blocks) ? body.blocks : [],
      });
      return res.status(201).json({ message: 'Page created', page });
    } catch (err: unknown) {
      const name = (err as { name?: string }).name;
      if (name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation failed' });
      }
      return res.status(500).json({ error: 'Failed to create page' });
    }
  }
);

/** Public: get published page by slug (no auth). Must be before /:id. */
router.get('/by-slug/:slug', async (req: Request, res: Response) => {
  const slug = req.params.slug;
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Slug is required' });
  }
  try {
    const page = await Page.findOne({ slug, status: 'published' }).lean();
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    return res.status(200).json({ page });
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to fetch page' });
  }
});

/** Public: get published page by ID (no auth). For URL pattern /c/:id/:slug. */
router.get('/public/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid page id' });
  }
  try {
    const page = await Page.findOne({ _id: id, status: 'published' }).lean();
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    return res.status(200).json({ page });
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to fetch page' });
  }
});

/** Public: get navigation pages for a published page's business (showInNav=true, published only). */
router.get('/public/:id/navigation', async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid page id' });
  }
  try {
    const sourcePage = await Page.findOne({ _id: id, status: 'published' }).select('businessId').lean();
    if (!sourcePage) {
      return res.status(404).json({ error: 'Page not found' });
    }
    const pages = await Page.find({
      businessId: sourcePage.businessId,
      status: 'published',
      // Backward-compatible: pages created before showInNav existed should still appear.
      showInNav: { $ne: false },
    })
      .select('_id slug title role showInNav')
      .sort({ createdAt: 1 })
      .lean();
    return res.status(200).json({ pages });
  } catch (_err) {
    return res.status(500).json({ error: 'Failed to fetch navigation pages' });
  }
});

/** Get single page by ID for editor (must own or admin). */
router.get(
  '/:id',
  isAuthenticated,
  authorize('business', 'admin', 'governmentservices', 'user'),
  resolveBusinessProfile,
  async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid page id' });
    }
    try {
      const filter: Record<string, unknown> = { _id: id };
      if (req.businessProfile) {
        filter.businessId = req.businessProfile._id;
      }
      const page = await Page.findOne(filter).lean();
      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }
      return res.status(200).json({ page });
    } catch (_err) {
      return res.status(500).json({ error: 'Failed to fetch page' });
    }
  }
);

/** Update page (must own or admin). */
router.put(
  '/:id',
  isAuthenticated,
  authorize('business', 'admin', 'governmentservices', 'user'),
  resolveBusinessProfile,
  async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid page id' });
    }
    try {
      const filter: Record<string, unknown> = { _id: id };
      if (req.businessProfile) {
        filter.businessId = req.businessProfile._id;
      }
      const page = await Page.findOne(filter);
      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }
      const body = req.body || {};
      if (typeof body.title === 'string') {
        page.title = body.title.trim().slice(0, 200);
      }
      if (typeof body.metaTitle === 'string') {
        page.metaTitle = body.metaTitle.trim().slice(0, 120);
      }
      if (typeof body.metaDescription === 'string') {
        page.metaDescription = body.metaDescription.trim().slice(0, 160);
      }
      if (body.status === 'published' || body.status === 'draft') {
        page.status = body.status;
      }
      if (Array.isArray(body.blocks)) {
        page.blocks = body.blocks;
      }
      if (typeof body.role === 'string') {
        const role = body.role.trim().slice(0, 40);
        page.role = role || undefined;
      }
      if (typeof body.showInNav === 'boolean') {
        page.showInNav = body.showInNav;
      }
      if (typeof body.slug === 'string') {
        const newSlug = normalizeSlug(body.slug);
        if (newSlug && SLUG_REGEX.test(newSlug) && newSlug !== page.slug) {
          const existing = await Page.findOne({ slug: newSlug });
          if (existing) {
            return res.status(400).json({ error: 'A page with this slug already exists' });
          }
          page.slug = newSlug;
        }
      }
      await page.save();
      return res.status(200).json({ message: 'Page updated', page });
    } catch (err: unknown) {
      const name = (err as { name?: string }).name;
      if (name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation failed' });
      }
      return res.status(500).json({ error: 'Failed to update page' });
    }
  }
);

/** Delete page (must own or admin). */
router.delete(
  '/:id',
  isAuthenticated,
  authorize('business', 'admin', 'governmentservices', 'user'),
  resolveBusinessProfile,
  async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid page id' });
    }
    try {
      const filter: Record<string, unknown> = { _id: id };
      if (req.businessProfile) {
        filter.businessId = req.businessProfile._id;
      }
      const page = await Page.findOneAndDelete(filter);
      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }
      return res.status(200).json({ message: 'Page deleted' });
    } catch (_err) {
      return res.status(500).json({ error: 'Failed to delete page' });
    }
  }
);

module.exports = router;
