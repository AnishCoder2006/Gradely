import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import { useToastContext } from '../../context/ToastContext';
import { Input } from '../../components/common/Input';
import { BookOpen, Send } from 'lucide-react';

const TeacherRequestCoursePage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToastContext();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', code: '', description: '',
    credits: 3, semester: '', maxStudents: 60,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/courses/request', { ...form, code: form.code.toUpperCase() });
      success('Course request submitted! Awaiting admin approval.');
      setForm({ name: '', code: '', description: '', credits: 3, semester: '', maxStudents: 60 });
    } catch (err: any) {
      toastError(err.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-section">
      <div className="flex-between animate-fade-in">
        <div>
          <p className="text-eyebrow">Teacher Portal</p>
          <h1 className="text-title" style={{ marginTop: 4 }}>Request a Course</h1>
        </div>
      </div>

      <div className="animate-fade-in" style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '16px 20px',
        backgroundColor: 'rgba(59,130,246,0.05)',
        border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <BookOpen size={18} style={{ color: '#3b82f6', flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>How course requests work</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '3px 0 0', lineHeight: 1.5 }}>
            Fill in the form below. The admin will review and approve your request.
            Once approved, the course appears in your dashboard.
          </p>
        </div>
      </div>

      <div className="card animate-fade-up" style={{ padding: '28px 28px', maxWidth: 600 }}>
        <p className="text-heading" style={{ marginBottom: 20 }}>Course Details</p>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="input-label">Instructor Name</label>
              <input className="input" value={user?.name ?? ''} disabled style={{ opacity: 0.6 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Course Code *" value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. CS401" required />
              <Input label="Course Name *" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Data Structures" required />
            </div>
            <Input label="Semester *" value={form.semester}
              onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
              placeholder="e.g. Fall 2026" required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Credits *" type="number" value={form.credits}
                onChange={e => setForm(f => ({ ...f, credits: parseInt(e.target.value) || 0 }))} required />
              <Input label="Max Students" type="number" value={form.maxStudents}
                onChange={e => setForm(f => ({ ...f, maxStudents: parseInt(e.target.value) || 60 }))} />
            </div>
            <div>
              <label className="input-label">Description *</label>
              <textarea className="input" style={{ height: 100, resize: 'vertical', lineHeight: 1.6 }}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe what students will learn..." required />
            </div>
            <button type="submit" className="btn btn-primary"
              style={{ justifyContent: 'center', marginTop: 4 }} disabled={submitting}>
              {submitting ? (
                <><span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#09090b', animation: 'btn-spin 0.6s linear infinite', display: 'inline-block' }} /><span>Submitting...</span></>
              ) : (
                <><Send size={13} /><span>Submit Course Request</span></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherRequestCoursePage;