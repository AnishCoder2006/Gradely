// src/services/courseService.ts
import { apiClient } from './api';
import { Course, CourseFormData } from '../types/course.types';

class CourseService {
  async getAll(): Promise<Course[]> {
    return apiClient.get<Course[]>('/courses');
  }

  async getById(id: string): Promise<Course> {
    return apiClient.get<Course>(`/courses/${id}`);
  }

  async create(data: CourseFormData): Promise<Course> {
    return apiClient.post<Course>('/courses', data);
  }

  async update(id: string, data: Partial<CourseFormData>): Promise<Course> {
    return apiClient.put<Course>(`/courses/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/courses/${id}`);
  }

  /** Enroll a student in a course */
  async enroll(courseId: string, studentId: string): Promise<{ message: string }> {
    return apiClient.post(`/courses/${courseId}/enroll`, { studentId });
  }

  /** Remove a student from a course */
  async unenroll(courseId: string, studentId: string): Promise<{ message: string }> {
    return apiClient.delete(`/courses/${courseId}/enroll`, { studentId });
  }

  /** Get all students enrolled in a course */
  async getEnrolledStudents(courseId: string): Promise<any[]> {
    return apiClient.get<any[]>(`/courses/${courseId}/students`);
  }
}

export const courseService = new CourseService();