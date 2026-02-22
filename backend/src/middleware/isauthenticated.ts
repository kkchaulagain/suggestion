import { Request, Response, NextFunction } from 'express';
const jwt = require('jsonwebtoken');

interface TokenPayload {
  userId: string;
  token?: string;
}


declare module 'express-serve-static-core' {
  interface Request {
    id?: string;
  }
}

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  try {
    const headerToken = (req.headers?.cookie ?? '')
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('token='))
      ?.split('=')[1];
    const authHeader = req.headers?.authorization ?? '';
    const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : undefined;
    const cookieToken = (req as Request & { cookies?: { token?: string } }).cookies?.token;
    const token = bearerToken || cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized access' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key') as TokenPayload;

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    req.id = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
