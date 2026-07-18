import mongoose, { Schema, Document } from 'mongoose';

export type ExamType = 'cie' | 'see';

export interface IGrade extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  examType: ExamType;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  score: number;
  semester: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GradeSchema = new Schema<IGrade>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    courseId:  { type: Schema.Types.ObjectId, ref: 'Course',  required: true },
    examType: {
      type: String,
      enum: ['cie', 'see'],
      required: true,
      default: 'see',
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
      required: true,
    },
    score:    { type: Number, required: true, min: 0, max: 100 },
    semester: { type: String, required: true },
    remarks:  { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// One CIE and one SEE per student per course per semester
GradeSchema.index({ studentId: 1, courseId: 1, semester: 1, examType: 1 }, { unique: true });

export default mongoose.model<IGrade>('Grade', GradeSchema);