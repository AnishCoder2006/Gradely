import mongoose, { Schema, Document } from 'mongoose';

export type FeeType = 'tuition' | 'exam' | 'library' | 'hostel' | 'miscellaneous';

export interface IFee extends Document {
  title: string;
  feeType: FeeType;
  amount: number;       // in INR (not paise)
  dueDate: Date;
  description: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FeeSchema = new Schema<IFee>(
  {
    title:       { type: String, required: true, trim: true },
    feeType:     { type: String, enum: ['tuition', 'exam', 'library', 'hostel', 'miscellaneous'], required: true },
    amount:      { type: Number, required: true, min: 1 },
    dueDate:     { type: Date, required: true },
    description: { type: String, required: true, trim: true },
    isActive:    { type: Boolean, default: true },
    createdBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, versionKey: false }
);

FeeSchema.index({ isActive: 1, dueDate: 1 });

export default mongoose.model<IFee>('Fee', FeeSchema);
