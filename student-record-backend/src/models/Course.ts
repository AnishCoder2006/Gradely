import mongoose, { Schema, Document } from 'mongoose';

export type CourseStatus = 'pending' | 'active' | 'rejected';

export interface ICourse extends Document {
  name: string;
  code: string;
  description: string;
  credits: number;
  instructor: string;
  instructorId?: mongoose.Types.ObjectId;
  semester: string;
  maxStudents: number;
  enrolledStudents: number;
  status: CourseStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true, trim: true },
    // ✅ unique index handled inline
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, required: true },
    credits: { type: Number, required: true, min: 1, max: 10 },
    instructor: { type: String, required: true },
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      sparse: true, // optional index, no need to duplicate
    },
    semester: { type: String, required: true },
    maxStudents: { type: Number, required: true, min: 1 },
    enrolledStudents: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'active', 'rejected'],
      default: 'active', // admin-created courses are active immediately
    },
    rejectionReason: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ✅ Keep only useful indexes (compound or non-duplicate)
CourseSchema.index({ semester: 1 });
CourseSchema.index({ status: 1 });

export default mongoose.model<ICourse>('Course', CourseSchema);
