import { Request, Response, NextFunction } from 'express';
import Attendance from '../models/Attendance';
import Student from '../models/Student';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';

export class AttendanceController {

  // GET /api/attendance?courseId=&date=&studentId=
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { courseId, date, studentId } = req.query;
      const filter: any = {};

      if (courseId)   filter.courseId = courseId;
      if (studentId)  filter.studentId = studentId;
      if (date) {
        const d = new Date(date as string);
        filter.date = {
          $gte: new Date(d.setHours(0,0,0,0)),
          $lte: new Date(d.setHours(23,59,59,999)),
        };
      }

      // Students only see their own attendance
      if (req.user?.role === 'student') {
        const user = await User.findById(req.user.id);
        if (!user) {
          res.status(404).json({ success: false, message: 'User record not found' });
          return;
        }
        const student = await Student.findOne({ email: user.email });
        if (!student) {
          res.status(404).json({ success: false, message: 'Student record not found' });
          return;
        }
        filter.studentId = student._id;
      }

      const attendance = await Attendance.find(filter)
        .populate('studentId', 'name email')
        .populate('courseId', 'name code')
        .sort({ date: -1 });

      const data = attendance.map(a => ({
        _id:         a._id,
        studentId:   (a.studentId as any)._id,
        studentName: (a.studentId as any).name ?? '',
        courseId:    (a.courseId as any)._id,
        courseName:  (a.courseId as any).name ?? '',
        courseCode:  (a.courseId as any).code ?? '',
        date:        a.date,
        status:      a.status,
        remarks:     a.remarks,
      }));

      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/attendance/mark — teacher marks attendance for a class
  async mark(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { courseId, date, records } = req.body;
      // records: [{ studentId, status, remarks? }]

      if (!courseId || !date || !records?.length) {
        res.status(400).json({
          success: false,
          message: 'courseId, date and records are required',
        });
        return;
      }

      const d = new Date(date);
      const results = [];

      for (const record of records) {
        const existing = await Attendance.findOne({
          studentId: record.studentId,
          courseId,
          date: {
            $gte: new Date(new Date(d).setHours(0,0,0,0)),
            $lte: new Date(new Date(d).setHours(23,59,59,999)),
          },
        });

        if (existing) {
          existing.status  = record.status;
          existing.remarks = record.remarks;
          await existing.save();
          results.push(existing);
        } else {
          const entry = await Attendance.create({
            studentId: record.studentId,
            courseId,
            date: d,
            status: record.status,
            remarks: record.remarks,
            markedBy: req.user!.id,
          });
          results.push(entry);
        }
      }

      res.status(200).json({
        success: true,
        data: results,
        message: `Attendance marked for ${results.length} students`,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/attendance/summary/:studentId
  async summary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      let studentId = req.params.studentId;

      // Student can only see their own summary
      if (req.user?.role === 'student') {
        const user = await User.findById(req.user.id);
        if (!user) {
          res.status(404).json({ success: false, message: 'User record not found' });
          return;
        }
        const student = await Student.findOne({ email: user.email });
        if (!student) {
          res.status(404).json({ success: false, message: 'Student record not found' });
          return;
        }
        studentId = String(student._id);
      }

      const records = await Attendance.find({ studentId })
        .populate('courseId', 'name code');

      // Group by course
      const grouped: Record<string, any> = {};
      for (const r of records) {
        const cid = String((r.courseId as any)._id);
        if (!grouped[cid]) {
          grouped[cid] = {
            courseId:   cid,
            courseName: (r.courseId as any).name,
            courseCode: (r.courseId as any).code,
            total: 0, present: 0, absent: 0, late: 0,
          };
        }
        grouped[cid].total++;
        grouped[cid][r.status]++;
      }

      const summary = Object.values(grouped).map(g => ({
        ...g,
        percentage: g.total > 0
          ? Math.round(((g.present + g.late) / g.total) * 100)
          : 0,
      }));

      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
}

export const attendanceController = new AttendanceController();