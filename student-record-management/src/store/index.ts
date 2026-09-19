// src/store/index.ts
// Barrel — keeps every Redux/RTK-Query export behind a single import path.
export { store } from './store';
export type { RootState, AppDispatch } from './store';

export {
    baseApi,
    axiosBaseQuery,
    tagTypeList,
    getRunningQueriesThunk,
    useGetStudentsQuery,
    useGetStudentByIdQuery,
    useCreateStudentMutation,
    useUpdateStudentMutation,
    useDeleteStudentMutation,
    useGetTeachersQuery,
    useGetCoursesQuery,
    useGetCourseByIdQuery,
    useGetEnrolledStudentsQuery,
    useCreateCourseMutation,
    useUpdateCourseMutation,
    useDeleteCourseMutation,
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
    useUpdateStudentStatusMutation,
    useRequestCourseMutation,
    useApproveCourseMutation,
    useRejectCourseMutation,
    useAssignTeacherMutation,
    useEnrollStudentMutation,
    useUnenrollStudentMutation,
    useGetAuditLogsQuery,
    useSetupMfaQuery,
    useEnableMfaMutation,
    useUpdateUserStatusMutation,
    useSubmitForApprovalMutation
} from './baseApi';
export type {
    AuthEnvelope,
    StudentListResponse,
    StudentQueryParams,
    CoursePayload,
    FeePayload,
    PaymentListResponse,
    PaymentQueryParams,
    PaymentVerification,
} from './baseApi';

export { default as authReducer } from './authSlice';
export { setCredentials, clearCredentials, setLoading } from './authSlice';
export type { AuthUser, UserRole, LoginResponse, AuthState } from './authSlice';

export { useAppDispatch, useAppSelector } from './hooks';
