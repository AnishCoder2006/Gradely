import { Router } from 'express';
import { auditLogController } from '../controllers/auditLog.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

router.use(protect, restrictTo('admin'));
router.get('/', auditLogController.getAll.bind(auditLogController));

export default router;
