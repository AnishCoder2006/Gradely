import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import { attendanceService } from '../../services/attendanceService';
import { Student } from '../../types/student.types';
import { AlertCircle } from 'lucide-react';

type AttStatus = 'present' | 'absent' | 'late' | 'na';

const STATUS_COLOR: Record<AttStatus, { bg: string; color: string; label: string }> = {
  present: { bg: 'rgba(22,163,74,0.1)',   color: '#16a34a', label: 'P'  },
  absent:  { bg: 'rgba(220,38,38,0.1)',   color: '#dc2626', label: 'A'  },
  late:    { bg: 'rgba(234,179,8,0.12)',  color: '#ca8a04', label: 'L'  },
  na:      { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', label: 'NA' },
};

const Cell = ({ status }: { status: AttStatus | '-' }) => {
  if (status === '-') return (
    <td style={{ padding: '10px 8px', textAlign: 'center' as const, fontSize: 13, color: 'var(--text-muted)' }}>—</td>
  );
  const cfg = STATUS_COLOR[status];
  return (
    <td style={{ padding: '8px', textAlign: 'center' as const }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, borderRadius: 6,
        backgroundColor: cfg.bg, color: cfg.color,
        fontSize: 11, fontWeight: 700,
        fontFamily: 'Geist Mono, monospace',
      }}>
        {cfg.label}
      </span>
    </td>
  );
};

const MyAttendancePage = () => {
  const { user } = useAuth();
  const [student, setStudent]     = useState<Student | null>(null);
  const [logs, setLogs]           = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0); // index into summaries

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email) return;
      try {
        setLoading(true);
        const data = await studentService.getAll({ email: user.email });
        const rec = data[0] ?? null;
        if (!rec) { setLoading(false); return; }
        setStudent(rec);
        const [allLogs, courseSummaries] = await Promise.all([
          attendanceService.getAll(),
          attendanceService.getSummary(rec._id),
        ]);
        setLogs(allLogs);
        setSummaries(courseSummaries);
      } catch {
        setError('Failed to load attendance.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return (
    <div className="page-section">
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16, marginBottom: 12 }} />)}
    </div>
  );

  if (!student) return (
    <div className="page-section">
      <div className="flex-between animate-fade-in">
        <div><p className="text-eyebrow">Attendance</p><h1 className="text-title" style={{ marginTop: 4 }}>My Attendance</h1></div>
      </div>
      <div className="empty-state card animate-fade-up" style={{ marginTop: 20 }}>
        <AlertCircle size={28} style={{ color: 'var(--text-muted)', marginBottom: 12, opacity: 0.5 }} />
        <p className="empty-state-title">No Student Profile Found</p>
        <p className="empty-state-body">Complete your profile setup to view attendance.</p>
      </div>
    </div>
  );

  // Total stats across all courses
  const totalClasses = logs.length;
  const presentCount = logs.filter(l => l.status === 'present').length;
  const lateCount    = logs.filter(l => l.status === 'late').length;
  const absentCount  = logs.filter(l => l.status === 'absent').length;
  const avgPct = totalClasses > 0
    ? Math.round(((presentCount + lateCount) / totalClasses) * 100)
    : 0;

  // For the selected course tab — build date×slot grid
  const activeSummary = summaries[activeTab];
  const courseLogs = activeSummary
    ? logs.filter(l => l.courseId === activeSummary.courseId || l.courseName === activeSummary.courseName)
    : [];

  // Group by date
  const byDate: Record<string, any[]> = {};
  courseLogs.forEach(log => {
    const d = new Date(log.date).toISOString().split('T')[0];
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(log);
  });
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));
  const maxSlots = Math.max(1, ...Object.values(byDate).map(v => v.length));
  const slots = Array.from({ length: Math.min(maxSlots, 6) }, (_, i) => `Slot ${i + 1}`);

  return (
    <div className="page-section">

      {/* Header */}
      <div className="flex-between animate-fade-in">
        <div>
          <p className="text-eyebrow">Attendance Tracking</p>
          <h1 className="text-title" style={{ marginTop: 4 }}>My Attendance</h1>
        </div>
        <div style={{ textAlign: 'right' as const }}>
          <p className="text-caption">Overall</p>
          <p style={{
            fontSize: 18, fontWeight: 700,
            fontFamily: 'Geist Mono, monospace',
            color: avgPct >= 75 ? 'var(--success)' : 'var(--error)',
            margin: 0,
          }}>
            {avgPct}%
          </p>
        </div>
      </div>

      {error && <div className="alert-error animate-fade-in">{error}</div>}

      {/* Overall stats strip */}
      <div className="card animate-fade-up" style={{ padding: '18px 22px' }}>
        {/* Progress bar */}
        <div style={{ marginBottom: 14 }}>
          <div className="flex-between" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Overall Attendance</span>
            <span style={{
              fontFamily: 'Geist Mono, monospace', fontSize: 14, fontWeight: 700,
              color: avgPct >= 85 ? 'var(--success)' : avgPct >= 75 ? 'var(--accent)' : 'var(--error)',
            }}>
              {avgPct}%
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 99, backgroundColor: 'var(--border)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${avgPct}%`,
              borderRadius: 99,
              backgroundColor: avgPct >= 85 ? 'var(--success)' : avgPct >= 75 ? 'var(--accent)' : 'var(--error)',
              transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
            }} />
          </div>
        </div>

        {/* Count grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Present',       value: `${presentCount} / ${totalClasses}`, color: '#16a34a' },
            { label: 'Absent',        value: `${absentCount} / ${totalClasses}`,  color: '#dc2626' },
            { label: 'Late',          value: `${lateCount} / ${totalClasses}`,    color: '#ca8a04' },
            { label: 'No Attendance', value: `${totalClasses === 0 ? 0 : totalClasses - presentCount - absentCount - lateCount} / ${totalClasses}`, color: '#94a3b8' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</span>
              <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{s.value}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '12px 0 0' }}>
          P = Present · A = Absent · L = Late · NA = No Attendance · — = No Lecture
        </p>
      </div>

      {/* Course tabs */}
      {summaries.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }} className="animate-fade-up">
          {summaries.map((s, i) => (
            <button key={s.courseId} onClick={() => setActiveTab(i)} style={{
              padding: '8px 14px', borderRadius: 10, border: 'none',
              cursor: 'pointer', fontSize: 12, fontWeight: 500,
              fontFamily: 'Geist, sans-serif',
              backgroundColor: activeTab === i ? 'var(--accent)' : 'var(--bg-card)',
              color: activeTab === i ? 'var(--text-on-yellow)' : 'var(--text-secondary)',
              border: activeTab === i ? 'none' : '1px solid var(--border-strong)',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{
                fontSize: 10, fontFamily: 'Geist Mono, monospace', fontWeight: 700,
                opacity: 0.8,
              }}>
                {s.courseCode}
              </span>
              <span>{s.courseName}</span>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: activeTab === i ? 'rgba(0,0,0,0.6)'
                  : s.percentage >= 75 ? 'var(--success)' : 'var(--error)',
              }}>
                {s.percentage}%
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Selected course detail */}
      {activeSummary && (
        <div className="card animate-fade-up" style={{ padding: 0, overflow: 'hidden' }}>

          {/* Course header */}
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, fontWeight: 600, color: 'var(--accent)', backgroundColor: 'rgba(234,179,8,0.1)', padding: '2px 8px', borderRadius: 5 }}>
                  {activeSummary.courseCode}
                </span>
                <p className="text-heading" style={{ margin: 0 }}>{activeSummary.courseName}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {[
                { label: 'Present', value: activeSummary.present, color: '#16a34a' },
                { label: 'Absent',  value: activeSummary.absent,  color: '#dc2626' },
                { label: 'Late',    value: activeSummary.late,    color: '#ca8a04' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' as const }}>
                  <p style={{ fontFamily: 'Geist Mono, monospace', fontSize: 15, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>{s.label}</p>
                </div>
              ))}
              <div style={{
                padding: '6px 12px', borderRadius: 8,
                backgroundColor: activeSummary.percentage >= 85 ? 'var(--success-bg)'
                  : activeSummary.percentage >= 75 ? 'rgba(234,179,8,0.1)' : 'var(--error-bg)',
                border: `1px solid ${activeSummary.percentage >= 85 ? '#86efac' : activeSummary.percentage >= 75 ? 'rgba(234,179,8,0.3)' : '#fca5a5'}`,
              }}>
                <p style={{
                  fontFamily: 'Geist Mono, monospace', fontSize: 16, fontWeight: 800,
                  color: activeSummary.percentage >= 85 ? 'var(--success)' : activeSummary.percentage >= 75 ? 'var(--accent)' : 'var(--error)',
                  margin: 0,
                }}>
                  {activeSummary.percentage}%
                </p>
              </div>
            </div>
          </div>

          {/* Date × Slot table */}
          {sortedDates.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 24px' }}>
              <p className="empty-state-title">No attendance records</p>
              <p className="empty-state-body">Attendance will appear once your teacher marks it.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
                    <th className="table-header" style={{ minWidth: 100 }}>Date</th>
                    {slots.map(s => (
                      <th key={s} className="table-header" style={{ textAlign: 'center' as const, minWidth: 64 }}>{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedDates.map((dateStr, i) => {
                    const dayLogs = byDate[dateStr];
                    const d = new Date(dateStr);
                    const dayLabel = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                    const weekday  = d.toLocaleDateString('en-IN', { weekday: 'short' });
                    return (
                      <tr key={dateStr} style={{ borderBottom: i < sortedDates.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(234,179,8,0.025)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <td style={{ padding: '10px 18px' }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0, fontFamily: 'Geist Mono, monospace' }}>{dayLabel}</p>
                          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>{weekday}</p>
                        </td>
                        {slots.map((_, si) => {
                          const log = dayLogs[si];
                          if (!log) return <td key={si} style={{ padding: '10px 8px', textAlign: 'center' as const, fontSize: 13, color: 'var(--text-muted)' }}>—</td>;
                          return <Cell key={si} status={log.status as AttStatus} />;
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Warning */}
          {activeSummary.percentage < 75 && (
            <div style={{ padding: '12px 22px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--error-bg)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} style={{ color: 'var(--error)', flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: 'var(--error)', margin: 0 }}>
                Attendance below 75% — you may face shortage in <strong>{activeSummary.courseName}</strong>. Contact your teacher immediately.
              </p>
            </div>
          )}
        </div>
      )}

      {totalClasses === 0 && !loading && (
        <div className="empty-state card animate-fade-up">
          <p className="empty-state-title">No attendance recorded yet</p>
          <p className="empty-state-body">Attendance will appear here once your teacher marks it.</p>
        </div>
      )}

    </div>
  );
};

export default MyAttendancePage;