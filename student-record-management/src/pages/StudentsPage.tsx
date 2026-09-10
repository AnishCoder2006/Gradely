import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Student, StudentFormData } from '../types/student.types';
import { Table } from '../components/common/Table';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { useToastContext } from '../context/ToastContext';
import {
  useCreateStudentMutation,
  useDeleteStudentMutation,
  useGetStudentsQuery,
  useUpdateStudentMutation,
} from '../store';
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react';

const LIMIT = 10;

const StudentsPage = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToastContext();

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<StudentFormData>({
    name: '', email: '', phone: '',
    dateOfBirth: '', gender: 'male', address: '',
  });

  const { data, isLoading, isFetching, error } = useGetStudentsQuery({
    page,
    limit: LIMIT,
    search: searchTerm || undefined,
  });
  const [createStudent, { isLoading: isCreating }] = useCreateStudentMutation();
  const [updateStudent, { isLoading: isUpdating }] = useUpdateStudentMutation();
  const [deleteStudent] = useDeleteStudentMutation();

  const students = data?.data ?? [];
  const total = data?.pagination?.total ?? students.length;
  const totalPages = data?.pagination?.totalPages ?? 1;

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (error) {
      const message = typeof error === 'string' ? error : 'Failed to load students.';
      toastError(message);
    }
  }, [error, toastError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      if (editingStudent) {
        await updateStudent({ id: editingStudent._id, data: formData }).unwrap();
        success('Student updated successfully!');
      } else {
        await createStudent(formData).unwrap();
        success('Student created successfully!');
      }
      resetForm();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save student. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', dateOfBirth: '', gender: 'male', address: '' });
    setEditingStudent(null);
    setShowForm(false);
    setFormError(null);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name, email: student.email, phone: student.phone,
      dateOfBirth: student.dateOfBirth instanceof Date
        ? student.dateOfBirth.toISOString().split('T')[0]
        : student.dateOfBirth,
      gender: student.gender, address: student.address,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Permanently delete this student?')) return;
    try {
      await deleteStudent(id).unwrap();
      success('Student deleted.');
    } catch {
      toastError('Failed to delete student.');
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' as const },
    { header: 'Email', accessor: 'email' as const },
    { header: 'Phone', accessor: 'phone' as const },
    {
      header: 'Status',
      accessor: (s: Student) => (
        <span className={`badge ${s.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{s.status}</span>
      ),
    },
    {
      header: 'Actions',
      accessor: (s: Student) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }}
            onClick={() => navigate(`/students/${s._id}`)}>
            <Eye size={13} /><span>View</span>
          </button>
          <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }}
            onClick={() => handleEdit(s)}>
            <Edit size={13} /><span>Edit</span>
          </button>
          <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }}
            onClick={() => handleDelete(s._id)}>
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
          <p className="text-eyebrow">Records</p>
          <h1 className="text-title" style={{ marginTop: 4 }}>Students</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={14} /><span>Add Student</span>
        </button>
      </div>

      <div className="animate-fade-up" style={{ position: 'relative', maxWidth: 360 }}>
        <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input className="input" style={{ paddingLeft: 34 }}
          placeholder="Search by name or email..."
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
        <Table data={students} columns={columns} isLoading={isLoading || isFetching}
          emptyMessage="No students found" emptySubtext="Add your first student to get started." />

        <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} />
      </div>

      <Modal isOpen={showForm} onClose={resetForm}
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
        subtitle={editingStudent ? 'Update the student record below.' : 'Fill in the details to create a new student record.'}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {formError && <div className="alert-error">{formError}</div>}
            <Input label="Full Name" value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Arjun Mehta" required />
            <Input label="Email" type="email" value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="e.g. arjun@college.edu" required />
            <Input label="Phone" value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="e.g. +91 98765 43210" required />
            <Input label="Date of Birth" type="date" value={formData.dateOfBirth}
              onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} required />
            <div>
              <label className="input-label" htmlFor="gender-select">Gender <span style={{ color: 'var(--accent)' }}>*</span></label>
              <select id="gender-select" className="input" value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value as any })} required>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input label="Address" value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="e.g. 12 MG Road, Bengaluru" required />
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={submitting || isCreating || isUpdating}>
                <span>{submitting || isCreating || isUpdating ? 'Saving...' : editingStudent ? 'Update Student' : 'Create Student'}</span>
              </button>
              <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={resetForm}>
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentsPage;