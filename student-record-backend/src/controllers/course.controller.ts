import { Request, Response, NextFunction } from 'express';
import Course from '../models/Course';
import Student from '../models/Student';
import User from '../models/User';
import { CreateCourseSchema, UpdateCourseSchema } from '../dtos/course.dto';
import { AuthRequest } from '../middleware/auth.middleware';

export class CourseController {

  // GET /api/courses
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { instructorId, status } = req.query;
      const filter: any = {};

      if (instructorId) filter.instructorId = instructorId;
      if (status)       filter.status = status;

      // Teachers only see their own courses
      if (req.user?.role === 'teacher') {
        filter.instructorId = req.user.id;
      }

      // Students only see active courses
      if (req.user?.role === 'student') {
        filter.status = 'active';
      }

      const courses = await Course.find(filter).sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: courses });
    } catch (error) { next(error); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) {
        res.status(404).json({ success: false, message: 'Course not found' });
        return;
      }
      res.status(200).json({ success: true, data: course });
    } catch (error) { next(error); }
  }

  // POST /api/courses — admin creates course (active immediately)
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = CreateCourseSchema.parse(req.body);
      const { instructorId } = req.body;

      const payload: any = { ...validatedData, status: 'active' };

      // If admin picked a teacher, link them
      if (instructorId) {
        const teacher = await User.findById(instructorId);
        if (teacher && teacher.role === 'teacher') {
          payload.instructorId = instructorId;
          payload.instructor   = teacher.name;
        }
      }

      const course = await Course.create(payload);
      res.status(201).json({ success: true, data: course, message: 'Course created successfully' });
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = UpdateCourseSchema.parse(req.body);
      const { instructorId } = req.body;

      const updatePayload: any = { ...validatedData };

      if (instructorId) {
        const teacher = await User.findById(instructorId);
        if (teacher && teacher.role === 'teacher') {
          updatePayload.instructorId = instructorId;
          updatePayload.instructor   = teacher.name;
        }
      }

      const course = await Course.findByIdAndUpdate(
        req.params.id, updatePayload, { new: true, runValidators: true }
      );
      if (!course) {
        res.status(404).json({ success: false, message: 'Course not found' });
        return;
      }
      res.status(200).json({ success: true, data: course, message: 'Course updated successfully' });
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const course = await Course.findByIdAndDelete(req.params.id);
      if (!course) {
        res.status(404).json({ success: false, message: 'Course not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Course deleted successfully' });
    } catch (error) { next(error); }
  }

  // POST /api/courses/request — teacher requests a course
  async requestCourse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, code, description, credits, semester, maxStudents } = req.body;

      if (!name || !code || !description || !credits || !semester) {
        res.status(400).json({ success: false, message: 'All fields are required' });
        return;
      }

      const teacher = await User.findById(req.user!.id);
      if (!teacher) {
        res.status(404).json({ success: false, message: 'Teacher not found' });
        return;
      }

      // Check if code already exists
      const existing = await Course.findOne({ code: code.toUpperCase() });
      if (existing) {
        res.status(409).json({ success: false, message: `Course code ${code.toUpperCase()} already exists` });
        return;
      }

      const course = await Course.create({
        name,
        code:         code.toUpperCase(),
        description,
        credits:      Number(credits),
        semester,
        maxStudents:  Number(maxStudents) || 60,
        instructor:   teacher.name,
        instructorId: teacher._id,
        status:       'pending', // awaits admin approval
      });

      res.status(201).json({
        success: true,
        data: course,
        message: 'Course request submitted. Awaiting admin approval.',
      });
    } catch (error) { next(error); }
  }

  // PATCH /api/courses/:id/approve — admin approves a course request
  async approveCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const course = await Course.findByIdAndUpdate(
        req.params.id,
        { status: 'active', rejectionReason: undefined },
        { new: true }
      );
      if (!course) {
        res.status(404).json({ success: false, message: 'Course not found' });
        return;
      }
      res.status(200).json({ success: true, data: course, message: `"${course.name}" approved` });
    } catch (error) { next(error); }
  }

  // PATCH /api/courses/:id/reject — admin rejects a course request
  async rejectCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      const course = await Course.findByIdAndUpdate(
        req.params.id,
        { status: 'rejected', rejectionReason: reason || 'No reason provided' },
        { new: true }
      );
      if (!course) {
        res.status(404).json({ success: false, message: 'Course not found' });
        return;
      }
      res.status(200).json({ success: true, data: course, message: `"${course.name}" rejected` });
    } catch (error) { next(error); }
  }

  // PATCH /api/courses/:id/assign-teacher — admin assigns teacher
  async assignTeacher(req: Request, res: Response, next: NextFunction) {
    try {
      const { teacherId } = req.body;

      const teacher = await User.findById(teacherId);
      if (!teacher || teacher.role !== 'teacher') {
        res.status(400).json({ success: false, message: 'Invalid teacher' });
        return;
      }

      const course = await Course.findByIdAndUpdate(
        req.params.id,
        { instructorId: teacherId, instructor: teacher.name },
        { new: true }
      );
      if (!course) {
        res.status(404).json({ success: false, message: 'Course not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: course,
        message: `${teacher.name} assigned to ${course.name}`,
      });
    } catch (error) { next(error); }
  }

  // POST /api/courses/:id/enroll
  async enrollStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.body;
      const courseId = req.params.id;

      const [course, student] = await Promise.all([
        Course.findById(courseId),
        Student.findById(studentId),
      ]);

      if (!course)   { res.status(404).json({ success: false, message: 'Course not found' });  return; }
      if (!student)  { res.status(404).json({ success: false, message: 'Student not found' }); return; }

      if (course.enrolledStudents >= course.maxStudents) {
        res.status(400).json({ success: false, message: 'Course is at full capacity' });
        return;
      }

      if (student.courseIds.includes(courseId)) {
        res.status(400).json({ success: false, message: 'Student already enrolled' });
        return;
      }

      await Promise.all([
        Student.findByIdAndUpdate(studentId, { $addToSet: { courseIds: courseId } }),
        Course.findByIdAndUpdate(courseId, { $inc: { enrolledStudents: 1 } }),
      ]);

      res.status(200).json({ success: true, message: `${student.name} enrolled in ${course.name}` });
    } catch (error) { next(error); }
  }

  // DELETE /api/courses/:id/enroll
  async unenrollStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.body;
      const courseId = req.params.id;

      await Promise.all([
        Student.findByIdAndUpdate(studentId, { $pull: { courseIds: courseId } }),
        Course.findByIdAndUpdate(courseId, { $inc: { enrolledStudents: -1 } }),
      ]);

      res.status(200).json({ success: true, message: 'Student unenrolled successfully' });
    } catch (error) { next(error); }
  }

  // GET /api/courses/:id/students
  async getEnrolledStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const students = await Student.find({ courseIds: req.params.id });
      res.status(200).json({ success: true, data: students });
    } catch (error) { next(error); }
  }
}

export const courseController = new CourseController();