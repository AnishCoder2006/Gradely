import { useEffect, useState } from 'react';
import { studentService } from '../services/studentService';
import { courseService } from '../services/courseService';
import { StatCard } from '../components/dashboard/StatCard';
import { Users, BookOpen, Award, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#d97706', '#6366f1', '#0d9488', '#8b5cf6'];

const COURSE_DISTRIBUTION = [
  { name: 'Computer Science', value: 35 },
  { name: 'Mathematics',      value: 25 },
  { name: 'Physics',          value: 20 },
  { name: 'Literature',       value: 20 },
];

const PERFORMANCE_DATA = [
  { name: 'Jan', students: 45 },
  { name: 'Feb', students: 52 },
  { name: 'Mar', students: 48 },
  { name: 'Apr', students: 61 },
  { name: 'May', students: 55 },
  { name: 'Jun', students: 67 },
];

const RECENT = [
  { name: 'Arjun Mehta',  action: 'Enrolled in Advanced Calculus',  time: '2m ago',  color: '#3b82f6' },
  { name: 'Priya Iyer',   action: 'Grade updated — Data Structures', time: '18m ago', color: '#22c55e' },
  { name: 'Rohan Sharma', action: 'Attendance marked — Physics',     time: '1h ago',  color: '#eab308' },
  { name: 'Sneha Pillai', action: 'New course registration',         time: '3h ago',  color: '#a855f7' },
  { name: 'Vikram Nair',  action: 'GPA recalculated — 3.82',        time: '5h ago',  color: '#22c55e' },
];

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-strong)',
      borderRadius: 8,
      padding: '8px 12px',
      boxShadow: 'var(--shadow-raised)',
    }}>
      <p className="text-caption" style={{ marginBottom: 2 }}>{label}</p>
      <p className="text-mono" style={{ fontSize: 15, fontWeight: 500 }}>
        {payload[0].value} students
      </p>
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-strong)',
      borderRadius: 8,
      padding: '8px 12px',
      boxShadow: 'var(--shadow-raised)',
    }}>
      <p className="text-caption" style={{ marginBottom: 2 }}>{payload[0].name}</p>
      <p className="text-mono" style={{ fontSize: 15, fontWeight: 500 }}>
        {payload[0].value}%
      </p>
    </div>
  );
};

const StatSkeleton = () => (
  <div style={{
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    padding: '22px 24px',
    boxShadow: 'var(--shadow-raised)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 14,
  }}>
    <div className="flex-between">
      <div className="skeleton" style={{ height: 10, width: '45%', borderRadius: 4 }} />
      <div className="skeleton" style={{ height: 30, width: 30, borderRadius: 8 }} />
    </div>
    <div className="skeleton" style={{ height: 28, width: '55%', borderRadius: 4 }} />
    <div className="skeleton" style={{ height: 10, width: '35%', borderRadius: 4 }} />
  </div>
);

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    activeStudents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [students, courses] = await Promise.all([
          studentService.getAll(),
          courseService.getAll(),
        ]);
        setStats({
          totalStudents: students.length,
          totalCourses: courses.length,
          activeStudents: students.filter((s) => s.status === 'active').length,
        });
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="page-section">

      {/* Page header */}
      <div className="flex-between animate-fade-in">
        <div>
          <p className="text-eyebrow">Overview</p>
          <h1 className="text-title" style={{ marginTop: 4 }}>Dashboard</h1>
        </div>
        <p className="text-caption">Academic Year 2025–26</p>
      </div>

      {error && <div className="alert-error animate-fade-in">{error}</div>}

      {/* Stat cards */}
      <div className="bento-4 stagger">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Total Students"
              value={stats.totalStudents}
              icon={Users}
              color="yellow"
              trend={{ value: 12, label: 'vs last month' }}
            />
            <StatCard
              title="Total Courses"
              value={stats.totalCourses}
              icon={BookOpen}
              color="blue"
              trend={{ value: 4, label: 'vs last month' }}
            />
            <StatCard
              title="Active Students"
              value={stats.activeStudents}
              icon={TrendingUp}
              color="green"
              trend={{ value: -2, label: 'vs last month' }}
            />
            <StatCard
              title="Avg GPA"
              value="3.65"
              icon={Award}
              color="purple"
              trend={{ value: 5, label: 'vs last semester' }}
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="bento-asymmetric">

        <div className="card animate-fade-up" style={{ padding: '24px 24px 16px' }}>
          <p className="text-eyebrow">Enrollment</p>
          <h3 className="text-heading" style={{ marginTop: 4, marginBottom: 20 }}>
            Monthly Trend
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={PERFORMANCE_DATA}
              barSize={28}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'Geist, sans-serif' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'Geist Mono, monospace' }}
              />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(217,119,6,0.03)' }} />
              <Bar dataKey="students" fill="#d97706" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card animate-fade-up" style={{ padding: 24, animationDelay: '60ms' }}>
          <p className="text-eyebrow">Breakdown</p>
          <h3 className="text-heading" style={{ marginTop: 4, marginBottom: 20 }}>
            Course Distribution
          </h3>

          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={COURSE_DISTRIBUTION}
                cx="50%" cy="50%"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {COURSE_DISTRIBUTION.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {COURSE_DISTRIBUTION.map((entry, i) => (
              <div key={i} className="flex-between">
                <div className="flex-start" style={{ gap: 8 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    backgroundColor: COLORS[i % COLORS.length],
                    flexShrink: 0,
                  }} />
                  <span className="text-subheading">{entry.name}</span>
                </div>
                <span className="text-mono" style={{ fontWeight: 500 }}>
                  {entry.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div
        className="card animate-fade-up"
        style={{ padding: 0, overflow: 'hidden', animationDelay: '120ms' }}
      >
        <div
          className="flex-between"
          style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <p className="text-eyebrow">Live Feed</p>
            <h3 className="text-heading" style={{ marginTop: 4 }}>Recent Activity</h3>
          </div>
          <div className="flex-start" style={{ gap: 6 }}>
            <span className="pulse-dot" />
            <span className="badge badge-green">Live</span>
          </div>
        </div>

        <div className="stagger">
          {RECENT.map((item, i) => (
            <div
              key={i}
              className="flex-start animate-fade-up"
              style={{
                gap: 14,
                padding: '13px 24px',
                borderBottom: i < RECENT.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.1s',
                cursor: 'default',
              }}
              onMouseEnter={e =>
                (e.currentTarget.style.backgroundColor = 'rgba(234,179,8,0.025)')
              }
              onMouseLeave={e =>
                (e.currentTarget.style.backgroundColor = 'transparent')
              }
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                backgroundColor: item.color + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Geist Mono, monospace',
                fontSize: 11, fontWeight: 600,
                color: item.color, flexShrink: 0,
              }}>
                {item.name.split(' ').map(n => n[0]).join('')}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="text-body truncate" style={{ fontWeight: 500 }}>
                  {item.name}
                </p>
                <p className="text-caption truncate">{item.action}</p>
              </div>

              <span className="text-mono" style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default DashboardPage;