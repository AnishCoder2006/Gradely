import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import {
  createOrder,
  verifyPayment,
  getMyPayments,
  getAllPayments,
  getPaymentStats,
} from '../controllers/payment.controller';

const router = Router();

// All routes require authentication
router.use(protect);

// Student routes
router.post('/create-order', restrictTo('student'), createOrder);
router.post('/verify',       restrictTo('student'), verifyPayment);
router.get('/my',            restrictTo('student'), getMyPayments);

// Admin/teacher routes
router.get('/stats', restrictTo('admin'), getPaymentStats);
router.get('/',      restrictTo('admin', 'teacher'), getAllPayments);

export default router;
