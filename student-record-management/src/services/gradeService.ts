import { apiClient } from './api';
import { GradeRecord } from '../types/grade.types';

class GradeService {
  async getAll(): Promise<GradeRecord[]> {
    return apiClient.get<GradeRecord[]>('/grades');
  }

  async create(data: Omit<GradeRecord, '_id' | 'createdAt' | 'updatedAt'>): Promise<GradeRecord> {
    return apiClient.post<GradeRecord>('/grades', data);
  }

  async update(id: string, data: Partial<GradeRecord>): Promise<GradeRecord> {
    return apiClient.put<GradeRecord>(`/grades/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/grades/${id}`);
  }
}

export const gradeService = new GradeService();