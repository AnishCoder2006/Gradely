import mongoose, { Schema, Document } from 'mongoose';

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface IAttendance extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  date: Date;
  status: AttendanceStatus;
  markedBy: mongoose.Types.ObjectId;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      required: true,
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    remarks: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Prevent duplicate attendance for same student+course+date
AttendanceSchema.index({ studentId: 1, courseId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ courseId: 1, date: 1 });
AttendanceSchema.index({ studentId: 1 });

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);