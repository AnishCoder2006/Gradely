import { apiClient } from './api';

export interface DoubtMessage {
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'teacher';
  text: string;
  createdAt: string;
}

export interface Doubt {
  _id: string;
  studentId: string;
  studentName: string;
  teacherId?: string;
  teacherName?: string;
  subject: string;
  status: 'open' | 'answered' | 'closed';
  messages: DoubtMessage[];
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

class DoubtService {
  async getAll(): Promise<Doubt[]> {
    return apiClient.get<Doubt[]>('/doubts');
  }

  async getById(id: string): Promise<Doubt> {
    return apiClient.get<Doubt>(`/doubts/${id}`);
  }

  async create(data: { subject: string; text: string }): Promise<Doubt> {
    return apiClient.post<Doubt>('/doubts', data);
  }

  async reply(id: string, text: string): Promise<Doubt> {
    return apiClient.post<Doubt>(`/doubts/${id}/reply`, { text });
  }

  async close(id: string): Promise<Doubt> {
    return apiClient.patch<Doubt>(`/doubts/${id}/close`, {});
  }
}

export const doubtService = new DoubtService();