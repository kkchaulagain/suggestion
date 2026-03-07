import { Request, Response, NextFunction } from 'express';
const User = require('../models/User');

export interface AuthorizedRequest extends Request {
  id?: string;
  user?: { _id: unknown; role: string; isActive?: boolean };
}

export function authorize(...allowedRoles: string[]) {
  return async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'Unauthorized',
        });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'Not found',
        });
      }

      if (user.isActive === false) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated',
          error: 'Unauthorized',
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.',
          error: 'Forbidden',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Authorize middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Server error',
      });
    }
  };
}
