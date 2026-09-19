import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  useGetCoursesQuery,
  useGetEnrolledStudentsQuery,
  useGetStudentsQuery,
  useEnrollStudentMutation,
  useUnenrollStudentMutation,
  useMarkAttendanceMutation,
  useCreateGradeMutation,
} from '../../store';
import {
  Search, UserPlus, UserMinus, Award, Calendar,
  CheckCircle, XCircle, Clock, X, AlertCircle, ChevronDown,
} from 'lucide-react';

type AttendanceStatus = 'present' | 'absent' | 'late';

const GRADE_OPTIONS = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'] as const;
type GradeValue = typeof GRADE_OPTIONS[number];

const scoreFromGrade = (g: GradeValue) => {
  const map: Record<GradeValue, number> = {
    'A+': 97, 'A': 92, 'B+': 87, 'B': 82,
    'C+': 77, 'C': 72, 'D': 60, 'F': 0,
  };
  return map[g];
};

/* ── Tiny reusable Modal shell ─────────────────────────── */
const Modal = ({
  open, title, subtitle, onClose, children,
}: {
  open: boolean; title: string; subtitle?: string;
  onClose: () => void; children: React.ReactNode;
}) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <p className="modal-title">{title}</p>
            {subtitle && <p className="modal-subtitle" style={{ margin: '4px 0 0' }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

/* ── Main Page ─────────────────────────────────────────── */
const TeacherMyStudentsPage = () => {
  const { user } = useAuth();
  const { data: coursesData } = useGetCoursesQuery();

  /* Course state */
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');

  const { data: enrolledData, isLoading: loadingEnrolled } = useGetEnrolledStudentsQuery(selectedCourse, { skip: !selectedCourse });
  const [enrollStudent] = useEnrollStudentMutation();
  const [unenrollStudent] = useUnenrollStudentMutation();
  const [markAttendance] = useMarkAttendanceMutation();
  const [createGrade] = useCreateGradeMutation();

  const enrolled = enrolledData ?? [];

  /* Search state */
  const [query, setQuery] = useState('');
  const { data: searchData, isFetching: searching } = useGetStudentsQuery(
    { search: query, status: 'active' }, // only admin-approved students
    { skip: !query },
  );
  const searchResults = searchData?.data ?? [];
  const [searched, setSearched] = useState(false);

  /* Action modals */
  const [enrollTarget, setEnrollTarget] = useState<any | null>(null);
  const [attendanceTarget, setAttendanceTarget] = useState<any | null>(null);
  const [gradeTarget, setGradeTarget] = useState<any | null>(null);

  /* Attendance form */
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attStatus, setAttStatus] = useState<AttendanceStatus>('present');
  const [attRemarks, setAttRemarks] = useState('');

  /* Grade form */
  const [gradeVal, setGradeVal] = useState<GradeValue>('A');
  const [gradeScore, setGradeScore] = useState(92);
  const [gradeSemester, setGradeSemester] = useState('');
  const [gradeRemarks, setGradeRemarks] = useState('');

  /* Feedback */
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Load teacher's courses ──────────────────────────── */
  useEffect(() => {
    if (coursesData) {
      // Filter by instructorId (stable ID) not name (mutable string)
      const mine = (Array.isArray(coursesData) ? coursesData : []).filter(c =>
        c.instructorId === user?.id ||
        // Fallback: name match for older records that may not have instructorId
        c.instructor?.toLowerCase() === user?.name?.toLowerCase()
      );
      setMyCourses(mine);
      if (mine.length > 0 && !selectedCourse) setSelectedCourse(mine[0]._id);
    }
  }, [coursesData, user]);

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearched(true);
  };

  /* ── Enroll ─────────────────────────────────────────── */
  const handleEnroll = async () => {
    if (!enrollTarget || !selectedCourse) return;
    setSubmitting(true);
    try {
      await enrollStudent({ courseId: selectedCourse, studentId: enrollTarget._id }).unwrap();
      showToast('Enrolled successfully');
      setEnrollTarget(null);
    } catch (err: any) {
      showToast(err.message || 'Enrollment failed', false);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Unenroll ───────────────────────────────────────── */
  const handleUnenroll = async (studentId: string, studentName: string) => {
    if (!window.confirm(`Remove ${studentName} from this course?`)) return;
    try {
      await unenrollStudent({ courseId: selectedCourse, studentId }).unwrap();
      showToast('Removed from course');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove', false);
    }
  };

  /* ── Mark Attendance ────────────────────────────────── */
  const handleMarkAttendance = async () => {
    if (!attendanceTarget || !selectedCourse) return;
    setSubmitting(true);
    try {
      await markAttendance({
        courseId: selectedCourse,
        date: attDate,
        records: [{ studentId: attendanceTarget._id, status: attStatus, remarks: attRemarks }],
      }).unwrap();
      showToast(`Attendance marked — ${attStatus} for ${attendanceTarget.name}`);
      setAttendanceTarget(null);
      setAttRemarks('');
    } catch (err: any) {
      showToast(err.message || 'Failed to mark attendance', false);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Add Grade ──────────────────────────────────────── */
  const handleAddGrade = async () => {
    if (!gradeTarget || !selectedCourse || !gradeSemester.trim()) return;
    setSubmitting(true);
    try {
      await createGrade({
        studentId: gradeTarget._id,
        courseId: selectedCourse,
        examType: 'see',
        grade: gradeVal,
        score: gradeScore,
        semester: gradeSemester,
        remarks: gradeRemarks || undefined,
      }).unwrap();
      showToast(`Grade ${gradeVal} added for ${gradeTarget.name}`);
      setGradeTarget(null);
      setGradeRemarks('');
      setGradeSemester('');
    } catch (err: any) {
      showToast(err.message || 'Failed to add grade', false);
    } finally {
      setSubmitting(false);
    }
  };

  const isEnrolled = (id: string) => enrolled.some(e => e._id === id);
  const currentCourse = myCourses.find(c => (c as any)._id === selectedCourse);

  return (
    <div className="page-section">

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 24, zIndex: 9999,
          padding: '10px 18px', borderRadius: 10,
          backgroundColor: toast.ok ? 'var(--success-bg)' : 'var(--error-bg)',
          border: `1px solid ${toast.ok ? '#bbf7d0' : '#fecaca'}`,
          color: toast.ok ? 'var(--success)' : 'var(--error)',
          fontSize: 13, fontWeight: 500,
          boxShadow: 'var(--shadow-dropdown)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex-between animate-fade-in">
        <div>
          <p className="text-eyebrow">Teacher Portal</p>
          <h1 className="text-title" style={{ marginTop: 4 }}>Manage Students</h1>
        </div>
      </div>

      {/* Course Selector */}
      <div className="card animate-fade-up" style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 auto' }}>
            <label className="input-label">Active Course</label>
          </div>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <select
              className="input"
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              style={{ paddingRight: 34, appearance: 'none' }}
            >
              {myCourses.length === 0
                ? <option value="">No courses assigned to you</option>
                : myCourses.map((c: any) => (
                  <option key={c._id} value={c._id}>{c.code} — {c.name} ({c.semester})</option>
                ))}
            </select>
            <ChevronDown size={14} style={{
              position: 'absolute', right: 10, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
            }} />
          </div>
          {currentCourse && (
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>
              <span>
                <span style={{ color: 'var(--text-muted)' }}>Enrolled: </span>
                <span style={{ fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace' }}>
                  {(currentCourse as any).enrolledStudents} / {(currentCourse as any).maxStudents}
                </span>
              </span>
              <span>
                <span style={{ color: 'var(--text-muted)' }}>Credits: </span>
                <span style={{ fontWeight: 600 }}>{(currentCourse as any).credits}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── Left: Search & Enroll ─────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="animate-fade-up">
          <div className="card" style={{ padding: '20px 22px' }}>
            <h3 className="text-heading" style={{ marginBottom: 14 }}>Search & Enroll Student</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={14} style={{
                  position: 'absolute', left: 10, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  className="input"
                  placeholder="Search by name or email…"
                  style={{ paddingLeft: 32 }}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={handleSearch}
                disabled={searching || !query.trim()}
              >
                {searching ? '…' : 'Search'}
              </button>
            </div>

            {/* Results */}
            {searched && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {searchResults.length === 0 ? (
                  <p style={{ fontSize: 12.5, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                    No students found for "{query}"
                  </p>
                ) : searchResults.map(s => {
                  const enrolled_ = isEnrolled(s._id);
                  return (
                    <div key={s._id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      backgroundColor: enrolled_ ? 'rgba(22,163,74,0.04)' : 'var(--bg-base)',
                    }}>
                      {/* Avatar */}
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #eab308, #ca8a04)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace',
                        color: 'var(--text-on-yellow)',
                      }}>
                        {s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 500, fontSize: 13 }}>{s.name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{s.email}</p>
                      </div>
                      {enrolled_ ? (
                        <span className="badge badge-green" style={{ flexShrink: 0 }}>Enrolled</span>
                      ) : (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '5px 10px', fontSize: 12, flexShrink: 0 }}
                          onClick={() => setEnrollTarget(s)}
                          disabled={!selectedCourse}
                        >
                          <UserPlus size={12} /> Enroll
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!searched && (
              <p style={{ marginTop: 16, fontSize: 12.5, color: 'var(--text-muted)', textAlign: 'center' }}>
                Type a name or email above and press Search or Enter.
              </p>
            )}
          </div>
        </div>

        {/* ── Right: Enrolled Students List ────────────────── */}
        <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-heading">
                Enrolled Students
                <span style={{
                  marginLeft: 8, fontSize: 11,
                  fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600,
                  color: 'var(--accent)', backgroundColor: 'rgba(234,179,8,0.1)',
                  padding: '1px 6px', borderRadius: 4,
                }}>
                  {enrolled.length}
                </span>
              </h3>
            </div>

            {loadingEnrolled ? (
              <div style={{ padding: 20 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8, marginBottom: 8 }} />
                ))}
              </div>
            ) : enrolled.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 24px' }}>
                <p className="empty-state-title">No students enrolled yet</p>
                <p className="empty-state-body">Search and enroll students using the panel on the left.</p>
              </div>
            ) : enrolled.map((s, i) => (
              <div
                key={s._id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 22px',
                  borderBottom: i < enrolled.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace', color: '#fff',
                }}>
                  {s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: 13 }}>{s.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</p>
                </div>

                {/* Quick Actions */}
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '4px 8px', fontSize: 11 }}
                    title="Mark Attendance"
                    onClick={() => { setAttendanceTarget(s); setAttDate(new Date().toISOString().split('T')[0]); setAttStatus('present'); }}
                  >
                    <Calendar size={13} />
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '4px 8px', fontSize: 11 }}
                    title="Add Grade"
                    onClick={() => { setGradeTarget(s); setGradeVal('A'); setGradeScore(92); }}
                  >
                    <Award size={13} />
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '4px 8px', fontSize: 11 }}
                    title="Remove from course"
                    onClick={() => handleUnenroll(s._id, s.name)}
                  >
                    <UserMinus size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ ENROLL CONFIRMATION MODAL ══════════════════════ */}
      <Modal
        open={!!enrollTarget}
        title="Confirm Enrollment"
        subtitle={`Enroll ${enrollTarget?.name} into ${currentCourse?.name ?? 'this course'}?`}
        onClose={() => setEnrollTarget(null)}
      >
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={handleEnroll}
            disabled={submitting}
          >
            <UserPlus size={14} />
            {submitting ? 'Enrolling…' : 'Yes, Enroll'}
          </button>
          <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEnrollTarget(null)}>
            Cancel
          </button>
        </div>
      </Modal>

      {/* ══ ATTENDANCE MODAL ═══════════════════════════════ */}
      <Modal
        open={!!attendanceTarget}
        title="Mark Attendance"
        subtitle={`${attendanceTarget?.name} · ${currentCourse?.code ?? ''}`}
        onClose={() => setAttendanceTarget(null)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="input-label">Date</label>
            <input type="date" className="input" value={attDate} onChange={e => setAttDate(e.target.value)} />
          </div>

          <div>
            <label className="input-label">Status</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              {(['present', 'late', 'absent'] as AttendanceStatus[]).map(s => {
                const cfg = {
                  present: { color: 'var(--success)', bg: 'rgba(22,163,74,0.1)', Icon: CheckCircle },
                  late: { color: 'var(--warning)', bg: 'rgba(217,119,6,0.1)', Icon: Clock },
                  absent: { color: 'var(--error)', bg: 'rgba(220,38,38,0.1)', Icon: XCircle },
                }[s];
                return (
                  <button
                    key={s}
                    onClick={() => setAttStatus(s)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8,
                      border: `1px solid ${attStatus === s ? cfg.color + '60' : 'var(--border)'}`,
                      backgroundColor: attStatus === s ? cfg.bg : 'var(--bg-base)',
                      color: attStatus === s ? cfg.color : 'var(--text-secondary)',
                      cursor: 'pointer', fontSize: 12, fontWeight: 500,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      transition: 'all 0.15s',
                    }}
                  >
                    <cfg.Icon size={13} /> {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="input-label">Remarks (optional)</label>
            <input type="text" className="input" placeholder="e.g. Medical leave" value={attRemarks} onChange={e => setAttRemarks(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleMarkAttendance} disabled={submitting}>
              <CheckCircle size={14} />
              {submitting ? 'Saving…' : 'Save Attendance'}
            </button>
            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setAttendanceTarget(null)}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* ══ GRADE MODAL ════════════════════════════════════ */}
      <Modal
        open={!!gradeTarget}
        title="Add Grade"
        subtitle={`${gradeTarget?.name} · ${currentCourse?.code ?? ''}`}
        onClose={() => setGradeTarget(null)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="input-label">Semester *</label>
            <input
              type="text" className="input"
              placeholder="e.g. Fall 2025"
              value={gradeSemester}
              onChange={e => setGradeSemester(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="input-label">Grade</label>
              <select
                className="input"
                value={gradeVal}
                onChange={e => {
                  const g = e.target.value as GradeValue;
                  setGradeVal(g);
                  setGradeScore(scoreFromGrade(g));
                }}
              >
                {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Score (0–100)</label>
              <input
                type="number" className="input" min={0} max={100}
                value={gradeScore}
                onChange={e => setGradeScore(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              />
            </div>
          </div>

          {/* Score visualiser */}
          <div style={{ height: 4, borderRadius: 99, backgroundColor: 'var(--border)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99, transition: 'width 0.3s ease',
              width: `${gradeScore}%`,
              backgroundColor: gradeScore >= 90 ? 'var(--success)' : gradeScore >= 75 ? 'var(--accent)' : 'var(--error)',
            }} />
          </div>

          <div>
            <label className="input-label">Remarks (optional)</label>
            <input type="text" className="input" placeholder="Additional feedback…" value={gradeRemarks} onChange={e => setGradeRemarks(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={handleAddGrade}
              disabled={submitting || !gradeSemester.trim()}
            >
              <Award size={14} />
              {submitting ? 'Saving…' : 'Add Grade'}
            </button>
            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setGradeTarget(null)}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default TeacherMyStudentsPage;
