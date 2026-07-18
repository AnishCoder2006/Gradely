import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  message: string;
  postedBy: mongoose.Types.ObjectId;
  postedByName: string;
  postedByRole: 'admin' | 'teacher';
  priority: 'normal' | 'important' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title:        { type: String, required: true, trim: true, maxlength: 150 },
    message:      { type: String, required: true, trim: true, maxlength: 2000 },
    postedBy:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    postedByName: { type: String, required: true },
    postedByRole: { type: String, enum: ['admin', 'teacher'], required: true },
    priority:     { type: String, enum: ['normal', 'important', 'urgent'], default: 'normal' },
  },
  { timestamps: true, versionKey: false }
);

AnnouncementSchema.index({ createdAt: -1 });

export default mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);