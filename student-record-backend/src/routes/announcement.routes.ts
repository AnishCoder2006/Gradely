import { Router } from 'express';
import { announcementController } from '../controllers/announcement.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { announcementLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.use(protect);

router.get('/',    announcementController.getAll.bind(announcementController));
router.post('/',   restrictTo('admin', 'teacher'), announcementLimiter, announcementController.create.bind(announcementController));
router.delete('/:id', restrictTo('admin', 'teacher'), announcementController.delete.bind(announcementController));

export default router;