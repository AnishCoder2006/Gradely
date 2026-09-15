import { useState } from 'react';
import { useToastContext } from '../../context/ToastContext';
import { useUpdateUserStatusMutation, baseApi, useAppDispatch } from '../../store';
import { CheckCircle, XCircle, Clock, Users, UserCheck, UserX } from 'lucide-react';
import { useEffect } from 'react';

const AdminStudentApprovePage = () => {
  const { success, error: toastError } = useToastContext();
  const dispatch = useAppDispatch();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'inactive'>('all');
  const [processing, setProcessing] = useState<string | null>(null);

  const [updateUserStatus] = useUpdateUserStatusMutation();

  const fetchStudents = async () => {
    try {
      await dispatch(baseApi.endpoints.getTeachers.initiate()).unwrap();
      // fetch users endpoint directly via store query
      const response = await dispatch(baseApi.endpoints.getStudents.initiate({})).unwrap();
      setStudents(response.data || []);
    } catch {
      toastError('Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleApprove = async (userId: string, name: string) => {
    setProcessing(userId);
    try {
      await updateUserStatus({ id: userId, status: 'active' }).unwrap();
      success(`${name} approved successfully`);
      fetchStudents();
    } catch {
      toastError('Failed to approve student.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId: string, name: string) => {
    if (!window.confirm(`Reject ${name}'s access?`)) return;
    setProcessing(userId);
    try {
      await updateUserStatus({ id: userId, status: 'inactive' }).unwrap();
      success(`${name} rejected`);
      fetchStudents();
    } catch {
      toastError('Failed to reject student.');
    } finally {
      setProcessing(null);
    }
  };

  const filtered = students.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'pending') return s.isActive && (!s.studentRecord || s.studentRecord.status !== 'active');
    if (filter === 'active') return s.studentRecord?.status === 'active';
    if (filter === 'inactive') return !s.isActive || s.studentRecord?.status === 'inactive';
    return true;
  });

  const counts = {
    all: students.length,
    pending: students.filter(s => s.isActive && (!s.studentRecord || s.studentRecord.status !== 'active')).length,
    active: students.filter(s => s.studentRecord?.status === 'active').length,
    inactive: students.filter(s => !s.isActive || s.studentRecord?.status === 'inactive').length,
  };

  const getStatusInfo = (s: any) => {
    if (!s.isActive) return { label: 'Rejected', badge: 'badge-red', icon: UserX };
    if (!s.studentRecord) return { label: 'Pending Profile', badge: 'badge-yellow', icon: Clock };
    if (s.studentRecord?.status === 'active') return { label: 'Approved', badge: 'badge-green', icon: UserCheck };
    if (s.studentRecord?.status === 'inactive') return { label: 'Inactive', badge: 'badge-red', icon: UserX };
    return { label: 'Pending', badge: 'badge-yellow', icon: Clock };
  };

  return (
    <div className="page-section">
      <div className="flex-between animate-fade-in">
        <div>
          <p className="text-eyebrow">Admin Portal</p>
          <h1 className="text-title" style={{ marginTop: 4 }}>Student Approvals</h1>
        </div>
        <p className="text-caption">{students.length} total registered students</p>
      </div>

      <div className="bento-4 stagger animate-fade-up">
        {[
          { label: 'Total', value: counts.all, color: '#3b82f6', icon: Users },
          { label: 'Pending', value: counts.pending, color: '#eab308', icon: Clock },
          { label: 'Approved', value: counts.active, color: '#22c55e', icon: UserCheck },
          { label: 'Rejected', value: counts.inactive, color: '#dc2626', icon: UserX },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
            onClick={() => setFilter(i === 0 ? 'all' : i === 1 ? 'pending' : i === 2 ? 'active' : 'inactive')}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: s.color, opacity: 0.5, borderRadius: '20px 20px 0 0' }} />
            <div className="flex-between">
              <p className="stat-card-label">{s.label}</p>
              <div className="stat-card-icon" style={{ backgroundColor: s.color + '15' }}>
                <s.icon size={14} style={{ color: s.color }} />
              </div>
            </div>
            <p className="stat-card-value" style={{ marginTop: 8, fontSize: 26 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }} className="animate-fade-up">
        {(['all', 'pending', 'active', 'inactive'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 8,
            cursor: 'pointer', fontSize: 12, fontWeight: 500,
            fontFamily: 'Instrument Sans, sans-serif',
            backgroundColor: filter === f ? 'var(--accent)' : 'var(--bg-card)',
            color: filter === f ? 'var(--text-on-yellow)' : 'var(--text-secondary)',
            border: filter === f ? 'none' : '1px solid var(--border-strong)',
            transition: 'all 0.15s',
            textTransform: 'capitalize' as const,
          }}>
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      <div className="card animate-fade-up" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
          <p className="text-heading" style={{ textTransform: 'capitalize' as const }}>{filter} Students</p>
        </div>

        {loading ? (
          <div style={{ padding: 24 }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8, marginBottom: 10 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><p className="empty-state-title">No students in this category</p></div>
        ) : (
          <div>
            {filtered.map((s, i) => {
              const status = getStatusInfo(s);
              const isProcessing = processing === s._id;
              return (
                <div key={s._id} className="flex-between" style={{
                  padding: '14px 22px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.1s',
                  opacity: isProcessing ? 0.6 : 1,
                }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(234,179,8,0.025)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="avatar" style={{ width: 36, height: 36, fontSize: 12 }}>
                      {s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p className="text-body" style={{ fontWeight: 600, margin: 0 }}>{s.name}</p>
                        <span className={`badge ${status.badge}`} style={{ fontSize: 10 }}>{status.label}</span>
                      </div>
                      <p className="text-caption" style={{ margin: 0 }}>{s.email}</p>
                      {!s.studentRecord && <p style={{ fontSize: 11, color: 'var(--warning)', margin: 0 }}>⚠ Profile not created yet</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p className="text-caption" style={{ margin: 0 }}>
                      {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {s.studentRecord?.status !== 'active' && (
                      <button className="btn btn-primary" style={{ fontSize: 11, padding: '5px 12px' }}
                        onClick={() => handleApprove(s._id, s.name)} disabled={isProcessing}>
                        <CheckCircle size={12} /><span>{isProcessing ? '...' : 'Approve'}</span>
                      </button>
                    )}
                    {s.isActive && (
                      <button className="btn btn-danger" style={{ fontSize: 11, padding: '5px 12px' }}
                        onClick={() => handleReject(s._id, s.name)} disabled={isProcessing}>
                        <XCircle size={12} /><span>Reject</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStudentApprovePage;