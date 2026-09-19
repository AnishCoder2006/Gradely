import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';

import AuthPage from '../pages/AuthPage';
import RoleRouter from './RoleRouter';

import StudentsPage from '../pages/StudentsPage';
import CoursesPage from '../pages/CoursesPage';
import GradesPage from '../pages/GradesPage';
import StudentProfilePage from '../pages/StudentProfilePage';
import AdminTeacherAssignPage from '../pages/admin/AdminTeacherAssignPage';
import AdminStudentApprovePage from '../pages/admin/AdminStudentApprovePage';

import TeacherAttendancePage from '../pages/teacher/TeacherAttendancePage';
import MyCoursesPage from '../pages/teacher/MyCoursesPage';
import TeacherRequestCoursePage from '../pages/teacher/TeacherRequestCoursePage';

import MyProfilePage from '../pages/student/MyProfilePage';
import MyGradesPage from '../pages/student/MyGradesPage';
import MyAttendancePage from '../pages/student/MyAttendancePage';
import MyProgressPage from '../pages/student/MyProgressPage';
import PendingApprovalPage from '../pages/student/PendingApprovalPage';

import AnnouncementsPage from '../pages/AnnouncementsPage';
import DoubtsPage from '../pages/DoubtsPage';
import SettingsPage from '../pages/SettingsPage';
import PaymentPage from '../pages/student/PaymentPage';
import AdminPaymentsPage from '../pages/admin/AdminPaymentsPage';
import AdminAuditLogsPage from '../pages/admin/AdminAuditLogsPage';

const AuthSkeleton = () => (
  <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-base)' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #eab308, #ca8a04)', animation: 'pulse-dot 1.4s ease-in-out infinite' }} />
      <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>Loading...</p>
    </div>
  </div>
);

const ProtectedLayout = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <AuthSkeleton />;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <AppLayout>{children}</AppLayout>;
};

// Looser guard used only for the profile pages (/my-profile,
// /my-profile/setup). A student needs access here regardless of
// approval status — draft students are completing their profile,
// pending students may want to review what they submitted, and only
// a rejected (inactive) student is turned away entirely.
const ProfileGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <AuthSkeleton />;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (user?.role !== 'student') return <Navigate to="/" replace />;
  if (user?.approvalStatus === 'inactive') return <Navigate to="/pending-approval" replace />;
  return <AppLayout>{children}</AppLayout>;
};

// Strict guard for everything else student-only — requires full
// ('active') approval. Draft students are redirected to finish their
// profile instead of hitting the generic pending screen.
const StudentGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <AuthSkeleton />;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (user?.role !== 'student') return <Navigate to="/" replace />;
  if (user?.approvalStatus !== 'active') {
    if (user?.approvalStatus === 'draft') return <Navigate to="/my-profile/setup" replace />;
    return <Navigate to="/pending-approval" replace />;
  }
  return <AppLayout>{children}</AppLayout>;
};

const NotFound = () => (
  <div className="page-section" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
    <div style={{ textAlign: 'center' }}>
      <p className="text-eyebrow">Error</p>
      <p className="text-mono-lg" style={{ fontSize: 64, opacity: 0.1, margin: '8px 0' }}>404</p>
      <p className="text-heading">Page not found</p>
    </div>
  </div>
);

const AppRouter = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <AuthSkeleton />;

  return (
    <Routes>
      <Route path="/auth" element={isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />} />

      {/* Pending-approval page: available to all logged-in students regardless of status */}
      <Route path="/pending-approval" element={
        isAuthenticated
          ? <PendingApprovalPage />
          : <Navigate to="/auth" replace />
      } />

      <Route path="/" element={<ProtectedLayout><RoleRouter /></ProtectedLayout>} />
      <Route path="/settings" element={<ProtectedLayout><SettingsPage /></ProtectedLayout>} />

      {/* Communication — all roles */}
      <Route path="/announcements" element={<ProtectedLayout><AnnouncementsPage /></ProtectedLayout>} />
      <Route path="/doubts" element={<ProtectedLayout roles={['teacher', 'student']}><DoubtsPage /></ProtectedLayout>} />

      {/* Admin only */}
      <Route path="/students" element={<ProtectedLayout roles={['admin']}><StudentsPage /></ProtectedLayout>} />
      <Route path="/students/:id" element={<ProtectedLayout roles={['admin']}><StudentProfilePage /></ProtectedLayout>} />
      <Route path="/courses" element={<ProtectedLayout roles={['admin']}><CoursesPage /></ProtectedLayout>} />
      <Route path="/grades" element={<ProtectedLayout roles={['admin', 'teacher']}><GradesPage /></ProtectedLayout>} />
      <Route path="/attendance" element={<ProtectedLayout roles={['admin', 'teacher']}><TeacherAttendancePage /></ProtectedLayout>} />
      <Route path="/admin/teachers" element={<ProtectedLayout roles={['admin']}><AdminTeacherAssignPage /></ProtectedLayout>} />
      <Route path="/admin/students" element={<ProtectedLayout roles={['admin']}><AdminStudentApprovePage /></ProtectedLayout>} />

      {/* Teacher only */}
      <Route path="/my-courses" element={<ProtectedLayout roles={['teacher']}><MyCoursesPage /></ProtectedLayout>} />
      <Route path="/request-course" element={<ProtectedLayout roles={['teacher']}><TeacherRequestCoursePage /></ProtectedLayout>} />

      {/* Student only — profile pages use the looser guard since draft/
          pending students still need to reach them to complete/review
          their profile before they're fully approved */}
      <Route path="/my-profile" element={<ProfileGuard><MyProfilePage /></ProfileGuard>} />
      <Route path="/my-profile/setup" element={<ProfileGuard><MyProfilePage setup /></ProfileGuard>} />
      <Route path="/my-grades" element={<StudentGuard><MyGradesPage /></StudentGuard>} />
      <Route path="/my-progress" element={<StudentGuard><MyProgressPage /></StudentGuard>} />
      <Route path="/my-attendance" element={<StudentGuard><MyAttendancePage /></StudentGuard>} />
      <Route path="/my-payments" element={<StudentGuard><PaymentPage /></StudentGuard>} />

      {/* Admin payments */}
      <Route path="/admin/payments" element={<ProtectedLayout roles={['admin']}><AdminPaymentsPage /></ProtectedLayout>} />
      <Route path="/admin/audit-logs" element={<ProtectedLayout roles={['admin']}><AdminAuditLogsPage /></ProtectedLayout>} />

      <Route path="*" element={<ProtectedLayout><NotFound /></ProtectedLayout>} />
    </Routes>
  );
};

export default AppRouter;