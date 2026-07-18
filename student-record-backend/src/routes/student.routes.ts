import { Router } from 'express';
import { studentController } from '../controllers/student.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

// GET / and GET /:id are role-filtered INSIDE the controller
// (students see only their own data), so no restrictTo() here.
router.get('/',    studentController.getAll.bind(studentController));
router.get('/:id', studentController.getById.bind(studentController));

// Any authenticated user can call POST / — the controller forces
// a student's own userId, so they can only ever create their own record.
router.post('/', studentController.create.bind(studentController));

// PUT is allowed for student (their own record, enforced in controller)
// and admin (any record). Teacher is excluded — teachers manage grades/
// attendance, not student personal records.
router.put('/:id', studentController.update.bind(studentController));

// Delete and status changes are destructive — admin only.
router.delete('/:id',        restrictTo('admin'), studentController.delete.bind(studentController));
router.patch('/:id/status',  restrictTo('admin'), studentController.updateStatus.bind(studentController));

export default router;