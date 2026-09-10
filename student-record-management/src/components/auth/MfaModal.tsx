// src/components/auth/MfaModal.tsx
import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface MfaModalProps {
  isOpen: boolean;
  email: string;
  onVerify: (code: string) => void;
  onClose: () => void;
}

export const MfaModal = ({ isOpen, email, onVerify, onClose }: MfaModalProps) => {
  const [code, setCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      onVerify(code);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 28, width: 380, textAlign: 'center',
        boxShadow: 'var(--shadow-dropdown)',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#6366f1',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 14,
        }}>
          <ShieldCheck size={24} />
        </div>

        <h3 style={{ margin: '0 0 6px 0', fontSize: 18, color: 'var(--text-primary)' }}>
          Two-Factor Authentication
        </h3>
        <p style={{ margin: '0 0 20px 0', fontSize: 12, color: 'var(--text-muted)' }}>
          Logging in as <strong>{email}</strong>. Enter the 6-digit code from your authenticator app.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            style={{
              width: '100%', height: 46, textAlign: 'center',
              letterSpacing: '0.4em', fontSize: 22, fontFamily: 'IBM Plex Mono, monospace',
              backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text-primary)', marginBottom: 18,
              outline: 'none',
            }}
          />

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, height: 40, borderRadius: 8,
                backgroundColor: 'transparent', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', fontWeight: 500, fontSize: 13, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={code.length !== 6}
              style={{
                flex: 1, height: 40, borderRadius: 8,
                backgroundColor: '#6366f1', color: '#fff', border: 'none',
                fontWeight: 600, fontSize: 13, cursor: code.length === 6 ? 'pointer' : 'not-allowed',
                opacity: code.length === 6 ? 1 : 0.5,
              }}
            >
              Verify Code
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};