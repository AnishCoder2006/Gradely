import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  userId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  address: string;
  enrollmentDate: Date;
  status: 'pending' | 'active' | 'inactive' | 'graduated';
  courseIds: string[];
  gpa?: number;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    address: { type: String, required: true },
    enrollmentDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'active', 'inactive', 'graduated'],
      default: 'pending', // ✅ was 'active' — now requires admin approval
    },
    courseIds: [{ type: String }],
    gpa: { type: Number, min: 0, max: 4.0 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

StudentSchema.index({ name: 1, email: 1 });

export default mongoose.model<IStudent>('Student', StudentSchema);