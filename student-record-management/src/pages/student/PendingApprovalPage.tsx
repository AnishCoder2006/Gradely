import { useAuth } from '../../context/AuthContext';
import { Clock, Mail } from 'lucide-react';

// Shown to students who are not yet approved by admin
const PendingApprovalPage = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #fefce8 0%, #f0fdf4 40%, #eff6ff 100%)',
      padding: 24,
      fontFamily: 'Instrument Sans, sans-serif',
    }}>
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.8)',
        borderRadius: 24,
        boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
        padding: '40px 36px',
        maxWidth: 460,
        width: '100%',
        textAlign: 'center' as const,
        animation: 'scale-in 0.2s cubic-bezier(0.16,1,0.3,1) both',
      }}>

        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          backgroundColor: 'rgba(234,179,8,0.1)',
          border: '2px solid rgba(234,179,8,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          animation: 'pulse-dot 2s ease-in-out infinite',
        }}>
          <Clock size={28} style={{ color: 'var(--accent)' }} />
        </div>

        <p style={{
          fontSize: 9, fontWeight: 600,
          letterSpacing: '0.18em', textTransform: 'uppercase' as const,
          color: 'var(--accent)', margin: '0 0 8px',
        }}>
          Pending Review
        </p>

        <h1 style={{
          fontSize: 22, fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '-0.025em',
          margin: '0 0 12px',
        }}>
          Awaiting Admin Approval
        </h1>

        <p style={{
          fontSize: 13, color: 'var(--text-secondary)',
          lineHeight: 1.6, margin: '0 0 24px',
        }}>
          Hi <strong>{user?.name?.split(' ')[0]}</strong>, your account is under review.
          The admin will verify your details and approve your access shortly.
          You'll be able to view your grades, attendance, and courses once approved.
        </p>

        {/* Status steps */}
        <div style={{
          backgroundColor: 'rgba(0,0,0,0.03)',
          borderRadius: 12, padding: '16px 20px',
          textAlign: 'left' as const,
          marginBottom: 24,
        }}>
          {[
            { label: 'Account created', done: true },
            { label: 'Profile setup', done: false },
            { label: 'Admin approval pending', done: false },
            { label: 'Access granted', done: false },
          ].map((step, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: i < 3 ? 10 : 0,
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                backgroundColor: step.done ? 'var(--success)' : 'var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {step.done && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
              </div>
              <span style={{
                fontSize: 12,
                color: step.done ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: step.done ? 500 : 400,
              }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Contact info */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          justifyContent: 'center',
          fontSize: 12, color: 'var(--text-muted)',
          marginBottom: 24,
        }}>
          <Mail size={13} />
          <span>Contact admin at <strong>admin@college.edu</strong> if this takes too long.</span>
        </div>

        <button
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}
          onClick={logout}
        >
          <span>Sign Out</span>
        </button>

      </div>
    </div>
  );
};

export default PendingApprovalPage;