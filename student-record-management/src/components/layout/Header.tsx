import { Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'var(--role-admin)' },
  teacher: { label: 'Teacher', color: 'var(--role-teacher)' },
  student: { label: 'Student', color: 'var(--role-student)' },
};

export const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'AD';

  const roleBadge = ROLE_BADGE[user?.role ?? 'student'];

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <header
      className="app-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        width: '100%',
        padding: '12px 24px',
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Right — Actions & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, width: '100%' }}>

        {/* User Profile Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '4px 10px 4px 6px',
            borderRadius: 'var(--radius-lg, 10px)',
            backgroundColor: 'var(--bg-base)',
            border: '1px solid var(--border)',
            transition: 'border-color 0.2s ease',
          }}
        >
          <div
            className="avatar"
            style={{
              width: 32,
              height: 32,
              fontSize: 11,
              fontWeight: 700,
              background: `linear-gradient(135deg, ${roleBadge.color}, ${roleBadge.color}aa)`,
              color: '#ffffff',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 2px 8px ${roleBadge.color}33`,
            }}
          >
            {initials}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: 1,
                  letterSpacing: '-0.01em',
                }}
              >
                {user?.name ?? 'User'}
              </p>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: roleBadge.color,
                  backgroundColor: `${roleBadge.color}18`,
                  border: `1px solid ${roleBadge.color}33`,
                  padding: '1px 6px',
                  borderRadius: 4,
                  lineHeight: 1.2,
                }}
              >
                {roleBadge.label}
              </span>
            </div>
            <p
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                margin: 0,
                lineHeight: 1,
                fontFamily: 'IBM Plex Mono, monospace',
              }}
            >
              {user?.email ?? ''}
            </p>
          </div>
        </div>

        {/* Vertical Divider */}
        <div
          style={{
            width: 1,
            height: 24,
            backgroundColor: 'var(--border)',
          }}
        />

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Theme Toggle Button (Optional if you use theme context) */}
          <button
            className="header-action-btn"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            title="Toggle theme"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Logout Button */}
          <button
            className="header-action-btn"
            onClick={handleLogout}
            aria-label="Logout"
            title="Sign out"
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              cursor: 'pointer',
              padding: 7,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <LogOut size={15} />
          </button>
        </div>

      </div>
    </header>
  );
};
