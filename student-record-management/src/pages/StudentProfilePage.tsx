import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentService } from '../services/studentService';
import { Student } from '../types/student.types';
import { useTheme } from '../context/ThemeContext';
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar,
  User, BookOpen, Award, TrendingUp, Clock,
} from 'lucide-react';

const MOCK_COURSES = [
  { code: 'CS401', name: 'Data Structures',   grade: 'A',  score: 92, semester: 'Fall 2025' },
  { code: 'CS302', name: 'Computer Networks', grade: 'B+', score: 85, semester: 'Fall 2025' },
  { code: 'MA201', name: 'Advanced Calculus', grade: 'A+', score: 97, semester: 'Fall 2025' },
  { code: 'PH101', name: 'Physics Lab',       grade: 'B',  score: 78, semester: 'Spring 2025' },
];

const MOCK_ACTIVITY = [
  { text: 'Submitted Data Structures Assignment 3', time: '2 days ago' },
  { text: 'Attendance marked — Computer Networks',  time: '3 days ago' },
  { text: 'Grade updated — Advanced Calculus',      time: '1 week ago' },
  { text: 'Enrolled in Physics Lab',                time: '2 weeks ago' },
];

const GradeBadge = ({ grade }: { grade: string }) => {
  const map: Record<string, string> = {
    'A+': 'badge-green', 'A': 'badge-green',
    'B+': 'badge-yellow', 'B': 'badge-yellow',
    'C': 'badge-gray', 'D': 'badge-gray', 'F': 'badge-red',
  };
  return <span className={`badge ${map[grade] ?? 'badge-gray'}`}>{grade}</span>;
};

const InfoRow = ({
  icon: Icon, label, value,
}: {
  icon: React.ElementType; label: string; value: string;
}) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
    <div style={{
      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
      backgroundColor: 'rgba(234,179,8,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={14} style={{ color: 'var(--accent)' }} />
    </div>
    <div>
      <p style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        color: 'var(--text-muted)', margin: 0,
      }}>
        {label}
      </p>
      <p style={{
        fontSize: 13, color: 'var(--text-primary)',
        margin: '2px 0 0', fontWeight: 400,
      }}>
        {value}
      </p>
    </div>
  </div>
);

const GlassCard = ({
  children, style = {}, isDark = false,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  isDark?: boolean;
}) => (
  <div style={{
    backgroundColor: isDark ? 'rgba(17,17,20,0.75)' : 'rgba(255,255,255,0.65)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: isDark
      ? '1px solid rgba(255,255,255,0.07)'
      : '1px solid rgba(255,255,255,0.75)',
    borderRadius: 20,
    boxShadow: isDark
      ? '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)'
      : '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
    ...style,
  }}>
    {children}
  </div>
);

