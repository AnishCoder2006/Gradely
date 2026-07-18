import { ReactNode } from 'react';

export const SettingsSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="card animate-fade-up" style={{ padding: 0, overflow: 'hidden' }}>
    <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border)' }}>
      <p className="text-heading">{title}</p>
    </div>
    <div>{children}</div>
  </div>
);

export const SettingsRow = ({
  icon: Icon, label, description, action,
}: {
  icon: React.ElementType; label: string; description?: string; action: ReactNode;
}) => (
  <div className="flex-between" style={{ padding: '14px 22px', borderBottom: '1px solid var(--border)', gap: 16 }}>
    <div className="flex-start" style={{ gap: 12 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={15} style={{ color: 'var(--text-secondary)' }} />
      </div>
      <div>
        <p className="text-body" style={{ fontWeight: 500 }}>{label}</p>
        {description && <p className="text-caption" style={{ marginTop: 1 }}>{description}</p>}
      </div>
    </div>
    <div style={{ flexShrink: 0 }}>{action}</div>
  </div>
);

export const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    role="switch"
    aria-checked={checked}
    style={{
      width: 40, height: 22, borderRadius: 99,
      backgroundColor: checked ? 'var(--accent)' : 'var(--border-strong)',
      border: 'none', cursor: 'pointer', position: 'relative',
      transition: 'background 0.2s ease', flexShrink: 0,
    }}
  >
    <span style={{
      position: 'absolute', top: 3, left: checked ? 21 : 3,
      width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff',
      transition: 'left 0.2s cubic-bezier(0.16,1,0.3,1)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }} />
  </button>
);