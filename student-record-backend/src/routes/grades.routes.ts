import { Router } from 'express';
import { gradeController } from '../controllers/grade.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/',       gradeController.getAll);
router.get('/:id',    gradeController.getById);
router.post('/',      restrictTo('admin', 'teacher'), gradeController.create);
router.put('/:id',    restrictTo('admin', 'teacher'), gradeController.update);
router.delete('/:id', restrictTo('admin', 'teacher'), gradeController.delete);

export default router;
