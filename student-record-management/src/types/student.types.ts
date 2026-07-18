import { BaseEntity, Status, Gender } from "./common.types";

export interface Student extends BaseEntity {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: Date | string;
  gender: 'male' | 'female' | 'other';
  address: string;
  enrollmentDate: Date;
  status: Status;
  courseIds: string[];
  gpa?: number;
}

export interface StudentFormData {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
}

export interface StudentFilters {
  search?: string;
  status?: Status;
  gender?: Gender;
  courseId?: string;
  email?: string;
}