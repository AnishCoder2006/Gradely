import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardPage from '../pages/DashboardPage';
import StudentDashboard from '../pages/student/StudentDashboard';

const RoleRouter = () => {
  const { user } = useAuth();

  if (user?.role === 'admin' || user?.role === 'teacher') {
    return <DashboardPage />;
  }

  // Student: route by actual approval status.
  if (user?.role === 'student') {
    // Draft — profile not yet completed/submitted. Send them to finish it.
    if (user?.approvalStatus === 'draft') {
      return <Navigate to="/my-profile/setup" replace />;
    }
    // Pending or rejected — not fully approved yet.
    if (user?.approvalStatus !== 'active') {
      return <Navigate to="/pending-approval" replace />;
    }
  }

  return <StudentDashboard />;
};

export default RoleRouter;