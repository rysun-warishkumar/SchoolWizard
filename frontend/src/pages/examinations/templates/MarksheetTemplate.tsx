import React from 'react';
import './templates.css';

interface StudentData {
  id: number;
  admission_no: string;
  roll_no?: string;
  scholar_no?: string;
  first_name: string;
  last_name?: string;
  father_name?: string;
  mother_name?: string;
  date_of_birth?: string;
  gender?: string;
  photo?: string;
  class_name?: string;
  section_name?: string;
}

interface SubjectMark {
  subject_name: string;
  subject_code?: string;
  max_marks: number;
  passing_marks?: number;
  marks_obtained: number;
  grade?: string;
  // For term-wise marks
  term1_oral?: number;
  term1_half_yearly?: number;
  term1_total?: number;
  term1_note_book?: number;
  term2_oral?: number;
  term2_yearly?: number;
  term2_total?: number;
  grand_total?: number;
}

interface ExamData {
  id: number;
  name: string;
  exam_group_name?: string;
  session_name?: string;
}

interface SchoolInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  affiliation_no?: string;
  board_name?: string;
}

interface GradeScale {
  marks_range: string;
  grade: string;
}

interface MarksheetTemplateProps {
  student: StudentData;
  exam: ExamData;
  marks: SubjectMark[];
  schoolInfo: SchoolInfo;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  grade?: string;
  rank?: number;
  result?: 'PASS' | 'FAIL';
  promotedToClass?: string;
  gradeScale?: GradeScale[];
  coScholasticAreas?: string[];
  disciplineAreas?: string[];
}

