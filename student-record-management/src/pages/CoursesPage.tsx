import { useState, useMemo } from 'react';
import { Course, CourseFormData } from '../types/course.types';
import { Table } from '../components/common/Table';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { useToastContext } from '../context/ToastContext';
import {
  useCreateCourseMutation,
  useDeleteCourseMutation,
  useGetCoursesQuery,
  useGetTeachersQuery,
  useUpdateCourseMutation,
} from '../store';
import { Plus, Edit, Trash2, Search, BookOpen, Users, CheckCircle2 } from 'lucide-react';

const CoursesPage = () => {
  const { success, error: toastError } = useToastContext();
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState<CourseFormData>({
    name: '', code: '', description: '',
    credits: 3, instructor: '', semester: '', maxStudents: 60,
  });

  const { data: courses = [], isLoading, isFetching, error } = useGetCoursesQuery();
  const { data: teachers = [] } = useGetTeachersQuery();
  const [createCourse, { isLoading: isCreating }] = useCreateCourseMutation();
  const [updateCourse, { isLoading: isUpdating }] = useUpdateCourseMutation();
  const [deleteCourse, { isLoading: isDeleting }] = useDeleteCourseMutation();

  if (error) toastError('Failed to load course catalogue.');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = { ...formData, instructorId: selectedTeacherId || undefined };
      if (editingCourse) {
        await updateCourse({ id: editingCourse._id, data: payload }).unwrap();
        success('Course updated successfully!');
      } else {
        await createCourse(payload).unwrap();
        success('Course created successfully!');
      }
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save course details.');
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
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await deleteCourse(id).unwrap();
      success('Course deleted.');
    } catch {
      toastError('Failed to delete course.');
    }
  };

  // Filtered dataset
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.instructor.toLowerCase().includes(searchTerm.toLowerCase());

      const status = (c as any).status ?? 'active';
      const matchesStatus = statusFilter === 'all' || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [courses, searchTerm, statusFilter]);

  // Aggregate stats
  const totalEnrolled = useMemo(() => courses.reduce((acc, c) => acc + (c.enrolledStudents || 0), 0), [courses]);
  const activeCount = useMemo(() => courses.filter(c => ((c as any).status ?? 'active') === 'active').length, [courses]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = { active: 'badge-green', pending: 'badge-yellow', rejected: 'badge-red' };
    return (
      <span className={`badge ${map[status] ?? 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>
        {status}
      </span>
    );
  };

  const columns = [
    { header: 'Code', accessor: 'code' as const, mono: true },
    { header: 'Course Name', accessor: 'name' as const },
    { header: 'Instructor', accessor: 'instructor' as const },
    { header: 'Credits', accessor: 'credits' as const, mono: true },
    { header: 'Semester', accessor: 'semester' as const },
    { header: 'Status', accessor: (c: Course) => getStatusBadge((c as any).status ?? 'active') },
    {
      header: 'Enrolled Capacity',
      accessor: (c: Course) => {
        const pct = Math.min(Math.round(((c.enrolledStudents || 0) / c.maxStudents) * 100), 100);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 100 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span className="text-mono">{c.enrolledStudents}</span>
              <span style={{ color: 'var(--text-muted)' }}>/ {c.maxStudents}</span>
            </div>
            <div style={{
              width: '100%', height: 4, borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden'
            }}>
              <div style={{
                width: `${pct}%`, height: '100%',
                backgroundColor: pct > 90 ? 'var(--error)' : 'var(--accent)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        );
      },
    },
    {
      header: 'Actions',
      accessor: (c: Course) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => handleEdit(c)}>
            <Edit size={13} /><span>Edit</span>
          </button>
          <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => handleDelete(c._id)} disabled={isDeleting}>
            <Trash2 size={13} /><span>Delete</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-section">
      {/* Page Header */}
      <div className="flex-between animate-fade-in">
        <div>
          <p className="text-eyebrow">Catalogue Management</p>
          <h1 className="text-title" style={{ marginTop: 4 }}>Courses</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={14} /><span>Add Course</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="animate-fade-up" style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16, marginTop: 20, marginBottom: 24
      }}>
        <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            backgroundColor: 'rgba(234, 179, 8, 0.15)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <BookOpen size={20} />
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Total Courses</p>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: '2px 0 0' }}>{courses.length}</h3>
          </div>
        </div>

        <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Users size={20} />
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Total Enrolled</p>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: '2px 0 0' }}>{totalEnrolled}</h3>
          </div>
        </div>

        <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Active Courses</p>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: '2px 0 0' }}>{activeCount}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card animate-fade-up" style={{ padding: 14, marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 36 }}
            placeholder="Search by course code, title, or teacher..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="input"
          style={{ width: 160 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
        <Table
          data={filteredCourses}
          columns={columns}
          isLoading={isLoading || isFetching}
          emptyMessage="No courses found"
          emptySubtext={searchTerm ? 'Try adjusting your search filters.' : 'Add your first course to get started.'}
        />
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editingCourse ? 'Edit Course' : 'Add New Course'}
        subtitle={editingCourse ? 'Update the course details below.' : 'Fill in the details to create a new course.'}
        maxWidth={540}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {formError && <div className="alert-error">{formError}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}>
              <Input
                label="Course Code"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. CS401"
                required
              />
              <Input
                label="Course Name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Data Structures & Algorithms"
                required
              />
            </div>

            <div>
              <label className="input-label" htmlFor="teacher-select">Instructor / Faculty</label>
              <select
                id="teacher-select"
                className="input"
                value={selectedTeacherId}
                onChange={e => {
                  setSelectedTeacherId(e.target.value);
                  const t = teachers.find(t => t._id === e.target.value);
                  setFormData(f => ({ ...f, instructor: t?.name ?? '' }));
                }}
              >
                <option value="">— Select a teacher —</option>
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 12 }}>
              <Input
                label="Semester"
                value={formData.semester}
                onChange={e => setFormData({ ...formData, semester: e.target.value })}
                placeholder="e.g. Fall 2026"
                required
              />
              <Input
                label="Credits"
                type="number"
                value={formData.credits}
                onChange={e => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                required
              />
              <Input
                label="Max Cap"
                type="number"
                value={formData.maxStudents}
                onChange={e => setFormData({ ...formData, maxStudents: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <div>
              <label className="input-label">Description <span style={{ color: 'var(--accent)' }}>*</span></label>
              <textarea
                className="input"
                style={{ height: 88, resize: 'vertical', lineHeight: 1.6 }}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide an overview of the curriculum and objectives..."
                required
              />
            </div>

            <div style={{ display: 'flex', gap: 10, paddingTop: 6 }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={submitting || isCreating || isUpdating}
              >
                <span>{submitting || isCreating || isUpdating ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={resetForm}
              >
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