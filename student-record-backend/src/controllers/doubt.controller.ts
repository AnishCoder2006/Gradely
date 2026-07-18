import { Response, NextFunction } from 'express';
import Doubt from '../models/Doubt';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';
import { getIO } from '../socket';

export class DoubtController {

  // GET /api/doubts — student sees their own, teacher sees ones assigned/unassigned to them
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filter: any = {};
      if (req.user!.role === 'student') {
        filter.studentId = req.user!.id;
      }
      // Teachers see all open doubts + ones already assigned to them
      // (admin sees everything by default — no filter)

      const doubts = await Doubt.find(filter).sort({ lastMessageAt: -1 }).limit(200);
      res.status(200).json({ success: true, data: doubts });
    } catch (error) { next(error); }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doubt = await Doubt.findById(req.params.id);
      if (!doubt) {
        res.status(404).json({ success: false, message: 'Doubt not found' });
        return;
      }
      // Students can only view their own doubt
      if (req.user!.role === 'student' && String(doubt.studentId) !== req.user!.id) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
      }
      res.status(200).json({ success: true, data: doubt });
    } catch (error) { next(error); }
  }

  // POST /api/doubts — student creates a new doubt thread
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user!.role !== 'student') {
        res.status(403).json({ success: false, message: 'Only students can raise doubts' });
        return;
      }

      const { subject, text } = req.body;
      if (!subject?.trim() || !text?.trim()) {
        res.status(400).json({ success: false, message: 'Subject and message text are required' });
        return;
      }

      const student = await User.findById(req.user!.id);
      if (!student) {
        res.status(404).json({ success: false, message: 'Student not found' });
        return;
      }

      const doubt = await Doubt.create({
        studentId:   student._id,
        studentName: student.name,
        subject:     subject.trim(),
        status:      'open',
        messages: [{
          senderId:   student._id,
          senderName: student.name,
          senderRole: 'student',
          text:       text.trim(),
          createdAt:  new Date(),
        }],
        lastMessageAt: new Date(),
      });

      // Notify all teachers in real time that a new doubt was raised
      getIO().to('announcements').emit('doubt:new', doubt);

      res.status(201).json({ success: true, data: doubt, message: 'Doubt submitted' });
    } catch (error) { next(error); }
  }

  // POST /api/doubts/:id/reply — teacher or student adds a message to the thread
  async reply(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { text } = req.body;
      if (!text?.trim()) {
        res.status(400).json({ success: false, message: 'Message text is required' });
        return;
      }

      const doubt = await Doubt.findById(req.params.id);
      if (!doubt) {
        res.status(404).json({ success: false, message: 'Doubt not found' });
        return;
      }

      // Authorization: student must own the doubt; teacher must be assigned or doubt unassigned
      if (req.user!.role === 'student' && String(doubt.studentId) !== req.user!.id) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
      }

      const sender = await User.findById(req.user!.id);
      if (!sender) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // First teacher to reply claims the doubt
      if (req.user!.role === 'teacher' && !doubt.teacherId) {
        doubt.teacherId   = sender._id as any;
        doubt.teacherName = sender.name;
      }

      const message = {
        senderId:   sender._id as any,
        senderName: sender.name,
        senderRole: req.user!.role === 'teacher' ? 'teacher' as const : 'student' as const,
        text:       text.trim(),
        createdAt:  new Date(),
      };

      doubt.messages.push(message);
      doubt.lastMessageAt = new Date();
      doubt.status = req.user!.role === 'teacher' ? 'answered' : 'open';
      await doubt.save();

      // Real-time push to anyone viewing this thread
      getIO().to(`doubt:${doubt._id}`).emit('doubt:message', {
        doubtId: doubt._id,
        message,
        status: doubt.status,
        teacherId: doubt.teacherId,
        teacherName: doubt.teacherName,
      });

      res.status(200).json({ success: true, data: doubt, message: 'Reply sent' });
    } catch (error) { next(error); }
  }

  // PATCH /api/doubts/:id/close — teacher marks doubt resolved
  async close(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doubt = await Doubt.findByIdAndUpdate(
        req.params.id,
        { status: 'closed' },
        { new: true }
      );
      if (!doubt) {
        res.status(404).json({ success: false, message: 'Doubt not found' });
        return;
      }
      getIO().to(`doubt:${doubt._id}`).emit('doubt:statusChanged', { doubtId: doubt._id, status: 'closed' });
      res.status(200).json({ success: true, data: doubt, message: 'Doubt closed' });
    } catch (error) { next(error); }
  }
}

export const doubtController = new DoubtController();