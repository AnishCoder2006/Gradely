import { apiClient } from './api';

export interface Announcement {
  _id: string;
  title: string;
  message: string;
  postedBy: string;
  postedByName: string;
  postedByRole: 'admin' | 'teacher';
  priority: 'normal' | 'important' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

class AnnouncementService {
  async getAll(): Promise<Announcement[]> {
    return apiClient.get<Announcement[]>('/announcements');
  }

  async create(data: { title: string; message: string; priority?: string }): Promise<Announcement> {
    return apiClient.post<Announcement>('/announcements', data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/announcements/${id}`);
  }
}

export const announcementService = new AnnouncementService();