const MarksheetTemplate: React.FC<MarksheetTemplateProps> = ({
  student,
  exam,
  marks,
  schoolInfo,
  totalMarks,
  maxMarks,
  percentage,
  grade,
  rank,
  result,
  promotedToClass,
  gradeScale,
  coScholasticAreas,
  disciplineAreas,
}) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim();

  // Default grade scale if not provided
  const defaultGradeScale: GradeScale[] = gradeScale || [
    { marks_range: '91-100', grade: 'A+' },
    { marks_range: '81-90', grade: 'A' },
    { marks_range: '71-80', grade: 'B+' },
    { marks_range: '61-70', grade: 'B' },
    { marks_range: '51-60', grade: 'C+' },
    { marks_range: '41-50', grade: 'C' },
    { marks_range: '32-40', grade: 'D' },
  ];

  // Default co-scholastic areas
  const defaultCoScholastic = coScholasticAreas || [
    'Work Education',
    'Art Education',
    'Health Physical Education',
    'Social Skills',
    'Sports',
  ];

  // Default discipline areas
  const defaultDiscipline = disciplineAreas || [
    'Regularity & Punctuality',
    'Sincerity',
    'Behaviour & Values',
    'Respectfulness for Rules & Reg.',
    'Attitude Towards Teachers',
    'Attitude Towards Society',
  ];

  return (
    <div className="marksheet-page">
      <div className="marksheet-container">
        {/* Decorative Border */}
        <div className="marksheet-border">
          <div className="marksheet-inner">
            {/* Header */}
            <div className="marksheet-header">
              <div className="header-logo-section">
                {schoolInfo.logo ? (
                  <img src={schoolInfo.logo} alt="School Logo" className="marksheet-logo" />
                ) : (
                  <div className="marksheet-logo-placeholder">
                    <span>🏫</span>
                  </div>
                )}
              </div>
              <div className="header-content">
                <h1 className="school-title">{schoolInfo.name}</h1>
                {schoolInfo.board_name && (
                  <div className="affiliation-text">
                    Affiliated to {schoolInfo.board_name}
                    {schoolInfo.affiliation_no && ` / Affiliation No.: ${schoolInfo.affiliation_no}`}
                  </div>
                )}
                {(schoolInfo.phone || schoolInfo.email) && (
                  <div className="contact-text">
                    {schoolInfo.phone && `Ph.: ${schoolInfo.phone}`}
                    {schoolInfo.phone && schoolInfo.email && ', '}
                    {schoolInfo.email && `Email: ${schoolInfo.email}`}
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="marksheet-title">
              <h2>Academic Record</h2>
              <div className="session-info">
                Academic Session - {exam.session_name || '-'}
              </div>
              <div className="class-info">
                Class: {student.class_name || '-'}
                {student.section_name && ` (${student.section_name})`}
              </div>
            </div>

            {/* Student Info */}
            <div className="student-info-section">
              <div className="info-row">
                <div className="info-group">
                  <span className="info-label">Name of Student</span>
                  <span className="info-value dotted">{studentName}</span>
                </div>
                <div className="info-group">
                  <span className="info-label">Roll No</span>
                  <span className="info-value dotted">{student.roll_no || '-'}</span>
                </div>
              </div>
              <div className="info-row">
                <div className="info-group">
                  <span className="info-label">Mother's Name</span>
                  <span className="info-value dotted">{student.mother_name || '-'}</span>
                </div>
                <div className="info-group">
                  <span className="info-label">Scholar No</span>
                  <span className="info-value dotted">{student.scholar_no || student.admission_no || '-'}</span>
                </div>
              </div>
              <div className="info-row">
                <div className="info-group">
                  <span className="info-label">Father's Name</span>
                  <span className="info-value dotted">{student.father_name || '-'}</span>
                </div>
                <div className="info-group">
                  <span className="info-label">Date of Birth</span>
                  <span className="info-value dotted">{formatDate(student.date_of_birth)}</span>
                </div>
              </div>
            </div>

            {/* Marks Table */}
            <div className="marks-section">
              <table className="marks-table">
                <thead>
                  <tr>
                    <th rowSpan={2} className="subject-header">Scholastic Area</th>
                    <th colSpan={4} className="term-header term1">Term I (100 Marks)</th>
                    <th colSpan={4} className="term-header term2">Term II (100 Marks)</th>
                    <th rowSpan={2} className="overall-header">Over All</th>
                  </tr>
                  <tr>
                    <th className="sub-header">Oral</th>
                    <th className="sub-header">Half Yearly</th>
                    <th className="sub-header">Total</th>
                    <th className="sub-header">Note Book</th>
                    <th className="sub-header">Oral</th>
                    <th className="sub-header">Yearly Exam</th>
                    <th className="sub-header">Total</th>
                    <th className="sub-header">Grand Total</th>
                  </tr>
                  <tr className="subjects-label">
                    <td>Subjects</td>
                    <td colSpan={8}></td>
                    <td></td>
                  </tr>
                </thead>
                <tbody>
                  {marks.map((mark, idx) => (
                    <tr key={idx}>
                      <td className="subject-name">{mark.subject_name}</td>
                      <td>{mark.term1_oral ?? ''}</td>
                      <td>{mark.term1_half_yearly ?? ''}</td>
                      <td>{mark.term1_total ?? ''}</td>
                      <td>{mark.term1_note_book ?? ''}</td>
                      <td>{mark.term2_oral ?? ''}</td>
                      <td>{mark.term2_yearly ?? ''}</td>
                      <td>{mark.term2_total ?? ''}</td>
                      <td>{mark.grand_total ?? mark.marks_obtained ?? ''}</td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Results Summary */}
            <div className="results-summary">
              <div className="summary-row">
                <div className="summary-item">
                  <span className="summary-label">Over All Marks</span>
                  <span className="summary-value">{totalMarks}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Percentage</span>
                  <span className="summary-value">{percentage.toFixed(2)}%</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Grade</span>
                  <span className="summary-value">{grade || '-'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Rank</span>
                  <span className="summary-value">{rank || '-'}</span>
                </div>
              </div>
            </div>

            {/* Co-Scholastic & Discipline Areas */}
            <div className="additional-sections">
              <div className="co-scholastic">
                <div className="section-title yellow-bg">CO-SCHOOLING AREA</div>
                <table className="area-table">
                  <thead>
                    <tr>
                      <th>Activity</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {defaultCoScholastic.map((area, idx) => (
                      <tr key={idx}>
                        <td>{area}</td>
                        <td></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="discipline">
                <div className="section-title blue-bg">DISCIPLINE</div>
                <table className="area-table">
                  <thead>
                    <tr>
                      <th>Activity</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {defaultDiscipline.map((area, idx) => (
                      <tr key={idx}>
                        <td>{area}</td>
                        <td></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Promotion Status */}
            <div className="promotion-section">
              <span className="promotion-text">
                Congratulation ! Promoted to Class - {promotedToClass || '_______'}
              </span>
            </div>

            {/* Grade Scale */}
            <div className="grade-scale-section">
              <div className="grade-scale-title">Grading Scale for Scholastic Areas</div>
              <table className="grade-scale-table">
                <thead>
                  <tr>
                    <th className="scale-header">Marks Range</th>
                    {defaultGradeScale.map((gs, idx) => (
                      <th key={idx} className="scale-value">{gs.marks_range}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="scale-header">Grade</td>
                    {defaultGradeScale.map((gs, idx) => (
                      <td key={idx} className="scale-value">{gs.grade}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="signatures-section">
              <div className="signature-box">
                <div className="signature-line"></div>
                <div className="signature-label">Class Teacher's Signature</div>
              </div>
              <div className="signature-box">
                <div className="signature-line"></div>
                <div className="signature-label">Principal's Signature</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarksheetTemplate;
