import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import logger from '../config/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export interface AuthRequest extends Request {
  user?: { id: string; role: string; name?: string };
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn({ event: 'auth_failure', method: req.method, path: req.path, reason: 'missing_token' }, 'authentication_failed');
      res.status(401).json({ success: false, message: 'Not authorised. No token.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };

    // Fetch the user's name so controllers don't need a fallback like 'Staff'
    const user = await User.findById(decoded.id).select('name role');
    if (!user) {
      logger.warn({ event: 'auth_failure', method: req.method, path: req.path, reason: 'user_not_found' }, 'authentication_failed');
      res.status(401).json({ success: false, message: 'User no longer exists.' });
      return;
    }

    req.user = { id: decoded.id, role: decoded.role, name: user.name };
    next();
  } catch (error) {
    logger.warn({ err: error, event: 'auth_failure', method: req.method, path: req.path, reason: 'invalid_token' }, 'authentication_failed');
    res.status(401).json({ success: false, message: 'Not authorised. Invalid token.' });
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      logger.warn({ event: 'auth_failure', method: req.method, path: req.path, reason: 'forbidden_role', role: req.user?.role, requiredRoles: roles }, 'authorization_failed');
      res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
      });
      return;
    }
    next();
  };
};