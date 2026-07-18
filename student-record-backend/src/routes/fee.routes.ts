import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { createFee, getFees, updateFee, deleteFee } from '../controllers/fee.controller';

const router = Router();
router.use(protect);

// Admin can create/update/delete; admin + student can list
router.get('/',       restrictTo('admin', 'student'), getFees);
router.post('/',      restrictTo('admin'),            createFee);
router.put('/:id',    restrictTo('admin'),            updateFee);
router.delete('/:id', restrictTo('admin'),            deleteFee);

export default router;
