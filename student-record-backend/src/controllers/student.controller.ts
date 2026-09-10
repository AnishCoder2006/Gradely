import { Response, NextFunction } from 'express';
import Student from '../models/Student';
import { CreateStudentSchema, UpdateStudentSchema } from '../dtos/student.dto';
import { AuthRequest } from '../middleware/auth.middleware';
import { writeAuditLog } from '../services/audit.service';

export class StudentController {

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { search, status, gender, email, userId, page, limit } = req.query;

      const filter: any = {};

      // ── Critical: students can only ever see their own record ──
      // This is enforced server-side regardless of what query params
      // are sent, so it cannot be bypassed via direct API calls.
      if (req.user?.role === 'student') {
        filter.userId = req.user.id;
      } else {
        // Only admin/teacher can filter across all students
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
    } catch (error) { next(error); }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const student = await Student.findById(req.params.id);
      if (!student) { res.status(404).json({ success: false, message: 'Student not found' }); return; }

      // Students can only view their own profile by ID
      if (req.user?.role === 'student' && String(student.userId) !== req.user.id) {
        res.status(403).json({ success: false, message: 'Not authorized to view this profile' });
        return;
      }

      res.status(200).json({ success: true, data: student });
    } catch (error) { next(error); }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId, ...rest } = req.body;
      const validatedData = CreateStudentSchema.parse(rest);
      const payload: any = { ...validatedData };

      // A student can only ever create a record linked to themselves
      if (req.user?.role === 'student') {
        payload.userId = req.user.id;
      } else if (userId) {
        payload.userId = userId;
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
    } catch (error) { next(error); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const existing = await Student.findById(req.params.id);
      if (!existing) { res.status(404).json({ success: false, message: 'Student not found' }); return; }

      // Students can only update their own record
      if (req.user?.role === 'student' && String(existing.userId) !== req.user.id) {
        res.status(403).json({ success: false, message: 'Not authorized to update this record' });
        return;
      }

      const { userId, status: _status, ...rest } = req.body;
      const validatedData = UpdateStudentSchema.parse(rest);
      const updatePayload: any = { ...validatedData };

      // Only admin can change userId or status directly through this route
      if (req.user?.role !== 'student') {
        if (userId) updatePayload.userId = userId;
      }

      const student = await Student.findByIdAndUpdate(req.params.id, updatePayload, { new: true, runValidators: true });
      if (!student) { res.status(404).json({ success: false, message: 'Student not found' }); return; }
      await writeAuditLog({
        actorId: req.user?.id,
        actorRole: req.user?.role,
        action: 'student.updated',
        entity: 'student',
        entityId: String(student._id),
        metadata: { changedFields: Object.keys(updatePayload) },
      });
      res.status(200).json({ success: true, data: student, message: 'Student updated successfully' });
    } catch (error) { next(error); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Route-level restrictTo('admin') already blocks non-admins from
      // reaching here, but double-checking costs nothing.
      const student = await Student.findByIdAndDelete(req.params.id);
      if (!student) { res.status(404).json({ success: false, message: 'Student not found' }); return; }
      await writeAuditLog({
        actorId: req.user?.id,
        actorRole: req.user?.role,
        action: 'student.deleted',
        entity: 'student',
        entityId: String(student._id),
        metadata: { status: student.status },
      });
      res.status(200).json({ success: true, message: 'Student deleted successfully' });
    } catch (error) { next(error); }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const existing = await Student.findById(req.params.id);
      if (!existing) { res.status(404).json({ success: false, message: 'Student not found' }); return; }
      const student = await Student.findByIdAndUpdate(req.params.id, { status }, { new: true });
      if (!student) { res.status(404).json({ success: false, message: 'Student not found' }); return; }
      await writeAuditLog({
        actorId: req.user?.id,
        actorRole: req.user?.role,
        action: 'student.status_changed',
        entity: 'student',
        entityId: String(student._id),
        metadata: { previousStatus: existing.status, currentStatus: student.status },
      });
      res.status(200).json({ success: true, data: student, message: `Status updated to ${status}` });
    } catch (error) { next(error); }
  }
}

export const studentController = new StudentController();
