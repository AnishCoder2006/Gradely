import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGetCoursesQuery, useGetStudentsQuery, useMarkAttendanceMutation } from '../../store';
import { useToastContext } from '../../context/ToastContext';
import { exportAttendanceSheetPDF } from '../../utils/pdfExport';
import { CheckCircle, XCircle, Clock, FileDown, Layers } from 'lucide-react';

type AttendanceStatus = 'present' | 'absent' | 'late';

const TeacherAttendancePage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToastContext();
  const { data: coursesData } = useGetCoursesQuery();
  const { data: studentsData, isLoading: loadingStudents } = useGetStudentsQuery({});
  const [markAttendance, { isLoading: saving }] = useMarkAttendanceMutation();

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slot, setSlot] = useState('Slot 1');
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (coursesData) {
      const mine = coursesData.filter((c: any) =>
        c.status === 'active' && (
          c.instructor?.toLowerCase() === user?.name?.toLowerCase() ||
          String(c.instructorId) === user?.id
        )
      );
      setCourses(mine);
      if (mine.length > 0 && !selectedCourse) setSelectedCourse(mine[0]._id);
    }
  }, [coursesData, user]);

  useEffect(() => {
    if (!selectedCourse || !studentsData?.data) return;
    const enrolled = studentsData.data.filter((s: any) => s.courseIds?.includes(selectedCourse));
    setStudents(enrolled);
    const defaults: Record<string, AttendanceStatus> = {};
    enrolled.forEach((s: any) => { defaults[s._id] = 'present'; });
    setAttendance(defaults);
  }, [selectedCourse, studentsData]);

  const toggle = (id: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [id]: status }));
  };

  const handleSave = async () => {
    try {
      const records = students.map(s => ({ studentId: s._id, status: attendance[s._id] ?? 'present' }));
      await markAttendance({
        courseId: selectedCourse,
        date,
        records
      }).unwrap();
      success(`Attendance for ${slot} saved successfully!`);
    } catch {
      toastError('Failed to save attendance.');
    }
  };

  const handleExport = () => {
    const course = courses.find(c => c._id === selectedCourse);
    if (!course || students.length === 0) {
      toastError('No data to export.');
      return;
    }
    setExporting(true);
    try {
      exportAttendanceSheetPDF({
        courseName: course.name,
        courseCode: course.code,
        semester: course.semester,
        date: `${new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} (${slot})`,
        records: students.map(s => ({
          studentName: s.name,
          status: attendance[s._id] ?? 'present',
        })),
      });
      success('Attendance sheet exported!');
    } catch {
      toastError('Failed to export PDF.');
    } finally {
      setExporting(false);
    }
  };

  const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; icon: React.ElementType }> = {
    present: { label: 'Present', color: 'var(--success)', icon: CheckCircle },
    absent: { label: 'Absent', color: 'var(--error)', icon: XCircle },
    late: { label: 'Late', color: 'var(--warning)', icon: Clock },
  };

  const counts = students.reduce((acc, s) => {
    const st = attendance[s._id] ?? 'present';
    acc[st] = (acc[st] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="page-section">
      <div className="flex-between animate-fade-in">
        <div>
          <p className="text-eyebrow">Teacher Portal</p>
          <h1 className="text-title" style={{ marginTop: 4 }}>Mark Attendance</h1>
        </div>
        {students.length > 0 && (
          <button className="btn btn-secondary" onClick={handleExport} disabled={exporting}>
            <FileDown size={14} /><span>{exporting ? 'Exporting...' : 'Export PDF'}</span>
          </button>
        )}
      </div>

      <div className="card animate-fade-up" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 16 }}>
          <div>
            <label className="input-label" htmlFor="course-select">Course</label>
            <select id="course-select" className="input" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
              {courses.map(c => <option key={c._id} value={c._id}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label" htmlFor="date-select">Date</label>
            <input id="date-select" className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="input-label" htmlFor="slot-select">Lecture Slot / Period</label>
            <select id="slot-select" className="input" value={slot} onChange={e => setSlot(e.target.value)}>
              <option value="Slot 1">Slot 1 (Period 1)</option>
              <option value="Slot 2">Slot 2 (Period 2)</option>
              <option value="Slot 3">Slot 3 (Period 3)</option>
              <option value="Slot 4">Slot 4 (Period 4)</option>
              <option value="Lab Session">Lab Session</option>
            </select>
          </div>
        </div>
      </div>

      {students.length > 0 && (
        <div className="card animate-fade-up" style={{ padding: '14px 22px' }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <cfg.icon size={14} style={{ color: cfg.color }} />
                <span className="text-mono" style={{ fontSize: 13, fontWeight: 500 }}>{counts[status] ?? 0}</span>
                <span className="text-caption">{cfg.label}</span>
              </div>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
              <span className="badge badge-gray" style={{ fontSize: 11 }}>
                <Layers size={11} style={{ marginRight: 4 }} />
                {slot}
              </span>
              <div>
                <span className="text-caption">Total: </span>
                <span className="text-mono" style={{ fontSize: 13, fontWeight: 500 }}>{students.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card animate-fade-up" style={{ padding: 0, overflow: 'hidden', animationDelay: '60ms' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
          <p className="text-heading">Students ({slot})</p>
        </div>

        {loadingStudents ? (
          <div style={{ padding: 24 }}>
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 48, borderRadius: 8, marginBottom: 10 }} />)}
          </div>
        ) : students.length === 0 ? (
          <div className="empty-state"><p className="empty-state-title">No students enrolled</p><p className="empty-state-body">Enroll students from My Courses first.</p></div>
        ) : (
          <div>
            {students.map((s, i) => {
              const current = attendance[s._id] ?? 'present';
              return (
                <div key={s._id} className="flex-between" style={{ padding: '13px 22px', borderBottom: i < students.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(234,179,8,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 600, color: 'var(--accent)', flexShrink: 0,
                    }}>
                      {s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-body" style={{ fontWeight: 500, margin: 0 }}>{s.name}</p>
                      <p className="text-caption" style={{ margin: 0 }}>{s.email}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(Object.entries(STATUS_CONFIG) as [AttendanceStatus, typeof STATUS_CONFIG[AttendanceStatus]][]).map(([status, cfg]) => (
                      <button key={status} onClick={() => toggle(s._id, status)} style={{
                        padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 500,
                        fontFamily: 'Instrument Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 4,
                        backgroundColor: current === status ? cfg.color + '20' : 'var(--bg-base)',
                        color: current === status ? cfg.color : 'var(--text-muted)',
                        border: current === status ? `1px solid ${cfg.color}40` : '1px solid var(--border)',
                        transition: 'all 0.15s',
                      }}>
                        <cfg.icon size={12} /><span>{cfg.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {students.length > 0 && (
          <div style={{ padding: '16px 22px', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ minWidth: 160, justifyContent: 'center' }}>
              {saving ? (
                <><span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#09090b', animation: 'btn-spin 0.6s linear infinite', display: 'inline-block' }} /><span>Saving...</span></>
              ) : (
                <span>Save {slot} Attendance</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAttendancePage;