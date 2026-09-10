import { useState } from 'react';
import { useToastContext } from '../../context/ToastContext';
import {
  useGetTeachersQuery,
  useGetCoursesQuery,
  useApproveCourseMutation,
  useRejectCourseMutation,
  useAssignTeacherMutation,
} from '../../store';
import { CheckCircle, XCircle, Clock, BookOpen, UserCheck, X, Plus } from 'lucide-react';

const AdminTeacherAssignPage = () => {
  const { success, error: toastError } = useToastContext();
  const { data: teachersData, isLoading: loadingTeachers } = useGetTeachersQuery();
  const { data: coursesData, isLoading: loadingCourses } = useGetCoursesQuery();

  const [approveCourse] = useApproveCourseMutation();
  const [rejectCourse] = useRejectCourseMutation();
  const [assignTeacher] = useAssignTeacherMutation();

  const teachers = Array.isArray(teachersData) ? teachersData : [];
  const allCourses = Array.isArray(coursesData) ? coursesData : [];
  const loading = loadingTeachers || loadingCourses;

  const [tab, setTab] = useState<'requests' | 'assignments'>('requests');
  const [modal, setModal] = useState<{ teacher: any } | null>(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ courseId: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const pendingCourses = allCourses.filter(c => c.status === 'pending');
  const activeCourses = allCourses.filter(c => c.status === 'active');
  const rejectedCourses = allCourses.filter(c => c.status === 'rejected');

  const handleApprove = async (courseId: string, name: string) => {
    setProcessing(courseId);
    try {
      await approveCourse(courseId).unwrap();
      success(`"${name}" approved`);
    } catch (e: any) { toastError(e.message || 'Failed to approve.'); }
    finally { setProcessing(null); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setProcessing(rejectModal.courseId);
    try {
      await rejectCourse(rejectModal.courseId).unwrap();
      success(`"${rejectModal.name}" rejected`);
      setRejectModal(null); setRejectReason('');
    } catch (e: any) { toastError(e.message || 'Failed to reject.'); }
    finally { setProcessing(null); }
  };

  const handleAssign = async () => {
    if (!selectedCourse || !modal) return;
    setAssigning(true);
    try {
      await assignTeacher({ id: selectedCourse, teacherId: modal.teacher._id }).unwrap();
      success(`Course assigned to ${modal.teacher.name}`);
      setModal(null); setSelectedCourse('');
    } catch (e: any) { toastError(e.message || 'Failed to assign.'); }
    finally { setAssigning(false); }
  };

  const handleUnassign = async (courseId: string, courseName: string) => {
    if (!window.confirm(`Unassign teacher from "${courseName}"?`)) return;
    try {
      await assignTeacher({ id: courseId, teacherId: '' }).unwrap();
      success('Teacher unassigned.');
    } catch { toastError('Failed to unassign.'); }
  };

  return (
    <div className="page-section">
      <div className="flex-between animate-fade-in">
        <div>
          <p className="text-eyebrow">Admin Portal</p>
          <h1 className="text-title" style={{ marginTop: 4 }}>Teacher Management</h1>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'right' as const }}>
            <p className="stat-card-label">Pending Requests</p>
            <p className="text-mono" style={{ fontSize: 20, fontWeight: 600, color: pendingCourses.length > 0 ? 'var(--accent)' : 'var(--text-primary)' }}>{pendingCourses.length}</p>
          </div>
          <div style={{ textAlign: 'right' as const }}>
            <p className="stat-card-label">Active Courses</p>
            <p className="text-mono" style={{ fontSize: 20, fontWeight: 600 }}>{activeCourses.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, backgroundColor: 'var(--bg-base)', padding: 4, borderRadius: 10, width: 'fit-content', border: '1px solid var(--border)' }}>
        {([
          { key: 'requests', label: `Course Requests (${pendingCourses.length})` },
          { key: 'assignments', label: `Teacher Assignments (${teachers.length})` },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '7px 16px', borderRadius: 8, border: 'none',
            cursor: 'pointer', fontSize: 12, fontWeight: 500,
            fontFamily: 'Instrument Sans, sans-serif',
            backgroundColor: tab === t.key ? 'var(--bg-card)' : 'transparent',
            color: tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: tab === t.key ? 'var(--shadow-card)' : 'none',
            transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Requests tab */}
      {tab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />) :
            pendingCourses.length === 0 ? (
              <div className="empty-state card">
                <Clock size={28} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p className="empty-state-title">No pending course requests</p>
              </div>
            ) : pendingCourses.map((course, i) => (
              <div key={course._id} className="card animate-fade-up" style={{ padding: '20px 24px', animationDelay: `${i * 40}ms` }}>
                <div className="flex-between">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 9, backgroundColor: 'rgba(234,179,8,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <BookOpen size={17} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'var(--accent)', backgroundColor: 'rgba(234,179,8,0.1)', padding: '2px 8px', borderRadius: 5 }}>{course.code}</span>
                        <span className="badge badge-yellow">Pending Review</span>
                      </div>
                      <p className="text-heading" style={{ margin: '0 0 3px' }}>{course.name}</p>
                      <p className="text-caption" style={{ margin: 0 }}>By <strong>{course.instructor}</strong> · {course.semester} · {course.credits} credits · Max {course.maxStudents}</p>
                      {course.description && <p className="text-caption" style={{ margin: '6px 0 0', lineHeight: 1.5 }}>{course.description}</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button className="btn btn-primary" style={{ fontSize: 12 }} disabled={processing === course._id} onClick={() => handleApprove(course._id, course.name)}>
                      <CheckCircle size={13} /><span>Approve</span>
                    </button>
                    <button className="btn btn-danger" style={{ fontSize: 12 }} disabled={processing === course._id} onClick={() => setRejectModal({ courseId: course._id, name: course.name })}>
                      <XCircle size={13} /><span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {rejectedCourses.length > 0 && (
            <div className="card animate-fade-up" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border)' }}>
                <p className="text-heading">Rejected Requests</p>
              </div>
              {rejectedCourses.map((c, i) => (
                <div key={c._id} className="flex-between" style={{ padding: '12px 22px', borderBottom: i < rejectedCourses.length - 1 ? '1px solid var(--border)' : 'none', opacity: 0.65 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'var(--error)', backgroundColor: 'var(--error-bg)', padding: '2px 6px', borderRadius: 4 }}>{c.code}</span>
                      <p className="text-body" style={{ margin: 0, fontWeight: 500 }}>{c.name}</p>
                    </div>
                    {c.rejectionReason && <p className="text-caption" style={{ margin: '3px 0 0', color: 'var(--error)' }}>Reason: {c.rejectionReason}</p>}
                  </div>
                  <span className="badge badge-red">Rejected</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignments tab */}
      {tab === 'assignments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />) :
            teachers.length === 0 ? (
              <div className="empty-state card">
                <UserCheck size={28} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p className="empty-state-title">No teachers registered</p>
              </div>
            ) : teachers.map((teacher, i) => {
              const assigned = activeCourses.filter(c => String(c.instructorId) === teacher._id);
              return (
                <div key={teacher._id} className="card animate-fade-up" style={{ padding: 0, overflow: 'hidden', animationDelay: `${i * 40}ms` }}>
                  <div className="flex-between" style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="avatar" style={{ width: 36, height: 36, fontSize: 12, backgroundColor: '#3b82f6', color: '#fff' }}>
                        {teacher.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-body" style={{ fontWeight: 600, margin: 0 }}>{teacher.name}</p>
                        <p className="text-caption" style={{ margin: 0 }}>{teacher.email}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="badge badge-gray">{assigned.length} course{assigned.length !== 1 ? 's' : ''}</span>
                      <button className="btn btn-primary" style={{ fontSize: 12, padding: '5px 12px' }}
                        onClick={() => { setModal({ teacher }); setSelectedCourse(''); }}>
                        <Plus size={13} /><span>Assign</span>
                      </button>
                    </div>
                  </div>
                  {assigned.length === 0 ? (
                    <div style={{ padding: '14px 22px' }}><p className="text-caption">No courses assigned yet.</p></div>
                  ) : assigned.map((course, ci) => (
                    <div key={course._id} className="flex-between" style={{ padding: '12px 22px', borderBottom: ci < assigned.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(234,179,8,0.025)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'var(--accent)', backgroundColor: 'rgba(234,179,8,0.1)', padding: '2px 6px', borderRadius: 4 }}>{course.code}</span>
                        <div>
                          <p className="text-body" style={{ margin: 0, fontWeight: 500 }}>{course.name}</p>
                          <p className="text-caption" style={{ margin: 0 }}>{course.semester} · {course.enrolledStudents}/{course.maxStudents}</p>
                        </div>
                      </div>
                      <button className="btn btn-danger" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => handleUnassign(course._id, course.name)}>
                        <X size={12} /><span>Unassign</span>
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
        </div>
      )}

      {/* Assign Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal-box">
            <p className="modal-title">Assign Course to {modal.teacher.name}</p>
            <div className="divider" style={{ margin: '12px 0 16px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="input-label" htmlFor="assign-select">Course</label>
                <select id="assign-select" className="input" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
                  <option value="">— Select —</option>
                  {activeCourses.filter(c => String(c.instructorId) !== modal.teacher._id).map(c => (
                    <option key={c._id} value={c._id}>{c.code} — {c.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleAssign} disabled={!selectedCourse || assigning}>
                  <span>{assigning ? 'Assigning...' : 'Confirm'}</span>
                </button>
                <button className="btn btn-secondary" onClick={() => setModal(null)}><span>Cancel</span></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setRejectModal(null); }}>
          <div className="modal-box">
            <p className="modal-title">Reject Course Request</p>
            <p className="modal-subtitle">Rejecting: <strong>{rejectModal.name}</strong></p>
            <div className="divider" style={{ margin: '0 0 16px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="input-label">Reason (optional)</label>
                <textarea className="input" style={{ height: 80, resize: 'vertical' }}
                  placeholder="e.g. Course already exists..."
                  value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={handleReject} disabled={!!processing}>
                  <span>{processing ? 'Rejecting...' : 'Confirm Rejection'}</span>
                </button>
                <button className="btn btn-secondary" onClick={() => setRejectModal(null)}><span>Cancel</span></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeacherAssignPage;