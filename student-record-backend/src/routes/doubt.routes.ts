import { Router } from 'express';
import { doubtController } from '../controllers/doubt.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { doubtLimiter, doubtDailyLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.use(protect);

router.get('/',          doubtController.getAll.bind(doubtController));
router.get('/:id',       doubtController.getById.bind(doubtController));
router.post('/',         restrictTo('student'), doubtLimiter, doubtDailyLimiter, doubtController.create.bind(doubtController));
router.post('/:id/reply',doubtLimiter, doubtDailyLimiter, doubtController.reply.bind(doubtController));
router.patch('/:id/close', restrictTo('teacher', 'admin'), doubtController.close.bind(doubtController));

export default router;