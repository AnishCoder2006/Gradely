import { useState } from 'react';
import { GradeRecord } from '../types/grade.types';
import { useAuth } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';
import { Table } from '../components/common/Table';
import { AddGradeModal } from '../components/grades/AddGradeModal';
import { Plus, Edit, Trash2, Award, BarChart3, CheckCircle2, TrendingUp } from 'lucide-react';
import { useDeleteGradeMutation, useGetGradesQuery } from '../store';

const GradeBadge = ({ grade }: { grade: string }) => {
  const map: Record<string, string> = {
    'A+': 'badge-green', 'A': 'badge-green',
    'B+': 'badge-yellow', 'B': 'badge-yellow',
    'C+': 'badge-gray', 'C': 'badge-gray',
    'D': 'badge-gray', 'F': 'badge-red',
  };
  return <span className={`badge ${map[grade] ?? 'badge-gray'}`}>{grade}</span>;
};

const ExamTypeBadge = ({ type }: { type: string }) => {
  const isSee = type?.toLowerCase() === 'see';
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.04em',
      padding: '2px 8px',
      borderRadius: 6,
      backgroundColor: isSee ? 'rgba(234,179,8,0.12)' : 'rgba(59,130,246,0.1)',
      color: isSee ? 'var(--accent-hover)' : '#3b82f6',
      border: `1px solid ${isSee ? 'rgba(234,179,8,0.25)' : 'rgba(59,130,246,0.2)'}`,
      fontFamily: 'IBM Plex Mono, monospace',
    }}>
      {isSee ? 'SEE' : 'CIE'}
    </span>
  );
};

const GradesPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToastContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeRecord | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'cie' | 'see'>('all');

  const { data: gradesRaw, isLoading, isFetching, error } = useGetGradesQuery();
  const grades: GradeRecord[] = Array.isArray(gradesRaw) ? gradesRaw : [];
  const [deleteGrade] = useDeleteGradeMutation();

  if (error) toastError('Failed to load grades.');

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this grade record?')) return;
    setDeleting(id);
    try {
      await deleteGrade(id).unwrap();
      success('Grade deleted.');
    } catch {
      toastError('Failed to delete grade.');
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (grade: GradeRecord) => {
    setEditingGrade(grade);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingGrade(null);
  };

  const handleGradeSaved = () => {
    success(editingGrade ? 'Grade updated successfully!' : 'Grade saved successfully!');
  };

  // Only teachers can manage (add/edit/delete)
  const canManage = user?.role === 'teacher';

  const filteredGrades = filterType === 'all'
    ? grades
    : grades.filter((g: any) => g.examType?.toLowerCase() === filterType);

  const seeGrades = grades.filter((g: any) => (g.examType?.toLowerCase() ?? 'see') === 'see');
  const avgScore = seeGrades.length > 0 ? Math.round(seeGrades.reduce((s, g) => s + g.score, 0) / seeGrades.length) : 0;
  const passRate = seeGrades.length > 0 ? Math.round((seeGrades.filter(g => g.score >= 40).length / seeGrades.length) * 100) : 0;
  const topGrades = seeGrades.filter(g => g.score >= 90).length;

  const columns: any[] = [
    { header: 'Student', accessor: (g: GradeRecord) => g.studentName ?? g.studentId },
    { header: 'Course', accessor: (g: GradeRecord) => g.courseName ?? g.courseId },
    { header: 'Type', accessor: (g: any) => <ExamTypeBadge type={g.examType ?? 'see'} /> },
    { header: 'Grade', accessor: (g: GradeRecord) => <GradeBadge grade={String(g.grade)} /> },
    { header: 'Score', accessor: 'score' as const, mono: true },
    { header: 'Semester', accessor: 'semester' as const },
    {
      header: 'Remarks',
      accessor: (g: GradeRecord) => (
        <span style={{ color: g.remarks ? 'var(--text-primary)' : 'var(--text-muted)', fontStyle: g.remarks ? 'normal' : 'italic' }}>
          {g.remarks ?? '—'}
        </span>
      ),
    },
    ...(canManage ? [{
      header: 'Actions',
      accessor: (g: GradeRecord) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-secondary" style={{ padding: '4px 9px', fontSize: 11 }} onClick={() => handleEdit(g)}>
            <Edit size={12} /><span>Edit</span>
          </button>
          <button className="btn btn-danger" style={{ padding: '4px 9px', fontSize: 11 }}
            onClick={() => handleDelete(g._id)} disabled={deleting === g._id}>
            <Trash2 size={12} /><span>{deleting === g._id ? '...' : 'Delete'}</span>
          </button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="page-section" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="flex-between animate-fade-in">
        <div>
          <p className="text-eyebrow">Academic</p>
          <h1 className="text-title" style={{ marginTop: 4 }}>Grades</h1>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => { setEditingGrade(null); setModalOpen(true); }}>
            <Plus size={14} /><span>Add Grade</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {!isLoading && seeGrades.length > 0 && (
        <div className="bento-4 animate-fade-up stagger">
          {[
            { label: 'SEE Records', value: seeGrades.length, color: '#3b82f6', icon: BarChart3 },
            { label: 'Avg SEE Score', value: avgScore, color: '#eab308', icon: TrendingUp },
            { label: 'Pass Rate', value: `${passRate}%`, color: '#22c55e', icon: CheckCircle2 },
            { label: 'Top Scores', value: topGrades, color: '#a855f7', icon: Award },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="card" style={{ padding: '16px 20px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: s.color, opacity: 0.6, borderRadius: '20px 20px 0 0' }} />
                <div className="flex-between">
                  <p className="stat-card-label">{s.label}</p>
                  <Icon size={16} style={{ color: s.color, opacity: 0.8 }} />
                </div>
                <p className="stat-card-value" style={{ marginTop: 8, fontSize: 26, fontFamily: 'IBM Plex Mono, monospace' }}>{s.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8 }} className="animate-fade-up">
        {([
          { key: 'all', label: 'All Records' },
          { key: 'cie', label: 'CIE' },
          { key: 'see', label: 'SEE' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setFilterType(t.key)} style={{
            padding: '6px 14px', borderRadius: 8,
            cursor: 'pointer', fontSize: 12, fontWeight: 500,
            fontFamily: 'Instrument Sans, sans-serif',
            backgroundColor: filterType === t.key ? 'var(--accent)' : 'var(--bg-card)',
            color: filterType === t.key ? 'var(--text-on-yellow)' : 'var(--text-secondary)',
            border: filterType === t.key ? '1px solid var(--accent)' : '1px solid var(--border-strong)',
            transition: 'all 0.15s ease',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
        <Table
          data={filteredGrades}
          columns={columns}
          isLoading={isLoading || isFetching}
          emptyMessage="No grades recorded yet"
          emptySubtext={canManage ? 'Click Add Grade to record the first grade.' : 'Grades will appear here once posted by your teacher.'}
        />
      </div>

      <AddGradeModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSuccess={handleGradeSaved}
        editingGrade={editingGrade}
      />
    </div>
  );
};

export default GradesPage;