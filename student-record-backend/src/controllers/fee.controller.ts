import { Response } from 'express';
import Fee from '../models/Fee';
import { AuthRequest } from '../middleware/auth.middleware';

// ─── POST /api/fees  (admin) ──────────────────────────────────────────────────
export const createFee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, feeType, amount, dueDate, description } = req.body;

    if (!title || !feeType || !amount || !dueDate || !description) {
      res.status(400).json({ success: false, message: 'All fields are required.' });
      return;
    }

    const fee = await Fee.create({
      title, feeType, amount: Number(amount), dueDate: new Date(dueDate),
      description, isActive: true, createdBy: req.user!.id,
    });

    res.status(201).json({ success: true, data: fee });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/fees  (admin + student) ────────────────────────────────────────
export const getFees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const showAll = req.user!.role === 'admin'; // admin sees all; student sees only active
    const filter  = showAll ? {} : { isActive: true };
    const fees    = await Fee.find(filter)
      .populate('createdBy', 'name')
      .sort({ dueDate: 1 });

    res.json({ success: true, data: fees });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/fees/:id  (admin) ───────────────────────────────────────────────
export const updateFee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!fee) { res.status(404).json({ success: false, message: 'Fee not found.' }); return; }
    res.json({ success: true, data: fee });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE /api/fees/:id  (admin) ───────────────────────────────────────────
export const deleteFee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fee = await Fee.findByIdAndDelete(req.params.id);
    if (!fee) { res.status(404).json({ success: false, message: 'Fee not found.' }); return; }
    res.json({ success: true, message: 'Fee deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
