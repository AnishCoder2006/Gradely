import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Student from '../models/Student';

export class UserController {

  // GET /api/users?role=teacher|student
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.query;
      const filter: any = {};
      if (role) filter.role = role;

      const users = await User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 });

      // For students, also attach their student record status
      if (role === 'student') {
        const studentRecords = await Student.find({});
        const data = users.map(u => {
          const record = studentRecords.find(
            s => String(s.userId) === String(u._id) ||
              s.email === u.email
          );
          return {
            _id: String(u._id),
            name: u.name,
            email: u.email,
            role: u.role,
            isActive: u.isActive,
            createdAt: u.createdAt,
            studentRecord: record ? {
              _id: String(record._id),
              status: record.status,
              phone: record.phone,
              gender: record.gender,
            } : null,
          };
        });
        res.status(200).json({ success: true, data });
        return;
      }

      res.status(200).json({
        success: true,
        data: users.map(u => ({
          _id: String(u._id),
          name: u.name,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
          createdAt: u.createdAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/users/:id/status
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const isActive = typeof req.body.isActive === 'boolean'
        ? req.body.isActive
        : req.body.status === 'active';
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive },
        { new: true }
      ).select('-password');

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // If activating a student user, also set their student record to active
      if (user.role === 'student' && isActive) {
        await Student.findOneAndUpdate(
          { $or: [{ userId: user._id }, { email: user.email }] },
          { status: 'active' }
        );
      }

      // If deactivating, set student record to inactive
      if (user.role === 'student' && !isActive) {
        await Student.findOneAndUpdate(
          { $or: [{ userId: user._id }, { email: user.email }] },
          { status: 'inactive' }
        );
      }

      res.status(200).json({
        success: true,
        data: user,
        message: `User ${isActive ? 'approved' : 'rejected'} successfully`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();