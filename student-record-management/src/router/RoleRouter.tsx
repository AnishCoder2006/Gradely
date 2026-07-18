import { useAuth } from '../context/AuthContext';
import DashboardPage from '../pages/DashboardPage';
import StudentDashboard  from '../pages/student/StudentDashboard';

const RoleRouter = () => {
  const { user } = useAuth();
  if (user?.role === 'admin' || user?.role === 'teacher') return <DashboardPage />;
  return <StudentDashboard />;
};

export default RoleRouter;