import { NextFunction, Response } from 'express';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth.middleware';

export class AuditLogController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
      const filter: Record<string, string> = {};

      if (typeof req.query.action === 'string') filter.action = req.query.action;
      if (typeof req.query.entity === 'string') filter.entity = req.query.entity;
      if (typeof req.query.actorId === 'string') filter.actorId = req.query.actorId;

      const [logs, total] = await Promise.all([
        AuditLog.find(filter)
          .populate('actorId', 'name email role')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        AuditLog.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        data: logs,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const auditLogController = new AuditLogController();
