import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

// Admin only
router.get('/', restrictTo('admin'), userController.getAll);
router.patch('/:id/status', restrictTo('admin'), userController.updateStatus);

export default router;