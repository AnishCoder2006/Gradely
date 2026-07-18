import { Moon, Sun, Bell, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const PAGE_LABELS: Record<string, { eyebrow: string; title: string }> = {
  '/':           { eyebrow: 'Overview',   title: 'Dashboard' },
  '/students':   { eyebrow: 'Records',    title: 'Students' },
  '/courses':    { eyebrow: 'Catalogue',  title: 'Courses' },
  '/grades':     { eyebrow: 'Academic',   title: 'Grades' },
  '/attendance': { eyebrow: 'Tracking',   title: 'Attendance' },
  '/settings':   { eyebrow: 'System',     title: 'Settings' },
};

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  admin:   { label: 'Admin',   color: '#d97706' },
  teacher: { label: 'Teacher', color: '#6366f1' },
  student: { label: 'Student', color: '#0d9488' },
};

export const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const page = PAGE_LABELS[location.pathname] ?? { eyebrow: '', title: 'Page' };

  const initials = user?.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'AD';

  const roleBadge = ROLE_BADGE[user?.role ?? 'student'];

  const NOTIFS = [
    { text: 'Priya Iyer submitted an assignment', time: '2m ago',  unread: true },
    { text: 'Grade report for CS401 is ready',    time: '1h ago',  unread: true },
    { text: 'Attendance below 75% — 3 students',  time: '3h ago',  unread: false },
  ];

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <header className="app-header" style={{ position: 'relative' }}>

      {/* Left — dynamic breadcrumb */}
      <div>
        <p style={{
          fontSize: 9, fontWeight: 600,
          letterSpacing: '0.14em', textTransform: 'uppercase' as const,
          color: 'var(--accent)', margin: 0, lineHeight: 1,
        }}>
          {page.eyebrow}
        </p>
        <p style={{
          fontSize: 14, fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0, letterSpacing: '-0.02em', lineHeight: 1.3,
        }}>
          {page.title}
        </p>
      </div>

      {/* Center — pill nav removed per user request */}

      {/* Right — system status and profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div className="sys-status">
          <div className="sys-status-dot"></div>
          SYS.OP.OK
        </div>
        <button className="neon-pulse-btn" style={{ padding: '6px 14px', fontSize: '12px' }}>
          CONNECT
        </button>

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            className="avatar"
            style={{
              width: 32, height: 32, fontSize: 11,
              background: `linear-gradient(135deg, ${roleBadge.color}cc, ${roleBadge.color}88)`,
              color: '#fff',
              borderRadius: 8,
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <p style={{
                fontSize: 12, fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0, lineHeight: 1.2, letterSpacing: '-0.01em',
              }}>
                {user?.name ?? 'User'}
              </p>
              <span style={{
                fontSize: 9, fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase' as const,
                color: roleBadge.color,
                backgroundColor: roleBadge.color + '15',
                padding: '1px 5px', borderRadius: 4,
              }}>
                {roleBadge.label}
              </span>
            </div>
            <p style={{
              fontSize: 10, color: 'var(--text-muted)',
              margin: 0, lineHeight: 1.2,
              fontFamily: 'Geist Mono, monospace',
            }}>
              {user?.email ?? ''}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          className="header-action-btn"
          onClick={handleLogout}
          aria-label="Logout"
          title="Sign out"
        >
          <LogOut size={14} />
        </button>

      </div>
    </header>
  );
};