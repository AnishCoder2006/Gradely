import { Router } from 'express';
import { gradeController } from '../controllers/grade.controller';

const router = Router();

router.get('/',       gradeController.getAll);
router.get('/:id',    gradeController.getById);
router.post('/',      gradeController.create);
router.put('/:id',    gradeController.update);
router.delete('/:id', gradeController.delete);

export default router;