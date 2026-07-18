import { Link, useLocation } from 'react-router-dom';
import { Users, BookOpen, Award, Calendar, Home, Settings } from 'lucide-react';

const menuItems = [
  { icon: Home,     label: 'Dashboard',  path: '/' },
  { icon: Users,    label: 'Students',   path: '/students' },
  { icon: BookOpen, label: 'Courses',    path: '/courses' },
  { icon: Award,    label: 'Grades',     path: '/grades' },
  { icon: Calendar, label: 'Attendance', path: '/attendance' },
  { icon: Settings, label: 'Settings',   path: '/settings' },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <p className="sidebar-eyebrow">Academic Suite</p>
        <p className="sidebar-name">Student Records</p>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <p className="sidebar-section">Navigation</p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={15} style={{ opacity: isActive ? 1 : 0.55, flexShrink: 0 }} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            className="avatar"
            style={{ width: 30, height: 30, fontSize: 11 }}
          >
            AD
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-sidebar-active)',
              margin: 0,
              lineHeight: 1.3,
            }}>
              Admin
            </p>
            <p style={{
              fontSize: 11,
              color: 'var(--text-sidebar)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              admin@college.edu
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};