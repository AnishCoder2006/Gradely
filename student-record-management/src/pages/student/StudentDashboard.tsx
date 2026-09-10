import { useMemo } from 'react';
import { Award, BookOpen, CheckCircle2, Clock } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/dashboard/StatCard';
import {
  useGetStudentsQuery,
  useGetCoursesQuery,
  useGetGradesQuery,
  useGetAttendanceQuery,
  useGetMyPaymentsQuery,
} from '../../store';

const month = (date: string) => new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(date));

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: studentsData, error: e1 } = useGetStudentsQuery({});
  const { data: coursesData, error: e2 } = useGetCoursesQuery();
  const { data: gradesData, error: e3 } = useGetGradesQuery();
  const { data: attendanceData, error: e4 } = useGetAttendanceQuery();
  const { data: paymentsData, error: e5 } = useGetMyPaymentsQuery();

  const student = studentsData?.data?.[0];
  const _coursesArr = Array.isArray(coursesData) ? coursesData : [];
  const courses = student?.courseIds?.length && _coursesArr.length ? _coursesArr.filter(c => student.courseIds.includes(c._id)) : _coursesArr;
  const grades = Array.isArray(gradesData) ? gradesData : [];
  const attendance = Array.isArray(attendanceData) ? attendanceData : [];
  const payments = Array.isArray(paymentsData) ? paymentsData : [];

  const data = (studentsData && coursesData) ? { student, courses, grades, attendance, payments } : null;
  const error = (e1 || e2 || e3 || e4 || e5) ? 'Unable to load live dashboard data. Please refresh and try again.' : '';

  const attendanceRate = useMemo(() => !data?.attendance.length ? 0 : Math.round(data.attendance.filter(a => a.status !== 'absent').length * 100 / data.attendance.length), [data]);
  const trend = useMemo(() => Object.values((data?.attendance || []).reduce<Record<string, { name: string; total: number; present: number }>>((all, item) => { const key = item.date.slice(0, 7); all[key] ||= { name: month(item.date), total: 0, present: 0 }; all[key].total++; if (item.status !== 'absent') all[key].present++; return all; }, {})).slice(-6).map(x => ({ name: x.name, attendance: Math.round(x.present * 100 / x.total) })), [data]);
  const activities = useMemo(() => [
    ...(data?.grades || []).map(g => ({ text: `${g.examType.toUpperCase()} grade posted for ${g.courseName || 'a course'} (${g.score}%)`, date: g.updatedAt })),
    ...(data?.payments || []).map(p => ({ text: `Payment ${p.status}${typeof p.feeId === 'object' ? ` for ${p.feeId.title}` : ''}`, date: p.paidAt || p.createdAt })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5), [data]);

  const pending = data?.payments.filter(p => p.status === 'created').length || 0;
  return <div className="page-section">
    <div><p className="text-eyebrow">Student Overview</p><h1 className="text-title" style={{ marginTop: 4 }}>Welcome back, {student?.name || user?.name || 'Student'}</h1></div>
    {error && <div className="alert-error">{error}</div>}
    <div className="bento-4 stagger">
      <StatCard title="Enrolled Courses" value={data ? data.courses.length : '—'} icon={BookOpen} color="blue" />
      <StatCard title="Current GPA" value={data ? (student?.gpa ?? '—') : '—'} icon={Award} color="purple" />
      <StatCard title="Attendance Rate" value={data ? `${attendanceRate}%` : '—'} icon={CheckCircle2} color="green" valueColor="var(--status-success)" />
      <StatCard title="Pending Payments" value={data ? pending : '—'} icon={Clock} color="yellow" />
    </div>
    <div className="card" style={{ padding: 24 }}><p className="text-eyebrow">Attendance</p><h3 className="text-heading" style={{ margin: '4px 0 20px' }}>Monthly Attendance Trend</h3>
      {trend.length ? <ResponsiveContainer width="100%" height={240}><BarChart data={trend}><XAxis dataKey="name" /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="attendance" fill="var(--accent-primary-muted)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer> : <p className="text-caption">No attendance has been recorded yet.</p>}
    </div>
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}><div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}><p className="text-eyebrow">Activity Log</p><h3 className="text-heading" style={{ marginTop: 4 }}>Recent Actions</h3></div>
      {activities.length ? activities.map((item, index) => <div key={`${item.text}-${index}`} className="flex-between" style={{ padding: '13px 24px', borderBottom: '1px solid var(--border)' }}><p className="text-body">{item.text}</p><span className="text-mono">{new Date(item.date).toLocaleDateString()}</span></div>) : <p className="text-caption" style={{ padding: 24 }}>No recent activity yet.</p>}
    </div>
  </div>;
}
