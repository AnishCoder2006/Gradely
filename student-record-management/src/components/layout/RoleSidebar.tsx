import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home, Users, BookOpen, Award,
  Calendar, Settings, User, BarChart2,
  UserCheck, GraduationCap, PlusCircle,
  Megaphone, MessageCircle, CreditCard,
} from 'lucide-react';

type NavItem = { icon: React.ElementType; label: string; path: string };

const ADMIN_NAV: NavItem[] = [
  { icon: Home,          label: 'Dashboard',          path: '/' },
  { icon: Users,         label: 'Students',           path: '/students' },
  { icon: BookOpen,      label: 'Courses',            path: '/courses' },
  { icon: Award,         label: 'Grades',             path: '/grades' },
  { icon: Calendar,      label: 'Attendance',         path: '/attendance' },
  { icon: Megaphone,     label: 'Announcements',      path: '/announcements' },
  { icon: UserCheck,     label: 'Teacher Management', path: '/admin/teachers' },
  { icon: GraduationCap, label: 'Student Approvals',  path: '/admin/students' },
  { icon: CreditCard,    label: 'Fees & Payments',    path: '/admin/payments' },
  { icon: Settings,      label: 'Settings',           path: '/settings' },
];

const TEACHER_NAV: NavItem[] = [
  { icon: Home,          label: 'Dashboard',      path: '/' },
  { icon: BookOpen,      label: 'My Courses',     path: '/my-courses' },
  { icon: PlusCircle,    label: 'Request Course', path: '/request-course' },
  { icon: Award,         label: 'Grades',         path: '/grades' },
  { icon: Calendar,      label: 'Attendance',     path: '/attendance' },
  { icon: Megaphone,     label: 'Announcements',  path: '/announcements' },
  { icon: MessageCircle, label: 'Doubts',         path: '/doubts' },
  { icon: Settings,      label: 'Settings',       path: '/settings' },
];

const STUDENT_NAV: NavItem[] = [
  { icon: Home,          label: 'Dashboard',     path: '/' },
  { icon: User,          label: 'My Profile',    path: '/my-profile' },
  { icon: Award,         label: 'My Grades',     path: '/my-grades' },
  { icon: Calendar,      label: 'Attendance',    path: '/my-attendance' },
  { icon: BarChart2,     label: 'Progress',      path: '/my-progress' },
  { icon: CreditCard,    label: 'Fees & Payments', path: '/my-payments' },
  { icon: Megaphone,     label: 'Announcements', path: '/announcements' },
  { icon: MessageCircle, label: 'Doubts',        path: '/doubts' },
  { icon: Settings,      label: 'Settings',      path: '/settings' },
];

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  admin: ADMIN_NAV, teacher: TEACHER_NAV, student: STUDENT_NAV,
};

const ROLE_COLOR: Record<string, string> = {
  admin: '#d97706', teacher: '#6366f1', student: '#0d9488',
};

export const RoleSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const role  = user?.role ?? 'student';
  const items = NAV_BY_ROLE[role] ?? ADMIN_NAV;
  const color = ROLE_COLOR[role];
  const initials = user?.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'AD';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">S</div>
        <div>
          <p className="sidebar-eyebrow">Academic Suite</p>
          <p className="sidebar-name">Student Records</p>
        </div>
      </div>

      <div style={{ padding: '10px 14px 6px' }}>
        <span style={{
          fontSize: 9.5, fontFamily: "'Outfit', sans-serif",
          fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase' as const, color,
          backgroundColor: color + '15',
          padding: '3px 10px', borderRadius: 6,
          border: `1px solid ${color}22`,
        }}>
          {role} portal
        </span>
      </div>

      <nav className="sidebar-nav">
        <p className="sidebar-section">Navigation</p>
        {items.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={`sidebar-item ${isActive ? 'active' : ''}`}>
              <Icon size={15} style={{ opacity: isActive ? 1 : 0.55, flexShrink: 0 }} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            className="avatar"
            style={{
              width: 32, height: 32, fontSize: 11,
              background: `linear-gradient(135deg, ${color}dd, ${color}99)`,
              color: '#ffffff',
              borderRadius: 8,
            }}
          >
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-sidebar-active)', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-sidebar)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};