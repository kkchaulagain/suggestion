import type { Request, Response } from 'express';
const express = require('express');
const User = require('../models/User');
const { isAuthenticated } = require('../middleware/isauthenticated');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const ROLES = ['admin', 'business', 'user', 'governmentservices'];

interface AuthenticatedRequest extends Request {
  id?: string;
}

function toPublicUser(doc: { _id: unknown; name: string; email: string; role: string; isActive?: boolean; createdAt?: Date }) {
  return {
    _id: doc._id,
    name: doc.name,
    email: doc.email,
    role: doc.role,
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt,
  };
}

router.get('/', isAuthenticated, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || DEFAULT_PAGE);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(String(req.query.pageSize), 10) || DEFAULT_PAGE_SIZE));
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const roleFilter = typeof req.query.role === 'string' && ROLES.includes(req.query.role) ? req.query.role : undefined;
    const isActiveParam = req.query.isActive;
    let isActiveFilter: boolean | undefined;
    if (isActiveParam === 'true') isActiveFilter = true;
    else if (isActiveParam === 'false') isActiveFilter = false;

    const filter: Record<string, unknown> = {};
    if (roleFilter) filter.role = roleFilter;
    if (isActiveFilter !== undefined) filter.isActive = isActiveFilter;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * pageSize;
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / pageSize) || 1;

    return res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users: users.map(toPublicUser),
        pagination: { page, pageSize, total, totalPages },
      },
    });
  } catch (err) {
    console.error('List users error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
});

router.get('/:id', isAuthenticated, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: toPublicUser(user),
    });
  } catch (err) {
    console.error('Get user error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
});

router.put('/:id', isAuthenticated, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body ?? {};
    const name = typeof body.name === 'string' ? body.name.trim() : undefined;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : undefined;
    const role = typeof body.role === 'string' && ROLES.includes(body.role) ? body.role : undefined;

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (role !== undefined) update.role = role;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: id } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
      }
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true }).select('-password').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: toPublicUser(user),
    });
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
});

router.patch('/:id/deactivate', isAuthenticated, authorize('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.id;

    if (id === currentUserId) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    }

    const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true }).select('-password').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      data: toPublicUser(user),
    });
  } catch (err) {
    console.error('Deactivate user error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
});

router.patch('/:id/activate', isAuthenticated, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(id, { isActive: true }, { new: true }).select('-password').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'User activated successfully',
      data: toPublicUser(user),
    });
  } catch (err) {
    console.error('Activate user error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong' });
  }
});

module.exports = router;
