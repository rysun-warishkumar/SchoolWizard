import React from 'react';
import './templates.css';

interface StudentData {
  id: number;
  admission_no: string;
  roll_no?: string;
  first_name: string;
  last_name?: string;
  father_name?: string;
  mother_name?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  photo?: string;
  class_name?: string;
  section_name?: string;
}

interface ExamSubject {
  id: number;
  subject_name: string;
  subject_code?: string;
  exam_date?: string;
  exam_time_from?: string;
  exam_time_to?: string;
  room_number?: string;
  max_marks?: number;
}

interface ExamData {
  id: number;
  name: string;
  exam_group_name?: string;
  session_name?: string;
  subjects?: ExamSubject[];
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

interface AdmitCardTemplateProps {
  students: StudentData[];
  exam: ExamData;
  schoolInfo: SchoolInfo;
  examCenter?: string;
}

// Single Admit Card Component (landscape, half of A4)
const SingleAdmitCard: React.FC<{
  student: StudentData;
  exam: ExamData;
  schoolInfo: SchoolInfo;
  examCenter?: string;
}> = ({ student, exam, schoolInfo, examCenter }) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (from?: string, to?: string) => {
    if (!from) return '-';
    return `${from}${to ? ` - ${to}` : ''}`;
  };

  const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim();

  // Helper function to get logo URL
  const getLogoUrl = (logo: string | null | undefined): string | null => {
    if (!logo) return null;
    const logoStr = String(logo).trim();
    if (!logoStr || logoStr === 'null' || logoStr === 'undefined') return null;
    
    // File path - construct full URL
    if (logoStr.startsWith('/uploads/')) {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
      return apiBaseUrl.replace('/api/v1', '') + logoStr;
    }
    
    // External URL - return as-is
    if (logoStr.startsWith('http://') || logoStr.startsWith('https://')) {
      return logoStr;
    }
    
    // Relative path - construct URL
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    return apiBaseUrl.replace('/api/v1', '') + (logoStr.startsWith('/') ? logoStr : '/' + logoStr);
  };

  // Helper function to get photo URL
  const getPhotoUrl = (photo: string | null | undefined): string | null => {
    if (!photo) return null;
    const photoStr = String(photo).trim();
    if (!photoStr || photoStr === 'null' || photoStr === 'undefined') return null;
    
    // Data URL (base64) - return as-is
    if (photoStr.startsWith('data:image/')) {
      return photoStr;
    }
    
    // File path - construct full URL
    if (photoStr.startsWith('/uploads/')) {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
      return apiBaseUrl.replace('/api/v1', '') + photoStr;
    }
    
    // External URL - return as-is
    if (photoStr.startsWith('http://') || photoStr.startsWith('https://')) {
      return photoStr;
    }
    
    // Assume base64 if no prefix and long enough
    if (photoStr.length > 100) {
      return `data:image/jpeg;base64,${photoStr}`;
    }
    
    // Relative path - construct URL
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    return apiBaseUrl.replace('/api/v1', '') + (photoStr.startsWith('/') ? photoStr : '/' + photoStr);
  };

  const logoUrl = getLogoUrl(schoolInfo.logo);
  const photoUrl = getPhotoUrl(student.photo);

  return (
    <div className="admit-card-single">
      {/* Header with School Info */}
      <div className="admit-card-header">
        <div className="header-logo">
          {logoUrl ? (
            <img src={logoUrl} alt="School Logo" className="school-logo" />
          ) : (
            <div className="school-logo-placeholder">
              <span>🏫</span>
            </div>
          )}
        </div>
        <div className="header-center">
          {schoolInfo.board_name && (
            <div className="board-name">{schoolInfo.board_name}</div>
          )}
          <div className="school-name">{schoolInfo.name}</div>
          {schoolInfo.affiliation_no && (
            <div className="affiliation">Affiliation No: {schoolInfo.affiliation_no}</div>
          )}
          {schoolInfo.address && (
            <div className="school-address">{schoolInfo.address}</div>
          )}
          {(schoolInfo.phone || schoolInfo.email) && (
            <div className="school-contact">
              {schoolInfo.phone && <span>Ph: {schoolInfo.phone}</span>}
              {schoolInfo.phone && schoolInfo.email && <span> | </span>}
              {schoolInfo.email && <span>Email: {schoolInfo.email}</span>}
            </div>
          )}
        </div>
        <div className="header-logo">
          {logoUrl ? (
            <img src={logoUrl} alt="School Logo" className="school-logo" />
          ) : (
            <div className="school-logo-placeholder">
              <span>🏫</span>
            </div>
          )}
        </div>
      </div>

      {/* Exam Title */}
      <div className="admit-card-title">
        <div className="exam-name-title">{exam.name}</div>
        <div className="exam-subtitle">
          {exam.session_name && `${exam.session_name} Examinations`}
        </div>
      </div>

      {/* Student Information */}
      <div className="admit-card-body">
        <div className="student-details">
          <table className="info-table">
            <tbody>
              <tr>
                <td className="label">ROLL NUMBER</td>
                <td className="value">{student.roll_no || '-'}</td>
                <td className="label">ADMISSION NO</td>
                <td className="value">{student.admission_no}</td>
              </tr>
              <tr>
                <td className="label">CANDIDATE'S NAME</td>
                <td className="value" colSpan={3}>{studentName}</td>
              </tr>
              <tr>
                <td className="label">D.O.B</td>
                <td className="value">{formatDate(student.date_of_birth)}</td>
                <td className="label">GENDER</td>
                <td className="value">{student.gender?.toUpperCase() || '-'}</td>
              </tr>
              <tr>
                <td className="label">FATHER'S NAME</td>
                <td className="value">{student.father_name || '-'}</td>
                <td className="label">MOTHER'S NAME</td>
                <td className="value">{student.mother_name || '-'}</td>
              </tr>
              <tr>
                <td className="label">CLASS</td>
                <td className="value">
                  {student.class_name || '-'}
                  {student.section_name && ` (${student.section_name})`}
                </td>
                <td className="label">EXAM CENTER</td>
                <td className="value">{examCenter || schoolInfo.name}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="student-photo">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={studentName}
              className="photo"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const placeholder = target.nextElementSibling as HTMLElement;
                if (placeholder) {
                  placeholder.classList.remove('hidden');
                }
              }}
              onLoad={(e) => {
                const target = e.target as HTMLImageElement;
                const placeholder = target.nextElementSibling as HTMLElement;
                if (placeholder) {
                  placeholder.classList.add('hidden');
                }
              }}
            />
          ) : null}
          <div className={`photo-placeholder ${photoUrl ? 'hidden' : ''}`}>
            <span>NO IMAGE</span>
            <span>AVAILABLE</span>
          </div>
        </div>
      </div>

      {/* Exam Schedule Table */}
      {exam.subjects && exam.subjects.length > 0 && (
        <div className="exam-schedule">
          <table className="schedule-table">
            <thead>
              <tr>
                <th>THEORY EXAM DATE & TIME</th>
                <th>PAPER CODE</th>
                <th>SUBJECT</th>
                <th>OPTED BY STUDENT</th>
              </tr>
            </thead>
            <tbody>
              {exam.subjects.map((subject, idx) => (
                <tr key={subject.id || idx}>
                  <td>
                    {formatDate(subject.exam_date)} {formatTime(subject.exam_time_from, subject.exam_time_to)}
                  </td>
                  <td>{subject.subject_code || '-'}</td>
                  <td>{subject.subject_name}</td>
                  <td>TH</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer with Signature */}
      <div className="admit-card-footer">
        <div className="signature-section">
          <div className="signature-line"></div>
          <div className="signature-label">Controller of Examination</div>
        </div>
      </div>
    </div>
  );
};

// Main Component - Renders 2 admit cards per A4 landscape page
const AdmitCardTemplate: React.FC<AdmitCardTemplateProps> = ({
  students,
  exam,
  schoolInfo,
  examCenter,
}) => {
  // Group students into pairs for 2 per page
  const studentPairs: StudentData[][] = [];
  for (let i = 0; i < students.length; i += 2) {
    studentPairs.push(students.slice(i, i + 2));
  }

  return (
    <div className="admit-cards-container">
      {studentPairs.map((pair, pageIndex) => (
        <div key={pageIndex} className="admit-card-page">
          {pair.map((student, cardIndex) => (
            <SingleAdmitCard
              key={student.id || `${pageIndex}-${cardIndex}`}
              student={student}
              exam={exam}
              schoolInfo={schoolInfo}
              examCenter={examCenter}
            />
          ))}
          {/* If odd number of students, add empty placeholder for last page */}
          {pair.length === 1 && <div className="admit-card-single empty"></div>}
        </div>
      ))}
    </div>
  );
};

export default AdmitCardTemplate;
