import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  useGetStudentsQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
} from '../../store';
import { Mail, Phone, MapPin, Calendar, User, Award, BookOpen, AlertCircle, Edit, Save, X } from 'lucide-react';

interface MyProfilePageProps {
  setup?: boolean;
}

const MyProfilePage = ({ setup = false }: MyProfilePageProps) => {
  const { user } = useAuth();
  const { data: studentsData, isLoading: loading, error: fetchErr } = useGetStudentsQuery({ email: user?.email });
  const [createStudent] = useCreateStudentMutation();
  const [updateStudent] = useUpdateStudentMutation();

  const student = studentsData?.data?.[0] ?? null;
  const [error, setError] = useState<string | null>(fetchErr ? 'Failed to load profile.' : null);
  const [isEditing, setIsEditing] = useState(setup || !student);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    address: '',
  });

  useEffect(() => {
    if (student) {
      setForm({
        name: student.name,
        email: student.email,
        phone: student.phone,
        dateOfBirth: student.dateOfBirth
          ? new Date(student.dateOfBirth).toISOString().split('T')[0]
          : '',
        gender: student.gender,
        address: student.address,
      });
      setIsEditing(false);
    } else if (!loading) {
      setIsEditing(true);
    }
  }, [student, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone || !form.dateOfBirth || !form.address) {
      setError('Please fill all required fields.');
      return;
    }
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
      setError(err.message || 'Failed to save profile.');
    } finally {
      setSubmitting(false);
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
          <span className={`badge ${student.status === 'active' ? 'badge-green' : 'badge-yellow'}`}>
            {student.status === 'active' ? 'Approved' : 'Pending Approval'}
          </span>
        )}
      </div>

      {error && (
        <div className="alert-error animate-fade-in">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>

        {/* Left: Form or view */}
        <div className="card animate-fade-up" style={{ padding: '28px 24px' }}>
          {isEditing ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p className="text-heading" style={{ marginBottom: 4 }}>
                {student ? 'Edit Details' : 'Personal Information'}
              </p>

              {[
                { label: 'Full Name', key: 'name', type: 'text', disabled: false, placeholder: 'e.g. Arjun Mehta' },
                { label: 'Email', key: 'email', type: 'email', disabled: true, placeholder: '' },
                { label: 'Phone *', key: 'phone', type: 'tel', disabled: false, placeholder: '+91 9876543210' },
                { label: 'Date of Birth *', key: 'dateOfBirth', type: 'date', disabled: false, placeholder: '' },
              ].map(field => (
                <div key={field.key}>
                  <label className="input-label">{field.label}</label>
                  <input
                    className="input"
                    type={field.type}
                    placeholder={field.placeholder}
                    value={(form as any)[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    disabled={field.disabled}
                    style={field.disabled ? { opacity: 0.55 } : {}}
                    required={!field.disabled}
                  />
                </div>
              ))}

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
                  placeholder="Street, City, Pin Code"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  rows={3}
                  required
                  style={{ resize: 'vertical', minHeight: 70 }}
                />
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
                {student && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => { setIsEditing(false); setError(null); }}
                  >
                    <X size={13} />
                    <span>Cancel</span>
                  </button>
                )}
              </div>

              {!student && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                  After saving, your profile will be reviewed by the admin before full access is granted.
                </p>
              )}
            </form>
          ) : (
            <div style={{ textAlign: 'center' as const }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, #eab308, #ca8a04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: 22, fontWeight: 600,
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' as const }}>
                {[
                  { icon: Mail, label: 'Email', value: student?.email },
                  { icon: Phone, label: 'Phone', value: student?.phone },
                  { icon: MapPin, label: 'Address', value: student?.address },
                  {
                    icon: Calendar, label: 'Date of Birth', value: student?.dateOfBirth
                      ? new Date(student.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '—'
                  },
                  {
                    icon: User, label: 'Gender', value: student?.gender
                      ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1)
                      : '—'
                  },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', gap: 10 }}>
                    <row.icon size={14} style={{ color: 'var(--text-muted)', marginTop: 3, flexShrink: 0 }} />
                    <div>
                      <p style={{
                        fontSize: 9, fontWeight: 600, letterSpacing: '0.1em',
                        textTransform: 'uppercase' as const, color: 'var(--text-muted)', margin: 0
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

              <button
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}
                onClick={() => setIsEditing(true)}
              >
                <Edit size={13} />
                <span>Edit Profile</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Academic summary */}
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
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 9,
                    backgroundColor: s.color + '15',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Status: </span>
                <span style={{
                  fontWeight: 600,
                  color: student.status === 'active' ? 'var(--success)' : 'var(--warning)',
                  textTransform: 'capitalize' as const,
                }}>
                  {student.status}
                </span>
              </div>
            </div>

            {student.status !== 'active' && (
              <div style={{
                marginTop: 16, padding: '12px 16px',
                backgroundColor: 'rgba(234,179,8,0.06)',
                border: '1px solid rgba(234,179,8,0.2)',
                borderRadius: 8, fontSize: 12,
                color: 'var(--text-secondary)',
              }}>
                ⏳ Your profile is awaiting admin approval. Once approved, you'll have full access
                to grades, attendance, and course materials.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProfilePage;