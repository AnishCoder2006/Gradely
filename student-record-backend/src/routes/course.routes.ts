import { Router } from 'express';
import { courseController } from '../controllers/course.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

// ── Collection ──
router.get('/',   courseController.getAll.bind(courseController));
router.post('/',  restrictTo('admin'), courseController.create.bind(courseController));

// ── Specific sub-routes BEFORE /:id param ──
router.post('/request', restrictTo('teacher'), courseController.requestCourse.bind(courseController));

router.patch('/:id/approve',       restrictTo('admin'), courseController.approveCourse.bind(courseController));
router.patch('/:id/reject',        restrictTo('admin'), courseController.rejectCourse.bind(courseController));
router.patch('/:id/assign-teacher',restrictTo('admin'), courseController.assignTeacher.bind(courseController));

router.post('/:id/enroll',   restrictTo('admin', 'teacher'), courseController.enrollStudent.bind(courseController));
router.delete('/:id/enroll', restrictTo('admin', 'teacher'), courseController.unenrollStudent.bind(courseController));
router.get('/:id/students',  courseController.getEnrolledStudents.bind(courseController));

// ── Single resource ──
router.get('/:id',    courseController.getById.bind(courseController));
router.put('/:id',    restrictTo('admin'), courseController.update.bind(courseController));
router.delete('/:id', restrictTo('admin'), courseController.delete.bind(courseController));

export default router;