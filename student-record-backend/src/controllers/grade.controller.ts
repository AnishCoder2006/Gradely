import { Request, Response, NextFunction } from 'express';
import Grade from '../models/Grade';
import Student from '../models/Student';
import { calculateSGPA, calculateCGPA } from '../utils/gradeUtils';
import { AuthRequest } from '../middleware/auth.middleware';
import { writeAuditLog } from '../services/audit.service';


export class GradeController {

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filter: Record<string, unknown> = {};
      if (req.user?.role === 'student') {
        const student = await Student.findOne({ userId: req.user.id });
        if (!student) { res.status(200).json({ success: true, data: [], message: 'Grades fetched successfully' }); return; }
        filter.studentId = student._id;
      }
      const grades = await Grade.find(filter)
        .populate('studentId', 'name email')
        .populate('courseId', 'name code credits')
        .sort({ createdAt: -1 });

      const data = grades.map(g => ({
        _id: g._id,
        studentId: (g.studentId as any)._id ?? g.studentId,
        studentName: (g.studentId as any).name ?? '',
        courseId: (g.courseId as any)._id ?? g.courseId,
        courseName: (g.courseId as any).name ?? '',
        courseCode: (g.courseId as any).code ?? '',
        examType: g.examType,
        grade: g.grade,
        score: g.score,
        semester: g.semester,
        remarks: g.remarks,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      }));

      res.status(200).json({ success: true, data, message: 'Grades fetched successfully' });
    } catch (error) { next(error); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const grade = await Grade.findById(req.params.id)
        .populate('studentId', 'name email')
        .populate('courseId', 'name code');
      if (!grade) { res.status(404).json({ success: false, message: 'Grade not found' }); return; }
      res.status(200).json({ success: true, data: grade });
    } catch (error) { next(error); }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { studentId, courseId, examType, grade, score, semester, remarks } = req.body;

      if (!studentId || !courseId || !examType || !grade || score === undefined || !semester) {
        res.status(400).json({
          success: false,
          message: 'studentId, courseId, examType, grade, score and semester are required',
        });
        return;
      }

      if (!['cie', 'see'].includes(examType)) {
        res.status(400).json({ success: false, message: 'examType must be either "cie" or "see"' });
        return;
      }

      if (req.user?.role === 'teacher') {
        const Course = (await import('../models/Course')).default;
        const course = await Course.findById(courseId);
        if (!course) {
          res.status(404).json({ success: false, message: 'Course not found' });
          return;
        }
        if (String(course.instructorId) !== String(req.user.id)) {
          res.status(403).json({
            success: false,
            message: 'You can only add grades for your own courses',
          });
          return;
        }
      }

      const newGrade = await Grade.create({
        studentId, courseId, examType, grade, score, semester, remarks,
      });

      if (examType === 'see') {
        await recalculateStudentGPA(String(studentId));
      }

      await writeAuditLog({
        actorId: req.user?.id,
        actorRole: req.user?.role,
        action: 'grade.created',
        entity: 'grade',
        entityId: String(newGrade._id),
        metadata: { studentId: String(studentId), courseId: String(courseId), examType, grade, score, semester },
      });

      res.status(201).json({ success: true, data: newGrade, message: 'Grade created successfully' });
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(409).json({
          success: false,
          message: 'A grade already exists for this student, course, semester and exam type. Edit it instead.',
        });
        return;
      }
      next(error);
    }
  }

  // ── FIXED: added ownership check. Previously any authenticated
  //    teacher could update ANY grade regardless of which course it
  //    belonged to. ──
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const existing = await Grade.findById(req.params.id);
      if (!existing) { res.status(404).json({ success: false, message: 'Grade not found' }); return; }

      if (req.user?.role === 'teacher') {
        const Course = (await import('../models/Course')).default;
        const course = await Course.findById(existing.courseId);
        if (!course || String(course.instructorId) !== String(req.user.id)) {
          res.status(403).json({
            success: false,
            message: 'You can only edit grades for your own courses',
          });
          return;
        }
      }

      const grade = await Grade.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!grade) { res.status(404).json({ success: false, message: 'Grade not found' }); return; }

      if (grade.examType === 'see') {
        await recalculateStudentGPA(String(grade.studentId));
      }

      await writeAuditLog({
        actorId: req.user?.id,
        actorRole: req.user?.role,
        action: 'grade.updated',
        entity: 'grade',
        entityId: String(grade._id),
        metadata: { changedFields: Object.keys(req.body) },
      });

      res.status(200).json({ success: true, data: grade, message: 'Grade updated successfully' });
    } catch (error) { next(error); }
  }

  // ── FIXED: same ownership check added for delete. ──
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const existing = await Grade.findById(req.params.id);
      if (!existing) { res.status(404).json({ success: false, message: 'Grade not found' }); return; }

      if (req.user?.role === 'teacher') {
        const Course = (await import('../models/Course')).default;
        const course = await Course.findById(existing.courseId);
        if (!course || String(course.instructorId) !== String(req.user.id)) {
          res.status(403).json({
            success: false,
            message: 'You can only delete grades for your own courses',
          });
          return;
        }
      }

      const grade = await Grade.findByIdAndDelete(req.params.id);
      if (!grade) { res.status(404).json({ success: false, message: 'Grade not found' }); return; }

      if (grade.examType === 'see') {
        await recalculateStudentGPA(String(grade.studentId));
      }

      await writeAuditLog({
        actorId: req.user?.id,
        actorRole: req.user?.role,
        action: 'grade.deleted',
        entity: 'grade',
        entityId: String(grade._id),
        metadata: { studentId: String(grade.studentId), courseId: String(grade.courseId), semester: grade.semester },
      });

      res.status(200).json({ success: true, message: 'Grade deleted successfully' });
    } catch (error) { next(error); }
  }
}

async function recalculateStudentGPA(studentId: string) {
  const seeGrades = await Grade.find({ studentId, examType: 'see' })
    .populate('courseId', 'credits');

  if (seeGrades.length === 0) {
    await Student.findByIdAndUpdate(studentId, { gpa: 0 });
    return;
  }

  const bySemester: Record<string, { grade: string; credits: number }[]> = {};
  for (const g of seeGrades) {
    const sem = g.semester;
    if (!bySemester[sem]) bySemester[sem] = [];
    bySemester[sem].push({
      grade: g.grade,
      credits: (g.courseId as any)?.credits ?? 3,
    });
  }

  const sgpaList = Object.values(bySemester).map(calculateSGPA);
  const cgpa = calculateCGPA(sgpaList);

  await Student.findByIdAndUpdate(studentId, { gpa: cgpa });
}

export const gradeController = new GradeController();