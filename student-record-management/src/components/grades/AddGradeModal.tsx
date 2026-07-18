import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services/courseService';
import { gradeService } from '../../services/gradeService';
import { GradeRecord, ExamType } from '../../types/grade.types';
import { X, FileText, GraduationCap } from 'lucide-react';

interface AddGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingGrade?: GradeRecord | null;
}

const GRADE_OPTIONS = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];

export const AddGradeModal = ({ isOpen, onClose, onSuccess, editingGrade }: AddGradeModalProps) => {
  const { user } = useAuth();
  const [courses, setCourses]   = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const [form, setForm] = useState({
    courseId:  '',
    studentId: '',
    examType:  'see' as ExamType,
    grade:     'A',
    score:     0,
    semester:  '',
    remarks:   '',
  });

  useEffect(() => {
    if (!isOpen) return;
    setError(null);

    courseService.getAll().then(data => {
      setCourses(data.filter((c: any) => c.status === 'active'));
    }).catch(() => setError('Failed to load courses'));

    if (editingGrade) {
      setForm({
        courseId:  String(editingGrade.courseId),
        studentId: String(editingGrade.studentId),
        examType:  editingGrade.examType ?? 'see',
        grade:     String(editingGrade.grade),
        score:     editingGrade.score,
        semester:  editingGrade.semester,
        remarks:   editingGrade.remarks ?? '',
      });
    } else {
      setForm({ courseId: '', studentId: '', examType: 'see', grade: 'A', score: 0, semester: '', remarks: '' });
    }
  }, [isOpen, editingGrade]);

  useEffect(() => {
    if (!form.courseId) { setStudents([]); return; }
    setLoadingStudents(true);
    courseService.getEnrolledStudents(form.courseId)
      .then(data => setStudents(data))
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [form.courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courseId || !form.studentId || !form.semester) {
      setError('Course, student and semester are required.');
      return;
    }
    if (form.score < 0 || form.score > 100) {
      setError('Score must be between 0 and 100.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (editingGrade) {
        await gradeService.update(editingGrade._id, form);
      } else {
        await gradeService.create(form as any);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save grade.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 500 }}>

        <div className="flex-between" style={{ marginBottom: 4 }}>
          <p className="modal-title">{editingGrade ? 'Edit Grade' : 'Add Grade'}</p>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 6,
            border: '1px solid var(--border-strong)',
            backgroundColor: 'var(--bg-base)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)',
          }}>
            <X size={14} />
          </button>
        </div>
        <p className="modal-subtitle">
          {editingGrade ? 'Update the grade details below.' : 'Fill in the details to record a new grade.'}
        </p>

        <div className="divider" style={{ margin: '0 0 20px' }} />

        {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Exam Type — prominent toggle */}
            <div>
              <label className="input-label">Exam Type *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([
                  { value: 'cie', label: 'CIE', sub: 'Continuous Internal Evaluation', icon: FileText, color: '#3b82f6' },
                  { value: 'see', label: 'SEE', sub: 'Semester End Exam', icon: GraduationCap, color: '#eab308' },
                ] as const).map(opt => {
                  const selected = form.examType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, examType: opt.value }))}
                      style={{
                        flex: 1, padding: '10px 12px', borderRadius: 10,
                        border: selected ? `1.5px solid ${opt.color}` : '1px solid var(--border-strong)',
                        backgroundColor: selected ? opt.color + '12' : 'var(--bg-base)',
                        cursor: 'pointer', textAlign: 'left' as const,
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <opt.icon size={13} style={{ color: selected ? opt.color : 'var(--text-muted)' }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: selected ? opt.color : 'var(--text-primary)' }}>
                          {opt.label}
                        </span>
                      </div>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>{opt.sub}</p>
                    </button>
                  );
                })}
              </div>
              {form.examType === 'cie' && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0' }}>
                  ℹ️ CIE scores do not count toward GPA calculation.
                </p>
              )}
              {form.examType === 'see' && (
                <p style={{ fontSize: 11, color: 'var(--accent-hover)', margin: '6px 0 0' }}>
                  ℹ️ SEE scores determine the student's SGPA/CGPA.
                </p>
              )}
            </div>

            <div>
              <label className="input-label" htmlFor="grade-course">Course *</label>
              <select id="grade-course" className="input" value={form.courseId}
                onChange={e => setForm(f => ({ ...f, courseId: e.target.value, studentId: '' }))} required>
                <option value="">— Select course —</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="input-label" htmlFor="grade-student">Student *</label>
              <select id="grade-student" className="input" value={form.studentId}
                onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
                required disabled={!form.courseId || loadingStudents}>
                <option value="">
                  {!form.courseId ? '— Select course first —'
                    : loadingStudents ? 'Loading students...'
                    : students.length === 0 ? '— No enrolled students —'
                    : '— Select student —'}
                </option>
                {students.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="input-label" htmlFor="grade-semester">Semester *</label>
              <input id="grade-semester" className="input" placeholder="e.g. Fall 2026"
                value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="input-label" htmlFor="grade-score">Score (0–100) *</label>
                <input id="grade-score" className="input" type="number" min={0} max={100}
                  value={form.score}
                  onChange={e => {
                    const score = parseInt(e.target.value) || 0;
                    let grade = 'F';
                    if (score >= 90) grade = 'A+';
                    else if (score >= 80) grade = 'A';
                    else if (score >= 75) grade = 'B+';
                    else if (score >= 65) grade = 'B';
                    else if (score >= 60) grade = 'C+';
                    else if (score >= 50) grade = 'C';
                    else if (score >= 40) grade = 'D';
                    setForm(f => ({ ...f, score, grade }));
                  }} required />
              </div>
              <div>
                <label className="input-label" htmlFor="grade-letter">Grade *</label>
                <select id="grade-letter" className="input" value={form.grade}
                  onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} required>
                  {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="input-label" htmlFor="grade-remarks">Remarks (optional)</label>
              <textarea id="grade-remarks" className="input" style={{ height: 72, resize: 'vertical' }}
                placeholder="e.g. Excellent performance..."
                value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={submitting}>
                {submitting ? (
                  <><span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#09090b', animation: 'btn-spin 0.6s linear infinite', display: 'inline-block' }} /><span>Saving...</span></>
                ) : (
                  <span>{editingGrade ? 'Update Grade' : 'Save Grade'}</span>
                )}
              </button>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
                <span>Cancel</span>
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};