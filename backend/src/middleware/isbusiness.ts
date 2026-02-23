import { Request, Response, NextFunction } from 'express';
const User = require('../models/User');

interface AuthRequest extends Request {
  id?: string;
  user?: any;
  business?: any;
}

export const isBusinessRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'Unauthorized'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'Not found'
      });
    }

    if (user.role !== 'business') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Business account required.',
        error: 'Forbidden'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Business role middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Server error'
    });
  }
};
