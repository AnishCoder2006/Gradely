import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SidebarToggle } from './SidebarToggle';
import {
  Home, Users, BookOpen, Award,
  Calendar, Settings, User, BarChart2,
  UserCheck, GraduationCap, PlusCircle,
  Megaphone, MessageCircle, CreditCard,
  ScrollText,
} from 'lucide-react';

type NavItem = { icon: React.ElementType; label: string; path: string };

interface RoleSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const ADMIN_NAV: NavItem[] = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Students', path: '/students' },
  { icon: BookOpen, label: 'Courses', path: '/courses' },
  { icon: Award, label: 'Grades', path: '/grades' },
  { icon: Calendar, label: 'Attendance', path: '/attendance' },
  { icon: Megaphone, label: 'Announcements', path: '/announcements' },
  { icon: UserCheck, label: 'Teacher Management', path: '/admin/teachers' },
  { icon: GraduationCap, label: 'Student Approvals', path: '/admin/students' },
  { icon: CreditCard, label: 'Fees & Payments', path: '/admin/payments' },
  { icon: ScrollText, label: 'Audit Logs', path: '/admin/audit-logs' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const TEACHER_NAV: NavItem[] = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: BookOpen, label: 'My Courses', path: '/my-courses' },
  { icon: PlusCircle, label: 'Request Course', path: '/request-course' },
  { icon: Award, label: 'Grades', path: '/grades' },
  { icon: Calendar, label: 'Attendance', path: '/attendance' },
  { icon: Megaphone, label: 'Announcements', path: '/announcements' },
  { icon: MessageCircle, label: 'Doubts', path: '/doubts' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const STUDENT_NAV: NavItem[] = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: User, label: 'My Profile', path: '/my-profile' },
  { icon: Award, label: 'My Grades', path: '/my-grades' },
  { icon: Calendar, label: 'Attendance', path: '/my-attendance' },
  { icon: BarChart2, label: 'Progress', path: '/my-progress' },
  { icon: CreditCard, label: 'Fees & Payments', path: '/my-payments' },
  { icon: Megaphone, label: 'Announcements', path: '/announcements' },
  { icon: MessageCircle, label: 'Doubts', path: '/doubts' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  admin: ADMIN_NAV, teacher: TEACHER_NAV, student: STUDENT_NAV,
};

const ROLE_COLOR: Record<string, string> = {
  admin: 'var(--role-admin)', teacher: 'var(--role-teacher)', student: 'var(--role-student)',
};

export const RoleSidebar = ({ isCollapsed, onToggle }: RoleSidebarProps) => {
  const location = useLocation();
  const { user } = useAuth();

  const role = user?.role ?? 'student';
  const items = NAV_BY_ROLE[role] ?? ADMIN_NAV;
  const color = ROLE_COLOR[role];
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'AD';

  return (
    <aside
      className="sidebar"
      style={{
        width: isCollapsed ? 64 : 240,
        minWidth: isCollapsed ? 64 : 240,
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Brand header with conditional logo render */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          padding: isCollapsed ? '16px 0' : '16px 14px',
          minHeight: 72,
          height: 'auto',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {!isCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="sidebar-logo">S</div>
            <div>
              <p className="sidebar-eyebrow">Academic Suite</p>
              <p className="sidebar-name">Student Records</p>
            </div>
          </div>
        )}

        <SidebarToggle isCollapsed={isCollapsed} onToggle={onToggle} />
      </div>

      {/* Role tag (hidden when collapsed) */}
      {!isCollapsed && (
        <div style={{ padding: '10px 14px 6px' }}>
          <span style={{
            fontSize: 9.5, fontFamily: "'Instrument Sans', sans-serif",
            fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase' as const, color,
            backgroundColor: color + '15',
            padding: '3px 10px', borderRadius: 6,
            border: `1px solid ${color}22`,
          }}>
            {role} portal
          </span>
        </div>
      )}

      {/* Navigation items */}
      <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        {!isCollapsed && <p className="sidebar-section">Navigation</p>}
        {items.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.label : undefined}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: isCollapsed ? '10px 0' : '10px 12px',
                borderRadius: 8,
                marginBottom: 4,
              }}
            >
              <Icon size={16} style={{ opacity: isActive ? 1 : 0.55, flexShrink: 0 }} />
              {!isCollapsed && <span style={{ marginLeft: 10 }}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User profile footer */}
      <div className="sidebar-footer" style={{ padding: isCollapsed ? '12px 0' : '14px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
          <div
            className="avatar"
            style={{
              width: 32, height: 32, fontSize: 11,
              background: `linear-gradient(135deg, ${color}dd, ${color}99)`,
              color: '#ffffff',
              borderRadius: 8,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          {!isCollapsed && (
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-sidebar-active)', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-sidebar)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
