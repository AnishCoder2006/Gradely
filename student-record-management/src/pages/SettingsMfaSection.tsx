import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEnableMfaMutation, baseApi } from '../store';
import { useAppDispatch } from '../store';
import { Shield, CheckCircle, QrCode, AlertCircle } from 'lucide-react';

export const SettingsMfaSection = () => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfaEnabled || false);

  const [enableMfa] = useEnableMfaMutation();

  // MFA is restricted to Teachers and Admins only
  if (user?.role === 'student') return null;

  const handleStartSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dispatch(baseApi.endpoints.setupMfa.initiate()).unwrap();
      if (res) {
        setQrCodeUrl(res.qrCodeUrl);
        setSecret(res.secret);
      }
    } catch (err: any) {
      setError(err?.data?.message || err?.message || 'Failed to start MFA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || !secret) return;

    setLoading(true);
    setError(null);
    try {
      await enableMfa({ secret, code }).unwrap();
      setMfaEnabled(true);
      setQrCodeUrl(null);
    } catch (err: any) {
      setError(err?.data?.message || err?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: 24,
        borderRadius: 12,
        border: '1px solid var(--border)',
        backgroundColor: 'var(--bg-card)',
        marginTop: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Shield size={20} style={{ color: '#6366f1' }} />
        <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)', fontWeight: 600 }}>
          Two-Factor Authentication (MFA)
        </h3>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.5 }}>
        Add an extra layer of security to your account. When logging in as an{' '}
        <strong style={{ color: 'var(--text-primary)', textTransform: 'uppercase' }}>{user?.role}</strong>,
        you will be required to enter a 6-digit verification code from your authenticator app.
      </p>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 8,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {mfaEnabled ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 8,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            color: '#10b981',
          }}
        >
          <CheckCircle size={18} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            Two-Factor Authentication is currently enabled on your account.
          </span>
        </div>
      ) : qrCodeUrl ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <img
              src={qrCodeUrl}
              alt="MFA Setup QR Code"
              style={{
                width: 140,
                height: 140,
                borderRadius: 8,
                border: '1px solid var(--border)',
                padding: 6,
                backgroundColor: '#ffffff',
              }}
            />
            <div>
              <p style={{ margin: '0 0 6px 0', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                1. Scan the QR Code
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                Open Google Authenticator, Authy, or 1Password on your phone and scan this code.
              </p>
              {secret && (
                <p style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--text-muted)', margin: 0 }}>
                  Manual key: <strong>{secret}</strong>
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleVerifySetup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              2. Enter Verification Code
            </p>
            <div style={{ display: 'flex', gap: 10, maxWidth: 320 }}>
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                style={{
                  flex: 1,
                  height: 40,
                  padding: '0 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-base)',
                  color: 'var(--text-primary)',
                  textAlign: 'center',
                  fontSize: 16,
                  fontFamily: 'IBM Plex Mono, monospace',
                  letterSpacing: '0.2em',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                style={{
                  height: 40,
                  padding: '0 20px',
                  borderRadius: 8,
                  backgroundColor: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: code.length === 6 ? 'pointer' : 'not-allowed',
                  opacity: code.length === 6 ? 1 : 0.5,
                }}
              >
                {loading ? 'Verifying...' : 'Enable 2FA'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={handleStartSetup}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            height: 38,
            padding: '0 16px',
            borderRadius: 8,
            backgroundColor: '#6366f1',
            color: '#ffffff',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.15s ease',
          }}
        >
          <QrCode size={16} />
          <span>{loading ? 'Loading...' : 'Set Up Two-Factor Authentication'}</span>
        </button>
      )}
    </div>
  );
};