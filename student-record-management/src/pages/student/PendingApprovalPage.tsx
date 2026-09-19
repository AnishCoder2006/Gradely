import { useEffect, useState } from 'react';
import { Clock, LogOut, CheckCircle, RefreshCw, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { baseApi, useAppDispatch } from '../../store';

const PendingApprovalPage = () => {
  const { user, logout } = useAuth();
  const dispatch = useAppDispatch();
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'active' | 'inactive'>(
    (user?.approvalStatus as any) ?? 'pending'
  );
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Poll every 30 seconds to see if admin has approved
  useEffect(() => {
    const poll = async () => {
      try {
        const result = await dispatch(baseApi.endpoints.getCurrentUser.initiate(undefined, { forceRefetch: true })).unwrap();
        if (result.approvalStatus === 'active') {
          setApprovalStatus('active');
          // Reload the app so routing re-evaluates with the new status
          window.location.reload();
        } else if (result.approvalStatus === 'inactive') {
          setApprovalStatus('inactive');
        }
      } catch {
        // ignore
      }
    };

    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleCheckNow = async () => {
    setChecking(true);
    try {
      const result = await dispatch(baseApi.endpoints.getCurrentUser.initiate(undefined, { forceRefetch: true })).unwrap();
      setLastChecked(new Date());
      if (result.approvalStatus === 'active') {
        setApprovalStatus('active');
        window.location.reload();
      } else {
        setApprovalStatus((result.approvalStatus as any) ?? 'pending');
      }
    } catch {
      // ignore
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, #1e1b4b 0%, #0a0f1e 40%, #020617 100%)',
      padding: '24px 16px',
      fontFamily: 'Instrument Sans, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background Glows */}
      <div style={{
        position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(234,179,8,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', left: '-10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)',
        pointerEvents: 'none', filter: 'blur(60px)',
      }} />

      <div style={{ width: '100%', maxWidth: 480, zIndex: 1 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18,
            background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 14px 32px -6px rgba(234,179,8,0.45)',
          }}>
            <GraduationCap size={30} color="#fff" />
          </div>
          <h1 style={{
            fontSize: 30, fontWeight: 600, color: '#fff',
            letterSpacing: '-0.01em', margin: '0 0 4px',
            fontFamily: 'Fraunces, Georgia, serif',
          }}>
            Registration Submitted
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Awaiting Admin Approval
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: 'rgba(18, 20, 29, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 24,
          padding: '32px 28px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}>
          {/* Status Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, marginBottom: 24,
            padding: '14px 20px', borderRadius: 14,
            backgroundColor: approvalStatus === 'inactive'
              ? 'rgba(239,68,68,0.1)'
              : 'rgba(234,179,8,0.1)',
            border: `1px solid ${approvalStatus === 'inactive' ? 'rgba(239,68,68,0.25)' : 'rgba(234,179,8,0.25)'}`,
          }}>
            <Clock size={18} color={approvalStatus === 'inactive' ? '#ef4444' : '#eab308'} />
            <span style={{
              fontSize: 14, fontWeight: 600,
              color: approvalStatus === 'inactive' ? '#ef4444' : '#eab308',
            }}>
              {approvalStatus === 'inactive'
                ? 'Registration Rejected'
                : 'Approval Pending'}
            </span>
          </div>

          {approvalStatus === 'inactive' ? (
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                Your registration request was <strong style={{ color: '#ef4444' }}>rejected</strong> by an admin.
                Please contact your institution for further assistance.
              </p>
            </div>
          ) : (
            <>
              <p style={{
                color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.7,
                margin: '0 0 22px', textAlign: 'center',
              }}>
                Hello <strong style={{ color: '#fff' }}>{user?.name}</strong>! Your account has been
                registered and is currently <strong style={{ color: '#eab308' }}>waiting for admin approval</strong>.
                You'll get full access to the student portal as soon as your account is approved.
              </p>

              {/* Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {[
                  { done: true,  text: 'Account created successfully' },
                  { done: false, text: 'Admin reviews your registration' },
                  { done: false, text: 'Access granted to student portal' },
                ].map((step, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 10,
                    backgroundColor: step.done ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${step.done ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: step.done ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {step.done
                        ? <CheckCircle size={13} color="#22c55e" />
                        : <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.3)', display: 'inline-block' }} />
                      }
                    </div>
                    <span style={{
                      fontSize: 13, color: step.done ? '#22c55e' : 'rgba(255,255,255,0.55)',
                      fontWeight: step.done ? 500 : 400,
                    }}>
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Check now */}
              <button
                onClick={handleCheckNow}
                disabled={checking}
                style={{
                  width: '100%', padding: '12px 0',
                  borderRadius: 12, border: '1px solid rgba(234,179,8,0.3)',
                  backgroundColor: 'rgba(234,179,8,0.1)',
                  color: '#eab308', fontSize: 14, fontWeight: 600,
                  cursor: checking ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s ease',
                  marginBottom: 12,
                  opacity: checking ? 0.7 : 1,
                }}
                onMouseEnter={e => !checking && ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(234,179,8,0.18)')}
                onMouseLeave={e => !checking && ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(234,179,8,0.1)')}
              >
                <RefreshCw size={15} style={{ animation: checking ? 'spin 1s linear infinite' : 'none' }} />
                {checking ? 'Checking…' : 'Check Approval Status'}
              </button>

              {lastChecked && (
                <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 12px' }}>
                  Last checked: {lastChecked.toLocaleTimeString()}
                </p>
              )}
            </>
          )}

          {/* Logout */}
          <button
            onClick={logout}
            style={{
              width: '100%', padding: '11px 0',
              borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.04)')}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalPage;
