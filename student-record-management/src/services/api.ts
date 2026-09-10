const API_BASE_URL = (import.meta as any).env.VITE_API_URL || '/api';

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/auth';
        throw new Error('Session expired. Please log in again.');
      }

      const text = await response.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        if (!response.ok) {
          throw new Error(`Server connection error (${response.status}): Backend may not be running on port 5000.`);
        }
        throw new Error('Invalid JSON response from server.');
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText || 'Server Error'}`);
      }

      return data.data ?? data;
    } catch (error: any) {
      console.error(`API Error [${options.method ?? 'GET'}] ${endpoint}:`, error);
      throw error;
    }
  }

  // Returns the FULL response envelope { success, data, pagination } —
  // used when callers need pagination metadata, not just the data array.
  private async requestFull<T>(endpoint: string, options: RequestInit = {}): Promise<{
    data: T; pagination?: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);

    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/auth';
      throw new Error('Session expired. Please log in again.');
    }

    const text = await response.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      if (!response.ok) {
        throw new Error(`Server connection error (${response.status}): Backend may not be running on port 5000.`);
      }
      throw new Error('Invalid JSON response from server.');
    }

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText || 'Server Error'}`);
    }

    return data;
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  getPaginated<T>(endpoint: string): Promise<{
    data: T; pagination?: { page: number; limit: number; total: number; totalPages: number };
  }> {
    return this.requestFull<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) });
  }

  put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  }

  patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) });
  }

  delete<T = void>(endpoint: string, data?: any): Promise<T> {
    const opts: RequestInit = { method: 'DELETE' };
    if (data) opts.body = JSON.stringify(data);
    return this.request<T>(endpoint, opts);
  }
}

export const apiClient = new ApiClient();