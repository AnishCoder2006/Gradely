import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Eye, EyeOff, GraduationCap, BookOpen, Shield, ArrowRight, KeyRound, ArrowLeft } from 'lucide-react';

type Mode = 'login' | 'register' | 'mfa';

const ROLES: { value: UserRole; label: string; icon: React.ElementType; color: string }[] = [
  {
    value: 'student',
    label: 'Student',
    icon: GraduationCap,
    color: '#22c55e',
  },
  {
    value: 'teacher',
    label: 'Teacher',
    icon: BookOpen,
    color: '#3b82f6',
  },
  {
    value: 'admin',
    label: 'Admin',
    icon: Shield,
    color: '#a855f7',
  },
];

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register, verifyMfa } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'mfa') {
        // Step 2: Verify 6-digit 2FA code
        await verifyMfa(email, mfaCode);
        navigate('/');
      } else if (mode === 'login') {
        // Step 1: Standard credentials check
        const result = await login(email, password);
        if (result?.mfaRequired) {
          setMode('mfa'); // Switch to 2FA verification mode
        } else {
          navigate(result.approvalStatus === 'active' ? '/' : '/pending');
        }
      } else {
        // Registration
        await register(name, email, password, role);
        navigate(role === 'student' ? '/pending' : '/');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    fontFamily: 'inherit',
    fontSize: 14,
    borderRadius: 12,
    border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.1)',
    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255,255,255,0.8)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
    marginBottom: 6,
    textTransform: 'uppercase',
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDark
        ? 'radial-gradient(circle at top right, #1e1b4b 0%, #0a0f1e 40%, #020617 100%), radial-gradient(circle at bottom left, #0d2a2a 0%, transparent 50%)'
        : 'radial-gradient(circle at top, #fefce8 0%, #f0fdf4 50%, #eef2ff 100%)',
      padding: '24px 16px',
      fontFamily: 'Instrument Sans, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background Decorative Glows */}
      <div style={{
        position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)',
        width: '800px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, rgba(79,70,229,0) 70%)',
        pointerEvents: 'none', filter: 'blur(60px)'
      }} />
      <div style={{
        position: 'absolute', bottom: '-5%', left: '-5%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(20,184,166,0.06) 0%, rgba(20,184,166,0) 70%)',
        pointerEvents: 'none', filter: 'blur(60px)'
      }} />
      <div style={{
        position: 'absolute', top: '20%', right: '-10%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, rgba(168,85,247,0) 70%)',
        pointerEvents: 'none', filter: 'blur(60px)'
      }} />

      <div style={{
        width: '100%',
        maxWidth: mode === 'register' ? 460 : 420,
        transition: 'max-width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 1,
      }}>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: mode === 'mfa'
              ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
              : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 55%, #0891b2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: mode === 'mfa'
              ? '0 12px 28px -6px rgba(124, 58, 237, 0.45)'
              : '0 12px 28px -6px rgba(79, 70, 229, 0.42)',
          }}>
            {mode === 'mfa' ? (
              <KeyRound size={28} style={{ color: '#ffffff' }} />
            ) : (
              <GraduationCap size={28} style={{ color: '#ffffff' }} />
            )}
          </div>

          <h1 style={{
            fontSize: 32, fontWeight: 600, color: 'var(--text-primary)',
            letterSpacing: '-0.01em', margin: '0 0 4px 0',
            fontFamily: 'Fraunces, Georgia, serif',
            fontOpticalSizing: 'auto',
            fontVariationSettings: "'SOFT' 60, 'WONK' 1",
          }}>
            {mode === 'mfa' ? 'Two-Factor Auth' : 'Student Records'}
          </h1>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
            textTransform: 'uppercase', color: 'var(--text-secondary)',
            margin: 0, opacity: 0.8,
          }}>
            {mode === 'mfa' ? 'Security Verification' : 'Academic Suite'}
          </p>
        </div>

        {/* Auth Glass Card */}
        <div style={{
          backgroundColor: isDark ? 'rgba(18, 20, 29, 0.5)' : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 24,
          padding: '32px 24px',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.9)',
          boxShadow: isDark
            ? '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : '0 20px 50px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 1)',
        }}>

          {/* Mode Switcher (Hidden in MFA Mode) */}
          {mode !== 'mfa' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
              borderRadius: 12,
              padding: 4,
              marginBottom: 24,
              gap: 4,
            }}>
              {(['login', 'register'] as Mode[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError(null); }}
                  style={{
                    padding: '10px 0',
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    backgroundColor: mode === m
                      ? isDark ? 'rgba(255,255,255,0.1)' : '#ffffff'
                      : 'transparent',
                    color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: mode === m
                      ? isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)'
                      : 'none',
                  }}
                >
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Error Banner */}
              {error && (
                <div style={{
                  padding: '12px 14px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 12,
                  fontSize: 12,
                  color: '#ef4444',
                  animation: 'fade-in 0.2s ease both',
                }}>
                  {error}
                </div>
              )}

              {/* MFA 6-Digit Code Input */}
              {mode === 'mfa' ? (
                <div>
                  <p style={{
                    fontSize: 13, color: 'var(--text-secondary)',
                    textAlign: 'center', marginBottom: 16, marginTop: 0
                  }}>
                    Enter the 6-digit code from your authenticator app for <strong>{email}</strong>
                  </p>
                  <label style={{ ...labelStyle, textAlign: 'center' }}>Authenticator Code</label>
                  <input
                    style={{
                      ...inputStyle,
                      textAlign: 'center',
                      fontSize: 22,
                      letterSpacing: '0.3em',
                      fontWeight: 700,
                    }}
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={mfaCode}
                    onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                    onFocus={e => {
                      e.target.style.borderColor = '#a855f7';
                      e.target.style.boxShadow = '0 0 0 3px rgba(168,85,247,0.15)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              ) : (
                <>
                  {/* Full Name (Register Only) */}
                  {mode === 'register' && (
                    <div>
                      <label style={labelStyle}>Full Name</label>
                      <input
                        style={inputStyle}
                        placeholder="e.g. Arjun Mehta"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        onFocus={e => {
                          e.target.style.borderColor = '#14b8a6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(20,184,166,0.15)';
                        }}
                        onBlur={e => {
                          e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input
                      style={inputStyle}
                      type="email"
                      placeholder="you@college.edu"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      onFocus={e => {
                        e.target.style.borderColor = '#14b8a6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(20,184,166,0.15)';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label style={labelStyle}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        style={{ ...inputStyle, paddingRight: 42 }}
                        type={showPass ? 'text' : 'password'}
                        placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        onFocus={e => {
                          e.target.style.borderColor = '#14b8a6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(20,184,166,0.15)';
                        }}
                        onBlur={e => {
                          e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(p => !p)}
                        style={{
                          position: 'absolute', right: 12, top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none', border: 'none',
                          cursor: 'pointer', padding: 4,
                          color: 'var(--text-muted)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: 6,
                        }}
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Role Cards Selector (Register Only) */}
                  {mode === 'register' && (
                    <div>
                      <label style={labelStyle}>Select Role</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                        {ROLES.map(r => {
                          const selected = role === r.value;
                          const colorMap: { [key: string]: string } = {
                            student: '#22c55e',
                            teacher: '#3b82f6',
                            admin: '#a855f7',
                          };
                          const bgColor = colorMap[r.value];

                          return (
                            <button
                              key={r.value}
                              type="button"
                              onClick={() => setRole(r.value)}
                              style={{
                                padding: '14px 8px',
                                borderRadius: 14,
                                border: selected ? `2px solid ${bgColor}` : isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)',
                                backgroundColor: selected
                                  ? `${bgColor}18`
                                  : isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 8,
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                transform: selected ? 'translateY(-2px)' : 'none',
                                boxShadow: selected ? `0 4px 12px ${bgColor}25` : 'none',
                              }}
                            >
                              <r.icon
                                size={18}
                                style={{ color: selected ? bgColor : 'var(--text-muted)' }}
                              />
                              <span style={{
                                fontSize: 11, fontWeight: 700,
                                color: selected ? bgColor : 'var(--text-secondary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                              }}>
                                {r.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 12,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  backgroundColor: mode === 'mfa' ? '#a855f7' : 'var(--accent)',
                  color: mode === 'mfa' ? '#ffffff' : '#09090b',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 8,
                  boxShadow: mode === 'mfa'
                    ? '0 4px 16px rgba(168,85,247,0.3)'
                    : '0 4px 16px rgba(79,70,229,0.25)',
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: 16, height: 16, borderRadius: '50%',
                      border: '2px solid rgba(0,0,0,0.2)',
                      borderTopColor: mode === 'mfa' ? '#ffffff' : '#09090b',
                      animation: 'btn-spin 0.6s linear infinite',
                      display: 'inline-block',
                    }} />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === 'mfa' ? 'Verify Code' : mode === 'login' ? 'Sign In' : 'Create Account'}
                    </span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

            </div>
          </form>

          {/* Switch Prompt or Back to Login */}
          <div style={{
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--text-muted)',
            marginTop: 24,
          }}>
            {mode === 'mfa' ? (
              <button
                onClick={() => { setMode('login'); setError(null); setMfaCode(''); }}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                  padding: 0, display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            ) : mode === 'login' ? (
              <span>
                Don't have an account?{' '}
                <button
                  onClick={() => { setMode('register'); setError(null); }}
                  style={{
                    background: 'none', border: 'none',
                    color: 'var(--accent)', cursor: 'pointer',
                    fontSize: 12, fontWeight: 700,
                    padding: 0,
                  }}
                >
                  Create one
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('login'); setError(null); }}
                  style={{
                    background: 'none', border: 'none',
                    color: 'var(--accent)', cursor: 'pointer',
                    fontSize: 12, fontWeight: 700,
                    padding: 0,
                  }}
                >
                  Sign in
                </button>
              </span>
            )}
          </div>

        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center', fontSize: 11,
          color: 'var(--text-muted)', marginTop: 20,
          opacity: 0.7, fontWeight: 700, letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Academic Year 2025–26
        </p>

      </div>
    </div>
  );
};

export default AuthPage;
