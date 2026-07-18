import { Calendar, Clock, Users, TrendingUp } from 'lucide-react';

const MOCK_ATTENDANCE = [
  { subject: 'Data Structures',    present: 42, total: 48, pct: 87 },
  { subject: 'Advanced Calculus',  present: 38, total: 48, pct: 79 },
  { subject: 'Physics Lab',        present: 45, total: 48, pct: 93 },
  { subject: 'Literature',         present: 31, total: 48, pct: 64 },
  { subject: 'Computer Networks',  present: 44, total: 48, pct: 91 },
];

const AttendancePage = () => {
  return (
    <div className="page-section">

      {/* Header */}
      <div className="flex-between animate-fade-in">
        <div>
          <p className="text-eyebrow">Tracking</p>
          <h1 className="text-title" style={{ marginTop: 4 }}>Attendance</h1>
        </div>
        <span className="badge badge-yellow">Coming Soon</span>
      </div>

      {/* Summary cards */}
      <div className="bento-4 stagger animate-fade-up">
        {[
          { icon: Users,     label: 'Total Students', value: '247',   color: '#eab308' },
          { icon: Calendar,  label: 'Classes Today',  value: '8',     color: '#3b82f6' },
          { icon: TrendingUp,label: 'Avg Attendance',  value: '83%',   color: '#22c55e' },
          { icon: Clock,     label: 'Late Arrivals',   value: '12',    color: '#a855f7' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: 2, backgroundColor: s.color, opacity: 0.5,
              borderRadius: '20px 20px 0 0',
            }} />
            <div className="flex-between">
              <p className="stat-card-label">{s.label}</p>
              <div
                className="stat-card-icon"
                style={{ backgroundColor: s.color + '15' }}
              >
                <s.icon size={15} style={{ color: s.color }} />
              </div>
            </div>
            <p className="stat-card-value" style={{ marginTop: 10 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Per-course breakdown */}
      <div className="card animate-fade-up" style={{ padding: 0, overflow: 'hidden', animationDelay: '80ms' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
          <p className="text-eyebrow">Breakdown</p>
          <h3 className="text-heading" style={{ marginTop: 4 }}>Attendance by Course</h3>
        </div>

        <div className="stagger">
          {MOCK_ATTENDANCE.map((row, i) => (
            <div
              key={i}
              className="animate-fade-up"
              style={{
                padding: '16px 24px',
                borderBottom: i < MOCK_ATTENDANCE.length - 1
                  ? '1px solid var(--border)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div className="flex-between">
                <p className="text-body" style={{ fontWeight: 500 }}>{row.subject}</p>
                <div className="flex-start" style={{ gap: 10 }}>
                  <span className="text-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {row.present}/{row.total} classes
                  </span>
                  <span className={`badge ${
                    row.pct >= 85 ? 'badge-green'
                    : row.pct >= 75 ? 'badge-yellow'
                    : 'badge-red'
                  }`}>
                    {row.pct}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{
                height: 4, borderRadius: 99,
                backgroundColor: 'var(--border)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${row.pct}%`,
                  borderRadius: 99,
                  backgroundColor: row.pct >= 85
                    ? 'var(--success)'
                    : row.pct >= 75
                    ? 'var(--accent)'
                    : 'var(--error)',
                  transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coming soon notice */}
      <div
        className="card animate-fade-up"
        style={{
          padding: '28px 24px',
          textAlign: 'center',
          animationDelay: '120ms',
          border: '1px dashed var(--border-strong)',
          boxShadow: 'none',
          backgroundColor: 'transparent',
        }}
      >
        <Calendar size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', opacity: 0.4 }} />
        <p className="text-heading">Full Attendance Module Coming Soon</p>
        <p className="text-caption" style={{ marginTop: 6 }}>
          Mark attendance, view history, and export reports — in the next release.
        </p>
      </div>

    </div>
  );
};

export default AttendancePage;