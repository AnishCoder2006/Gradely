import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services/courseService';
import { apiClient } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Plus, Clock, CheckCircle, XCircle, UserPlus, UserMinus } from 'lucide-react';

const UpdatedMyCoursesPage = () => {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [courses, setCourses]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  // Enroll student modal
  const [enrollModal, setEnrollModal]   = useState<{ courseId: string; courseName: string } | null>(null);
  const [allStudents, setAllStudents]   = useState<any[]>([]);
  const [enrolled, setEnrolled]         = useState<any[]>([]);
  const [enrollTab, setEnrollTab]       = useState<'enrolled' | 'add'>('enrolled');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [enrolling, setEnrolling]       = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await courseService.getAll();
      setCourses(data);
    } catch {
      setError('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, [user]);

  const openEnrollModal = async (courseId: string, courseName: string) => {
    setEnrollModal({ courseId, courseName });
    setEnrollTab('enrolled');
    setLoadingStudents(true);
    try {
      const [enrolledData, allData] = await Promise.all([
        courseService.getEnrolledStudents(courseId),
        apiClient.get<any[]>('/students'),
      ]);
      setEnrolled(enrolledData);
      setAllStudents(allData);
    } catch {
      setError('Failed to load students.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleEnroll = async (studentId: string, studentName: string) => {
    if (!enrollModal) return;
    setEnrolling(studentId);
    try {
      await courseService.enroll(enrollModal.courseId, studentId);
      setSuccess(`${studentName} enrolled successfully`);
      setTimeout(() => setSuccess(null), 3000);
      // Refresh enrolled list
      const updated = await courseService.getEnrolledStudents(enrollModal.courseId);
      setEnrolled(updated);
      fetchCourses();
    } catch (e: any) {
      setError(e.message || 'Failed to enroll student.');
    } finally {
      setEnrolling(null);
    }
  };

  const handleUnenroll = async (studentId: string, studentName: string) => {
    if (!enrollModal) return;
    if (!window.confirm(`Remove ${studentName} from this course?`)) return;
    setEnrolling(studentId);
    try {
      await courseService.unenroll(enrollModal.courseId, studentId);
      setSuccess(`${studentName} removed`);
      setTimeout(() => setSuccess(null), 3000);
      const updated = await courseService.getEnrolledStudents(enrollModal.courseId);
      setEnrolled(updated);
      fetchCourses();
    } catch (e: any) {
      setError(e.message || 'Failed to unenroll.');
    } finally {
      setEnrolling(null);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'active')   return <CheckCircle size={14} style={{ color: 'var(--success)' }} />;
    if (status === 'pending')  return <Clock       size={14} style={{ color: 'var(--accent)' }} />;
    if (status === 'rejected') return <XCircle     size={14} style={{ color: 'var(--error)' }} />;
    return null;
  };

  const enrolledIds = new Set(enrolled.map(s => s._id));
  const unenrolledStudents = allStudents.filter(s => !enrolledIds.has(s._id) && s.status === 'active');

  const activeCourses  = courses.filter(c => c.status === 'active');
  const pendingCourses = courses.filter(c => c.status === 'pending');
  const rejectedCourses = courses.filter(c => c.status === 'rejected');

  return (
    <div className="page-section">

      <div className="flex-between animate-fade-in">
        <div>
          <p className="text-eyebrow">Teacher Portal</p>
          <h1 className="text-title" style={{ marginTop: 4 }}>My Courses</h1>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/request-course')}
        >
          <Plus size={14} />
          <span>Request Course</span>
        </button>
      </div>

      {error   && <div className="alert-error animate-fade-in">{error}</div>}
      {success && (
        <div style={{
          padding: '10px 16px', borderRadius: 8, fontSize: 13,
          backgroundColor: 'var(--success-bg)', border: '1px solid #86efac', color: 'var(--success)',
        }}>
          ✓ {success}
        </div>
      )}

      {/* Active courses */}
      {!loading && activeCourses.length > 0 && (
        <>
          <p className="text-eyebrow" style={{ marginBottom: -8 }}>Active</p>
          <div className="bento-3 stagger">
            {activeCourses.map((course, i) => (
              <div
                key={course._id}
                className="card animate-fade-up"
                style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden', animationDelay: `${i * 50}ms` }}
              >
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  height: 2, backgroundColor: '#3b82f6', opacity: 0.5,
                  borderRadius: '20px 20px 0 0',
                }} />

                <div className="flex-between" style={{ marginBottom: 10 }}>
                  <span style={{
                    fontFamily: 'Geist Mono, monospace', fontSize: 11, fontWeight: 600,
                    color: 'var(--accent)', backgroundColor: 'rgba(234,179,8,0.1)',
                    padding: '3px 8px', borderRadius: 6,
                  }}>
                    {course.code}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {getStatusIcon(course.status)}
                    <span className="badge badge-green">Active</span>
                  </div>
                </div>

                <p className="text-heading" style={{ margin: '0 0 3px' }}>{course.name}</p>
                <p className="text-caption" style={{ margin: '0 0 14px' }}>{course.semester}</p>

                <div className="flex-between">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Users size={13} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-mono" style={{ fontSize: 12 }}>
                      {course.enrolledStudents}/{course.maxStudents}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 11, color: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.08)',
                    padding: '2px 8px', borderRadius: 4,
                  }}>
                    {course.credits} cr
                  </span>
                </div>

                <div className="divider" style={{ margin: '14px 0 12px' }} />

                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
                  onClick={() => openEnrollModal(course._id, course.name)}
                >
                  <UserPlus size={13} />
                  <span>Manage Students</span>
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pending courses */}
      {!loading && pendingCourses.length > 0 && (
        <>
          <p className="text-eyebrow" style={{ marginBottom: -8 }}>Awaiting Approval</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingCourses.map(c => (
              <div key={c._id} className="card" style={{ padding: '16px 20px', opacity: 0.8 }}>
                <div className="flex-between">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Clock size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontFamily: 'Geist Mono, monospace', fontSize: 10,
                          color: 'var(--accent)', backgroundColor: 'rgba(234,179,8,0.1)',
                          padding: '2px 6px', borderRadius: 4,
                        }}>
                          {c.code}
                        </span>
                        <p className="text-body" style={{ margin: 0, fontWeight: 500 }}>{c.name}</p>
                      </div>
                      <p className="text-caption" style={{ margin: 0 }}>{c.semester} · {c.credits} credits</p>
                    </div>
                  </div>
                  <span className="badge badge-yellow">Pending Admin Review</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Rejected */}
      {!loading && rejectedCourses.length > 0 && (
        <>
          <p className="text-eyebrow" style={{ marginBottom: -8 }}>Rejected</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rejectedCourses.map(c => (
              <div key={c._id} className="card" style={{ padding: '16px 20px', opacity: 0.65 }}>
                <div className="flex-between">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontFamily: 'Geist Mono, monospace', fontSize: 10,
                        color: 'var(--error)', backgroundColor: 'var(--error-bg)',
                        padding: '2px 6px', borderRadius: 4,
                      }}>
                        {c.code}
                      </span>
                      <p className="text-body" style={{ margin: 0 }}>{c.name}</p>
                    </div>
                    {c.rejectionReason && (
                      <p className="text-caption" style={{ margin: '4px 0 0', color: 'var(--error)' }}>
                        Reason: {c.rejectionReason}
                      </p>
                    )}
                  </div>
                  <span className="badge badge-red">Rejected</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && courses.length === 0 && (
        <div className="empty-state card">
          <BookOpen size={28} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p className="empty-state-title">No courses yet</p>
          <p className="empty-state-body">Request a course and wait for admin approval.</p>
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => navigate('/request-course')}>
            <Plus size={13} />
            <span>Request Your First Course</span>
          </button>
        </div>
      )}

      {/* Enroll Students Modal */}
      {enrollModal && (
        <div
          className="modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) setEnrollModal(null); }}
        >
          <div className="modal-box" style={{ maxWidth: 540 }}>
            <p className="modal-title">Manage Students</p>
            <p className="modal-subtitle">{enrollModal.courseName}</p>
            <div className="divider" style={{ margin: '0 0 16px' }} />

            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16,
              backgroundColor: 'var(--bg-base)', padding: 3, borderRadius: 8,
              border: '1px solid var(--border)',
            }}>
              {([
                { key: 'enrolled', label: `Enrolled (${enrolled.length})` },
                { key: 'add',      label: `Add Students (${unenrolledStudents.length})` },
              ] as const).map(t => (
                <button
                  key={t.key}
                  onClick={() => setEnrollTab(t.key)}
                  style={{
                    flex: 1, padding: '6px 0',
                    borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 500,
                    fontFamily: 'Geist, sans-serif',
                    backgroundColor: enrollTab === t.key ? 'var(--bg-card)' : 'transparent',
                    color: enrollTab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {loadingStudents ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8, marginBottom: 8 }} />
                ))
              ) : enrollTab === 'enrolled' ? (
                enrolled.length === 0 ? (
                  <div className="empty-state" style={{ padding: '24px 0' }}>
                    <p className="empty-state-title">No students enrolled yet</p>
                    <p className="empty-state-body">Switch to "Add Students" to enroll.</p>
                  </div>
                ) : (
                  enrolled.map((s, i) => (
                    <div
                      key={s._id}
                      className="flex-between"
                      style={{
                        padding: '10px 12px', borderRadius: 8,
                        marginBottom: 6,
                        backgroundColor: 'var(--bg-base)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>
                          {s.name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{s.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{s.email}</p>
                        </div>
                      </div>
                      <button
                        className="btn btn-danger"
                        style={{ fontSize: 11, padding: '4px 9px' }}
                        onClick={() => handleUnenroll(s._id, s.name)}
                        disabled={enrolling === s._id}
                      >
                        <UserMinus size={12} />
                        <span>Remove</span>
                      </button>
                    </div>
                  ))
                )
              ) : (
                unenrolledStudents.length === 0 ? (
                  <div className="empty-state" style={{ padding: '24px 0' }}>
                    <p className="empty-state-title">All active students enrolled</p>
                  </div>
                ) : (
                  unenrolledStudents.map(s => (
                    <div
                      key={s._id}
                      className="flex-between"
                      style={{
                        padding: '10px 12px', borderRadius: 8,
                        marginBottom: 6,
                        backgroundColor: 'var(--bg-base)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>
                          {s.name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{s.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{s.email}</p>
                        </div>
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: 11, padding: '4px 9px' }}
                        onClick={() => handleEnroll(s._id, s.name)}
                        disabled={enrolling === s._id}
                      >
                        <UserPlus size={12} />
                        <span>{enrolling === s._id ? 'Adding...' : 'Enroll'}</span>
                      </button>
                    </div>
                  ))
                )
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <button
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setEnrollModal(null)}
              >
                <span>Done</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UpdatedMyCoursesPage;