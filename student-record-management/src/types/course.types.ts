import {BaseEntity} from './common.types';

export interface Course extends BaseEntity {
    name: string;
    code: string;
    description: string;
    credits: number;
    instructor: string;
    instructorId?: string;
    semester: string;
    maxStudents: number;
    enrolledStudents: number;
    status?: 'active' | 'pending' | 'rejected';
    rejectionReason?: string;
}

export interface CourseFormData {
    name: string;
    code: string;
    description: string;
    credits: number;
    instructor?: string;
    semester: string;
    maxStudents?: number;
    status?: 'active' | 'pending' | 'rejected';
    rejectionReason?: string;
}