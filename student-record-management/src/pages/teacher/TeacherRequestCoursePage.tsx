import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRequestCourseMutation } from '../../store';
import { useToastContext } from '../../context/ToastContext';
import { Input } from '../../components/common/Input';
import { BookOpen, Send, UserCheck } from 'lucide-react';

const TeacherRequestCoursePage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToastContext();
  const [requestCourse, { isLoading: submitting }] = useRequestCourseMutation();
  const [form, setForm] = useState({
    name: '', code: '', description: '',
    credits: 3, semester: '', maxStudents: 60,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestCourse({ ...form, code: form.code.toUpperCase() }).unwrap();
      success('Course request submitted! Awaiting admin approval.');
      setForm({ name: '', code: '', description: '', credits: 3, semester: '', maxStudents: 60 });
    } catch (err: any) {
      toastError(err.message || 'Failed to submit request.');
    }
  };

  return (
    <div className="page-section">
      {/* Header */}
      <div className="flex-between animate-fade-in" style={{ marginBottom: 20 }}>
        <div>
          <p className="text-eyebrow">Teacher Portal</p>
          <h1 className="text-title" style={{ marginTop: 4 }}>Request a Course</h1>
        </div>
      </div>

      <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Info Callout Banner */}
        <div
          className="animate-fade-in"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            padding: '16px 20px',
            backgroundColor: 'rgba(59,130,246,0.06)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 'var(--radius-lg, 16px)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              backgroundColor: 'rgba(59,130,246,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <BookOpen size={18} style={{ color: '#3b82f6' }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              How course requests work
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>
              Fill in the curriculum details below. The administrator will review your proposal.
              Once approved, the course will automatically publish to your active dashboard and student registration lists.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="card animate-fade-up" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <p className="text-heading" style={{ margin: 0 }}>Course Details</p>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>* Required fields</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Instructor Read-only Field */}
              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UserCheck size={13} style={{ color: 'var(--text-muted)' }} />
                  Instructor Name
                </label>
                <input
                  className="input"
                  value={user?.name ? `${user.name} (${user.email})` : 'Authenticated Instructor'}
                  disabled
                  style={{
                    opacity: 0.7,
                    cursor: 'not-allowed',
                    backgroundColor: 'rgba(0,0,0,0.15)',
                  }}
                />
              </div>

              {/* Course Code & Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}>
                <Input
                  label="Course Code *"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. CS401"
                  required
                />
                <Input
                  label="Course Title *"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Advanced Data Structures"
                  required
                />
              </div>

              {/* Semester */}
              <Input
                label="Target Semester *"
                value={form.semester}
                onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
                placeholder="e.g. Fall 2026"
                required
              />

              {/* Credits & Capacity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input
                  label="Credits *"
                  type="number"
                  value={form.credits}
                  onChange={e => setForm(f => ({ ...f, credits: parseInt(e.target.value) || 0 }))}
                  required
                />
                <Input
                  label="Max Student Capacity"
                  type="number"
                  value={form.maxStudents}
                  onChange={e => setForm(f => ({ ...f, maxStudents: parseInt(e.target.value) || 60 }))}
                />
              </div>

              {/* Course Description */}
              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Course Description *</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>Syllabus summary</span>
                </label>
                <textarea
                  className="input"
                  style={{ height: 110, resize: 'vertical', lineHeight: 1.6 }}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Summarize course objectives, prerequisites, and learning outcomes..."
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  justifyContent: 'center',
                  marginTop: 6,
                  padding: '12px 16px',
                  fontWeight: 600,
                  fontSize: 14,
                }}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        border: '2px solid rgba(0,0,0,0.2)',
                        borderTopColor: '#09090b',
                        animation: 'btn-spin 0.6s linear infinite',
                        display: 'inline-block',
                      }}
                    />
                    <span>Submitting Proposal...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Submit Course Proposal</span>
                  </>
                )}
              </button>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherRequestCoursePage;