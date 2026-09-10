import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  useGetStudentsQuery,
  useGetAttendanceQuery,
  useGetAttendanceSummaryQuery,
} from '../../store';
import { AlertTriangle, Calendar, CheckCircle2, XCircle, Clock, MinusCircle } from 'lucide-react';

type AttStatus = 'present' | 'absent' | 'late' | 'na';

const STATUS_CONFIG: Record<AttStatus, { bg: string; border: string; color: string; label: string; name: string }> = {
  present: { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.25)', color: '#22c55e', label: 'P', name: 'Present' },
  absent: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.25)', color: '#ef4444', label: 'A', name: 'Absent' },
  late: { bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.25)', color: '#d97706', label: 'L', name: 'Late' },
  na: { bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8', label: 'NA', name: 'No Attendance' },
};

const StatusCell = ({ status }: { status?: AttStatus | '-' }) => {
  if (!status || status === '-') {
    return (
      <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>—</td>
    );
  }
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.na;
  return (
    <td style={{ padding: '8px', textAlign: 'center' }}>
      <span
        title={cfg.name}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 30,
          height: 30,
          borderRadius: 8,
          backgroundColor: cfg.bg,
          border: `1px solid ${cfg.border}`,
          color: cfg.color,
          fontSize: 11,
          fontWeight: 700,
          fontFamily: 'IBM Plex Mono, monospace',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          cursor: 'default',
        }}
      >
        {cfg.label}
      </span>
    </td>
  );
};

const MyAttendancePage = () => {
  const { user } = useAuth();
  const { data: studentsData, isLoading: loadingStudent } = useGetStudentsQuery({ email: user?.email });
  const student = studentsData?.data?.[0] ?? null;

  const { data: logsData, isLoading: loadingLogs, error: logsError } = useGetAttendanceQuery();
  const { data: summariesData, isLoading: loadingSummaries, error: summariesError } = useGetAttendanceSummaryQuery(student?._id, { skip: !student?._id });

  const logs = logsData ?? [];
  const summaries = summariesData ?? [];
  const loading = loadingStudent || loadingLogs || loadingSummaries;
  const error = (logsError || summariesError) ? 'Failed to load attendance records.' : null;
  const [activeTab, setActiveTab] = useState(0);

  if (loading) {
    return (
      <div className="page-section" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="skeleton" style={{ height: 110, borderRadius: 'var(--radius-xl)' }} />
        <div className="skeleton" style={{ height: 48, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton" style={{ height: 320, borderRadius: 'var(--radius-xl)' }} />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="page-section">
        <div className="flex-between animate-fade-in">
          <div>
            <p className="text-eyebrow">Attendance Tracking</p>
            <h1 className="text-title" style={{ marginTop: 4 }}>My Attendance</h1>
          </div>
        </div>
        <div className="empty-state card animate-fade-up" style={{ marginTop: 20 }}>
          <AlertTriangle size={32} style={{ color: 'var(--text-muted)', marginBottom: 12, opacity: 0.6 }} />
          <p className="empty-state-title">No Student Profile Found</p>
          <p className="empty-state-body">Please complete your student profile setup to view attendance records.</p>
        </div>
      </div>
    );
  }

  // Attendance metrics calculation
  const totalClasses = logs.length;
  const presentCount = logs.filter(l => l.status === 'present').length;
  const lateCount = logs.filter(l => l.status === 'late').length;
  const absentCount = logs.filter(l => l.status === 'absent').length;
  const naCount = totalClasses === 0 ? 0 : Math.max(0, totalClasses - presentCount - absentCount - lateCount);

  const avgPct = totalClasses > 0
    ? Math.round(((presentCount + lateCount) / totalClasses) * 100)
    : 0;

  // Selected course tab processing
  const activeSummary = summaries[activeTab];
  const courseLogs = activeSummary
    ? logs.filter(l => l.courseId === activeSummary.courseId || l.courseName === activeSummary.courseName)
    : [];

  const byDate: Record<string, any[]> = {};
  courseLogs.forEach(log => {
    const d = new Date(log.date).toISOString().split('T')[0];
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(log);
  });

  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  // Determine dynamic slots from recorded logs or generate default slots
  const detectedSlots = Array.from(
    new Set(courseLogs.map(l => l.slot).filter(Boolean))
  );

  const maxSlotCount = Math.max(1, ...Object.values(byDate).map(v => v.length));

  const slots = detectedSlots.length > 0
    ? detectedSlots
    : Array.from({ length: Math.min(maxSlotCount, 6) }, (_, i) => `Slot ${i + 1}`);

  return (
    <div className="page-section" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div className="flex-between animate-fade-in">
        <div>
          <p className="text-eyebrow">Attendance Tracking</p>
          <h1 className="text-title" style={{ marginTop: 4 }}>My Attendance</h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="text-caption">Overall Score</p>
          <p style={{
            fontSize: 20,
            fontWeight: 800,
            fontFamily: 'IBM Plex Mono, monospace',
            color: avgPct >= 85 ? 'var(--success)' : avgPct >= 75 ? 'var(--accent)' : 'var(--error)',
            margin: 0,
          }}>
            {avgPct}%
          </p>
        </div>
      </div>

      {error && (
        <div className="alert-error animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Top Overview Metric Card */}
      <div className="card animate-fade-up" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div className="flex-between" style={{ marginBottom: 8 }}>
            <span className="text-subheading" style={{ color: 'var(--text-secondary)' }}>Overall Course Attendance</span>
            <span style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 15,
              fontWeight: 700,
              color: avgPct >= 85 ? 'var(--success)' : avgPct >= 75 ? 'var(--accent)' : 'var(--error)',
            }}>
              {avgPct}%
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 999, backgroundColor: 'var(--border)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${avgPct}%`,
              borderRadius: 999,
              backgroundColor: avgPct >= 85 ? '#22c55e' : avgPct >= 75 ? 'var(--accent)' : '#ef4444',
              transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }} />
          </div>
        </div>

        {/* Counter Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
          <div style={{ padding: '10px 14px', borderRadius: 10, backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={14} style={{ color: '#22c55e' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Present</span>
            </div>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{presentCount}</span>
          </div>

          <div style={{ padding: '10px 14px', borderRadius: 10, backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <XCircle size={14} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Absent</span>
            </div>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, fontWeight: 700, color: '#ef4444' }}>{absentCount}</span>
          </div>

          <div style={{ padding: '10px 14px', borderRadius: 10, backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} style={{ color: '#d97706' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Late</span>
            </div>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, fontWeight: 700, color: '#d97706' }}>{lateCount}</span>
          </div>

          <div style={{ padding: '10px 14px', borderRadius: 10, backgroundColor: 'var(--bg-base)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MinusCircle size={14} style={{ color: '#94a3b8' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Unmarked</span>
            </div>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>{naCount}</span>
          </div>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
          <strong>Legend:</strong> <span style={{ color: '#22c55e' }}>P</span> = Present · <span style={{ color: '#ef4444' }}>A</span> = Absent · <span style={{ color: '#d97706' }}>L</span> = Late · <span style={{ color: '#94a3b8' }}>NA</span> = No Attendance · — = No Lecture Scheduled
        </p>
      </div>

      {/* Course Navigation Tabs */}
      {summaries.length > 0 && (
        <div className="animate-fade-up" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {summaries.map((s, i) => {
            const isActive = activeTab === i;
            return (
              <button
                key={s.courseId || i}
                onClick={() => setActiveTab(i)}
                style={{
                  padding: '9px 16px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 12.5,
                  fontWeight: 500,
                  backgroundColor: isActive ? 'var(--accent)' : 'var(--bg-card)',
                  color: isActive ? '#000' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--accent)' : '1px solid var(--border-strong)',
                  boxShadow: isActive ? '0 2px 8px rgba(217, 119, 6, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: 10.5,
                  fontWeight: 700,
                  opacity: isActive ? 0.9 : 0.7,
                }}>
                  {s.courseCode}
                </span>
                <span>{s.courseName}</span>
                <span style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  fontFamily: 'IBM Plex Mono, monospace',
                  padding: '1px 6px',
                  borderRadius: 4,
                  backgroundColor: isActive ? 'rgba(0,0,0,0.15)' : 'var(--bg-base)',
                  color: isActive ? '#000' : s.percentage >= 75 ? 'var(--success)' : 'var(--error)',
                }}>
                  {s.percentage}%
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Course Attendance Breakdown Card */}
      {activeSummary && (
        <div className="card animate-fade-up" style={{ padding: 0, overflow: 'hidden' }}>

          {/* Header Strip */}
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--accent)',
                backgroundColor: 'rgba(217,119,6,0.1)',
                border: '1px solid rgba(217,119,6,0.2)',
                padding: '3px 8px',
                borderRadius: 6,
              }}>
                {activeSummary.courseCode}
              </span>
              <h3 className="text-heading" style={{ margin: 0 }}>{activeSummary.courseName}</h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 14, fontWeight: 700, color: '#22c55e', margin: 0 }}>{activeSummary.present}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>Present</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 14, fontWeight: 700, color: '#ef4444', margin: 0 }}>{activeSummary.absent}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>Absent</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 14, fontWeight: 700, color: '#d97706', margin: 0 }}>{activeSummary.late}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>Late</p>
                </div>
              </div>

              <div style={{
                padding: '6px 14px',
                borderRadius: 8,
                backgroundColor: activeSummary.percentage >= 85 ? 'rgba(34, 197, 94, 0.1)'
                  : activeSummary.percentage >= 75 ? 'rgba(217,119,6,0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${activeSummary.percentage >= 85 ? 'rgba(34, 197, 94, 0.3)' : activeSummary.percentage >= 75 ? 'rgba(217,119,6,0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}>
                <p style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: 16,
                  fontWeight: 800,
                  color: activeSummary.percentage >= 85 ? '#22c55e' : activeSummary.percentage >= 75 ? 'var(--accent)' : '#ef4444',
                  margin: 0,
                }}>
                  {activeSummary.percentage}%
                </p>
              </div>
            </div>
          </div>

          {/* Matrix Table */}
          {sortedDates.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 24px' }}>
              <Calendar size={28} style={{ color: 'var(--text-muted)', marginBottom: 8, opacity: 0.5 }} />
              <p className="empty-state-title">No attendance records found</p>
              <p className="empty-state-body">Attendance logs for this course will appear here once marked.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
                    <th className="table-header" style={{ minWidth: 120, paddingLeft: 22, textAlign: 'left' }}>Date</th>
                    {slots.map(s => (
                      <th key={s} className="table-header" style={{ textAlign: 'center', minWidth: 80 }}>{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedDates.map((dateStr, i) => {
                    const dayLogs = byDate[dateStr];
                    const d = new Date(dateStr);
                    const dayLabel = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                    const weekday = d.toLocaleDateString('en-IN', { weekday: 'short' });

                    return (
                      <tr
                        key={dateStr}
                        style={{
                          borderBottom: i < sortedDates.length - 1 ? '1px solid var(--border)' : 'none',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '12px 22px' }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0, fontFamily: 'IBM Plex Mono, monospace' }}>{dayLabel}</p>
                          <p style={{ fontSize: 10.5, color: 'var(--text-muted)', margin: 0 }}>{weekday}</p>
                        </td>
                        {slots.map((slotName, si) => {
                          // Find log matching current slot name or fallback to index-based log
                          const log = dayLogs.find(l => l.slot === slotName) || dayLogs[si];
                          if (!log) return <td key={si} style={{ padding: '12px 8px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>—</td>;
                          return <StatusCell key={si} status={log.status as AttStatus} />;
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Shortage Warning */}
          {activeSummary.percentage < 75 && (
            <div style={{ padding: '12px 22px', borderTop: '1px solid var(--border)', backgroundColor: 'rgba(239, 68, 68, 0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={15} style={{ color: '#ef4444', flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: '#ef4444', margin: 0, fontWeight: 500 }}>
                Low Attendance Alert: Attendance in <strong>{activeSummary.courseName}</strong> is below 75%. Please speak to your course instructor.
              </p>
            </div>
          )}
        </div>
      )}

      {totalClasses === 0 && !loading && (
        <div className="empty-state card animate-fade-up">
          <Calendar size={28} style={{ color: 'var(--text-muted)', marginBottom: 8, opacity: 0.5 }} />
          <p className="empty-state-title">No attendance recorded yet</p>
          <p className="empty-state-body">Attendance records will appear here once submitted by your teachers.</p>
        </div>
      )}

    </div>
  );
};

export default MyAttendancePage;