import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  useGetStudentsQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useSubmitForApprovalMutation,
} from '../../store';
import { Mail, Phone, MapPin, Calendar, User, Award, BookOpen, AlertCircle, Edit, Save, X, Send, CheckCircle } from 'lucide-react';

interface MyProfilePageProps {
  setup?: boolean;
}

const initialForm = {
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: 'male' as 'male' | 'female' | 'other',
  address: '',
};

// Client-side validation — mirrors the backend's CreateStudentSchema so
// the user gets inline field errors instead of a generic failure after
// a round-trip. Keep these thresholds in sync with student.dto.ts.
const validateForm = (form: typeof initialForm) => {
  const errors: Record<string, string> = {};
  if (!form.phone || form.phone.trim().length < 10) {
    errors.phone = 'Phone number must be at least 10 digits';
  }
  if (!form.dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required';
  }
  if (!form.address || form.address.trim().length < 5) {
    errors.address = 'Address must be at least 5 characters';
  }
  if (!form.gender) {
    errors.gender = 'Please select a gender';
  }
  return errors;
};

const MyProfilePage = ({ setup = false }: MyProfilePageProps) => {
  const { user } = useAuth();
  const { data: studentsData, isLoading: loading, error: fetchErr } = useGetStudentsQuery({ email: user?.email });
  const [createStudent] = useCreateStudentMutation();
  const [updateStudent] = useUpdateStudentMutation();
  const [submitForApproval] = useSubmitForApprovalMutation();

  const student = studentsData?.data?.[0] ?? null;
  const [error, setError] = useState<string | null>(fetchErr ? 'Failed to load profile.' : null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(setup || !student);
  const [submitting, setSubmitting] = useState(false);
  const [submittingApproval, setSubmittingApproval] = useState(false);

  const [form, setForm] = useState({
    ...initialForm,
    name: user?.name || '',
    email: user?.email || '',
  });

  const isProfileComplete = !!student &&
    student.phone && student.phone !== 'N/A' &&
    student.address && student.address !== 'Pending' && student.address.length >= 5;

  const isDraft = student?.status === 'draft';
  const isSubmittedPending = student?.status === 'pending';
  const isApproved = student?.status === 'active';
  const isRejected = student?.status === 'inactive';

  useEffect(() => {
    if (student) {
      setForm({
        name: student.name,
        email: student.email,
        phone: student.phone === 'N/A' ? '' : student.phone,
        dateOfBirth: student.dateOfBirth
          ? new Date(student.dateOfBirth).toISOString().split('T')[0]
          : '',
        gender: student.gender,
        address: student.address === 'Pending' ? '' : student.address,
      });
      setIsEditing(!isProfileComplete);
    } else if (!loading) {
      setIsEditing(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the highlighted fields below.');
      return;
    }

    setFieldErrors({});
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        userId: user?.id,
      };

      if (student) {
        await updateStudent({ id: student._id, data: payload }).unwrap();
      } else {
        await createStudent(payload).unwrap();
      }
      setIsEditing(false);
    } catch (err: any) {
      if (err.data?.errors) {
        const backendErrors: Record<string, string> = {};
        err.data.errors.forEach((e: any) => { backendErrors[e.field] = e.message; });
        setFieldErrors(backendErrors);
        setError('Please fix the highlighted fields below.');
      } else {
        setError(err.data?.message || err.message || 'Failed to save profile.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!student) return;
    setSubmittingApproval(true);
    setError(null);
    try {
      await submitForApproval(student._id).unwrap();
    } catch (err: any) {
      setError(err.data?.message || 'Failed to submit for approval.');
    } finally {
      setSubmittingApproval(false);
    }
  };

  if (loading) {
    return (
      <div className="page-section">
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
          <div className="skeleton" style={{ height: 480, borderRadius: 'var(--radius-xl)' }} />
          <div className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-xl)' }} />
        </div>
      </div>
    );
  }

  const initials = form.name
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST';

  const statusBadge = () => {
    if (isApproved) return { label: 'Approved', cls: 'badge-green' };
    if (isSubmittedPending) return { label: 'Pending Review', cls: 'badge-yellow' };
    if (isRejected) return { label: 'Rejected', cls: 'badge-red' };
    return { label: 'Profile Incomplete', cls: 'badge-gray' };
  };

  return (
    <div className="page-section">

      <div className="flex-between animate-fade-in">
        <div>
          <p className="text-eyebrow">Student Settings</p>
          <h1 className="text-title" style={{ marginTop: 4 }}>
            {student ? 'My Profile' : 'Setup Profile'}
          </h1>
        </div>
        {student && !isEditing && (
          <span className={`badge ${statusBadge().cls}`}>{statusBadge().label}</span>
        )}
      </div>

      {error && (
        <div className="alert-error animate-fade-in">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>

        <div className="card animate-fade-up" style={{ padding: '28px 24px' }}>
          {isEditing ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p className="text-heading" style={{ marginBottom: 4 }}>
                {student ? 'Edit Details' : 'Personal Information'}
              </p>

              <div>
                <label className="input-label">Full Name</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. Arjun Mehta"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="input-label">Email</label>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  disabled
                  style={{ opacity: 0.55 }}
                />
              </div>

              <div>
                <label className="input-label">Phone *</label>
                <input
                  className="input"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  style={fieldErrors.phone ? { borderColor: 'var(--error)' } : {}}
                  required
                />
                {fieldErrors.phone && (
                  <p style={{ fontSize: 11, color: 'var(--error)', margin: '4px 0 0' }}>{fieldErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="input-label">Date of Birth *</label>
                <input
                  className="input"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                  style={fieldErrors.dateOfBirth ? { borderColor: 'var(--error)' } : {}}
                  required
                />
                {fieldErrors.dateOfBirth && (
                  <p style={{ fontSize: 11, color: 'var(--error)', margin: '4px 0 0' }}>{fieldErrors.dateOfBirth}</p>
                )}
              </div>

              <div>
                <label className="input-label" htmlFor="gender-select">Gender *</label>
                <select
                  id="gender-select"
                  className="input"
                  value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value as any }))}
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="input-label">Address *</label>
                <textarea
                  className="input"
                  placeholder="Street, City, Pin Code (min. 5 characters)"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  rows={3}
                  required
                  style={{
                    resize: 'vertical',
                    minHeight: 70,
                    borderColor: fieldErrors.address ? 'var(--error)' : undefined,
                  }}
                />
                {fieldErrors.address && (
                  <p style={{ fontSize: 11, color: 'var(--error)', margin: '4px 0 0' }}>{fieldErrors.address}</p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={submitting}
                >
                  <Save size={13} />
                  <span>{submitting ? 'Saving...' : 'Save Profile'}</span>
                </button>
                {isProfileComplete && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => { setIsEditing(false); setError(null); setFieldErrors({}); }}
                  >
                    <X size={13} />
                    <span>Cancel</span>
                  </button>
                )}
              </div>

              {!isProfileComplete && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                  Fill in every field above, then save. Once saved, you'll be able to submit
                  your profile for admin approval.
                </p>
              )}
            </form>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #eab308, #ca8a04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: 22,
                fontWeight: 600,
                fontFamily: 'IBM Plex Mono, monospace',
                color: '#09090b',
                boxShadow: '0 8px 20px rgba(234,179,8,0.25)',
              }}>
                {initials}
              </div>

              <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                {student?.name}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono, monospace', margin: '0 0 14px' }}>
                ID: {student?._id?.slice(0, 8).toUpperCase()}
              </p>

              <div className="divider" style={{ margin: '16px 0' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
                {[
                  { icon: Mail, label: 'Email', value: student?.email },
                  { icon: Phone, label: 'Phone', value: student?.phone },
                  { icon: MapPin, label: 'Address', value: student?.address },
                  {
                    icon: Calendar,
                    label: 'Date of Birth',
                    value: student?.dateOfBirth
                      ? new Date(student.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '—',
                  },
                  {
                    icon: User,
                    label: 'Gender',
                    value: student?.gender
                      ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1)
                      : '—',
                  },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', gap: 10 }}>
                    <row.icon size={14} style={{ color: 'var(--text-muted)', marginTop: 3, flexShrink: 0 }} />
                    <div>
                      <p style={{
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        margin: 0,
                      }}>
                        {row.label}
                      </p>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                        {row.value ?? '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {isDraft && isProfileComplete && (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}
                  onClick={handleSubmitForApproval}
                  disabled={submittingApproval}
                >
                  <Send size={13} />
                  <span>{submittingApproval ? 'Submitting...' : 'Submit for Admin Approval'}</span>
                </button>
              )}

              {isSubmittedPending && (
                <div style={{
                  marginTop: 20,
                  padding: '10px 14px',
                  borderRadius: 8,
                  backgroundColor: 'rgba(234,179,8,0.08)',
                  border: '1px solid rgba(234,179,8,0.2)',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  justifyContent: 'center',
                }}>
                  <CheckCircle size={13} style={{ color: '#eab308' }} />
                  Submitted — waiting for admin review
                </div>
              )}

              <button
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
                onClick={() => setIsEditing(true)}
              >
                <Edit size={13} />
                <span>Edit Profile</span>
              </button>
            </div>
          )}
        </div>

        {student && (
          <div className="card animate-fade-up" style={{ padding: '24px 28px' }}>
            <p className="text-heading" style={{ marginBottom: 16 }}>Academic Standing</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { icon: Award, label: 'GPA', value: student.gpa ?? '—', color: '#eab308' },
                { icon: BookOpen, label: 'Enrolled Courses', value: student.courseIds?.length ?? 0, color: '#3b82f6' },
              ].map(s => (
                <div key={s.label} style={{
                  padding: '16px 18px',
                  backgroundColor: 'var(--bg-base)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    backgroundColor: s.color + '15',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <s.icon size={17} style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="stat-card-label" style={{ fontSize: 9 }}>{s.label}</p>
                    <p className="stat-card-value" style={{ fontSize: 22, marginTop: 2 }}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="divider" style={{ margin: '20px 0 16px' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Enrolled: </span>
                <span style={{ fontWeight: 500 }}>
                  {new Date(student.enrollmentDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Status: </span>
                <span style={{
                  fontWeight: 600,
                  color: isApproved ? 'var(--success)' : 'var(--warning)',
                  textTransform: 'capitalize',
                }}>
                  {student.status}
                </span>
              </div>
            </div>

            {isDraft && !isProfileComplete && (
              <div style={{
                marginTop: 16,
                padding: '12px 16px',
                backgroundColor: 'rgba(234,179,8,0.06)',
                border: '1px solid rgba(234,179,8,0.2)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--text-secondary)',
              }}>
                Complete your profile on the left, then submit it for admin approval.
              </div>
            )}

            {isDraft && isProfileComplete && (
              <div style={{
                marginTop: 16,
                padding: '12px 16px',
                backgroundColor: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--text-secondary)',
              }}>
                Your profile is complete. Click "Submit for Admin Approval" to send your request.
              </div>
            )}

            {isSubmittedPending && (
              <div style={{
                marginTop: 16,
                padding: '12px 16px',
                backgroundColor: 'rgba(234,179,8,0.06)',
                border: '1px solid rgba(234,179,8,0.2)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--text-secondary)',
              }}>
                Your profile is awaiting admin approval. Once approved, you'll have full access
                to grades, attendance, and course materials.
              </div>
            )}

            {isRejected && (
              <div style={{
                marginTop: 16,
                padding: '12px 16px',
                backgroundColor: 'rgba(220,38,38,0.06)',
                border: '1px solid rgba(220,38,38,0.2)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--text-secondary)',
              }}>
                Your request was rejected. Please contact your institution for details.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProfilePage;