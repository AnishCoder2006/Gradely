import { BaseEntity } from "./common.types";

export type ExamType = 'cie' | 'see';

export interface GradeRecord extends BaseEntity {
  studentId: string;
  studentName?: string;
  courseId: string;
  courseName?: string;
  courseCode?: string;
  examType: ExamType;
  grade: string;
  score: number;
  semester: string;
  remarks?: string;
}