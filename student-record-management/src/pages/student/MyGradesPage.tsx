import { useAuth } from '../../context/AuthContext';
import {
  useGetStudentsQuery,
  useGetGradesQuery,
  useGetCoursesQuery,
} from '../../store';
import { Award, BookOpen, AlertCircle, Calendar, MessageSquare, TrendingUp, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const GradeBadge = ({ grade }: { grade: string }) => {
  const map: Record<string, string> = {
    'A+': 'badge-green',
    'A': 'badge-green',
    'B+': 'badge-yellow',
    'B': 'badge-yellow',
    'C+': 'badge-gray',
    'C': 'badge-gray',
    'D': 'badge-gray',
    'F': 'badge-red',
  };
  return <span className={`badge ${map[grade] ?? 'badge-gray'}`}>{grade}</span>;
};

const MyGradesPage = () => {
  const { user } = useAuth();
  const { data: studentsData, isLoading: loadingStudent } = useGetStudentsQuery({ email: user?.email });
  const student = studentsData?.data?.[0] ?? null;

  const { data: gradesData, isLoading: loadingGrades, error: gradesErr } = useGetGradesQuery();
  const { data: coursesData, isLoading: loadingCourses, error: coursesErr } = useGetCoursesQuery();

  const allGrades = Array.isArray(gradesData) ? gradesData : [];
  const courses = Array.isArray(coursesData) ? coursesData : [];
  const grades = student ? allGrades.filter(g => g.studentId === student._id) : [];

  const loading = loadingStudent || loadingGrades || loadingCourses;
  const error = (gradesErr || coursesErr) ? 'Failed to load grade records.' : null;

  if (loading) {
    return (
      <div className="page-section">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-xl)' }} />
          <div className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-xl)' }} />
          <div className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-xl)' }} />
        </div>
        <div className="skeleton" style={{ height: 350, borderRadius: 'var(--radius-xl)', marginTop: 24 }} />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="page-section">
        <div className="flex-between">
          <div>
            <p className="text-eyebrow">Academic Portal</p>
            <h1 className="text-title" style={{ marginTop: 4 }}>My Grades</h1>
          </div>
        </div>
        <div className="empty-state card animate-fade-up" style={{ marginTop: 20 }}>
          <AlertCircle size={32} style={{ color: 'var(--text-muted)', marginBottom: 12, opacity: 0.6 }} />
          <p className="empty-state-title">No Student Profile Found</p>
          <p className="empty-state-body" style={{ maxWidth: 400, margin: '0 auto 16px' }}>
            Please complete your student profile setup first before you can view your grades.
          </p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalCourses = grades.length;
  const passedCourses = grades.filter(g => g.grade !== 'F').length;

  // Calculate credits earned
  let totalCreditsEarned = 0;
  grades.forEach(g => {
    if (g.grade !== 'F') {
      const course = courses.find(c => c._id === g.courseId);
      if (course) {
        totalCreditsEarned += course.credits;
      } else {
        totalCreditsEarned += 3; // default fallback credits
      }
    }
  });

  // Prepare chart data (course code vs score)
  const chartData = grades.map(g => {
    const course = courses.find(c => c._id === g.courseId);
    return {
      name: course?.code || 'Course',
      fullName: course?.name || 'Unknown',
      Score: g.score,
      Grade: g.grade,
    };
  }).reverse(); // Sort oldest to newest for chart progression

  const getBarColor = (score: number) => {
    if (score >= 90) return '#22c55e'; // Green
    if (score >= 75) return '#eab308'; // Yellow
    if (score >= 50) return '#3b82f6'; // Blue
    return '#dc2626'; // Red
  };

  return (
    <div className="page-section">
      {/* Header */}
      <div className="flex-between animate-fade-in">
        <div>
          <p className="text-eyebrow">Academic Records</p>
          <h1 className="text-title" style={{ marginTop: 4 }}>My Grades</h1>
        </div>
        <p className="text-caption">GPA: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{student.gpa ?? 'N/A'}</span></p>
      </div>

      {error && (
        <div className="alert-error animate-fade-in" style={{ marginBottom: 16 }}>
          <AlertCircle size={15} style={{ marginTop: 2 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="bento-3 stagger animate-fade-up">

        <div className="card" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: 'var(--accent)', opacity: 0.5 }} />
          <div className="flex-between">
            <p className="stat-card-label">Cumulative GPA</p>
            <div className="stat-card-icon" style={{ backgroundColor: 'rgba(234,179,8,0.1)' }}>
              <TrendingUp size={15} style={{ color: 'var(--accent)' }} />
            </div>
          </div>
          <p className="stat-card-value" style={{ marginTop: 10 }}>{student.gpa ?? '—'}</p>
        </div>

        <div className="card" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#3b82f6', opacity: 0.5 }} />
          <div className="flex-between">
            <p className="stat-card-label">Credits Completed</p>
            <div className="stat-card-icon" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
              <BookOpen size={15} style={{ color: '#3b82f6' }} />
            </div>
          </div>
          <p className="stat-card-value" style={{ marginTop: 10 }}>{totalCreditsEarned}</p>
        </div>

        <div className="card" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: 'var(--success)', opacity: 0.5 }} />
          <div className="flex-between">
            <p className="stat-card-label">Courses Passed</p>
            <div className="stat-card-icon" style={{ backgroundColor: 'rgba(22,163,74,0.1)' }}>
              <CheckCircle size={15} style={{ color: 'var(--success)' }} />
            </div>
          </div>
          <p className="stat-card-value" style={{ marginTop: 10 }}>{passedCourses} <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>/ {totalCourses}</span></p>
        </div>

      </div>

      {totalCourses === 0 ? (
        <div className="empty-state card animate-fade-up" style={{ marginTop: 24 }}>
          <Award size={28} style={{ color: 'var(--text-muted)', marginBottom: 12, opacity: 0.5 }} />
          <p className="empty-state-title">No Grades Recorded Yet</p>
          <p className="empty-state-body">
            You don't have any grading records listed in the system at this time.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginTop: 24 }} className="lg:grid-cols-[1fr_380px]">

          {/* Grades List Table */}
          <div className="table-wrapper animate-fade-up" style={{ alignSelf: 'start' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-heading">Grade Sheet</h3>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th className="table-header">Course</th>
                  <th className="table-header">Semester</th>
                  <th className="table-header" style={{ textAlign: 'center' }}>Score</th>
                  <th className="table-header" style={{ textAlign: 'center' }}>Grade</th>
                  <th className="table-header">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {grades.map(g => {
                  const course = courses.find(c => c._id === g.courseId);
                  return (
                    <tr key={g._id} className="table-row">
                      <td className="table-cell">
                        <div>
                          <p style={{ fontWeight: 500, margin: 0 }}>{course?.name || g.courseName || 'Course Name'}</p>
                          <span style={{
                            fontFamily: 'IBM Plex Mono, monospace', fontSize: 10.5,
                            color: 'var(--accent)', backgroundColor: 'rgba(234,179,8,0.1)',
                            padding: '1px 5px', borderRadius: 4, display: 'inline-block', marginTop: 3
                          }}>
                            {course?.code || 'CODE'} • {course?.credits ?? 3} credits
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                          <span>{g.semester}</span>
                        </div>
                      </td>
                      <td className="table-cell table-cell-mono" style={{ textAlign: 'center', fontWeight: 600 }}>
                        {g.score}
                      </td>
                      <td className="table-cell" style={{ textAlign: 'center' }}>
                        <GradeBadge grade={g.grade} />
                      </td>
                      <td className="table-cell" style={{ color: 'var(--text-secondary)', fontSize: 12.5, maxWidth: 200 }}>
                        {g.remarks ? (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            <MessageSquare size={12} style={{ color: 'var(--text-muted)', marginTop: 3, flexShrink: 0 }} />
                            <span>{g.remarks}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Recharts Analytics Panel */}
          <div className="card animate-fade-up" style={{ padding: '24px 22px', display: 'flex', flexDirection: 'column', height: '100%', animationDelay: '100ms' }}>
            <div style={{ marginBottom: 16 }}>
              <p className="text-eyebrow">Visual Analysis</p>
              <h3 className="text-heading" style={{ marginTop: 4 }}>Subject Performance</h3>
            </div>

            <div style={{ flex: 1, minHeight: 250, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    cursor={{ fill: 'rgba(234,179,8,0.04)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div style={{
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-strong)',
                            padding: '8px 12px',
                            borderRadius: 8,
                            boxShadow: 'var(--shadow-dropdown)',
                            fontSize: 12
                          }}>
                            <p style={{ margin: 0, fontWeight: 600 }}>{data.fullName}</p>
                            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>
                              Score: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{data.Score}</span>
                            </p>
                            <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)' }}>
                              Grade: <span className="text-mono" style={{ fontWeight: 600, color: 'var(--accent)' }}>{data.Grade}</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="Score" radius={[4, 4, 0, 0]} maxBarSize={30}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.Score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
              <div style={{ padding: 8, backgroundColor: 'rgba(34,197,94,0.06)', borderRadius: 8, textAlign: 'center' }}>
                <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--success)', fontWeight: 600 }}>Excellent (90+)</span>
                <p style={{ fontSize: 16, fontWeight: 600, margin: '2px 0 0' }}>
                  {grades.filter(g => g.score >= 90).length}
                </p>
              </div>
              <div style={{ padding: 8, backgroundColor: 'rgba(234,179,8,0.06)', borderRadius: 8, textAlign: 'center' }}>
                <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--accent-hover)', fontWeight: 600 }}>Average (75-89)</span>
                <p style={{ fontSize: 16, fontWeight: 600, margin: '2px 0 0' }}>
                  {grades.filter(g => g.score >= 75 && g.score < 90).length}
                </p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default MyGradesPage;
