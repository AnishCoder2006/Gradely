import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, BookOpen, PlusCircle, GraduationCap, 
  CalendarCheck, Megaphone, HelpCircle, Settings 
} from 'lucide-react';
import { SidebarToggle } from './SidebarToggle';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'courses', label: 'My Courses', icon: BookOpen, path: '/courses' },
  { id: 'request', label: 'Request Course', icon: PlusCircle, path: '/request' },
  { id: 'grades', label: 'Grades', icon: GraduationCap, path: '/grades' },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck, path: '/attendance' },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, path: '/announcements' },
  { id: 'doubts', label: 'Doubts', icon: HelpCircle, path: '/doubts' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size to handle mobile collapsing automatically
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setIsCollapsed(true); // Collapse by default on mobile
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <>
      {/* Mobile Backdrop Overlay when open */}
      {isMobile && !isCollapsed && (
        <div
          onClick={() => setIsCollapsed(true)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 40,
          }}
        />
      )}

      <aside
        style={{
          width: isCollapsed ? (isMobile ? 0 : 64) : 240,
          minWidth: isCollapsed ? (isMobile ? 0 : 64) : 240,
          height: '100vh',
          backgroundColor: 'var(--bg-base)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          position: isMobile ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          zIndex: 50,
          overflow: 'hidden',
        }}
      >
        {/* Sidebar Header with Toggle */}
        <div
          style={{
            height: 60,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed && !isMobile ? 'center' : 'space-between',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {(!isCollapsed || isMobile) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  backgroundColor: 'var(--accent)',
                  color: '#000',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                }}
              >
                S
              </div>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                }}
              >
                Student Records
              </span>
            </div>
          )}

          <SidebarToggle
            isCollapsed={isCollapsed}
            onToggle={() => setIsCollapsed(!isCollapsed)}
            variant={isMobile ? 'dots' : 'icon'}
          />
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={item.path}
                title={isCollapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 4,
                  justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start',
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {(!isCollapsed || isMobile) && (
                  <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                )}
              </a>
            );
          })}
        </nav>
      </aside>
    </>
  );
};