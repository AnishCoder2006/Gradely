import { apiClient } from './api';
import { Student, StudentFilters } from '../types/student.types';

class StudentService {
  async getAll(filters?: StudentFilters): Promise<Student[]> {
    const params = new URLSearchParams();
    if (filters?.search)   params.append('search',   filters.search);
    if (filters?.status)   params.append('status',   filters.status);
    if (filters?.gender)   params.append('gender',   filters.gender);
    if (filters?.courseId) params.append('courseId', filters.courseId);
    if (filters?.email)    params.append('email',    filters.email);
    const qs = params.toString();
    return apiClient.get<Student[]>(`/students${qs ? `?${qs}` : ''}`);
  }

  async getById(id: string): Promise<Student> {
    return apiClient.get<Student>(`/students/${id}`);
  }

  async create(data: any): Promise<Student> {
    return apiClient.post<Student>('/students', data);
  }

  async update(id: string, data: any): Promise<Student> {
    return apiClient.put<Student>(`/students/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/students/${id}`);
  }
}

export const studentService = new StudentService();