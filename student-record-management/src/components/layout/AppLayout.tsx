import { useState } from 'react';
import { RoleSidebar } from './RoleSidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="app-frame" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '24px',
      backgroundColor: 'transparent',
    }}>
      <div className="app-shell" style={{
        display: 'flex',
        width: '100%',
        maxWidth: '1600px',
        minHeight: 'calc(100vh - 48px)',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-shell)',
        boxShadow: 'var(--shadow-dropdown)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* RoleSidebar now receives collapse props */}
        <RoleSidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          transition: 'all 0.25s ease',
        }}>
          <Header />
          <main
            key={location.pathname}
            className="page-enter page-section"
            style={{ padding: '28px 32px', flex: 1, overflowY: 'auto' }}
          >
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};