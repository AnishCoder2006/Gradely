// src/services/attendanceService.ts
import { apiClient } from './api';
import { Attendance } from '../types/attendance.types';

class AttendanceService {
  async getAll(): Promise<Attendance[]> {
    return apiClient.get<Attendance[]>('/attendance');
  }

  async create(data: any): Promise<Attendance> {
    return apiClient.post<Attendance>('/attendance', data);
  }

  async getSummary(studentId?: string): Promise<any[]> {
  if (!studentId) {
    // Backend route requires :studentId — for the logged-in student,
    // backend already resolves it from the JWT, but route still needs a placeholder
    return apiClient.get<any[]>('/attendance/summary/me');
  }
  return apiClient.get<any[]>(`/attendance/summary/${studentId}`);
}
}

export const attendanceService = new AttendanceService();