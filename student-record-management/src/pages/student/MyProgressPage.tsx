import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import { gradeService } from '../../services/gradeService';
import { courseService } from '../../services/courseService';
import { attendanceService } from '../../services/attendanceService';
import { Student } from '../../types/student.types';
import { Course } from '../../types/course.types';
import { GradeRecord } from '../../types/grade.types';
import { AlertTriangle, Flame, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, Line } from 'recharts';

const MyProgressPage = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Target GPA Planner State
  const [targetGpa, setTargetGpa] = useState(3.8);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email) return;
      try {
        setLoading(true);
        // 1. Get student record
        const data = await studentService.getAll({ email: user.email });
        const studentRecord = data[0] ?? null;
        if (!studentRecord) {
          setStudent(null);
          setLoading(false);
          return;
        }
        setStudent(studentRecord);

        // 2. Fetch grades, courses, and attendance summary
        const [allGrades, allCourses, attendanceSummary] = await Promise.all([
          gradeService.getAll(),
          courseService.getAll(),
          attendanceService.getSummary()
        ]);

        const studentGrades = allGrades.filter(g => g.studentId === studentRecord._id);
        setGrades(studentGrades);
        setCourses(allCourses);
        setAttendance(attendanceSummary);
      } catch (err) {
        console.error(err);
        setError('Failed to load progress details.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="page-section">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-xl)' }} />
          <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-xl)' }} />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="page-section">
        <div className="flex-between">
          <div>
            <p className="text-eyebrow">Academic Portal</p>
            <h1 className="text-title" style={{ marginTop: 4 }}>My Progress</h1>
          </div>
        </div>
        <div className="empty-state card animate-fade-up" style={{ marginTop: 20 }}>
          <AlertTriangle size={32} style={{ color: 'var(--text-muted)', marginBottom: 12, opacity: 0.6 }} />
          <p className="empty-state-title">No Student Profile Found</p>
          <p className="empty-state-body">
            Please complete your student profile setup first before you can view your progress statistics.
          </p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalCourses = grades.length;
  const currentGpa = student.gpa || 3.0;
  
  // Calculate completed credits vs total program credits
  let completedCredits = 0;
  grades.forEach(g => {
    if (g.grade !== 'F') {
      const course = courses.find(c => c._id === g.courseId);
      completedCredits += course?.credits || 3;
    }
  });

  const totalRequiredCredits = 30; // standard academic year threshold
  const creditProgressPercent = Math.min(Math.round((completedCredits / totalRequiredCredits) * 100), 100);

  // Check for attendance risks
  const lowAttendanceCourses = attendance.filter(a => a.percentage < 75);

  // Determine Academic Standing
  let standing = 'Satisfactory';
  let standingColor = '#3b82f6';
  if (currentGpa >= 3.6) {
    standing = 'Excellent (Dean\'s List)';
    standingColor = '#22c55e';
  } else if (currentGpa >= 3.0) {
    standing = 'Good Standing';
    standingColor = '#eab308';
  } else if (currentGpa < 2.0) {
    standing = 'Academic Probation';
    standingColor = '#dc2626';
  }

  // Combined data for analysis (Scores vs Attendance)
  const analysisData = attendance.map(a => {
    const gradeRec = grades.find(g => g.courseId === a.courseId);
    return {
      name: a.courseCode,
      courseName: a.courseName,
      'Attendance %': a.percentage,
      'Score': gradeRec ? gradeRec.score : 0,
    };
  });

  // Score progression data (sorted chronologically)
  const timelineData = grades.map((g, i) => {
    const course = courses.find(c => c._id === g.courseId);
    return {
      index: i + 1,
      name: course?.code || `C${i + 1}`,
      score: g.score,
      semester: g.semester
    };
  }).reverse();

  // Target GPA Planner math
  const estimatedRemainingCourses = Math.max(12 - totalCourses, 1);
  const totalTargetPoints = targetGpa * (totalCourses + estimatedRemainingCourses);
  const currentTotalPoints = currentGpa * totalCourses;
  const neededAverageGpa = (totalTargetPoints - currentTotalPoints) / estimatedRemainingCourses;

  const getNeededGradeMessage = (neededGpa: number) => {
    if (neededGpa > 4.0) return 'Requires a near-impossible average (> 4.0 GPA). Target may be too high.';
    if (neededGpa >= 3.7) return 'Requires outstanding performance (A / A+ average).';
    if (neededGpa >= 3.3) return 'Requires a strong performance (B+ / A average).';
    if (neededGpa >= 2.7) return 'Requires a solid, steady performance (B average).';
    if (neededGpa > 0) return 'Easily attainable. Keep up your current pace.';
    return 'Goal already met! Maintain your current performance.';
  };

  return (
    <div className="page-section">
      {/* Header */}
      <div className="flex-between animate-fade-in">
        <div>
          <p className="text-eyebrow">Academic Analytics</p>
          <h1 className="text-title" style={{ marginTop: 4 }}>My Progress</h1>
        </div>
      </div>

      {error && (
        <div className="alert-error animate-fade-in" style={{ marginBottom: 16 }}>
          <AlertTriangle size={15} style={{ marginTop: 2 }} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="lg:grid-cols-[1fr_340px]">
        
        {/* Left column: Charts & Graphs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Timeline Score Trend Chart */}
          <div className="card animate-fade-up" style={{ padding: '24px 22px' }}>
            <div style={{ marginBottom: 16 }}>
              <p className="text-eyebrow">Academic Journey</p>
              <h3 className="text-heading" style={{ marginTop: 4 }}>Score Trajectory</h3>
            </div>

            <div style={{ width: '100%', height: 260 }}>
              {timelineData.length === 0 ? (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Not enough grading data to map trajectory.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} domain={[0, 100]} />
                    <Tooltip
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
                              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 10 }}>{data.semester}</p>
                              <p style={{ margin: '3px 0 0', fontWeight: 600 }}>{data.name}</p>
                              <p style={{ margin: '4px 0 0', color: 'var(--accent-hover)', fontWeight: 600 }}>
                                Score: {data.score}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Comparative analysis (Attendance vs Score) */}
          <div className="card animate-fade-up" style={{ padding: '24px 22px', animationDelay: '60ms' }}>
            <div style={{ marginBottom: 16 }}>
              <p className="text-eyebrow">Correlation Analysis</p>
              <h3 className="text-heading" style={{ marginTop: 4 }}>Attendance vs. Scores</h3>
            </div>

            <div style={{ width: '100%', height: 260 }}>
              {analysisData.length === 0 ? (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Requires grading and attendance logs to generate correlation.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analysisData} margin={{ top: 10, right: -5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} domain={[0, 100]} />
                    <Tooltip
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
                              <p style={{ margin: 0, fontWeight: 600 }}>{data.courseName}</p>
                              <p style={{ margin: '4px 0 0', color: '#3b82f6' }}>
                                Attendance: <span style={{ fontWeight: 600 }}>{data['Attendance %']}%</span>
                              </p>
                              <p style={{ margin: '2px 0 0', color: 'var(--accent-hover)' }}>
                                Academic Score: <span style={{ fontWeight: 600 }}>{data['Score']}</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="Attendance %" fill="#3b82f6" opacity={0.65} radius={[4, 4, 0, 0]} maxBarSize={24} />
                    <Line type="monotone" dataKey="Score" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: 'var(--bg-card)', stroke: 'var(--accent)', strokeWidth: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 11, color: 'var(--text-secondary)', marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, backgroundColor: '#3b82f6', opacity: 0.65, borderRadius: 2 }} />
                <span>Attendance Percentage</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 2, backgroundColor: 'var(--accent)' }} />
                <span>Subject Score</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right column: Planner & Standing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-up">
          
          {/* Status card */}
          <div className="card" style={{ padding: '24px 22px' }}>
            <h3 className="text-heading" style={{ marginBottom: 16 }}>Academic Overview</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div>
                <p className="input-label" style={{ margin: 0, fontSize: 10, textTransform: 'uppercase' }}>Academic Standing</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: standingColor }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{standing}</p>
                </div>
              </div>

              {/* Progress Ring / Bar for credits */}
              <div>
                <div className="flex-between" style={{ marginBottom: 6 }}>
                  <p className="input-label" style={{ margin: 0, fontSize: 10, textTransform: 'uppercase' }}>Syllabus Credit Progress</p>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{completedCredits} / {totalRequiredCredits} Cr</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, backgroundColor: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${creditProgressPercent}%`, borderRadius: 99, backgroundColor: 'var(--accent)', transition: 'width 0.6s ease' }} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, margin: '4px 0 0' }}>
                  {creditProgressPercent}% of total required year credits completed.
                </p>
              </div>

              {/* Attendance warnings */}
              {lowAttendanceCourses.length > 0 && (
                <div style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--error-bg)',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  gap: 8,
                  marginTop: 4,
                }}>
                  <AlertTriangle size={16} style={{ color: 'var(--error)', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--error)', margin: 0 }}>Attendance Risk Alert</p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                      You are below 75% in <span style={{ fontWeight: 600 }}>{lowAttendanceCourses.length}</span> course(s). You may face attendance shortages.
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Interactive GPA Planner */}
          <div className="card" style={{ padding: '24px 22px', animationDelay: '80ms' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Flame size={16} style={{ color: 'var(--accent)' }} />
              <h3 className="text-heading" style={{ margin: 0 }}>GPA Goal Planner</h3>
            </div>
            
            <p className="text-caption" style={{ marginBottom: 16 }}>
              Adjust the slider to see what average GPA you need in your remaining courses to hit your goal.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div className="flex-between">
                  <span className="input-label" style={{ fontSize: 11 }}>Target Cumulative GPA</span>
                  <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>{targetGpa.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="4.0"
                  step="0.05"
                  value={targetGpa}
                  onChange={e => setTargetGpa(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: 'var(--accent)',
                    marginTop: 8,
                    cursor: 'pointer'
                  }}
                />
              </div>

              <div style={{
                padding: '14px',
                backgroundColor: 'var(--bg-base)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                textAlign: 'center'
              }}>
                <span className="stat-card-label" style={{ fontSize: 8.5 }}>Needed Average GPA</span>
                <p className="stat-card-value" style={{
                  fontSize: 28,
                  marginTop: 4,
                  color: neededAverageGpa > 4.0 ? 'var(--error)' : neededAverageGpa >= 3.5 ? 'var(--success)' : 'var(--text-primary)'
                }}>
                  {neededAverageGpa > 4.0 ? 'Out of Reach' : neededAverageGpa <= 0 ? 'Goal Met' : neededAverageGpa.toFixed(2)}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: 'var(--text-secondary)' }}>
                <ArrowUpRight size={14} style={{ flexShrink: 0, marginTop: 2, color: 'var(--text-muted)' }} />
                <span>
                  {getNeededGradeMessage(neededAverageGpa)}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default MyProgressPage;
