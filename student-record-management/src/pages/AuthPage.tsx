import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Eye, EyeOff, GraduationCap, BookOpen, Shield } from 'lucide-react';

type Mode = 'login' | 'register';

const ROLES: { value: UserRole; label: string; icon: React.ElementType; desc: string; color: string }[] = [
  {
    value: 'admin',
    label: 'Administrator',
    icon: Shield,
    desc: 'Full system access',
    color: '#eab308',
  },
  {
    value: 'teacher',
    label: 'Teacher',
    icon: BookOpen,
    desc: 'Manage courses & grades',
    color: '#3b82f6',
  },
  {
    value: 'student',
    label: 'Student',
    icon: GraduationCap,
    desc: 'View records & grades',
    color: '#22c55e',
  },
];

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [mode, setMode]           = useState<Mode>('login');
  const [role, setRole]           = useState<UserRole>('student');
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const glass = {
    backgroundColor: isDark ? 'rgba(17,17,20,0.75)' : 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.8)',
    boxShadow: isDark
      ? '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)'
      : '0 8px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password, role);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 13px',
    fontFamily: 'Geist, sans-serif',
    fontSize: 13,
    borderRadius: 8,
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.12)',
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.04em',
    color: 'var(--text-secondary)',
    marginBottom: 5,
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDark
        ? 'linear-gradient(135deg, #0a0f1e 0%, #081a0e 50%, #0a0f1e 100%)'
        : 'linear-gradient(135deg, #fefce8 0%, #f0fdf4 50%, #eff6ff 100%)',
      padding: 16,
      fontFamily: 'Geist, sans-serif',
    }}>

      {/* Decorative blobs */}
      <div style={{
        position: 'fixed', top: '-10%', left: '-5%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(234,179,8,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', right: '-5%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: mode === 'register' ? 480 : 420,
        animation: 'scale-in 0.2s cubic-bezier(0.16,1,0.3,1) both',
      }}>

        {/* Logo / brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #eab308, #ca8a04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 8px 24px rgba(234,179,8,0.35)',
          }}>
            <GraduationCap size={26} style={{ color: '#09090b' }} />
          </div>
          <p style={{
            fontSize: 9, fontWeight: 600,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--accent)', margin: '0 0 4px',
          }}>
            Academic Suite
          </p>
          <h1 style={{
            fontSize: 22, fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.025em', margin: 0,
          }}>
            Student Records
          </h1>
        </div>

        {/* Card */}
        <div style={{ ...glass, borderRadius: 24, padding: 28 }}>

          {/* Mode tabs */}
          <div style={{
            display: 'flex',
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            borderRadius: 10,
            padding: 3,
            marginBottom: 24,
          }}>
            {(['login', 'register'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                style={{
                  flex: 1,
                  padding: '7px 0',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: 'Geist, sans-serif',
                  transition: 'all 0.15s',
                  backgroundColor: mode === m
                    ? isDark ? 'rgba(255,255,255,0.1)' : '#ffffff'
                    : 'transparent',
                  color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: mode === m
                    ? isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.08)'
                    : 'none',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Error */}
              {error && (
                <div style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--error-bg)',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--error)',
                  animation: 'fade-in 0.2s ease both',
                }}>
                  {error}
                </div>
              )}

              {/* Name — register only */}
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
                      e.target.style.borderColor = 'var(--accent)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(234,179,8,0.1)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)';
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
                    e.target.style.borderColor = 'var(--accent)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(234,179,8,0.1)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={{ ...inputStyle, paddingRight: 40 }}
                    type={showPass ? 'text' : 'password'}
                    placeholder={mode === 'register' ? 'Min. 6 characters' : 'Enter your password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    onFocus={e => {
                      e.target.style.borderColor = 'var(--accent)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(234,179,8,0.1)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    style={{
                      position: 'absolute', right: 11, top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none',
                      cursor: 'pointer', padding: 0,
                      color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Role selector — register only */}
              {mode === 'register' && (
                <div>
                  <label style={labelStyle}>Sign up as</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {ROLES.map(r => {
                      const selected = role === r.value;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setRole(r.value)}
                          style={{
                            flex: 1,
                            padding: '10px 8px',
                            borderRadius: 10,
                            border: selected
                              ? `1.5px solid ${r.color}`
                              : isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)',
                            backgroundColor: selected
                              ? r.color + '14'
                              : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{
                            width: 30, height: 30, borderRadius: 8,
                            backgroundColor: selected ? r.color + '20' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <r.icon
                              size={16}
                              style={{ color: selected ? r.color : 'var(--text-muted)' }}
                            />
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: selected ? r.color : 'var(--text-secondary)',
                            letterSpacing: '0.01em',
                          }}>
                            {r.label}
                          </span>
                          <span style={{
                            fontSize: 10,
                            color: selected ? r.color : 'var(--text-muted)',
                            opacity: 0.8,
                          }}>
                            {r.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  backgroundColor: 'var(--accent)',
                  color: '#09090b',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'Geist, sans-serif',
                  letterSpacing: '-0.01em',
                  transition: 'background 0.15s, box-shadow 0.15s, transform 0.1s',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 4,
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--accent-hover)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(234,179,8,0.35)';
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--accent)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: 14, height: 14, borderRadius: '50%',
                      border: '2px solid rgba(0,0,0,0.2)',
                      borderTopColor: '#09090b',
                      animation: 'btn-spin 0.6s linear infinite',
                      display: 'inline-block',
                    }} />
                    <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                  </>
                ) : (
                  <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                )}
              </button>

            </div>
          </form>

          {/* Footer note */}
          <p style={{
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--text-muted)',
            marginTop: 20,
            marginBottom: 0,
          }}>
            {mode === 'login' ? (
              <span>
                Don't have an account?{' '}
                <button
                  onClick={() => { setMode('register'); setError(null); }}
                  style={{
                    background: 'none', border: 'none',
                    color: 'var(--accent)', cursor: 'pointer',
                    fontSize: 11, fontWeight: 600,
                    fontFamily: 'Geist, sans-serif',
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
                    fontSize: 11, fontWeight: 600,
                    fontFamily: 'Geist, sans-serif',
                    padding: 0,
                  }}
                >
                  Sign in
                </button>
              </span>
            )}
          </p>

        </div>

        {/* Bottom caption */}
        <p style={{
          textAlign: 'center', fontSize: 11,
          color: 'var(--text-muted)', marginTop: 16,
        }}>
          <span>Academic Year 2025–26</span>
        </p>

      </div>
    </div>
  );
};

export default AuthPage;