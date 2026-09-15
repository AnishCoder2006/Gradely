// src/store/baseApi.ts
// Unified RTK Query entry point.
// `axiosBaseQuery` reads the auth token from the Redux store (single source)
// and `tagTypeList` drives cache invalidation across the app.
import { createApi, BaseQueryFn } from '@reduxjs/toolkit/query/react';
import axios, { AxiosRequestConfig, Method, AxiosResponse } from 'axios';
import type { Student } from '../types/student.types';
import type { Course, CourseFormData } from '../types/course.types';
import type { GradeRecord } from '../types/grade.types';
import type { Announcement } from '../services/announcementService';
import type { Doubt } from '../services/doubtService';
import type {
  Fee,
  FeeType,
  Payment,
  PaymentStats,
  CreateOrderResponse,
  PaymentStatus,
} from '../services/paymentService';
import type { AuthUser } from './authSlice';

const API_BASE_URL =
  (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ||
  '/api';

/**
 * Tag types available for cache invalidation. Domain RTK Query endpoints
 * should declare `providesTags: [[tag, id], tag]` so mutations can
 * invalidate precisely (e.g. after editing a grade, invalidate 'Grade').
 */
export const tagTypeList = [
  'User',
  'Student',
  'Course',
  'Grade',
  'Attendance',
  'Announcement',
  'Payment',
  'Fee',
  'Doubt',
  'AuditLog',
] as const;

type BaseQueryArgs =
  | string
  | {
    url: string;
    method?: Method;
    data?: unknown;
    params?: Record<string, unknown>;
  };

export type StudentListResponse = {
  data: Student[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type StudentQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  gender?: string;
  courseId?: string;
  email?: string;
};

export type CoursePayload = CourseFormData & { instructorId?: string };

export type FeePayload = {
  title: string;
  feeType: FeeType;
  amount: number;
  dueDate: string;
  description: string;
  isActive?: boolean;
};

export type PaymentListResponse = {
  data: Payment[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
};

export type PaymentQueryParams = {
  status?: PaymentStatus;
  feeId?: string;
  page?: number;
  limit?: number;
};

export type PaymentVerification = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

const unwrapData = <T>(response: unknown): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
};

interface AuthEnvelope {
  success: boolean;
  message?: string;
  data?: {
    token?: string;
    user?: AuthUser;
    mfaRequired?: boolean;
    email?: string;
    qrCodeUrl?: string;
    secret?: string;
  };
}

/** Minimal slice of state used by the base query (avoids a circular import
 *  with store.ts just to read the auth token). */
interface BaseApiState {
  auth?: { token?: string | null };
}

/**
 * Minimal axios-based base query that mirrors the behaviour of the existing
 * apiClient (Bearer token, 401 session-expiry) but reads the token from the
 * Redux store instead of localStorage directly.
 */
export const axiosBaseQuery =
  (baseUrl: string = API_BASE_URL): BaseQueryFn<BaseQueryArgs, unknown> =>
    async (args, api) => {
      let url: string;
      let method: Method;
      let data: unknown;
      let params: Record<string, unknown> | undefined;

      if (typeof args === 'string') {
        url = args;
        method = 'GET';
        data = undefined;
        params = undefined;
      } else {
        url = args.url;
        method = args.method ?? 'GET';
        data = args.data;
        params = args.params;
      }

      // Token is sourced from the single source of truth (auth slice).
      const token = (api.getState() as unknown as BaseApiState).auth?.token;

      const config: AxiosRequestConfig = {
        url,
        method,
        baseURL: baseUrl,
        data,
        params,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      };

      try {
        const response: AxiosResponse = await axios(config);
        const raw = response.data;
        // Auto-unwrap the standard backend envelope `{ success, data }` so
        // RTK Query endpoints receive the plain payload (array/object) directly.
        // Auth endpoints intentionally consume the full envelope, so we skip
        // unwrapping for /auth/* routes.
        const isAuthRoute = url.startsWith('/auth');
        const unwrapped =
          !isAuthRoute &&
            raw !== null &&
            typeof raw === 'object' &&
            'success' in raw &&
            'data' in raw
            ? raw.data
            : raw;
        return { data: unwrapped };
      } catch (err: any) {
        const { response, request, message } = err;

        // 401 — session expired. The error shape is returned so callers can
        // react; the auth slice keeps localStorage + state in sync elsewhere.
        if (response?.status === 401) {
          return {
            error: {
              status: 401,
              data: response?.data ?? { message: 'Session expired. Please log in again.' },
            },
          };
        }

        return {
          error: {
            status: response?.status ?? (request ? 500 : 'FETCH_ERROR'),
            data: response?.data ?? { message },
          },
        };
      }
    };

/**
 * Unified RTK Query API slice. Auth endpoints here feed the AuthContext shim
 * so the MFA flow is served through the same data layer as everything else.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: tagTypeList,
  endpoints: (builder) => ({
    // --- Auth ---
    login: builder.mutation<AuthEnvelope, { email: string; password: string }>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        data: body,
      }),
    }),

    register: builder.mutation<
      AuthEnvelope,
      { name: string; email: string; password: string; role: string }
    >({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        data: body,
      }),
    }),

    verifyMfa: builder.mutation<AuthEnvelope, { email: string; code: string }>({
      query: (body) => ({
        url: '/auth/mfa/verify-login',
        method: 'POST',
        data: body,
      }),
    }),

    getCurrentUser: builder.query<AuthUser, void>({
      query: () => '/auth/me',
      providesTags: [{ type: 'User', id: 'me' }],
    }),

    getStudents: builder.query<StudentListResponse, StudentQueryParams>({
      query: (params: StudentQueryParams = {}) => ({
        url: '/students',
        method: 'GET',
        params: Object.fromEntries(
          Object.entries(params).filter(([, value]) => value !== undefined && value !== '' && value !== null)
        ) as Record<string, string | number>,
      }),
      transformResponse: (response: unknown): StudentListResponse =>
        Array.isArray(response) ? { data: response } : response as StudentListResponse,
      providesTags: [{ type: 'Student', id: 'LIST' }],
    }),

    getStudentById: builder.query<Student, string>({
      query: (id) => `/students/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Student', id }],
    }),

    createStudent: builder.mutation<Student, Partial<Student>>({
      query: (body) => ({
        url: '/students',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: [{ type: 'Student', id: 'LIST' }],
    }),

    updateStudent: builder.mutation<Student, { id: string; data: Partial<Student> }>({
      query: ({ id, data }) => ({
        url: `/students/${id}`,
        method: 'PUT',
        data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Student', id },
        { type: 'Student', id: 'LIST' },
      ],
    }),

    deleteStudent: builder.mutation<void, string>({
      query: (id) => ({
        url: `/students/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Student', id: 'LIST' }],
    }),

    getTeachers: builder.query<any[], void>({
      query: () => ({ url: '/users', method: 'GET', params: { role: 'teacher' } }),
      providesTags: [{ type: 'User', id: 'LIST' }],
    }),

    getStudentUsers: builder.query<any[], void>({
      query: () => ({ url: '/users', method: 'GET', params: { role: 'student' } }),
      providesTags: [{ type: 'User', id: 'LIST' }],
    }),

    getCourses: builder.query<Course[], void>({
      query: () => '/courses',
      providesTags: [{ type: 'Course', id: 'LIST' }],
    }),

    getCourseById: builder.query<Course, string>({
      query: (id) => `/courses/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Course', id }],
    }),

    getEnrolledStudents: builder.query<any[], string>({
      query: (courseId) => `/courses/${courseId}/students`,
      providesTags: (_result, _error, courseId) => [{ type: 'Course', id: `${courseId}-STUDENTS` }],
    }),

    createCourse: builder.mutation<Course, CoursePayload>({
      query: (body) => ({ url: '/courses', method: 'POST', data: body }),
      invalidatesTags: [{ type: 'Course', id: 'LIST' }],
    }),

    updateCourse: builder.mutation<Course, { id: string; data: Partial<CoursePayload> }>({
      query: ({ id, data }) => ({ url: `/courses/${id}`, method: 'PUT', data }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Course', id },
        { type: 'Course', id: 'LIST' },
      ],
    }),

    deleteCourse: builder.mutation<void, string>({
      query: (id) => ({ url: `/courses/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Course', id: 'LIST' }],
    }),

    getGrades: builder.query<GradeRecord[], void>({
      query: () => '/grades',
      providesTags: [{ type: 'Grade', id: 'LIST' }],
    }),

    createGrade: builder.mutation<GradeRecord, Omit<GradeRecord, '_id' | 'createdAt' | 'updatedAt'>>({
      query: (body) => ({ url: '/grades', method: 'POST', data: body }),
      invalidatesTags: [{ type: 'Grade', id: 'LIST' }],
    }),

    updateGrade: builder.mutation<GradeRecord, { id: string; data: Partial<GradeRecord> }>({
      query: ({ id, data }) => ({ url: `/grades/${id}`, method: 'PUT', data }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Grade', id },
        { type: 'Grade', id: 'LIST' },
      ],
    }),

    deleteGrade: builder.mutation<void, string>({
      query: (id) => ({ url: `/grades/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Grade', id: 'LIST' }],
    }),

    getAnnouncements: builder.query<Announcement[], void>({
      query: () => '/announcements',
      providesTags: [{ type: 'Announcement', id: 'LIST' }],
    }),

    createAnnouncement: builder.mutation<Announcement, { title: string; message: string; priority?: string }>({
      query: (body) => ({ url: '/announcements', method: 'POST', data: body }),
      invalidatesTags: [{ type: 'Announcement', id: 'LIST' }],
    }),

    deleteAnnouncement: builder.mutation<void, string>({
      query: (id) => ({ url: `/announcements/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Announcement', id: 'LIST' }],
    }),

    getFees: builder.query<Fee[], void>({
      query: () => '/fees',
      transformResponse: (response: unknown) => unwrapData<Fee[]>(response) ?? [],
      providesTags: [{ type: 'Fee', id: 'LIST' }],
    }),

    createFee: builder.mutation<Fee, FeePayload>({
      query: (body) => ({ url: '/fees', method: 'POST', data: body }),
      transformResponse: (response: unknown) => unwrapData<Fee>(response),
      invalidatesTags: [{ type: 'Fee', id: 'LIST' }],
    }),

    updateFee: builder.mutation<Fee, { id: string; data: Partial<FeePayload> }>({
      query: ({ id, data }) => ({ url: `/fees/${id}`, method: 'PUT', data }),
      transformResponse: (response: unknown) => unwrapData<Fee>(response),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Fee', id },
        { type: 'Fee', id: 'LIST' },
      ],
    }),

    deleteFee: builder.mutation<void, string>({
      query: (id) => ({ url: `/fees/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Fee', id: 'LIST' }],
    }),

    getMyPayments: builder.query<Payment[], void>({
      query: () => '/payments/my',
      transformResponse: (response: unknown) => unwrapData<Payment[]>(response) ?? [],
      providesTags: [{ type: 'Payment', id: 'MINE' }],
    }),

    getAllPayments: builder.query<PaymentListResponse, PaymentQueryParams>({
      query: (params = {}) => ({ url: '/payments', method: 'GET', params }),
      transformResponse: (response: PaymentListResponse) => response,
      providesTags: [{ type: 'Payment', id: 'LIST' }],
    }),

    getPaymentStats: builder.query<PaymentStats, void>({
      query: () => '/payments/stats',
      transformResponse: (response: unknown) => unwrapData<PaymentStats>(response),
      providesTags: [{ type: 'Payment', id: 'STATS' }],
    }),

    createPaymentOrder: builder.mutation<CreateOrderResponse, string>({
      query: (feeId) => ({ url: '/payments/create-order', method: 'POST', data: { feeId } }),
      transformResponse: (response: unknown) => unwrapData<CreateOrderResponse>(response),
      invalidatesTags: [{ type: 'Payment', id: 'MINE' }],
    }),

    verifyPayment: builder.mutation<Payment, PaymentVerification>({
      query: (data) => ({ url: '/payments/verify', method: 'POST', data }),
      transformResponse: (response: unknown) => unwrapData<Payment>(response),
      invalidatesTags: [
        { type: 'Payment', id: 'MINE' },
        { type: 'Payment', id: 'LIST' },
        { type: 'Payment', id: 'STATS' },
      ],
    }),

    getDoubts: builder.query<Doubt[], void>({
      query: () => '/doubts',
      transformResponse: (response: unknown) => unwrapData<Doubt[]>(response) ?? [],
      providesTags: [{ type: 'Doubt', id: 'LIST' }],
    }),

    getDoubtById: builder.query<Doubt, string>({
      query: (id) => `/doubts/${id}`,
      transformResponse: (response: unknown) => unwrapData<Doubt>(response),
      providesTags: (_result, _error, id) => [{ type: 'Doubt', id }],
    }),

    createDoubt: builder.mutation<Doubt, { subject: string; text: string }>({
      query: (body) => ({ url: '/doubts', method: 'POST', data: body }),
      transformResponse: (response: unknown) => unwrapData<Doubt>(response),
      invalidatesTags: [{ type: 'Doubt', id: 'LIST' }],
    }),

    replyToDoubt: builder.mutation<Doubt, { id: string; text: string }>({
      query: ({ id, text }) => ({ url: `/doubts/${id}/reply`, method: 'POST', data: { text } }),
      transformResponse: (response: unknown) => unwrapData<Doubt>(response),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Doubt', id },
        { type: 'Doubt', id: 'LIST' },
      ],
    }),

    closeDoubt: builder.mutation<Doubt, string>({
      query: (id) => ({ url: `/doubts/${id}/close`, method: 'PATCH', data: {} }),
      transformResponse: (response: unknown) => unwrapData<Doubt>(response),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Doubt', id },
        { type: 'Doubt', id: 'LIST' },
      ],
    }),

    // --- Attendance ---
    getAttendance: builder.query<any[], { courseId?: string; date?: string; studentId?: string } | void>({
      query: (params) => ({
        url: '/attendance',
        method: 'GET',
        params: params ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) : undefined,
      }),
      transformResponse: (response: unknown) => unwrapData<any[]>(response) ?? [],
      providesTags: [{ type: 'Attendance', id: 'LIST' }],
    }),

    getAttendanceSummary: builder.query<any[], string | void>({
      query: (studentId) => `/attendance/summary/${studentId || 'me'}`,
      transformResponse: (response: unknown) => unwrapData<any[]>(response) ?? [],
      providesTags: [{ type: 'Attendance', id: 'SUMMARY' }],
    }),

    markAttendance: builder.mutation<any, { courseId: string; date: string; records: { studentId: string; status: string; remarks?: string }[] }>({
      query: (body) => ({ url: '/attendance/mark', method: 'POST', data: body }),
      invalidatesTags: [
        { type: 'Attendance', id: 'LIST' },
        { type: 'Attendance', id: 'SUMMARY' },
      ],
    }),

    // --- Student Approvals & Status ---
    updateStudentStatus: builder.mutation<Student, { id: string; status: 'active' | 'inactive' | 'pending' | 'graduated' }>({
      query: ({ id, status }) => ({
        url: `/students/${id}/status`,
        method: 'PATCH',
        data: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Student', id },
        { type: 'Student', id: 'LIST' },
      ],
    }),

    // --- Course Approval, Request & Assignment ---
    requestCourse: builder.mutation<Course, Partial<CoursePayload>>({
      query: (body) => ({ url: '/courses/request', method: 'POST', data: body }),
      invalidatesTags: [{ type: 'Course', id: 'LIST' }],
    }),

    approveCourse: builder.mutation<Course, string>({
      query: (id) => ({ url: `/courses/${id}/approve`, method: 'PATCH' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Course', id },
        { type: 'Course', id: 'LIST' },
      ],
    }),

    rejectCourse: builder.mutation<Course, string>({
      query: (id) => ({ url: `/courses/${id}/reject`, method: 'PATCH' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Course', id },
        { type: 'Course', id: 'LIST' },
      ],
    }),

    assignTeacher: builder.mutation<Course, { id: string; teacherId: string }>({
      query: ({ id, teacherId }) => ({
        url: `/courses/${id}/assign-teacher`,
        method: 'PATCH',
        data: { teacherId },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Course', id },
        { type: 'Course', id: 'LIST' },
      ],
    }),

    enrollStudent: builder.mutation<void, { courseId: string; studentId: string }>({
      query: ({ courseId, studentId }) => ({
        url: `/courses/${courseId}/enroll`,
        method: 'POST',
        data: { studentId },
      }),
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: 'Course', id: courseId },
        { type: 'Course', id: `${courseId}-STUDENTS` },
      ],
    }),

    unenrollStudent: builder.mutation<void, { courseId: string; studentId: string }>({
      query: ({ courseId, studentId }) => ({
        url: `/courses/${courseId}/enroll`,
        method: 'DELETE',
        data: { studentId },
      }),
      invalidatesTags: (_result, _error, { courseId }) => [
        { type: 'Course', id: courseId },
        { type: 'Course', id: `${courseId}-STUDENTS` },
      ],
    }),

    // --- Audit Logs ---
    getAuditLogs: builder.query<any[], void>({
      query: () => '/audit-logs',
      transformResponse: (response: unknown) => unwrapData<any[]>(response) ?? [],
      providesTags: [{ type: 'AuditLog', id: 'LIST' }],
    }),

    // --- MFA ---
    setupMfa: builder.query<{ qrCodeUrl: string; secret: string }, void>({
      query: () => '/auth/mfa/setup',
      transformResponse: (response: unknown) => unwrapData<{ qrCodeUrl: string; secret: string }>(response),
    }),

    enableMfa: builder.mutation<void, { secret: string; code: string }>({
      query: (body) => ({ url: '/auth/mfa/enable', method: 'POST', data: body }),
      invalidatesTags: [{ type: 'User', id: 'me' }],
    }),

    // --- User Management ---
    updateUserStatus: builder.mutation<void, { id: string; status: 'active' | 'inactive' }>({
      query: ({ id, status }) => ({
        url: `/users/${id}/status`,
        method: 'PATCH',
        data: { status },
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
  }),
});

export const {
  util: { getRunningQueriesThunk },
  useGetStudentsQuery,
  useGetStudentByIdQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useUpdateStudentStatusMutation,
  useGetTeachersQuery,
  useGetCoursesQuery,
  useGetCourseByIdQuery,
  useGetEnrolledStudentsQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useRequestCourseMutation,
  useApproveCourseMutation,
  useRejectCourseMutation,
  useAssignTeacherMutation,
  useEnrollStudentMutation,
  useUnenrollStudentMutation,
  useGetGradesQuery,
  useCreateGradeMutation,
  useUpdateGradeMutation,
  useDeleteGradeMutation,
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useGetFeesQuery,
  useCreateFeeMutation,
  useUpdateFeeMutation,
  useDeleteFeeMutation,
  useGetMyPaymentsQuery,
  useGetAllPaymentsQuery,
  useGetPaymentStatsQuery,
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
  useGetDoubtsQuery,
  useGetDoubtByIdQuery,
  useCreateDoubtMutation,
  useReplyToDoubtMutation,
  useCloseDoubtMutation,
  useGetAttendanceQuery,
  useGetAttendanceSummaryQuery,
  useMarkAttendanceMutation,
  useGetAuditLogsQuery,
  useSetupMfaQuery,
  useEnableMfaMutation,
  useUpdateUserStatusMutation,
} = baseApi;

export type { AuthEnvelope };
