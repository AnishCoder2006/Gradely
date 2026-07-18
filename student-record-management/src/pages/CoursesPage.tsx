import { useState, useEffect } from 'react';
import { courseService } from '../services/courseService';
import { apiClient } from '../services/api';
import { Course, CourseFormData } from '../types/course.types';
import { Table } from '../components/common/Table';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { useToastContext } from '../context/ToastContext';
import { Plus, Edit, Trash2 } from 'lucide-react';

const CoursesPage = () => {
  const { success, error: toastError } = useToastContext();
  const [courses, setCourses]       = useState<Course[]>([]);
  const [teachers, setTeachers]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const [formData, setFormData] = useState<CourseFormData>({
    name: '', code: '', description: '',
    credits: 3, instructor: '', semester: '', maxStudents: 60,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseData, teacherData] = await Promise.all([
        courseService.getAll(),
        apiClient.get<any[]>('/users?role=teacher'),
      ]);
      setCourses(courseData);
      setTeachers(teacherData);
    } catch {
      toastError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = { ...formData, instructorId: selectedTeacherId || undefined };
      if (editingCourse) {
        await courseService.update(editingCourse._id, payload);
        success('Course updated successfully!');
      } else {
        await courseService.create(payload);
        success('Course created successfully!');
      }
      fetchData();
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save course.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '', credits: 3, instructor: '', semester: '', maxStudents: 60 });
    setSelectedTeacherId('');
    setEditingCourse(null);
    setShowForm(false);
    setFormError(null);
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name, code: course.code, description: course.description,
      credits: course.credits, instructor: course.instructor,
      semester: course.semester, maxStudents: course.maxStudents,
    });
    setSelectedTeacherId(String((course as any).instructorId ?? ''));
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Permanently delete this course?')) return;
    try {
      await courseService.delete(id);
      success('Course deleted.');
      fetchData();
    } catch {
      toastError('Failed to delete course.');
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = { active: 'badge-green', pending: 'badge-yellow', rejected: 'badge-red' };
    return <span className={`badge ${map[status] ?? 'badge-gray'}`} style={{ textTransform: 'capitalize' as const }}>{status}</span>;
  };

  const columns = [
    { header: 'Code',        accessor: 'code' as const, mono: true },
    { header: 'Course Name', accessor: 'name' as const },
    { header: 'Instructor',  accessor: 'instructor' as const },
    { header: 'Credits',     accessor: 'credits' as const, mono: true },
    { header: 'Semester',    accessor: 'semester' as const },
    { header: 'Status',      accessor: (c: Course) => getStatusBadge((c as any).status ?? 'active') },
    {
      header: 'Enrolled',
      accessor: (c: Course) => (
        <span className="text-mono" style={{ fontSize: 12 }}>
          {c.enrolledStudents}<span style={{ color: 'var(--text-muted)' }}>/{c.maxStudents}</span>
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (c: Course) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => handleEdit(c)}>
            <Edit size={13} /><span>Edit</span>
          </button>
          <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => handleDelete(c._id)}>
            <Trash2 size={13} /><span>Delete</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-section">
      <div className="flex-between animate-fade-in">
        <div>
          <p className="text-eyebrow">Catalogue</p>
          <h1 className="text-title" style={{ marginTop: 4 }}>Courses</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={14} /><span>Add Course</span>
        </button>
      </div>

      <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
        <Table data={courses} columns={columns} isLoading={loading}
          emptyMessage="No courses found" emptySubtext="Add your first course to get started." />
      </div>

      <Modal isOpen={showForm} onClose={resetForm}
        title={editingCourse ? 'Edit Course' : 'Add New Course'}
        subtitle={editingCourse ? 'Update the course details below.' : 'Fill in the details to create a new course.'}
        maxWidth={520}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {formError && <div className="alert-error">{formError}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Course Code" value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. CS401" required />
              <Input label="Course Name" value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Data Structures" required />
            </div>
            <div>
              <label className="input-label" htmlFor="teacher-select">Assign Teacher</label>
              <select id="teacher-select" className="input" value={selectedTeacherId}
                onChange={e => {
                  setSelectedTeacherId(e.target.value);
                  const t = teachers.find(t => t._id === e.target.value);
                  setFormData(f => ({ ...f, instructor: t?.name ?? '' }));
                }}>
                <option value="">— No teacher assigned yet —</option>
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                ))}
              </select>
            </div>
            <Input label="Semester" value={formData.semester}
              onChange={e => setFormData({ ...formData, semester: e.target.value })}
              placeholder="e.g. Fall 2026" required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Credits" type="number" value={formData.credits}
                onChange={e => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })} required />
              <Input label="Max Students" type="number" value={formData.maxStudents}
                onChange={e => setFormData({ ...formData, maxStudents: parseInt(e.target.value) || 0 })} required />
            </div>
            <div>
              <label className="input-label">Description <span style={{ color: 'var(--accent)' }}>*</span></label>
              <textarea className="input" style={{ height: 88, resize: 'vertical', lineHeight: 1.6 }}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter a detailed course description..." required />
            </div>
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button type="submit" className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }} disabled={submitting}>
                <span>{submitting ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}</span>
              </button>
              <button type="button" className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }} onClick={resetForm}>
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CoursesPage;