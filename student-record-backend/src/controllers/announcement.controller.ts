import { Response, NextFunction } from 'express';
import Announcement from '../models/Announcement';
import { AuthRequest } from '../middleware/auth.middleware';
import { getIO } from '../socket';

export class AnnouncementController {

  async getAll(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const announcements = await Announcement.find().sort({ createdAt: -1 }).limit(100);
      res.status(200).json({ success: true, data: announcements });
    } catch (error) { next(error); }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, message, priority } = req.body;

      if (!title?.trim() || !message?.trim()) {
        res.status(400).json({ success: false, message: 'Title and message are required' });
        return;
      }

      const announcement = await Announcement.create({
        title:        title.trim(),
        message:      message.trim(),
        postedBy:     req.user!.id,
        postedByName: req.user!.name ?? 'Staff', // now reliably populated by auth middleware
        postedByRole: req.user!.role,
        priority:     priority ?? 'normal',
      });

      getIO().to('announcements').emit('announcement:new', announcement);

      res.status(201).json({ success: true, data: announcement, message: 'Announcement posted' });
    } catch (error) { next(error); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const announcement = await Announcement.findByIdAndDelete(req.params.id);
      if (!announcement) {
        res.status(404).json({ success: false, message: 'Announcement not found' });
        return;
      }
      getIO().to('announcements').emit('announcement:deleted', { _id: req.params.id });
      res.status(200).json({ success: true, message: 'Announcement deleted' });
    } catch (error) { next(error); }
  }
}

export const announcementController = new AnnouncementController();