import mongoose, { Schema, Document } from 'mongoose';

export type PaymentStatus = 'created' | 'paid' | 'failed' | 'refunded';

export interface IPayment extends Document {
  feeId: mongoose.Types.ObjectId;      // admin-created fee notice
  studentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  // Razorpay identifiers
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;

  amount: number;        // in paise
  currency: string;
  status: PaymentStatus;
  paidAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    feeId: { type: Schema.Types.ObjectId, ref: 'Fee', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    // ✅ unique index handled inline
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },

    status: { type: String, enum: ['created', 'paid', 'failed', 'refunded'], default: 'created' },
    paidAt: { type: Date },
  },
  { timestamps: true, versionKey: false }
);

// ✅ Keep compound index only
PaymentSchema.index({ studentId: 1, feeId: 1 });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
