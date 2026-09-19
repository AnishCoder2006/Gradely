import { Response, NextFunction } from 'express';
import Student from '../models/Student';
import User from '../models/User';
import { CreateStudentSchema, UpdateStudentSchema } from '../dtos/student.dto';
import { AuthRequest } from '../middleware/auth.middleware';
import { writeAuditLog } from '../services/audit.service';

export class StudentController {

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { search, status, gender, email, userId, page, limit } = req.query;
      const filter: any = {};

      if (req.user?.role === 'student') {
        filter.userId = req.user.id;
      } else {
        if (search) {
          filter.$or = [
            { name: { $regex: search as string, $options: 'i' } },
            { email: { $regex: search as string, $options: 'i' } },
          ];
        }
        if (status) filter.status = status;
        if (gender) filter.gender = gender;
        if (email) filter.email = (email as string).toLowerCase();
        if (userId) filter.userId = userId;
      }

      if (page || limit) {
        const pageNum = Math.max(1, parseInt(page as string) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit as string) || 10));
        const skip = (pageNum - 1) * limitNum;

        const [students, total] = await Promise.all([
          Student.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
          Student.countDocuments(filter),
        ]);

        res.status(200).json({
          success: true,
          data: students,
          pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
        return;
      }

      const students = await Student.find(filter).sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: students, message: 'Students fetched successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const student = await Student.findById(req.params.id);
      if (!student) {
        res.status(404).json({ success: false, message: 'Student not found' });
        return;
      }

      if (req.user?.role === 'student' && String(student.userId) !== req.user.id) {
        res.status(403).json({ success: false, message: 'Not authorized to view this profile' });
        return;
      }

      res.status(200).json({ success: true, data: student });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId, ...rest } = req.body;
      const validatedData = CreateStudentSchema.parse(rest);
      const payload: any = { ...validatedData };

      if (req.user?.role === 'student') {
        payload.userId = req.user.id;
      } else if (userId) {
        payload.userId = userId;
      }

      if (payload.userId) {
        const userRecord = await User.findById(payload.userId);
        if (userRecord && userRecord.isActive) {
          payload.status = 'active';
        }
      }

      // If a placeholder Student record already exists for this user
      // (auto-created at registration), update it in place rather than
      // creating a duplicate — `email` has a unique index, so a second
      // Student.create() call with the same email always throws 11000.
      if (payload.userId) {
        const existing = await Student.findOne({ userId: payload.userId });
        if (existing) {
          const updated = await Student.findByIdAndUpdate(
            existing._id,
            payload,
            { new: true, runValidators: true }
          );
          await writeAuditLog({
            actorId: req.user?.id,
            actorRole: req.user?.role,
            action: 'student.profile_completed',
            entity: 'student',
            entityId: String(updated!._id),
            metadata: { status: updated!.status },
          });
          res.status(200).json({ success: true, data: updated, message: 'Student profile updated successfully' });
          return;
        }
      }

      const student = await Student.create(payload);
      await writeAuditLog({
        actorId: req.user?.id,
        actorRole: req.user?.role,
        action: 'student.created',
        entity: 'student',
        entityId: String(student._id),
        metadata: { status: student.status },
      });
      res.status(201).json({ success: true, data: student, message: 'Student created successfully' });
    } catch (error: any) {
      // Zod validation errors (e.g. address under 5 chars) surface as a
      // clean 400 with field-level detail instead of a generic 500.
      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((e: any) => ({ field: e.path.join('.'), message: e.message })),
        });
        return;
      }
      if (error.code === 11000) {
        res.status(409).json({
          success: false,
          message: 'A profile already exists for this account. Try refreshing the page.',
        });
        return;
      }
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const existing = await Student.findById(req.params.id);
      if (!existing) {
        res.status(404).json({ success: false, message: 'Student not found' });
        return;
      }

      if (req.user?.role === 'student' && String(existing.userId) !== req.user.id) {
        res.status(403).json({ success: false, message: 'Not authorized to update this record' });
        return;
      }

      const { userId, status: _status, ...rest } = req.body;
      const validatedData = UpdateStudentSchema.parse(rest);
      const updatePayload: any = { ...validatedData };

      if (req.user?.role !== 'student') {
        if (userId) updatePayload.userId = userId;
      }

      const student = await Student.findByIdAndUpdate(req.params.id, updatePayload, { new: true, runValidators: true });
      if (!student) {
        res.status(404).json({ success: false, message: 'Student not found' });
        return;
      }
      await writeAuditLog({
        actorId: req.user?.id,
        actorRole: req.user?.role,
        action: 'student.updated',
        entity: 'student',
        entityId: String(student._id),
        metadata: { changedFields: Object.keys(updatePayload) },
      });
      res.status(200).json({ success: true, data: student, message: 'Student updated successfully' });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((e: any) => ({ field: e.path.join('.'), message: e.message })),
        });
        return;
      }
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const student = await Student.findByIdAndDelete(req.params.id);
      if (!student) {
        res.status(404).json({ success: false, message: 'Student not found' });
        return;
      }
      await writeAuditLog({
        actorId: req.user?.id,
        actorRole: req.user?.role,
        action: 'student.deleted',
        entity: 'student',
        entityId: String(student._id),
        metadata: { status: student.status },
      });
      res.status(200).json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const existing = await Student.findById(req.params.id);
      if (!existing) {
        res.status(404).json({ success: false, message: 'Student not found' });
        return;
      }
      const student = await Student.findByIdAndUpdate(req.params.id, { status }, { new: true });
      if (!student) {
        res.status(404).json({ success: false, message: 'Student not found' });
        return;
      }
      await writeAuditLog({
        actorId: req.user?.id,
        actorRole: req.user?.role,
        action: 'student.status_changed',
        entity: 'student',
        entityId: String(student._id),
        metadata: { previousStatus: existing.status, currentStatus: student.status },
      });
      res.status(200).json({ success: true, data: student, message: `Status updated to ${status}` });
    } catch (error) {
      next(error);
    }
  }

  // ── NEW: student explicitly submits their completed profile for admin
  //    review. Moves status from 'draft' -> 'pending'. This is what
  //    actually makes them visible in AdminStudentApprovePage's queue —
  //    students who haven't reached this step never show up for admin
  //    to (mistakenly) approve with an incomplete profile. ──
  async submitForApproval(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const student = await Student.findById(req.params.id);
      if (!student) {
        res.status(404).json({ success: false, message: 'Student not found' });
        return;
      }

      if (req.user?.role === 'student' && String(student.userId) !== req.user.id) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
      }

      if (student.status !== 'draft') {
        res.status(400).json({ success: false, message: 'Profile has already been submitted' });
        return;
      }

      // Guard against submitting with placeholder/incomplete data
      if (
        !student.phone || student.phone === 'N/A' ||
        !student.address || student.address === 'Pending' || student.address.length < 5
      ) {
        res.status(400).json({ success: false, message: 'Please complete your profile before submitting' });
        return;
      }

      student.status = 'pending';
      await student.save();

      await writeAuditLog({
        actorId: req.user?.id,
        actorRole: req.user?.role,
        action: 'student.submitted_for_approval',
        entity: 'student',
        entityId: String(student._id),
        metadata: {},
      });

      res.status(200).json({ success: true, data: student, message: 'Submitted for admin approval' });
    } catch (error) {
      next(error);
    }
  }
}

export const studentController = new StudentController();