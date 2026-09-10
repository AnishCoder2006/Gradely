import { PanelLeftClose, PanelLeft, MoreVertical, Menu } from 'lucide-react';

interface SidebarToggleProps {
  isCollapsed: boolean;
  onToggle: () => void;
  variant?: 'icon' | 'dots' | 'hamburger';
}

export const SidebarToggle = ({
  isCollapsed,
  onToggle,
  variant = 'icon',
}: SidebarToggleProps) => {
  return (
    <button
      onClick={onToggle}
      aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: 8,
        border: '1px solid var(--border-strong)',
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
        e.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-card)';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
    >
      {variant === 'dots' ? (
        <MoreVertical size={16} />
      ) : variant === 'hamburger' ? (
        <Menu size={16} />
      ) : isCollapsed ? (
        <PanelLeft size={16} />
      ) : (
        <PanelLeftClose size={16} />
      )}
    </button>
  );
};