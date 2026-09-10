import {
  createContext, useContext, ReactNode, useMemo,
} from 'react';
import { useToast, Toast, ToastType } from './hooks/useToast';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastContextType {
  success: (msg: string) => void;
  error: (msg: string) => void;
  warning: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_CONFIG: Record<ToastType, {
  icon: React.ElementType;
  bg: string;
  border: string;
  color: string;
}> = {
  success: { icon: CheckCircle, bg: 'var(--success-bg)', border: '#86efac', color: 'var(--success)' },
  error: { icon: XCircle, bg: 'var(--error-bg)', border: '#fca5a5', color: 'var(--error)' },
  warning: { icon: AlertTriangle, bg: 'var(--warning-bg)', border: '#fcd34d', color: 'var(--warning)' },
  info: { icon: Info, bg: 'rgba(59,130,246,0.08)', border: '#93c5fd', color: '#3b82f6' },
};

const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: () => void }) => {
  const cfg = TOAST_CONFIG[toast.type];
  const Icon = cfg.icon;

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '12px 14px',
      backgroundColor: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 10,
      boxShadow: 'var(--shadow-raised)',
      minWidth: 280, maxWidth: 380,
      animation: 'slide-in-right 0.22s cubic-bezier(0.16,1,0.3,1) both',
      fontFamily: 'Instrument Sans, sans-serif',
    }}>
      <Icon size={15} style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }} />
      <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, flex: 1, lineHeight: 1.4 }}>
        {toast.message}
      </p>
      <button
        onClick={onRemove}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 0, color: 'var(--text-muted)', flexShrink: 0,
          display: 'flex', alignItems: 'center',
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const { toasts, removeToast, success, error, warning, info } = useToast();
  const actions = useMemo(() => ({ success, error, warning, info }), [success, error, warning, info]);

  return (
    <ToastContext.Provider value={actions}>
      {children}

      {/* Toast container */}
      <div style={{
        position: 'fixed',
        bottom: 24, right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToastContext = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext must be used within ToastProvider');
  return ctx;
};