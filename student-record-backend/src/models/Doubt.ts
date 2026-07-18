import mongoose, { Schema, Document } from 'mongoose';

export interface IDoubtMessage {
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  senderRole: 'student' | 'teacher';
  text: string;
  createdAt: Date;
}

export interface IDoubt extends Document {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  teacherId?: mongoose.Types.ObjectId;
  teacherName?: string;
  subject: string;
  status: 'open' | 'answered' | 'closed';
  messages: IDoubtMessage[];
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DoubtMessageSchema = new Schema<IDoubtMessage>(
  {
    senderId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, enum: ['student', 'teacher'], required: true },
    text:       { type: String, required: true, trim: true, maxlength: 1000 },
    createdAt:  { type: Date, default: Date.now },
  },
  { _id: false }
);

const DoubtSchema = new Schema<IDoubt>(
  {
    studentId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentName:  { type: String, required: true },
    teacherId:    { type: Schema.Types.ObjectId, ref: 'User' },
    teacherName:  { type: String },
    subject:      { type: String, required: true, trim: true, maxlength: 150 },
    status:       { type: String, enum: ['open', 'answered', 'closed'], default: 'open' },
    messages:     { type: [DoubtMessageSchema], default: [] },
    lastMessageAt:{ type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

DoubtSchema.index({ studentId: 1, lastMessageAt: -1 });
DoubtSchema.index({ teacherId: 1, lastMessageAt: -1 });
DoubtSchema.index({ status: 1 });

export default mongoose.model<IDoubt>('Doubt', DoubtSchema);