const StatPill = ({
  icon: Icon, label, value, color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) => (
  <div style={{
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: '16px 12px', flex: 1,
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: color + '18',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={16} style={{ color }} />
    </div>
    <p style={{
      fontFamily: 'Geist Mono, monospace', fontSize: 20,
      fontWeight: 500, color: 'var(--text-primary)',
      letterSpacing: '-0.03em', margin: 0,
    }}>
      {value}
    </p>
    <p style={{
      fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
      color: 'var(--text-muted)', margin: 0,
    }}>
      {label}
    </p>
  </div>
);

const StudentProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const data = await studentService.getById(id!);
        setStudent(data);
      } catch {
        setError('Failed to load student profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="page-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 120, height: 14, borderRadius: 4 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
          <div className="skeleton" style={{ height: 480, borderRadius: 20 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="skeleton" style={{ height: 120, borderRadius: 20 }} />
            <div className="skeleton" style={{ height: 300, borderRadius: 20 }} />
            <div className="skeleton" style={{ height: 200, borderRadius: 20 }} />
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !student) {
    return (
      <div className="page-section">
        <div className="alert-error">{error ?? 'Student not found.'}</div>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/students')}
        >
          <ArrowLeft size={14} />
          <span>Back to Students</span>
        </button>
      </div>
    );
  }

  // ── Derived values — student guaranteed non-null below ──
  const initials = student.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const dob = student.dateOfBirth
    ? new Date(student.dateOfBirth).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

  const enrolledOn = student.enrollmentDate
    ? new Date(student.enrollmentDate).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

  const shortId = String(student._id ?? '').slice(0, 8).toUpperCase();
  const courseCount = student.courseIds?.length ?? MOCK_COURSES.length;

  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  return (
    <div style={{
      minHeight: '100%',
      background: isDark
        ? 'linear-gradient(135deg, #0a0f1e 0%, #081a0e 40%, #0a0f1e 100%)'
        : 'linear-gradient(135deg, #fefce8 0%, #f0fdf4 40%, #eff6ff 100%)',
      margin: '-28px -32px',
      padding: '28px 32px',
      transition: 'background 0.3s ease',
    }}>

      {/* Back button */}
      <button
        className="btn btn-ghost animate-fade-in"
        style={{
          marginBottom: 24,
          backdropFilter: 'blur(8px)',
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.5)',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.7)',
          color: 'var(--text-primary)',
        }}
        onClick={() => navigate('/students')}
      >
        <ArrowLeft size={14} />
        <span>Back to Students</span>
      </button>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: 20,
        alignItems: 'start',
      }}>

        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Profile card */}
          <GlassCard isDark={isDark} style={{ padding: '32px 24px', textAlign: 'center' as const }}>

            {/* Avatar */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #eab308, #ca8a04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 26, fontWeight: 600,
              fontFamily: 'Geist Mono, monospace',
              color: '#09090b',
              boxShadow: '0 8px 24px rgba(234,179,8,0.35)',
            }}>
              {initials}
            </div>

            <p style={{
              fontSize: 18, fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em', margin: '0 0 4px',
            }}>
              {student.name}
            </p>
            <p style={{
              fontSize: 12, color: 'var(--text-muted)',
              margin: '0 0 14px',
              fontFamily: 'Geist Mono, monospace',
            }}>
              <span>ID: {shortId}</span>
            </p>

            <span className={`badge ${
              student.status === 'active' ? 'badge-green' : 'badge-gray'
            }`}>
              {student.status}
            </span>

            <div style={{ height: 1, backgroundColor: dividerColor, margin: '20px 0' }} />

            <div style={{
              display: 'flex', flexDirection: 'column',
              gap: 16, textAlign: 'left' as const,
            }}>
              <InfoRow icon={Mail}     label="Email"         value={student.email} />
              <InfoRow icon={Phone}    label="Phone"         value={student.phone} />
              <InfoRow icon={MapPin}   label="Address"       value={student.address} />
              <InfoRow icon={Calendar} label="Date of Birth" value={dob} />
              <InfoRow icon={Clock}    label="Enrolled On"   value={enrolledOn} />
              <InfoRow
                icon={User}
                label="Gender"
                value={student.gender.charAt(0).toUpperCase() + student.gender.slice(1)}
              />
            </div>
          </GlassCard>

          {/* Quick actions */}
          <GlassCard isDark={isDark} style={{ padding: 16 }}>
            <p style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              color: 'var(--text-muted)', margin: '0 0 12px',
            }}>
              Quick Actions
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Send Email',      icon: Mail },
                { label: 'View Transcript', icon: BookOpen },
                { label: 'Edit Profile',    icon: User },
              ].map(action => (
                <button
                  key={action.label}
                  className="btn btn-secondary"
                  style={{
                    justifyContent: 'flex-start', fontSize: 12,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  <action.icon size={13} />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stats strip */}
          <GlassCard isDark={isDark}>
            <div style={{ display: 'flex' }}>
              {[
                { icon: BookOpen,   label: 'Courses',    value: courseCount,        color: '#3b82f6' },
                { icon: Award,      label: 'GPA',        value: student.gpa ?? '—', color: '#eab308' },
                { icon: TrendingUp, label: 'Attendance', value: '87%',              color: '#22c55e' },
                {
                  icon: Calendar,
                  label: 'Status',
                  value: student.status === 'active' ? 'Active' : 'Inactive',
                  color: student.status === 'active' ? '#22c55e' : '#a1a1aa',
                },
              ].map((s, i, arr) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    borderRight: i < arr.length - 1 ? `1px solid ${dividerColor}` : 'none',
                  }}
                >
                  <StatPill {...s} />
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Enrolled courses */}
          <GlassCard isDark={isDark} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${dividerColor}` }}>
              <p className="text-eyebrow">Academic</p>
              <p className="text-heading" style={{ marginTop: 4 }}>Enrolled Courses</p>
            </div>

            {MOCK_COURSES.map((course, i) => (
              <div
                key={course.code}
                className="animate-fade-up"
                style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '13px 22px',
                  borderBottom: i < MOCK_COURSES.length - 1
                    ? `1px solid ${dividerColor}` : 'none',
                  transition: 'background 0.1s',
                  animationDelay: `${i * 50}ms`,
                }}
                onMouseEnter={e =>
                  (e.currentTarget.style.backgroundColor = isDark
                    ? 'rgba(234,179,8,0.06)'
                    : 'rgba(234,179,8,0.04)')
                }
                onMouseLeave={e =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{
                    fontFamily: 'Geist Mono, monospace', fontSize: 11,
                    fontWeight: 500, color: 'var(--accent)',
                    backgroundColor: 'rgba(234,179,8,0.1)',
                    padding: '3px 8px', borderRadius: 6,
                    letterSpacing: '0.04em',
                  }}>
                    {course.code}
                  </span>
                  <div>
                    <p style={{
                      fontSize: 13, fontWeight: 500,
                      color: 'var(--text-primary)', margin: 0,
                    }}>
                      {course.name}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '1px 0 0' }}>
                      {course.semester}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    fontFamily: 'Geist Mono, monospace',
                    fontSize: 13, fontWeight: 500,
                    color: 'var(--text-primary)',
                  }}>
                    {course.score}
                  </span>
                  <GradeBadge grade={course.grade} />
                </div>
              </div>
            ))}
          </GlassCard>

          {/* Recent activity */}
          <GlassCard isDark={isDark} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: `1px solid ${dividerColor}` }}>
              <p className="text-eyebrow">Timeline</p>
              <p className="text-heading" style={{ marginTop: 4 }}>Recent Activity</p>
            </div>

            <div style={{ padding: '8px 0' }}>
              {MOCK_ACTIVITY.map((item, i) => (
                <div
                  key={i}
                  className="animate-fade-up"
                  style={{
                    display: 'flex', gap: 14,
                    padding: '10px 22px',
                    animationDelay: `${i * 60}ms`,
                  }}
                >
                  <div style={{
                    display: 'flex', flexDirection: 'column' as const,
                    alignItems: 'center', flexShrink: 0,
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      backgroundColor: 'var(--accent)',
                      boxShadow: '0 0 0 3px rgba(234,179,8,0.15)',
                      marginTop: 4, flexShrink: 0,
                    }} />
                    {i < MOCK_ACTIVITY.length - 1 && (
                      <div style={{
                        width: 1, flex: 1, minHeight: 20,
                        backgroundColor: 'rgba(234,179,8,0.15)',
                        margin: '4px 0',
                      }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: i < MOCK_ACTIVITY.length - 1 ? 8 : 0 }}>
                    <p style={{
                      fontSize: 13, color: 'var(--text-primary)',
                      margin: 0, lineHeight: 1.4,
                    }}>
                      {item.text}
                    </p>
                    <p style={{
                      fontSize: 11, color: 'var(--text-muted)',
                      margin: '3px 0 0',
                      fontFamily: 'Geist Mono, monospace',
                    }}>
                      {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;