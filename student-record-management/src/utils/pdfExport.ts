import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TranscriptData {
  studentName: string;
  studentEmail: string;
  enrollmentDate: string;
  gpa: number | string;
  status: string;
  grades: {
    courseCode: string;
    courseName: string;
    semester: string;
    examType: string;
    score: number;
    grade: string;
  }[];
  attendance: {
    courseCode: string;
    courseName: string;
    percentage: number;
    present: number;
    total: number;
  }[];
}

const ACCENT: [number, number, number] = [234, 179, 8]; // matches --accent
const DARK: [number, number, number]   = [9, 9, 11];
const MUTED: [number, number, number]  = [113, 113, 122];

export function exportTranscriptPDF(data: TranscriptData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ── Header ──
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(9, 9, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Official Academic Transcript', 14, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Student Record Management System', 14, 23);

  // ── Student info block ──
  let y = 40;
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(data.studentName, 14, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(`Email: ${data.studentEmail}`, 14, y);
  y += 5;
  doc.text(`Enrolled: ${data.enrollmentDate}`, 14, y);
  y += 5;
  doc.text(`Status: ${data.status.toUpperCase()}`, 14, y);

  // GPA badge on the right
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(pageWidth - 60, 36, 46, 20, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('CUMULATIVE GPA', pageWidth - 57, 43);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text(String(data.gpa), pageWidth - 57, 52);

  y += 14;

  // ── Grades table (SEE only matters for GPA, but show all) ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...DARK);
  doc.text('Academic Record', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Code', 'Course', 'Semester', 'Type', 'Score', 'Grade']],
    body: data.grades.map(g => [
      g.courseCode, g.courseName, g.semester,
      g.examType.toUpperCase(), String(g.score), g.grade,
    ]),
    theme: 'striped',
    headStyles: { fillColor: ACCENT, textColor: DARK, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: DARK },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: 14, right: 14 },
  });

  // ── Attendance table ──
  let y2 = (doc as any).lastAutoTable.finalY + 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Attendance Summary', 14, y2);
  y2 += 4;

  autoTable(doc, {
    startY: y2,
    head: [['Code', 'Course', 'Present', 'Total', 'Percentage']],
    body: data.attendance.map(a => [
      a.courseCode, a.courseName, String(a.present), String(a.total), `${a.percentage}%`,
    ]),
    theme: 'striped',
    headStyles: { fillColor: ACCENT, textColor: DARK, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: DARK },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: 14, right: 14 },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 4) {
        const pct = parseInt(String(hookData.cell.raw).replace('%', ''));
        if (pct < 75) hookData.cell.styles.textColor = [220, 38, 38];
        else if (pct >= 85) hookData.cell.styles.textColor = [22, 163, 74];
      }
    },
  });

  // ── Footer ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      `Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      14, pageHeight - 10
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
  }

  doc.save(`Transcript_${data.studentName.replace(/\s+/g, '_')}.pdf`);
}

interface AttendanceSheetData {
  courseName: string;
  courseCode: string;
  semester: string;
  date: string;
  records: { studentName: string; status: string }[];
}

export function exportAttendanceSheetPDF(data: AttendanceSheetData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setTextColor(9, 9, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Attendance Sheet', 14, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.courseCode} — ${data.courseName}`, 14, 22);

  let y = 38;
  doc.setTextColor(...DARK);
  doc.setFontSize(10);
  doc.text(`Semester: ${data.semester}`, 14, y);
  doc.text(`Date: ${data.date}`, pageWidth - 60, y);

  const present = data.records.filter(r => r.status === 'present').length;
  const total = data.records.length;

  autoTable(doc, {
    startY: y + 8,
    head: [['#', 'Student Name', 'Status']],
    body: data.records.map((r, i) => [String(i + 1), r.studentName, r.status.toUpperCase()]),
    theme: 'striped',
    headStyles: { fillColor: ACCENT, textColor: DARK, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 2) {
        const status = String(hookData.cell.raw);
        if (status === 'PRESENT') hookData.cell.styles.textColor = [22, 163, 74];
        else if (status === 'ABSENT') hookData.cell.styles.textColor = [220, 38, 38];
        else if (status === 'LATE') hookData.cell.styles.textColor = [202, 138, 4];
      }
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Present: ${present} / ${total} (${Math.round((present / total) * 100)}%)`, 14, finalY);

  doc.save(`Attendance_${data.courseCode}_${data.date}.pdf`);
}