import { Router } from 'express';
import { attendanceController } from '../controllers/attendance.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

// All routes require login
router.use(protect);

router.get('/',                      attendanceController.getAll.bind(attendanceController));
router.get('/summary/:studentId',    attendanceController.summary.bind(attendanceController));
router.post('/mark', restrictTo('teacher', 'admin'), attendanceController.mark.bind(attendanceController));

export default router; 