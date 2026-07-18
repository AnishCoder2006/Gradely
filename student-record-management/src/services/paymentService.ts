import { apiClient } from './api';

export type FeeType = 'tuition' | 'exam' | 'library' | 'hostel' | 'miscellaneous';
export type PaymentStatus = 'created' | 'paid' | 'failed' | 'refunded';

export interface Fee {
  _id: string;
  title: string;
  feeType: FeeType;
  amount: number;      // in INR
  dueDate: string;
  description: string;
  isActive: boolean;
  createdBy: { _id: string; name: string } | string;
  createdAt: string;
}

export interface Payment {
  _id: string;
  feeId: { _id: string; title: string; feeType: FeeType; amount: number; description: string; dueDate: string } | string;
  studentId: { _id: string; name: string; email: string } | string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amount: number;       // in paise
  currency: string;
  status: PaymentStatus;
  paidAt?: string;
  createdAt: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  paymentDocId: string;
  studentName: string;
  studentEmail: string;
  feeTitle: string;
}

export interface PaymentStats {
  totalRevenue: number;
  paidCount: number;
  pendingCount: number;
  failedCount: number;
  revenueByType: { _id: FeeType; total: number; count: number }[];
}

// ─── Fee API ──────────────────────────────────────────────────────────────────
export const feeService = {
  getAll: (): Promise<Fee[]> => apiClient.get<Fee[]>('/fees'),

  create: (data: {
    title: string; feeType: FeeType; amount: number;
    dueDate: string; description: string;
  }): Promise<Fee> => apiClient.post<Fee>('/fees', data),

  update: (id: string, data: Partial<Fee>): Promise<Fee> =>
    apiClient.put<Fee>(`/fees/${id}`, data),

  delete: (id: string): Promise<void> =>
    apiClient.delete(`/fees/${id}`),
};

// ─── Payment API ──────────────────────────────────────────────────────────────
export const paymentService = {
  createOrder: (feeId: string): Promise<CreateOrderResponse> =>
    apiClient.post<CreateOrderResponse>('/payments/create-order', { feeId }),

  verifyPayment: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<Payment> => apiClient.post<Payment>('/payments/verify', data),

  getMyPayments: (): Promise<Payment[]> =>
    apiClient.get<Payment[]>('/payments/my'),

  getAllPayments: (params?: {
    status?: PaymentStatus; feeId?: string; page?: number; limit?: number;
  }): Promise<{ data: Payment[]; pagination?: any }> => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.feeId)  qs.set('feeId',  params.feeId);
    if (params?.page)   qs.set('page',   String(params.page));
    if (params?.limit)  qs.set('limit',  String(params.limit));
    const q = qs.toString();
    return apiClient.getPaginated<Payment[]>(`/payments${q ? `?${q}` : ''}`);
  },

  getStats: (): Promise<PaymentStats> =>
    apiClient.get<PaymentStats>('/payments/stats'),
};
