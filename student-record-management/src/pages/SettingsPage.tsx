import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { studentService } from '../services/studentService';
import { gradeService } from '../services/gradeService';
import { attendanceService } from '../services/attendanceService';
import { exportTranscriptPDF } from '../utils/pdfExport';
import { useToastContext } from '../context/ToastContext';
import { SettingsSection, SettingsRow, Toggle } from './SettingsShared';
import { SettingsMfaSection } from './SettingsMfaSection';
import { Sun, Moon, Shield, Database, User, ChevronRight, Building, BookOpen, Download } from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success, error: toastError } = useToastContext();
  const [exporting, setExporting] = useState(false);
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    newStudentSignup: true, courseRequests: true, systemAlerts: true,
    gradePosted: true, attendanceAlert: true, doubtReplied: true, announcements: true,
    newDoubt: true, courseApproval: true, lowAttendanceAlerts: true,
  });

  const handleDownloadTranscript = async () => {
    if (!user?.email) return;
    setExporting(true);
    try {
      const studentData = await studentService.getAll({ email: user.email });
      const student = studentData[0];
      if (!student) {
        toastError('No student profile found. Complete your profile first.');
        return;
      }

      const [allGrades, attendanceSummary] = await Promise.all([
        gradeService.getAll(),
        attendanceService.getSummary(student._id),
      ]);

      const myGrades = allGrades.filter((g: any) => g.studentId === student._id);

      exportTranscriptPDF({
        studentName: student.name,
        studentEmail: student.email,
        enrollmentDate: new Date(student.enrollmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        gpa: student.gpa ?? 'N/A',
        status: student.status,
        grades: myGrades.map((g: any) => ({
          courseCode: g.courseCode ?? '',
          courseName: g.courseName ?? '',
          semester: g.semester,
          examType: g.examType ?? 'see',
          score: g.score,
          grade: g.grade,
        })),
        attendance: attendanceSummary.map((a: any) => ({
          courseCode: a.courseCode,
          courseName: a.courseName,
          percentage: a.percentage,
          present: a.present,
          total: a.total,
        })),
      });

      success('Transcript downloaded!');
    } catch {
      toastError('Failed to generate transcript.');
    } finally {
      setExporting(false);
    }
  };

  const getNotificationItems = () => {
    if (user?.role === 'admin') {
      return [
        { key: 'newStudentSignup', label: 'New Student Signups', desc: 'Alert when a student registers' },
        { key: 'courseRequests',   label: 'Course Requests',      desc: 'Alert when a teacher requests a course' },
        { key: 'systemAlerts',     label: 'System Alerts',        desc: 'Critical errors and warnings' },
      ];
    }
    if (user?.role === 'teacher') {
      return [
        { key: 'newDoubt',             label: 'New Doubts',           desc: 'Alert when a student raises a doubt' },
        { key: 'courseApproval',       label: 'Course Approval',      desc: 'Alert when admin approves/rejects your course' },
        { key: 'lowAttendanceAlerts',  label: 'Attendance Alerts',    desc: 'Alert when a student falls below 75%' },
      ];
    }
    return [
      { key: 'gradePosted',     label: 'Grade Posted',         desc: 'Alert when a teacher posts a new grade' },
      { key: 'attendanceAlert', label: 'Attendance Warnings',  desc: 'Alert when attendance falls below 75%' },
      { key: 'doubtReplied',    label: 'Doubt Replies',        desc: 'Alert when a teacher replies to your doubt' },
      { key: 'announcements',   label: 'Announcements',        desc: 'Alert on new institution announcements' },
    ];
  };

  return (
    <div className="page-section">
      <div className="animate-fade-in">
        <p className="text-eyebrow">{user?.role === 'admin' ? 'System' : user?.role === 'teacher' ? 'Teacher Settings' : 'Student Settings'}</p>
        <h1 className="text-title" style={{ marginTop: 4 }}>Settings</h1>
      </div>

      {user?.role === 'admin' && (
        <SettingsSection title="Institution">
          <SettingsRow
            icon={Building}
            label="Institution Details"
            description="Manage academic year, department, and branding"
            action={<button className="btn btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }}><span>Edit</span><ChevronRight size={12} /></button>}
          />
          <div style={{ padding: '14px 22px', display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label className="input-label">Institution Name</label>
              <input className="input" defaultValue="Dayananda Sagar College of Engineering" />
            </div>
            <div style={{ width: 140 }}>
              <label className="input-label">Academic Year</label>
              <input className="input" defaultValue="2025–26" />
            </div>
          </div>
        </SettingsSection>
      )}

      <SettingsSection title="Profile">
        <SettingsRow
          icon={User}
          label={user?.role === 'admin' ? 'Administrator Account' : (user?.name ?? (user?.role === 'teacher' ? 'Teacher' : 'Student'))}
          description={user?.role === 'admin' ? 'admin@college.edu' : user?.email}
          action={<button className="btn btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }}><span>Edit Profile</span><ChevronRight size={12} /></button>}
        />
      </SettingsSection>

      {user?.role === 'teacher' && (
        <SettingsSection title="Teaching">
          <SettingsRow
            icon={BookOpen}
            label="Default Grading Scale"
            description="A+ to F (10-point GPA scale)"
            action={<span className="badge badge-gray">Standard</span>}
          />
        </SettingsSection>
      )}

      <SettingsSection title="Appearance">
        <SettingsRow
          icon={theme === 'dark' ? Moon : Sun}
          label="Theme"
          description={theme === 'dark' ? 'Dark mode active' : 'Light mode active'}
          action={<Toggle checked={theme === 'dark'} onChange={toggleTheme} />}
        />
      </SettingsSection>

      <SettingsSection title={user?.role === 'admin' ? 'Admin Notifications' : 'Notifications'}>
        {getNotificationItems().map((item, i, arr) => (
          <div key={item.key} className="flex-between" style={{ padding: '14px 22px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }} >
            <div>
              <p className="text-body" style={{ fontWeight: 500 }}>{item.label}</p>
              <p className="text-caption" style={{ marginTop: 1 }}>{item.desc}</p>
            </div>
            <Toggle
              checked={!!notifications[item.key]}
              onChange={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
            />
          </div>
        ))}
      </SettingsSection>

      {user?.role === 'student' && (
        <SettingsSection title="My Data">
          <SettingsRow
            icon={Download}
            label="Download My Transcript"
            description="Export your grades and attendance as a PDF document"
            action={
              <button
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: '5px 12px' }}
                onClick={handleDownloadTranscript}
                disabled={exporting}
              >
                <span>{exporting ? 'Generating...' : 'Download'}</span>
                {!exporting && <ChevronRight size={12} />}
              </button>
            }
          />
        </SettingsSection>
      )}

      {/* Security & Multi-Factor Authentication Section */}
      <SettingsMfaSection />

      <SettingsSection title="Security">
        <SettingsRow icon={Shield} label="Change Password" description="Last changed 30 days ago"
          action={<button className="btn btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }}><span>Update</span><ChevronRight size={12} /></button>} />
      </SettingsSection>

      {user?.role === 'admin' && (
        <SettingsSection title="Data Management">
          <SettingsRow icon={Database} label="Export All Data" description="Download a full system backup"
            action={<button className="btn btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }}><span>Export</span><ChevronRight size={12} /></button>} />
          <div style={{ padding: '14px 22px' }}>
            <button className="btn btn-danger" style={{ fontSize: 12 }} onClick={() => alert('This would clear all data.')}>
              Clear All Records
            </button>
            <p className="text-caption" style={{ marginTop: 6 }}>
              This action is irreversible. All student, course, and grade data will be deleted.
            </p>
          </div>
        </SettingsSection>
      )}
    </div>
  );
};

export default SettingsPage;