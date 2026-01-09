import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import {
  examinationsService,
  MarksGrade,
  ExamGroup,
  Exam,
  ExamSubject,
  ExamMark,
  AdmitCardTemplate,
  MarksheetTemplate,
} from '../../services/api/examinationsService';
import { settingsService } from '../../services/api/settingsService';
import { academicsService } from '../../services/api/academicsService';
import { studentsService } from '../../services/api/studentsService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import AdmitCardTemplateComponent from './templates/AdmitCardTemplate';
import MarksheetTemplateComponent from './templates/MarksheetTemplate';
import './Examinations.css';
import './templates/templates.css';

// ========== Predefined Admit Card Template (Landscape, 2 per A4) ==========
interface AdmitCardPredefinedTemplateProps {
  students: any[];
  exam: any;
  schoolInfo: any;
  examCenter?: string;
}

const SingleAdmitCard: React.FC<{
  student: any;
  exam: any;
  schoolInfo: any;
  examCenter?: string;
}> = ({ student, exam, schoolInfo, examCenter }) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (from?: string, to?: string) => {
    if (!from) return '-';
    return `${from}${to ? ` - ${to}` : ''}`;
  };

  const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
  const subjects = Array.isArray(exam.subjects) ? exam.subjects : [];

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
    
    // Assume base64 if no prefix
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
      <div className="admit-card-header">
        <div className="header-logo">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="school-logo" />
          ) : (
            <div className="school-logo-placeholder"><span>🏫</span></div>
          )}
        </div>
        <div className="header-center">
          {schoolInfo.board_name && <div className="board-name">{schoolInfo.board_name}</div>}
          <div className="school-name">{schoolInfo.name}</div>
          {schoolInfo.affiliation_no && <div className="affiliation">Affiliation No: {schoolInfo.affiliation_no}</div>}
          {schoolInfo.address && <div className="school-address">{schoolInfo.address}</div>}
        </div>
        <div className="header-logo">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="school-logo" />
          ) : (
            <div className="school-logo-placeholder"><span>🏫</span></div>
          )}
        </div>
      </div>

      <div className="admit-card-title">
        <div className="exam-name-title">{exam.name}</div>
        <div className="exam-subtitle">{exam.session_name && `${exam.session_name} Examinations`}</div>
      </div>

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
                <td className="value">{student.class_name || '-'}{student.section_name && ` (${student.section_name})`}</td>
                <td className="label">EXAM CENTER</td>
                <td className="value">{examCenter || schoolInfo.name}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="student-photo">
          {photoUrl ? (
            <img src={photoUrl} alt={studentName} className="photo" />
          ) : (
            <div className="photo-placeholder"><span>NO IMAGE</span><span>AVAILABLE</span></div>
          )}
        </div>
      </div>

      {subjects.length > 0 && (
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
              {subjects.map((subject: any, idx: number) => (
                <tr key={subject.id || idx}>
                  <td>{formatDate(subject.exam_date)} {formatTime(subject.exam_time_from, subject.exam_time_to)}</td>
                  <td>{subject.subject_code || '-'}</td>
                  <td>{subject.subject_name}</td>
                  <td>TH</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="admit-card-footer">
        <div className="signature-section">
          <div className="signature-line"></div>
          <div className="signature-label">Controller of Examination</div>
        </div>
      </div>
    </div>
  );
};

const AdmitCardPredefinedTemplate: React.FC<AdmitCardPredefinedTemplateProps> = ({ students, exam, schoolInfo, examCenter }) => {
  const studentPairs: any[][] = [];
  for (let i = 0; i < students.length; i += 2) {
    studentPairs.push(students.slice(i, i + 2));
  }

  return (
    <div className="admit-cards-container">
      {studentPairs.map((pair, pageIndex) => (
        <div key={pageIndex} className="admit-card-page">
          {pair.map((student, cardIndex) => (
            <SingleAdmitCard key={student.id || `${pageIndex}-${cardIndex}`} student={student} exam={exam} schoolInfo={schoolInfo} examCenter={examCenter} />
          ))}
          {pair.length === 1 && <div className="admit-card-single empty"></div>}
        </div>
      ))}
    </div>
  );
};

// ========== Predefined Marksheet Template (Portrait, Full A4) ==========
interface MarksheetPredefinedTemplateProps {
  student: any;
  exam: any;
  marks: any[];
  schoolInfo: any;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  grade?: string;
  rank?: number;
  result?: string;
}

const MarksheetPredefinedTemplate: React.FC<MarksheetPredefinedTemplateProps> = ({
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
}) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
  const gradeScale = [
    { marks_range: '91-100', grade: 'A+' },
    { marks_range: '81-90', grade: 'A' },
    { marks_range: '71-80', grade: 'B+' },
    { marks_range: '61-70', grade: 'B' },
    { marks_range: '51-60', grade: 'C+' },
    { marks_range: '41-50', grade: 'C' },
    { marks_range: '32-40', grade: 'D' },
  ];

  return (
    <div className="marksheet-page">
      <div className="marksheet-container">
        <div className="marksheet-border">
          <div className="marksheet-inner">
            <div className="marksheet-header">
              <div className="header-logo-section">
                {schoolInfo.logo ? (
                  <img src={schoolInfo.logo} alt="Logo" className="marksheet-logo" />
                ) : (
                  <div className="marksheet-logo-placeholder"><span>🏫</span></div>
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
              </div>
            </div>

            <div className="marksheet-title">
              <h2>Academic Record</h2>
              <div className="session-info">Academic Session - {exam.session_name || '-'}</div>
              <div className="class-info">Class: {student.class_name || '-'}{student.section_name && ` (${student.section_name})`}</div>
            </div>

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
                  <span className="info-label">Admission No</span>
                  <span className="info-value dotted">{student.admission_no || '-'}</span>
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

            <div className="marks-section">
              <table className="marks-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Max Marks</th>
                    <th>Passing Marks</th>
                    <th>Marks Obtained</th>
                    <th>Grade</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.map((mark, idx) => (
                    <tr key={idx} className={mark.is_pass === false ? 'failed-row' : ''}>
                      <td className="subject-name">{mark.subject_name}</td>
                      <td>{mark.max_marks}</td>
                      <td>{mark.passing_marks || '-'}</td>
                      <td className={mark.is_pass === false ? 'failed-marks' : ''}>{mark.marks_obtained}</td>
                      <td>{mark.grade || '-'}</td>
                      <td>{mark.is_pass ? 'PASS' : 'FAIL'}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 'bold', background: '#f5f5f5' }}>
                    <td>Total</td>
                    <td>{maxMarks}</td>
                    <td>-</td>
                    <td>{totalMarks}</td>
                    <td>{percentage.toFixed(2)}%</td>
                    <td>{result || (percentage >= 33 ? 'PASS' : 'FAIL')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="results-summary">
              <div className="summary-row">
                <div className="summary-item">
                  <span className="summary-label">Total Marks</span>
                  <span className="summary-value">{totalMarks} / {maxMarks}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Percentage</span>
                  <span className="summary-value">{percentage.toFixed(2)}%</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Grade</span>
                  <span className="summary-value">{grade || '-'}</span>
                </div>
                {rank && (
                  <div className="summary-item">
                    <span className="summary-label">Rank</span>
                    <span className="summary-value">{rank}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grade-scale-section">
              <div className="grade-scale-title">Grading Scale</div>
              <table className="grade-scale-table">
                <thead>
                  <tr>
                    <th className="scale-header">Marks Range</th>
                    {gradeScale.map((gs, idx) => (<th key={idx} className="scale-value">{gs.marks_range}</th>))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="scale-header">Grade</td>
                    {gradeScale.map((gs, idx) => (<td key={idx} className="scale-value">{gs.grade}</td>))}
                  </tr>
                </tbody>
              </table>
            </div>

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

type TabType =
  | 'marks-grade'
  | 'exam-groups'
  | 'exams'
  | 'exam-result'
  | 'print-admit-card'
  | 'print-marksheet';

const Examinations = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType;
  const validTabs: TabType[] = [
    'marks-grade',
    'exam-groups',
    'exams',
    'exam-result',
    'print-admit-card',
    'print-marksheet',
  ];
  const defaultTab: TabType = validTabs.includes(tabFromUrl) ? tabFromUrl : 'marks-grade';

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setTimeout(() => {
      scrollToActiveTab();
    }, 100);
  };

  const scrollToActiveTab = () => {
    if (activeTabRef.current && tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const tab = activeTabRef.current;
      const containerRect = container.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();

      const scrollLeft = container.scrollLeft;
      const tabLeft = tabRect.left - containerRect.left + scrollLeft;
      const tabWidth = tabRect.width;
      const containerWidth = containerRect.width;

      const targetScroll = tabLeft - containerWidth / 2 + tabWidth / 2;

      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
  };

  const checkArrows = () => {
    if (tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      // Only show arrows if tabs overflow the container width
      const hasOverflow = container.scrollWidth > container.clientWidth;
      
      if (hasOverflow) {
        setShowLeftArrow(container.scrollLeft > 5);
        setShowRightArrow(
          container.scrollLeft < container.scrollWidth - container.clientWidth - 5
        );
      } else {
        // Hide arrows if no overflow
        setShowLeftArrow(false);
        setShowRightArrow(false);
      }
    }
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = 250;
      const container = tabsContainerRef.current;
      const currentScroll = container.scrollLeft;
      const newScrollLeft =
        direction === 'left'
          ? Math.max(0, currentScroll - scrollAmount)
          : Math.min(
              container.scrollWidth - container.clientWidth,
              currentScroll + scrollAmount
            );

      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });

      setTimeout(() => {
        checkArrows();
      }, 300);
    }
  };

  useEffect(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
    checkArrows();
    scrollToActiveTab();
  }, []);

  useEffect(() => {
    const container = tabsContainerRef.current;
    if (container) {
      checkArrows();
      container.addEventListener('scroll', checkArrows);
      window.addEventListener('resize', checkArrows);

      const resizeObserver = new ResizeObserver(() => {
        checkArrows();
      });
      resizeObserver.observe(container);

      return () => {
        container.removeEventListener('scroll', checkArrows);
        window.removeEventListener('resize', checkArrows);
        resizeObserver.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    scrollToActiveTab();
  }, [activeTab]);

  return (
    <div className="examinations-page">
      <div className="page-header">
        <h1>Examinations</h1>
      </div>

      <div className="examinations-tabs-wrapper">
        <div className="examinations-tabs-container">
          {showLeftArrow && (
            <button
              className="examinations-tabs-arrow examinations-tabs-arrow-left"
              onClick={() => scrollTabs('left')}
              aria-label="Scroll tabs left"
            >
              ‹
            </button>
          )}
          <div className="examinations-tabs" ref={tabsContainerRef}>
            <button
              ref={activeTab === 'marks-grade' ? activeTabRef : null}
              className={activeTab === 'marks-grade' ? 'active' : ''}
              onClick={() => handleTabChange('marks-grade')}
            >
              Marks Grade
            </button>
            <button
              ref={activeTab === 'exam-groups' ? activeTabRef : null}
              className={activeTab === 'exam-groups' ? 'active' : ''}
              onClick={() => handleTabChange('exam-groups')}
            >
              Exam Group
            </button>
            <button
              ref={activeTab === 'exams' ? activeTabRef : null}
              className={activeTab === 'exams' ? 'active' : ''}
              onClick={() => handleTabChange('exams')}
            >
              Exam
            </button>
            <button
              ref={activeTab === 'exam-result' ? activeTabRef : null}
              className={activeTab === 'exam-result' ? 'active' : ''}
              onClick={() => handleTabChange('exam-result')}
            >
              Exam Result
            </button>
            <button
              ref={activeTab === 'print-admit-card' ? activeTabRef : null}
              className={activeTab === 'print-admit-card' ? 'active' : ''}
              onClick={() => handleTabChange('print-admit-card')}
            >
              Print Admit Card
            </button>
            <button
              ref={activeTab === 'print-marksheet' ? activeTabRef : null}
              className={activeTab === 'print-marksheet' ? 'active' : ''}
              onClick={() => handleTabChange('print-marksheet')}
            >
              Print Marksheet
            </button>
          </div>
          {showRightArrow && (
            <button
              className="examinations-tabs-arrow examinations-tabs-arrow-right"
              onClick={() => scrollTabs('right')}
              aria-label="Scroll tabs right"
            >
              ›
            </button>
          )}
        </div>
      </div>

      <div className="examinations-content">
        {activeTab === 'marks-grade' && <MarksGradeTab />}
        {activeTab === 'exam-groups' && <ExamGroupsTab />}
        {activeTab === 'exams' && <ExamsTab />}
        {activeTab === 'exam-result' && <ExamResultTab />}
        {activeTab === 'print-admit-card' && <PrintAdmitCardTab />}
        {activeTab === 'print-marksheet' && <PrintMarksheetTab />}
      </div>
    </div>
  );
};

// ========== Tab Components ==========

const MarksGradeTab = () => {
  const [showModal, setShowModal] = useState(false);
  const [examTypeFilter, setExamTypeFilter] = useState('');
  const [formData, setFormData] = useState({
    exam_type: 'general_purpose' as 'general_purpose' | 'school_based' | 'college_based' | 'gpa',
    grade_name: '',
    percent_from: '',
    percent_upto: '',
    grade_point: '',
    description: '',
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: marksGrades, isLoading } = useQuery(
    ['marks-grades', examTypeFilter],
    () => examinationsService.getMarksGrades(examTypeFilter || undefined)
  );

  const createMutation = useMutation(examinationsService.createMarksGrade, {
    onSuccess: () => {
      queryClient.invalidateQueries('marks-grades');
      showToast('Marks grade created successfully', 'success');
      setShowModal(false);
      setFormData({
        exam_type: 'general_purpose',
        grade_name: '',
        percent_from: '',
        percent_upto: '',
        grade_point: '',
        description: '',
      });
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create marks grade', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.grade_name || !formData.percent_from || !formData.percent_upto) {
      showToast('Grade name, percent from, and percent upto are required', 'error');
      return;
    }

    createMutation.mutate({
      exam_type: formData.exam_type,
      grade_name: formData.grade_name.trim(),
      percent_from: Number(formData.percent_from),
      percent_upto: Number(formData.percent_upto),
      grade_point: formData.grade_point ? Number(formData.grade_point) : undefined,
      description: formData.description || undefined,
    });
  };

  return (
    <div className="examinations-tab-content">
      <div className="tab-header">
        <h2>Marks Grade</h2>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Filter by Exam Type:</label>
            <select
              value={examTypeFilter}
              onChange={(e) => setExamTypeFilter(e.target.value)}
              style={{ minWidth: '200px' }}
            >
              <option value="">All Types</option>
              <option value="general_purpose">General Purpose</option>
              <option value="school_based">School Based</option>
              <option value="college_based">College Based</option>
              <option value="gpa">GPA</option>
            </select>
          </div>
          <button className="btn-primary btn-wm" onClick={() => setShowModal(true)}>
            + Add Marks Grade
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : marksGrades && marksGrades.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Exam Type</th>
              <th>Grade Name</th>
              <th>Percent From</th>
              <th>Percent Upto</th>
              <th>Grade Point</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {marksGrades.map((grade) => (
              <tr key={grade.id}>
                <td>
                  <span className="badge">
                    {grade.exam_type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </td>
                <td>{grade.grade_name}</td>
                <td>{grade.percent_from}%</td>
                <td>{grade.percent_upto}%</td>
                <td>{grade.grade_point || '-'}</td>
                <td>{grade.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">No marks grades found</div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setFormData({
            exam_type: 'general_purpose',
            grade_name: '',
            percent_from: '',
            percent_upto: '',
            grade_point: '',
            description: '',
          });
        }}
        title="Add Marks Grade"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Exam Type <span className="required">*</span>
            </label>
            <select
              value={formData.exam_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  exam_type: e.target.value as any,
                })
              }
              required
            >
              <option value="general_purpose">General Purpose (Pass/Fail)</option>
              <option value="school_based">School Based Grading System</option>
              <option value="college_based">College Based Grading System</option>
              <option value="gpa">GPA Grading System</option>
            </select>
          </div>
          <div className="form-group">
            <label>
              Grade Name <span className="required">*</span>
            </label>
            <input
              type="text"
              value={formData.grade_name}
              onChange={(e) => setFormData({ ...formData, grade_name: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>
                Percent From <span className="required">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.percent_from}
                onChange={(e) => setFormData({ ...formData, percent_from: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>
                Percent Upto <span className="required">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.percent_upto}
                onChange={(e) => setFormData({ ...formData, percent_upto: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Grade Point</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.grade_point}
              onChange={(e) => setFormData({ ...formData, grade_point: e.target.value })}
            />
            <small>Required for GPA Grading System</small>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>
              {createMutation.isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const ExamGroupsTab = () => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    exam_type: 'general_purpose' as 'general_purpose' | 'school_based' | 'college_based' | 'gpa',
    description: '',
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: examGroups = [], isLoading } = useQuery('exam-groups', examinationsService.getExamGroups);

  const createMutation = useMutation(examinationsService.createExamGroup, {
    onSuccess: () => {
      queryClient.invalidateQueries('exam-groups');
      showToast('Exam group created successfully', 'success');
      setShowModal(false);
      setFormData({
        name: '',
        exam_type: 'general_purpose',
        description: '',
      });
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create exam group', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Exam group name is required', 'error');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="examinations-tab-content">
      <div className="tab-header">
        <h2>Exam Groups</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Add Exam Group
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : examGroups.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Exam Type</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {examGroups.map((group) => (
              <tr key={group.id}>
                <td>{group.name}</td>
                <td>
                  <span className="badge">
                    {group.exam_type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </td>
                <td>{group.description || '-'}</td>
                <td>
                  <button
                    className="btn-sm btn-secondary"
                    onClick={() => {
                      // Navigate to exams tab with this group selected
                      window.location.href = '/examinations?tab=exams&group=' + group.id;
                    }}
                  >
                    View Exams
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">No exam groups found</div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setFormData({
            name: '',
            exam_type: 'general_purpose',
            description: '',
          });
        }}
        title="Add Exam Group"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Exam Name <span className="required">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>
              Exam Type <span className="required">*</span>
            </label>
            <select
              value={formData.exam_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  exam_type: e.target.value as any,
                })
              }
              required
            >
              <option value="general_purpose">General Purpose (Pass/Fail)</option>
              <option value="school_based">School Based Grading System</option>
              <option value="college_based">College Based Grading System</option>
              <option value="gpa">GPA Grading System</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>
              {createMutation.isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const ExamsTab = () => {
  const [searchParams] = useSearchParams();
  const groupFromUrl = searchParams.get('group');
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignStudentsModal, setShowAssignStudentsModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showEnterMarksModal, setShowEnterMarksModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [filters, setFilters] = useState({
    exam_group_id: groupFromUrl || '',
    session_id: '',
  });

  const { data: examGroups = [] } = useQuery('exam-groups', examinationsService.getExamGroups);
  const { data: sessionsResponse } = useQuery('sessions', () => settingsService.getSessions());
  const sessions = Array.isArray(sessionsResponse?.data) ? sessionsResponse.data : [];
  const { data: exams = [], isLoading } = useQuery(
    ['exams', filters],
    () =>
      examinationsService.getExams({
        exam_group_id: filters.exam_group_id ? Number(filters.exam_group_id) : undefined,
        session_id: filters.session_id ? Number(filters.session_id) : undefined,
      }),
    {
      onError: (error: any) => {
        console.error('Error fetching exams:', error);
      },
    }
  );

  const [createFormData, setCreateFormData] = useState({
    exam_group_id: '',
    name: '',
    session_id: '',
    is_published: false,
    description: '',
  });

  const createMutation = useMutation(examinationsService.createExam, {
    onSuccess: () => {
      queryClient.invalidateQueries('exams');
      showToast('Exam created successfully', 'success');
      setShowCreateModal(false);
      setCreateFormData({
        exam_group_id: '',
        name: '',
        session_id: '',
        is_published: false,
        description: '',
      });
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create exam', 'error');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.exam_group_id || !createFormData.name || !createFormData.session_id) {
      showToast('Exam group, name, and session are required', 'error');
      return;
    }
    createMutation.mutate({
      exam_group_id: Number(createFormData.exam_group_id),
      name: createFormData.name.trim(),
      session_id: Number(createFormData.session_id),
      is_published: createFormData.is_published,
      description: createFormData.description || undefined,
    });
  };

  const handleViewDetails = async (exam: Exam) => {
    try {
      setShowDetailsModal(true);
      // Set basic exam info first for immediate display
      // Ensure subjects and students are arrays even if undefined
      const examWithDefaults = {
        ...exam,
        subjects: Array.isArray(exam.subjects) ? exam.subjects : [],
        students: Array.isArray(exam.students) ? exam.students : [],
      };
      setSelectedExam(examWithDefaults);
      // Then fetch full details with subjects and students
      try {
        const examDetails = await examinationsService.getExamById(exam.id);
        // Ensure subjects and students are arrays
        const examDetailsWithDefaults = {
          ...examDetails,
          subjects: Array.isArray(examDetails.subjects) ? examDetails.subjects : [],
          students: Array.isArray(examDetails.students) ? examDetails.students : [],
        };
        setSelectedExam(examDetailsWithDefaults);
      } catch (fetchError: any) {
        console.error('Error fetching exam details:', fetchError);
        // Keep the basic exam info, just log the error
        // The modal will still show with basic info
      }
    } catch (error: any) {
      console.error('Error loading exam details:', error);
      setShowDetailsModal(false);
      setSelectedExam(null);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load exam details';
      showToast(errorMessage, 'error');
    }
  };

  const handleDeleteExam = async (exam: Exam) => {
    if (!window.confirm(`Are you sure you want to delete exam "${exam.name}"? This will also delete all associated subjects, marks, and student assignments.`)) {
      return;
    }
    try {
      await examinationsService.deleteExam(exam.id);
      showToast('Exam deleted successfully', 'success');
      queryClient.invalidateQueries('exams');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete exam', 'error');
    }
  };

  return (
    <div className="examinations-tab-content">
      <div className="tab-header">
        <h2>Exams</h2>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + New Exam
        </button>
      </div>

      <div className="filters-section" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="form-row">
          <div className="form-group">
            <label>Filter by Exam Group:</label>
            <select
              value={filters.exam_group_id}
              onChange={(e) => setFilters({ ...filters, exam_group_id: e.target.value })}
            >
              <option value="">All Groups</option>
              {examGroups?.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Filter by Session:</label>
            <select
              value={filters.session_id}
              onChange={(e) => setFilters({ ...filters, session_id: e.target.value })}
            >
              <option value="">All Sessions</option>
              {sessions && Array.isArray(sessions) && sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : exams && Array.isArray(exams) && exams.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Exam Name</th>
              <th>Exam Group</th>
              <th>Session</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => (
              <tr key={exam.id}>
                <td>{exam.name}</td>
                <td>{exam.exam_group_name}</td>
                <td>{exam.session_name}</td>
                <td>
                  <span className="badge">
                    {exam.exam_type?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </td>
                <td>
                  <span className={`badge ${exam.is_published ? 'badge-success' : 'badge-warning'}`}>
                    {exam.is_published ? 'PUBLISHED' : 'DRAFT'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-sm btn-secondary"
                      onClick={() => handleViewDetails(exam)}
                    >
                      View
                    </button>
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => handleDeleteExam(exam)}
                      title="Delete Exam"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">No exams found</div>
      )}

      {/* Create Exam Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateFormData({
            exam_group_id: '',
            name: '',
            session_id: '',
            is_published: false,
            description: '',
          });
        }}
        title="Create New Exam"
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label>
              Exam Group <span className="required">*</span>
            </label>
            <select
              value={createFormData.exam_group_id}
              onChange={(e) =>
                setCreateFormData({ ...createFormData, exam_group_id: e.target.value })
              }
              required
            >
              <option value="">Select Exam Group</option>
              {examGroups?.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>
              Exam Name <span className="required">*</span>
            </label>
            <input
              type="text"
              value={createFormData.name}
              onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>
              Session <span className="required">*</span>
            </label>
            <select
              value={createFormData.session_id}
              onChange={(e) =>
                setCreateFormData({ ...createFormData, session_id: e.target.value })
              }
              required
            >
              <option value="">Select Session</option>
              {sessions && Array.isArray(sessions) && sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={createFormData.is_published}
                onChange={(e) =>
                  setCreateFormData({ ...createFormData, is_published: e.target.checked })
                }
              />
              Publish Exam
            </label>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={createFormData.description}
              onChange={(e) =>
                setCreateFormData({ ...createFormData, description: e.target.value })
              }
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>
              {createMutation.isLoading ? 'Creating...' : 'Create Exam'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Exam Details Modal */}
      {selectedExam && (
        <ExamDetailsModal
          exam={selectedExam}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedExam(null);
          }}
          onAssignStudents={() => {
            setShowAssignStudentsModal(true);
          }}
          onAddSubject={() => {
            setShowAddSubjectModal(true);
          }}
          onEnterMarks={(subjectId: number) => {
            setShowDetailsModal(false);
            setShowEnterMarksModal(true);
            // Store subject ID for marks entry
            (window as any).__selectedExamSubjectId = subjectId;
          }}
          onPublish={() => {
            // Refresh exam list and details
            queryClient.invalidateQueries('exams');
            if (selectedExam) {
              queryClient.invalidateQueries(['exam', selectedExam.id]);
            }
          }}
        />
      )}

      {/* Assign Students Modal */}
      {selectedExam && (
        <AssignStudentsModal
          exam={selectedExam}
          isOpen={showAssignStudentsModal}
          onClose={() => {
            setShowAssignStudentsModal(false);
            // Keep the parent modal open
          }}
          onSuccess={async () => {
            // Refresh exam details to show updated students
            if (selectedExam) {
              queryClient.invalidateQueries(['exam', selectedExam.id]);
              // Fetch updated exam data to refresh the parent modal
              try {
                const updatedExam = await examinationsService.getExamById(selectedExam.id);
                setSelectedExam({
                  ...updatedExam,
                  subjects: Array.isArray(updatedExam.subjects) ? updatedExam.subjects : [],
                  students: Array.isArray(updatedExam.students) ? updatedExam.students : [],
                });
              } catch (error) {
                console.error('Error refreshing exam data:', error);
              }
            }
          }}
        />
      )}

      {/* Add Subject Modal */}
      {selectedExam && (
        <AddSubjectModal
          exam={selectedExam}
          isOpen={showAddSubjectModal}
          onClose={() => {
            setShowAddSubjectModal(false);
            // Don't close the parent modal - keep selectedExam
          }}
          onSuccess={async () => {
            // Refresh exam details to show updated subjects
            if (selectedExam) {
              queryClient.invalidateQueries(['exam', selectedExam.id]);
              // Fetch updated exam data to refresh the parent modal
              try {
                const updatedExam = await examinationsService.getExamById(selectedExam.id);
                setSelectedExam({
                  ...updatedExam,
                  subjects: Array.isArray(updatedExam.subjects) ? updatedExam.subjects : [],
                  students: Array.isArray(updatedExam.students) ? updatedExam.students : [],
                });
              } catch (error) {
                console.error('Error refreshing exam data:', error);
              }
            }
          }}
        />
      )}

      {/* Enter Marks Modal */}
      {selectedExam && (
        <EnterMarksModal
          exam={selectedExam}
          examSubjectId={(window as any).__selectedExamSubjectId}
          isOpen={showEnterMarksModal}
          onClose={() => {
            setShowEnterMarksModal(false);
            setSelectedExam(null);
            (window as any).__selectedExamSubjectId = null;
          }}
        />
      )}
    </div>
  );
};

const ExamResultTab = () => {
  const [filters, setFilters] = useState({
    exam_id: '',
    class_id: '',
    section_id: '',
    session_id: '',
  });
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const { data: examGroups } = useQuery('exam-groups', examinationsService.getExamGroups);
  const { data: sessionsResponse } = useQuery('sessions', () => settingsService.getSessions());
  const sessions = Array.isArray(sessionsResponse?.data) ? sessionsResponse.data : [];
  const { data: classesResponse } = useQuery('classes', async () => {
    const response = await academicsService.getClasses();
    return response.data;
  });
  const classes = classesResponse || [];
  const { data: sectionsResponse } = useQuery('sections', async () => {
    const response = await academicsService.getSections();
    return response.data;
  });
  const sections = sectionsResponse || [];

  // Get exams for selected exam group
  const { data: exams } = useQuery(
    ['exams', filters],
    () => examinationsService.getExams({ session_id: filters.session_id ? Number(filters.session_id) : undefined }),
    { enabled: !!filters.session_id }
  );

  const handleSearch = async () => {
    if (!filters.exam_id || !filters.class_id || !filters.section_id || !filters.session_id) {
      showToast('Please select all criteria (Exam, Class, Section, Session)', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await examinationsService.getExamResults({
        exam_id: Number(filters.exam_id),
        class_id: Number(filters.class_id),
        section_id: Number(filters.section_id),
        session_id: Number(filters.session_id),
      });
      setResults(result.data);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to fetch exam results', 'error');
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="examinations-tab-content">
      <div className="tab-header">
        <h2>Exam Result</h2>
      </div>

      <div className="filters-section" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="form-row">
          <div className="form-group">
            <label>Session <span className="required">*</span></label>
            <select
              value={filters.session_id}
              onChange={(e) => setFilters({ ...filters, session_id: e.target.value, exam_id: '' })}
            >
              <option value="">Select Session</option>
              {sessions && Array.isArray(sessions) && sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Exam <span className="required">*</span></label>
            <select
              value={filters.exam_id}
              onChange={(e) => setFilters({ ...filters, exam_id: e.target.value })}
              disabled={!filters.session_id}
            >
              <option value="">Select Exam</option>
              {exams?.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name} ({exam.exam_group_name})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Class <span className="required">*</span></label>
            <select
              value={filters.class_id}
              onChange={(e) => setFilters({ ...filters, class_id: e.target.value, section_id: '' })}
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Section <span className="required">*</span></label>
            <select
              value={filters.section_id}
              onChange={(e) => setFilters({ ...filters, section_id: e.target.value })}
              disabled={!filters.class_id}
            >
              <option value="">Select Section</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={handleSearch}
          disabled={isLoading || !filters.exam_id || !filters.class_id || !filters.section_id || !filters.session_id}
        >
          {isLoading ? 'Loading...' : 'View Results'}
        </button>
      </div>

      {results && (
        <div className="exam-results-container">
          <div className="exam-results-header">
            <h3>
              {results.exam.name} - Class {results.class_id} Section {results.section_id}
            </h3>
            <div className="exam-results-summary">
              <span>Total Students: {results.results.length}</span>
              <span>
                Passed: {results.results.filter((r: any) => r.is_pass).length}
              </span>
              <span>
                Failed: {results.results.filter((r: any) => !r.is_pass).length}
              </span>
            </div>
          </div>

          {results.results.length > 0 ? (
            <div className="exam-results-table-wrapper" style={{ overflowX: 'auto' }}>
              <table className="data-table exam-results-table">
                <thead>
                  <tr>
                    <th rowSpan={2}>Rank</th>
                    <th rowSpan={2}>Admission No</th>
                    <th rowSpan={2}>Roll No</th>
                    <th rowSpan={2}>Student Name</th>
                    {results.results[0].subjects.map((subject: any) => (
                      <th key={subject.subject_id} colSpan={2}>
                        {subject.subject_name}
                        {subject.subject_code && ` (${subject.subject_code})`}
                      </th>
                    ))}
                    <th rowSpan={2}>Total</th>
                    <th rowSpan={2}>Percentage</th>
                    {results.exam.exam_type !== 'general_purpose' && (
                      <>
                        <th rowSpan={2}>Grade</th>
                        {results.exam.exam_type === 'gpa' && <th rowSpan={2}>Grade Point</th>}
                      </>
                    )}
                    <th rowSpan={2}>Status</th>
                  </tr>
                  <tr>
                    {results.results[0].subjects.map((subject: any) => (
                      <React.Fragment key={subject.subject_id}>
                        <th>Obtained</th>
                        <th>Max</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.results.map((result: any) => (
                    <tr key={result.student_id} className={result.is_pass ? '' : 'failed-row'}>
                      <td>{result.rank}</td>
                      <td>{result.admission_no}</td>
                      <td>{result.exam_roll_number || result.roll_no || '-'}</td>
                      <td>
                        {result.first_name} {result.last_name}
                      </td>
                      {result.subjects.map((subject: any) => (
                        <React.Fragment key={subject.subject_id}>
                          <td className={subject.is_pass ? '' : 'failed-marks'}>
                            {Number(subject.marks_obtained || 0).toFixed(2)}
                          </td>
                          <td>{Number(subject.max_marks || 0)}</td>
                        </React.Fragment>
                      ))}
                      <td>
                        <strong>
                          {Number(result.total_marks_obtained || 0).toFixed(2)} / {Number(result.total_max_marks || 0)}
                        </strong>
                      </td>
                      <td>
                        <strong>{Number(result.percentage || 0).toFixed(2)}%</strong>
                      </td>
                      {results.exam.exam_type !== 'general_purpose' && (
                        <>
                          <td>
                            <span className="badge">{result.grade || '-'}</span>
                          </td>
                          {results.exam.exam_type === 'gpa' && (
                            <td>{result.grade_point || '-'}</td>
                          )}
                        </>
                      )}
                      <td>
                        <span className={`badge ${result.is_pass ? 'badge-success' : 'badge-danger'}`}>
                          {result.is_pass ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">No results found</div>
          )}
        </div>
      )}
    </div>
  );
};

const DesignAdmitCardTab = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AdmitCardTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    heading: '',
    title: '',
    exam_name: '',
    header_left_text: '',
    header_center_text: '',
    header_right_text: '',
    body_text: '',
    footer_left_text: '',
    footer_center_text: '',
    footer_right_text: '',
    header_height: 100,
    footer_height: 50,
    body_height: 400,
    body_width: 800,
    show_student_photo: true,
    photo_height: 100,
    background_image: '',
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: templates = [], isLoading, refetch, error: fetchError } = useQuery(
    'admit-card-templates',
    examinationsService.getAdmitCardTemplates,
    {
      onSuccess: (data) => {
        console.log('Templates loaded:', data);
      },
      onError: (error: any) => {
        console.error('Error fetching admit card templates:', error);
        showToast(error.response?.data?.message || 'Failed to load templates', 'error');
      },
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    }
  );

  const createMutation = useMutation(examinationsService.createAdmitCardTemplate, {
    onSuccess: async (data) => {
      console.log('Template created successfully:', data);
      // Invalidate queries first
      queryClient.invalidateQueries('admit-card-templates');
      // Refetch immediately
      await refetch();
      showToast('Admit card template created successfully', 'success');
      setSelectedTemplate(null);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Error creating template:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create template';
      showToast(errorMessage, 'error');
    },
  });

  const updateMutation = useMutation(
    (data: { id: number; template: Partial<AdmitCardTemplate> }) =>
      examinationsService.updateAdmitCardTemplate(data.id, data.template),
    {
      onSuccess: async () => {
        console.log('Template updated successfully');
        // Invalidate and refetch
        queryClient.invalidateQueries('admit-card-templates');
        await refetch();
        showToast('Template updated successfully', 'success');
        setSelectedTemplate(null);
        resetForm();
      },
      onError: (error: any) => {
        console.error('Error updating template:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to update template';
        showToast(errorMessage, 'error');
      },
    }
  );

  const resetForm = () => {
    setFormData({
      name: '',
      heading: '',
      title: '',
      exam_name: '',
      header_left_text: '',
      header_center_text: '',
      header_right_text: '',
      body_text: '',
      footer_left_text: '',
      footer_center_text: '',
      footer_right_text: '',
      header_height: 100,
      footer_height: 50,
      body_height: 400,
      body_width: 800,
      show_student_photo: true,
      photo_height: 100,
      background_image: '',
    });
  };

  const handleEdit = (template: AdmitCardTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      heading: template.heading || '',
      title: template.title || '',
      exam_name: template.exam_name || '',
      header_left_text: template.header_left_text || '',
      header_center_text: template.header_center_text || '',
      header_right_text: template.header_right_text || '',
      body_text: template.body_text || '',
      footer_left_text: template.footer_left_text || '',
      footer_center_text: template.footer_center_text || '',
      footer_right_text: template.footer_right_text || '',
      header_height: template.header_height,
      footer_height: template.footer_height,
      body_height: template.body_height,
      body_width: template.body_width,
      show_student_photo: template.show_student_photo,
      photo_height: template.photo_height,
      background_image: template.background_image || '',
    });
    // Scroll to top of edit section
    const editSection = document.querySelector('.admit-card-edit-section');
    if (editSection) {
      editSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.name.trim()) {
      showToast('Template name is required', 'error');
      return;
    }
    
    if (!formData.heading || !formData.heading.trim()) {
      showToast('Heading is required', 'error');
      return;
    }
    
    if (!formData.title || !formData.title.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    
    if (!formData.exam_name || !formData.exam_name.trim()) {
      showToast('Exam name is required', 'error');
      return;
    }

    if (selectedTemplate) {
      updateMutation.mutate({ id: selectedTemplate.id, template: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="examinations-tab-content">
      <div className="admit-card-layout">
        {/* Left Panel - Edit Admit Card */}
        <div className="admit-card-edit-section">
          <h3>Edit Admit Card</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
          >
            <div className="form-group">
              <label>
                Template <span className="required">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>
                Heading <span className="required">*</span>
              </label>
              <input
                type="text"
                value={formData.heading}
                onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>
                Title <span className="required">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>
                Exam Name <span className="required">*</span>
              </label>
              <input
                type="text"
                value={formData.exam_name}
                onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                required
              />
            </div>

            <div style={{ marginTop: 'var(--spacing-lg)', borderTop: '2px solid var(--gray-200)', paddingTop: 'var(--spacing-lg)' }}>
              <h4 style={{ marginBottom: 'var(--spacing-md)' }}>Header Settings</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Header Left Text</label>
                  <input
                    type="text"
                    value={formData.header_left_text}
                    onChange={(e) => setFormData({ ...formData, header_left_text: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Header Center Text</label>
                  <input
                    type="text"
                    value={formData.header_center_text}
                    onChange={(e) => setFormData({ ...formData, header_center_text: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Header Right Text</label>
                  <input
                    type="text"
                    value={formData.header_right_text}
                    onChange={(e) => setFormData({ ...formData, header_right_text: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Header Height (px)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.header_height}
                  onChange={(e) => setFormData({ ...formData, header_height: Number(e.target.value) })}
                />
              </div>
            </div>

            <div style={{ marginTop: 'var(--spacing-lg)', borderTop: '2px solid var(--gray-200)', paddingTop: 'var(--spacing-lg)' }}>
              <h4 style={{ marginBottom: 'var(--spacing-md)' }}>Body Settings</h4>
              <div className="form-group">
                <label>Body Text</label>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const textarea = document.querySelector('textarea[name="body_text"]') as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = formData.body_text;
                          const newText = text.substring(0, start) + e.target.value + text.substring(end);
                          setFormData({ ...formData, body_text: newText });
                          setTimeout(() => {
                            textarea.focus();
                            textarea.setSelectionRange(start + e.target.value.length, start + e.target.value.length);
                          }, 0);
                        } else {
                          setFormData({ ...formData, body_text: formData.body_text + e.target.value });
                        }
                        e.target.value = '';
                      }
                    }}
                    style={{ flex: '0 0 auto', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
                  >
                    <option value="">Insert Variable...</option>
                    <option value="{student_name}">Student Name</option>
                    <option value="{admission_no}">Admission Number</option>
                    <option value="{roll_no}">Roll Number</option>
                    <option value="{exam_roll_no}">Exam Roll Number</option>
                    <option value="{class}">Class</option>
                    <option value="{section}">Section</option>
                    <option value="{session}">Session</option>
                    <option value="{exam_name}">Exam Name</option>
                    <option value="{exam_group}">Exam Group</option>
                    <option value="{father_name}">Father Name</option>
                    <option value="{mother_name}">Mother Name</option>
                    <option value="{guardian_name}">Guardian Name</option>
                    <option value="{date_of_birth}">Date of Birth</option>
                    <option value="{gender}">Gender</option>
                    <option value="{blood_group}">Blood Group</option>
                    <option value="{address}">Address</option>
                    <option value="{phone}">Phone</option>
                    <option value="{email}">Email</option>
                    <option value="{exam_date}">Exam Date</option>
                    <option value="{exam_time}">Exam Time</option>
                    <option value="{room_number}">Room Number</option>
                  </select>
                </div>
                <textarea
                  name="body_text"
                  value={formData.body_text}
                  onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
                  rows={6}
                  placeholder="Use variables like {student_name}, {admission_no}, {class}, {section}, {exam_name}, etc."
                />
                <small>Click "Insert Variable" dropdown to add variables to the body text</small>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Body Width (px)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.body_width}
                    onChange={(e) => setFormData({ ...formData, body_width: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Body Height (px)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.body_height}
                    onChange={(e) => setFormData({ ...formData, body_height: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.show_student_photo}
                      onChange={(e) => setFormData({ ...formData, show_student_photo: e.target.checked })}
                    />
                    Show Student Photo
                  </label>
                </div>
                <div className="form-group">
                  <label>Photo Height (px)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.photo_height}
                    onChange={(e) => setFormData({ ...formData, photo_height: Number(e.target.value) })}
                    disabled={!formData.show_student_photo}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'var(--spacing-lg)', borderTop: '2px solid var(--gray-200)', paddingTop: 'var(--spacing-lg)' }}>
              <h4 style={{ marginBottom: 'var(--spacing-md)' }}>Footer Settings</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Footer Left Text</label>
                  <input
                    type="text"
                    value={formData.footer_left_text}
                    onChange={(e) => setFormData({ ...formData, footer_left_text: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Footer Center Text</label>
                  <input
                    type="text"
                    value={formData.footer_center_text}
                    onChange={(e) => setFormData({ ...formData, footer_center_text: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Footer Right Text</label>
                  <input
                    type="text"
                    value={formData.footer_right_text}
                    onChange={(e) => setFormData({ ...formData, footer_right_text: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Footer Height (px)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.footer_height}
                  onChange={(e) => setFormData({ ...formData, footer_height: Number(e.target.value) })}
                />
              </div>
            </div>

            <div style={{ marginTop: 'var(--spacing-lg)', borderTop: '2px solid var(--gray-200)', paddingTop: 'var(--spacing-lg)' }}>
              <h4 style={{ marginBottom: 'var(--spacing-md)' }}>Background Settings</h4>
              <div className="form-group">
                <label>Background Image URL</label>
                <input
                  type="text"
                  value={formData.background_image}
                  onChange={(e) => setFormData({ ...formData, background_image: e.target.value })}
                  placeholder="Enter image URL"
                />
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: 'var(--spacing-lg)' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSelectedTemplate(null);
                  resetForm();
                }}
              >
                Reset
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={createMutation.isLoading || updateMutation.isLoading}
              >
                {createMutation.isLoading || updateMutation.isLoading
                  ? 'Saving...'
                  : selectedTemplate
                  ? 'Update'
                  : 'Save'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Panel - Admit Card List */}
        <div className="admit-card-list-section">
          <h3>Admit Card List</h3>
          {fetchError ? (
            <div className="error-state" style={{ color: 'var(--error-color)', padding: 'var(--spacing-md)' }}>
              Error loading templates. Please try again.
            </div>
          ) : isLoading ? (
            <div className="loading">Loading...</div>
          ) : templates.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Certificate Name</th>
                  <th>Background Image</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id}>
                    <td>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleEdit(template);
                        }}
                        style={{ color: 'var(--primary-color)', textDecoration: 'none' }}
                      >
                        {template.name}
                      </a>
                    </td>
                    <td>
                      {template.background_image ? (
                        <img
                          src={template.background_image}
                          alt="Background"
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: 'var(--border-radius-sm)' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '50px',
                            height: '50px',
                            backgroundColor: 'var(--gray-200)',
                            borderRadius: 'var(--border-radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--gray-500)',
                            fontSize: 'var(--font-size-xs)',
                          }}
                        >
                          No Image
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-sm btn-secondary"
                          onClick={() => handleEdit(template)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-sm btn-danger"
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
                              try {
                                await examinationsService.deleteAdmitCardTemplate(template.id);
                                await queryClient.invalidateQueries('admit-card-templates');
                                await refetch();
                                showToast('Template deleted successfully', 'success');
                                // If deleted template was selected, clear selection
                                if (selectedTemplate?.id === template.id) {
                                  setSelectedTemplate(null);
                                  resetForm();
                                }
                              } catch (error: any) {
                                console.error('Error deleting template:', error);
                                const errorMessage = error.response?.data?.message || error.message || 'Failed to delete template';
                                showToast(errorMessage, 'error');
                              }
                            }
                          }}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">No templates found</div>
          )}
        </div>
      </div>
    </div>
  );
};

const PrintAdmitCardTab = () => {
  const [filters, setFilters] = useState({
    exam_group_id: '',
    exam_id: '',
    session_id: '',
    class_id: '',
    section_id: '',
  });
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [examDetails, setExamDetails] = useState<any>(null);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const { showToast } = useToast();

  // Fetch data for dropdowns
  const { data: examGroups = [] } = useQuery('exam-groups', examinationsService.getExamGroups);
  const { data: sessionsResponse } = useQuery('sessions', () => settingsService.getSessions());
  const sessions = Array.isArray(sessionsResponse?.data) ? sessionsResponse.data : [];
  const { data: classesResponse } = useQuery(['classes', filters.session_id], () => academicsService.getClasses(), { enabled: !!filters.session_id });
  const classes = Array.isArray(classesResponse?.data) ? classesResponse.data : [];
  const { data: sectionsResponse } = useQuery(['sections', filters.class_id], () => academicsService.getSections(), { enabled: !!filters.class_id });
  const sections = Array.isArray(sectionsResponse?.data) ? sectionsResponse.data : [];

  // Fetch exams based on exam group
  const { data: exams = [] } = useQuery(
    ['exams', filters.exam_group_id],
    () => examinationsService.getExams({ exam_group_id: Number(filters.exam_group_id) }),
    { enabled: !!filters.exam_group_id }
  );

  // Fetch school settings for school info
  useEffect(() => {
    const loadSchoolInfo = async () => {
      try {
        const settings = await settingsService.getGeneralSettings();
        if (settings?.data) {
          setSchoolInfo({
            name: settings.data.schoolName || 'School Name',
            address: settings.data.address || '',
            phone: settings.data.phone || '',
            email: settings.data.email || '',
            logo: settings.data.printLogo || settings.data.adminLogo || '',
            affiliation_no: '', // Not available in GeneralSettings
            board_name: '', // Not available in GeneralSettings
          });
        }
      } catch (error) {
        console.error('Failed to load school info:', error);
        setSchoolInfo({
          name: 'School Name',
          address: '',
          phone: '',
          email: '',
        });
      }
    };
    loadSchoolInfo();
  }, []);

  const handleSearch = async () => {
    if (!filters.exam_id || !filters.session_id || !filters.class_id || !filters.section_id) {
      showToast('Please select all required criteria', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // Fetch exam details
      const examData = await examinationsService.getExamById(Number(filters.exam_id));
      setExamDetails(examData);

      // Fetch students for the selected exam, class, and section
      const examStudentsResponse = await examinationsService.getExamMarks({
        exam_id: Number(filters.exam_id),
        exam_subject_id: undefined,
        student_id: undefined,
      });

      if (Array.isArray(examStudentsResponse) && examStudentsResponse.length > 0) {
        // Get unique students from exam marks
        const studentMap = new Map();
        examStudentsResponse.forEach((mark: any) => {
          if (!studentMap.has(mark.student_id)) {
            studentMap.set(mark.student_id, {
              id: mark.student_id,
              admission_no: mark.admission_no,
              roll_no: mark.roll_no || mark.roll_number,
              first_name: mark.first_name,
              last_name: mark.last_name,
              father_name: mark.father_name,
              mother_name: mark.mother_name,
              date_of_birth: mark.date_of_birth,
              gender: mark.gender,
              class_name: mark.class_name,
              section_name: mark.section_name,
              photo: mark.photo,
              category: mark.category_name || 'N/A',
              mobile_number: mark.student_mobile || mark.father_phone || 'N/A',
            });
          }
        });

        setStudents(Array.from(studentMap.values()));
        setSelectedStudents(new Set());
      } else {
        // If no exam marks, fetch students directly
        const studentsResponse = await studentsService.getStudents({
          class_id: Number(filters.class_id),
          section_id: Number(filters.section_id),
        });

        if (studentsResponse.success && studentsResponse.data) {
          setStudents(studentsResponse.data.map((s: any) => ({
            id: s.id,
            admission_no: s.admission_no,
            roll_no: s.roll_no || s.roll_number,
            first_name: s.first_name,
            last_name: s.last_name,
            father_name: s.father_name,
            mother_name: s.mother_name,
            date_of_birth: s.date_of_birth,
            gender: s.gender,
            class_name: s.class_name,
            section_name: s.section_name,
            photo: s.photo,
            category: s.category_name || 'N/A',
            mobile_number: s.student_mobile || s.father_phone || 'N/A',
          })));
          setSelectedStudents(new Set());
        }
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to fetch students', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(students.map(s => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectStudent = (studentId: number, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleGenerate = () => {
    if (selectedStudents.size === 0) {
      showToast('Please select at least one student', 'error');
      return;
    }
    setShowPreview(true);
  };

  const selectedStudentsList = students.filter(s => selectedStudents.has(s.id));

  const handlePrint = () => {
    if (!examDetails || !schoolInfo || selectedStudentsList.length === 0) {
      showToast('No data available to print', 'error');
      return;
    }

    // Generate HTML for admit cards
    const generateAdmitCardHTML = (student: any, exam: any, schoolInfo: any) => {
      const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      };

      const formatTime = (from?: string, to?: string) => {
        if (!from) return '-';
        return `${from}${to ? ` - ${to}` : ''}`;
      };

      const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
      const subjects = Array.isArray(exam.subjects) ? exam.subjects : [];
      
      // Helper function to get logo URL
      const getLogoUrl = (logo: string | null | undefined): string => {
        if (!logo) return '';
        const logoStr = String(logo).trim();
        if (!logoStr || logoStr === 'null' || logoStr === 'undefined') return '';
        
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
      const getPhotoUrl = (photo: string | null | undefined): string => {
        if (!photo) return '';
        const photoStr = String(photo).trim();
        if (!photoStr || photoStr === 'null' || photoStr === 'undefined') return '';
        
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

      let subjectsHTML = '';
      if (subjects.length > 0) {
        subjectsHTML = `
          <div class="exam-schedule">
            <table class="schedule-table">
              <thead>
                <tr>
                  <th>THEORY EXAM DATE & TIME</th>
                  <th>PAPER CODE</th>
                  <th>SUBJECT</th>
                  <th>OPTED BY STUDENT</th>
                </tr>
              </thead>
              <tbody>
                ${subjects.map((subject: any) => `
                  <tr>
                    <td>${formatDate(subject.exam_date)} ${formatTime(subject.exam_time_from, subject.exam_time_to)}</td>
                    <td>${subject.subject_code || '-'}</td>
                    <td>${subject.subject_name || '-'}</td>
                    <td>TH</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      return `
        <div class="admit-card-single">
          <div class="admit-card-header">
            <div class="header-logo">
              ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="school-logo" />` : '<div class="school-logo-placeholder"><span>🏫</span></div>'}
            </div>
            <div class="header-center">
              ${schoolInfo.board_name ? `<div class="board-name">${schoolInfo.board_name}</div>` : ''}
              <div class="school-name">${schoolInfo.name || 'School Name'}</div>
              ${schoolInfo.affiliation_no ? `<div class="affiliation">Affiliation No: ${schoolInfo.affiliation_no}</div>` : ''}
              ${schoolInfo.address ? `<div class="school-address">${schoolInfo.address}</div>` : ''}
            </div>
            <div class="header-logo">
              ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="school-logo" />` : '<div class="school-logo-placeholder"><span>🏫</span></div>'}
            </div>
          </div>
          <div class="admit-card-title">
            <div class="exam-name-title">${exam.name || 'Examination'}</div>
            <div class="exam-subtitle">${exam.session_name ? `${exam.session_name} Examinations` : ''}</div>
          </div>
          <div class="admit-card-body">
            <div class="student-details">
              <table class="info-table">
                <tbody>
                  <tr>
                    <td class="label">ROLL NUMBER</td>
                    <td class="value">${student.roll_no || '-'}</td>
                    <td class="label">ADMISSION NO</td>
                    <td class="value">${student.admission_no || '-'}</td>
                  </tr>
                  <tr>
                    <td class="label">CANDIDATE'S NAME</td>
                    <td class="value" colspan="3">${studentName}</td>
                  </tr>
                  <tr>
                    <td class="label">D.O.B</td>
                    <td class="value">${formatDate(student.date_of_birth)}</td>
                    <td class="label">GENDER</td>
                    <td class="value">${student.gender ? student.gender.toUpperCase() : '-'}</td>
                  </tr>
                  <tr>
                    <td class="label">FATHER'S NAME</td>
                    <td class="value">${student.father_name || '-'}</td>
                    <td class="label">MOTHER'S NAME</td>
                    <td class="value">${student.mother_name || '-'}</td>
                  </tr>
                  <tr>
                    <td class="label">CLASS</td>
                    <td class="value">${student.class_name || '-'}${student.section_name ? ` (${student.section_name})` : ''}</td>
                    <td class="label">EXAM CENTER</td>
                    <td class="value">${schoolInfo.name || 'School Name'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="student-photo">
              ${photoUrl ? `<img src="${photoUrl}" alt="${studentName}" class="photo" />` : '<div class="photo-placeholder"><span>NO IMAGE</span><span>AVAILABLE</span></div>'}
            </div>
          </div>
          ${subjectsHTML}
          <div class="admit-card-footer">
            <div class="signature-section">
              <div class="signature-line"></div>
              <div class="signature-label">Controller of Examination</div>
            </div>
          </div>
        </div>
      `;
    };

    // Generate pages (2 cards per page)
    const studentPairs: any[][] = [];
    for (let i = 0; i < selectedStudentsList.length; i += 2) {
      studentPairs.push(selectedStudentsList.slice(i, i + 2));
    }

    const pagesHTML = studentPairs.map((pair) => {
      const cardsHTML = pair.map((student) => generateAdmitCardHTML(student, examDetails, schoolInfo)).join('');
      const emptyCard = pair.length === 1 ? '<div class="admit-card-single empty"></div>' : '';
      return `
        <div class="admit-card-page">
          ${cardsHTML}
          ${emptyCard}
        </div>
      `;
    }).join('');

    // Create new window with HTML
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      showToast('Please allow popups to print', 'error');
      return;
    }

    // Get CSS content (inline for reliability)
    const cssContent = `
      /* Admit Card Styles */
      .admit-cards-container {
        width: 100%;
        background: #f5f5f5;
        padding: 20px;
      }
      .admit-card-page {
        width: 297mm;
        height: 210mm;
        margin: 0 auto 20px;
        display: flex;
        flex-direction: column;
        gap: 2mm;
        background: white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        page-break-after: always;
        box-sizing: border-box;
        padding: 5mm;
      }
      .admit-card-single {
        width: 100%;
        height: calc(50% - 1mm);
        border: 2px solid #333;
        padding: 4mm 6mm;
        box-sizing: border-box;
        background: #fff;
        display: flex;
        flex-direction: column;
        font-family: 'Times New Roman', Times, serif;
        position: relative;
      }
      .admit-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 2px solid #333;
        padding-bottom: 3mm;
        margin-bottom: 2mm;
      }
      .header-logo { width: 60px; flex-shrink: 0; }
      .school-logo { width: 50px; height: 50px; object-fit: contain; }
      .school-logo-placeholder {
        width: 50px; height: 50px; border: 1px solid #999; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 24px; background: #f0f0f0;
      }
      .header-center { flex: 1; text-align: center; padding: 0 10px; }
      .board-name { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
      .school-name { font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 2px 0; }
      .affiliation { font-size: 10px; color: #555; }
      .school-address { font-size: 9px; color: #666; margin-top: 1px; }
      .admit-card-title { text-align: center; margin-bottom: 2mm; }
      .exam-name-title { font-size: 14px; font-weight: bold; text-decoration: underline; text-transform: uppercase; }
      .exam-subtitle { font-size: 11px; text-decoration: underline; }
      .admit-card-body { display: flex; gap: 4mm; flex: 1; }
      .student-details { flex: 1; }
      .info-table { width: 100%; border-collapse: collapse; font-size: 10px; }
      .info-table td { padding: 2px 4px; vertical-align: top; }
      .info-table .label { font-weight: bold; width: 25%; color: #333; }
      .info-table .value { width: 25%; color: #000; font-weight: 500; }
      .student-photo { width: 90px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; }
      .photo { width: 80px; height: 100px; object-fit: cover; border: 2px solid #333; border-radius: 4px; background: #fff; }
      .photo-placeholder {
        width: 80px; height: 100px; border: 2px solid #999; border-radius: 4px;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: #f0f0f0; font-size: 9px; color: #999; text-align: center;
      }
      .exam-schedule { margin-top: 2mm; }
      .schedule-table { width: 100%; border-collapse: collapse; font-size: 9px; }
      .schedule-table th, .schedule-table td { border: 1px solid #333; padding: 2px 4px; text-align: center; }
      .schedule-table th { background: #e8e8e8; font-weight: bold; font-size: 8px; }
      .admit-card-footer { margin-top: auto; padding-top: 3mm; display: flex; justify-content: flex-end; }
      .signature-section { text-align: center; width: 150px; }
      .signature-line { border-bottom: 1px solid #333; height: 25px; }
      .signature-label { font-size: 8px; margin-top: 2px; }
      .admit-card-single.empty { border: 2px dashed #ccc; background: #fafafa; }
      @media print {
        @page { size: A4 landscape; margin: 0; }
        body { margin: 0; padding: 0; }
        .admit-cards-container { padding: 0; background: none; }
        .admit-card-page { box-shadow: none; margin: 0; page-break-after: always; }
        .admit-card-page:last-child { page-break-after: auto; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      }
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Admit Cards</title>
          <style>${cssContent}</style>
        </head>
        <body>
          <div class="admit-cards-container">
            ${pagesHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="examinations-tab-content">
      <div className="tab-header">
        <h2>Print Admit Card</h2>
        <p className="tab-description">Predefined template - 2 admit cards per A4 landscape page</p>
      </div>

      {/* Select Criteria Section */}
      <div className="select-criteria-section no-print" style={{ background: 'var(--white)', padding: 'var(--spacing-lg)', borderRadius: 'var(--border-radius)', marginBottom: 'var(--spacing-lg)', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Select Criteria</h3>
        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label>Exam Group <span className="required">*</span></label>
            <select
              value={filters.exam_group_id}
              onChange={(e) => {
                setFilters({ ...filters, exam_group_id: e.target.value, exam_id: '' });
                setStudents([]);
              }}
              required
            >
              <option value="">Select Exam Group</option>
              {examGroups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Exam <span className="required">*</span></label>
            <select
              value={filters.exam_id}
              onChange={(e) => {
                setFilters({ ...filters, exam_id: e.target.value });
                setStudents([]);
              }}
              required
              disabled={!filters.exam_group_id}
            >
              <option value="">Select Exam</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>{exam.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Session <span className="required">*</span></label>
            <select
              value={filters.session_id}
              onChange={(e) => {
                setFilters({ ...filters, session_id: e.target.value, class_id: '', section_id: '' });
                setStudents([]);
              }}
              required
            >
              <option value="">Select Session</option>
              {sessions && Array.isArray(sessions) && sessions.length > 0 ? (
                sessions.map((session: any) => (
                  <option key={session.id} value={session.id}>{session.name}</option>
                ))
              ) : (
                <option value="" disabled>No sessions available</option>
              )}
            </select>
          </div>
          <div className="form-group">
            <label>Class <span className="required">*</span></label>
            <select
              value={filters.class_id}
              onChange={(e) => {
                setFilters({ ...filters, class_id: e.target.value, section_id: '' });
                setStudents([]);
              }}
              required
              disabled={!filters.session_id}
            >
              <option value="">Select Class</option>
              {classes && Array.isArray(classes) && classes.length > 0 ? (
                classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))
              ) : (
                <option value="" disabled>No classes available</option>
              )}
            </select>
          </div>
          <div className="form-group">
            <label>Section <span className="required">*</span></label>
            <select
              value={filters.section_id}
              onChange={(e) => {
                setFilters({ ...filters, section_id: e.target.value });
                setStudents([]);
              }}
              required
              disabled={!filters.class_id}
            >
              <option value="">Select Section</option>
              {sections && Array.isArray(sections) && sections.length > 0 ? (
                sections.map((section) => (
                  <option key={section.id} value={section.id}>{section.name}</option>
                ))
              ) : (
                <option value="" disabled>No sections available</option>
              )}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 'var(--spacing-md)' }}>
          <button className="btn-primary" onClick={handleSearch} disabled={isLoading}>
            {isLoading ? 'Searching...' : '🔍 Search'}
          </button>
        </div>
      </div>

      {/* Student List Section */}
      {students.length > 0 && !showPreview && (
        <div className="student-list-section no-print" style={{ background: 'var(--white)', padding: 'var(--spacing-lg)', borderRadius: 'var(--border-radius)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <h3>Student List ({students.length} students)</h3>
            <button className="btn-primary" onClick={handleGenerate} disabled={selectedStudents.size === 0}>
              🖨️ Generate Admit Cards ({selectedStudents.size} selected)
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedStudents.size === students.length && students.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th>Admission No</th>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Father Name</th>
                <th>Class</th>
                <th>Section</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(student.id)}
                      onChange={(e) => handleSelectStudent(student.id, e.target.checked)}
                    />
                  </td>
                  <td>{student.admission_no}</td>
                  <td>{student.roll_no || '-'}</td>
                  <td>{student.first_name} {student.last_name || ''}</td>
                  <td>{student.father_name || 'N/A'}</td>
                  <td>{student.class_name || '-'}</td>
                  <td>{student.section_name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Modal with Predefined Template */}
      {showPreview && examDetails && schoolInfo && (
        <Modal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title="Admit Card Preview"
          size="large"
        >
          <div className="admit-card-preview-wrapper">
            <div className="print-actions no-print" style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>
              <button className="btn-primary" onClick={handlePrint} style={{ marginRight: 'var(--spacing-sm)' }}>
                🖨️ Print Admit Cards
              </button>
              <button className="btn-secondary" onClick={() => setShowPreview(false)}>
                Close Preview
              </button>
            </div>
            <AdmitCardPredefinedTemplate
              students={selectedStudentsList}
              exam={examDetails}
              schoolInfo={schoolInfo}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

// Keep the Modal component for advanced editing (hidden by default, can be accessed via a button)
const DesignAdmitCardAdvancedModal = ({ isOpen, onClose, formData, setFormData, selectedTemplate, handleSubmit, createMutation, updateMutation, resetForm, setSelectedTemplate }: any) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setSelectedTemplate(null);
        resetForm();
      }}
      title={selectedTemplate ? 'Edit Admit Card Template (Advanced)' : 'Create Admit Card Template (Advanced)'}
      size="large"
    >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Template Name <span className="required">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Header Left Text</label>
              <input
                type="text"
                value={formData.header_left_text}
                onChange={(e) => setFormData({ ...formData, header_left_text: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Header Center Text</label>
              <input
                type="text"
                value={formData.header_center_text}
                onChange={(e) => setFormData({ ...formData, header_center_text: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Header Right Text</label>
              <input
                type="text"
                value={formData.header_right_text}
                onChange={(e) => setFormData({ ...formData, header_right_text: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Body Text</label>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const textarea = document.querySelector('textarea[name="body_text"]') as HTMLTextAreaElement;
                    if (textarea) {
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const text = formData.body_text;
                      const newText = text.substring(0, start) + e.target.value + text.substring(end);
                      setFormData({ ...formData, body_text: newText });
                      setTimeout(() => {
                        textarea.focus();
                        textarea.setSelectionRange(start + e.target.value.length, start + e.target.value.length);
                      }, 0);
                    } else {
                      setFormData({ ...formData, body_text: formData.body_text + e.target.value });
                    }
                    e.target.value = '';
                  }
                }}
                style={{ flex: '0 0 auto', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
              >
                <option value="">Insert Variable...</option>
                <option value="{student_name}">Student Name</option>
                <option value="{admission_no}">Admission Number</option>
                <option value="{roll_no}">Roll Number</option>
                <option value="{exam_roll_no}">Exam Roll Number</option>
                <option value="{class}">Class</option>
                <option value="{section}">Section</option>
                <option value="{session}">Session</option>
                <option value="{exam_name}">Exam Name</option>
                <option value="{exam_group}">Exam Group</option>
                <option value="{father_name}">Father Name</option>
                <option value="{mother_name}">Mother Name</option>
                <option value="{guardian_name}">Guardian Name</option>
                <option value="{date_of_birth}">Date of Birth</option>
                <option value="{gender}">Gender</option>
                <option value="{blood_group}">Blood Group</option>
                <option value="{address}">Address</option>
                <option value="{phone}">Phone</option>
                <option value="{email}">Email</option>
                <option value="{exam_date}">Exam Date</option>
                <option value="{exam_time}">Exam Time</option>
                <option value="{room_number}">Room Number</option>
              </select>
            </div>
            <textarea
              name="body_text"
              value={formData.body_text}
              onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
              rows={4}
              placeholder="Use variables like {student_name}, {admission_no}, {class}, {section}, {exam_name}, etc."
            />
            <small>Click "Insert Variable" dropdown to add variables to the body text</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Footer Left Text</label>
              <input
                type="text"
                value={formData.footer_left_text}
                onChange={(e) => setFormData({ ...formData, footer_left_text: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Footer Center Text</label>
              <input
                type="text"
                value={formData.footer_center_text}
                onChange={(e) => setFormData({ ...formData, footer_center_text: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Footer Right Text</label>
              <input
                type="text"
                value={formData.footer_right_text}
                onChange={(e) => setFormData({ ...formData, footer_right_text: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Header Height (px)</label>
              <input
                type="number"
                min="0"
                value={formData.header_height}
                onChange={(e) => setFormData({ ...formData, header_height: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Footer Height (px)</label>
              <input
                type="number"
                min="0"
                value={formData.footer_height}
                onChange={(e) => setFormData({ ...formData, footer_height: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Body Width (px)</label>
              <input
                type="number"
                min="0"
                value={formData.body_width}
                onChange={(e) => setFormData({ ...formData, body_width: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Body Height (px)</label>
              <input
                type="number"
                min="0"
                value={formData.body_height}
                onChange={(e) => setFormData({ ...formData, body_height: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.show_student_photo}
                  onChange={(e) => setFormData({ ...formData, show_student_photo: e.target.checked })}
                />
                Show Student Photo
              </label>
            </div>
            <div className="form-group">
              <label>Photo Height (px)</label>
              <input
                type="number"
                min="0"
                value={formData.photo_height}
                onChange={(e) => setFormData({ ...formData, photo_height: Number(e.target.value) })}
                disabled={!formData.show_student_photo}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Background Image URL</label>
            <input
              type="text"
              value={formData.background_image}
              onChange={(e) => setFormData({ ...formData, background_image: e.target.value })}
              placeholder="Enter image URL"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowModal(false);
                setSelectedTemplate(null);
                if (resetForm) resetForm();
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {createMutation.isLoading || updateMutation.isLoading
                ? 'Saving...'
                : selectedTemplate
                ? 'Update Template'
                : 'Create Template'}
            </button>
          </div>
        </form>

        {/* Preview Section */}
        <div className="admit-card-preview-section" style={{ marginTop: 'var(--spacing-xl)', borderTop: '2px solid var(--gray-200)', paddingTop: 'var(--spacing-lg)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Preview</h3>
          <AdmitCardPreview formData={formData} />
        </div>
      </Modal>
    );
  };

// Admit Card Preview Modal Component
interface AdmitCardPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: any[];
  examId: number;
  templateId: number;
}

const AdmitCardPreviewModal = ({ isOpen, onClose, students, examId, templateId }: AdmitCardPreviewModalProps) => {
  const [template, setTemplate] = useState<AdmitCardTemplate | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && examId && templateId) {
      loadData();
    }
  }, [isOpen, examId, templateId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load template
      const templates = await examinationsService.getAdmitCardTemplates();
      const selectedTemplate = templates.find(t => t.id === templateId);
      setTemplate(selectedTemplate || null);

      // Load exam details
      const examDetails = await examinationsService.getExamById(examId);
      setExam(examDetails);

      // Load full student data
      const fullStudentsData = await Promise.all(
        students.map(async (student) => {
          try {
            const studentDetails = await studentsService.getStudentById(String(student.id));
            return studentDetails.data;
          } catch {
            return student;
          }
        })
      );
      setStudentsData(fullStudentsData);
    } catch (error) {
      console.error('Error loading admit card data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Admit Card Preview" size="large">
      <div className="admit-card-preview-container">
        {isLoading ? (
          <div className="loading">Loading admit cards...</div>
        ) : template && exam ? (
          <div className="admit-cards-print-view">
            {studentsData.map((student, index) => (
              <AdmitCardComponent
                key={student.id || index}
                student={student}
                exam={exam}
                template={template}
              />
            ))}
          </div>
        ) : (
          <div className="error-state">Failed to load template or exam data</div>
        )}
        <div className="admit-card-actions" style={{ marginTop: 'var(--spacing-lg)', textAlign: 'center' }}>
          <button className="btn-primary" onClick={() => window.print()}>
            🖨️ Print
          </button>
          <button className="btn-secondary" onClick={onClose} style={{ marginLeft: 'var(--spacing-sm)' }}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Individual Admit Card Component
interface AdmitCardComponentProps {
  student: any;
  exam: Exam;
  template: AdmitCardTemplate;
}

const AdmitCardComponent = ({ student, exam, template }: AdmitCardComponentProps) => {
  // Replace variables in text
  const replaceVariables = (text: string): string => {
    if (!text) return '';
    let result = text;
    const variables: Record<string, string> = {
      student_name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
      admission_no: student.admission_no || '',
      roll_no: student.roll_no || '',
      exam_roll_no: student.roll_no || '',
      class: student.class_name || '',
      section: student.section_name || '',
      session: exam.session_name || '',
      exam_name: exam.name || '',
      exam_group: exam.exam_group_name || '',
      father_name: student.father_name || '',
      mother_name: student.mother_name || '',
      guardian_name: student.guardian_name || student.father_name || '',
      date_of_birth: student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '',
      gender: student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : '',
      blood_group: student.blood_group || '',
      address: student.current_address || student.permanent_address || '',
      phone: student.student_mobile || student.father_phone || '',
      email: student.email || '',
    };

    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, variables[key]);
    });
    return result;
  };

  const cardStyle: React.CSSProperties = {
    width: `${template.body_width || 800}px`,
    minHeight: `${(template.header_height || 100) + (template.body_height || 400) + (template.footer_height || 50)}px`,
    border: '2px solid #000',
    margin: '0 auto 20px',
    padding: '20px',
    backgroundColor: template.background_image ? 'transparent' : '#fff',
    backgroundImage: template.background_image ? `url(${template.background_image})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    pageBreakAfter: 'always',
  };

  return (
    <div className="admit-card" style={cardStyle}>
      {/* Header */}
      {(template.header_left_text || template.header_center_text || template.header_right_text) && (
        <div
          className="admit-card-header"
          style={{
            height: `${template.header_height || 100}px`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #000',
            marginBottom: '20px',
            paddingBottom: '10px',
          }}
        >
          <div style={{ flex: 1, textAlign: 'left' }}>
            {template.header_left_text && <div>{replaceVariables(template.header_left_text)}</div>}
          </div>
          <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>
            {template.header_center_text && <div>{replaceVariables(template.header_center_text)}</div>}
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            {template.header_right_text && <div>{replaceVariables(template.header_right_text)}</div>}
          </div>
        </div>
      )}

      {/* Title */}
      {(template as any).title && (
        <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '20px', fontWeight: 'bold', textDecoration: 'underline' }}>
          {replaceVariables((template as any).title)}
        </div>
      )}

      {/* Body */}
      <div
        className="admit-card-body"
        style={{
          minHeight: `${template.body_height || 400}px`,
          display: 'flex',
          gap: '20px',
        }}
      >
        {/* Left side - Student info */}
        <div style={{ flex: 1 }}>
          {template.body_text && (
            <div style={{ whiteSpace: 'pre-line', lineHeight: '1.8' }}>
              {replaceVariables(template.body_text)}
            </div>
          )}

          {/* Exam Schedule Table */}
          {exam.subjects && exam.subjects.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginTop: '15px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>THEORY EXAM DATE & TIME</th>
                    <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>PAPER CODE</th>
                    <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>SUBJECT</th>
                    <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>OPTED BY STUDENT</th>
                  </tr>
                </thead>
                <tbody>
                  {exam.subjects.map((subject: any, idx: number) => (
                    <tr key={subject.id || idx}>
                      <td style={{ border: '1px solid #000', padding: '8px' }}>
                        {subject.exam_date && subject.exam_time_from
                          ? `${new Date(subject.exam_date).toLocaleDateString()} ${subject.exam_time_from}${subject.exam_time_to ? ` - ${subject.exam_time_to}` : ''}`
                          : '-'}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '8px' }}>{subject.subject_code || '-'}</td>
                      <td style={{ border: '1px solid #000', padding: '8px' }}>{subject.subject_name || '-'}</td>
                      <td style={{ border: '1px solid #000', padding: '8px' }}>THEORY</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right side - Student photo */}
        {template.show_student_photo && (
          <div style={{ width: '150px', textAlign: 'center' }}>
            {student.photo ? (
              <img
                src={student.photo}
                alt={student.first_name}
                style={{
                  width: '100%',
                  height: `${template.photo_height || 100}px`,
                  objectFit: 'cover',
                  border: '2px solid #000',
                  borderRadius: '4px',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: `${template.photo_height || 100}px`,
                  border: '2px solid #000',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f0f0f0',
                }}
              >
                No Photo
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {(template.footer_left_text || template.footer_center_text || template.footer_right_text) && (
        <div
          className="admit-card-footer"
          style={{
            height: `${template.footer_height || 50}px`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: '2px solid #000',
            marginTop: '20px',
            paddingTop: '10px',
          }}
        >
          <div style={{ flex: 1, textAlign: 'left' }}>
            {template.footer_left_text && <div>{replaceVariables(template.footer_left_text)}</div>}
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            {template.footer_center_text && <div>{replaceVariables(template.footer_center_text)}</div>}
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            {template.footer_right_text && <div>{replaceVariables(template.footer_right_text)}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

// Old Admit Card Preview Component (kept for reference)
const AdmitCardPreview = ({ formData }: { formData: any }) => {
  // Sample data for preview
  const sampleData: Record<string, string> = {
    student_name: 'John Doe',
    admission_no: 'ADM001',
    roll_no: '101',
    exam_roll_no: 'EX001',
    class: 'Class 10',
    section: 'A',
    session: '2024-2025',
    exam_name: 'Half Yearly Examination',
    exam_group: 'Mid Term Exams',
    father_name: 'Robert Doe',
    mother_name: 'Jane Doe',
    guardian_name: 'Robert Doe',
    date_of_birth: '15/05/2010',
    gender: 'Male',
    blood_group: 'O+',
    address: '123 Main Street, City',
    phone: '+1234567890',
    email: 'john.doe@example.com',
    exam_date: '15/03/2024',
    exam_time: '09:00 AM - 12:00 PM',
    room_number: 'Room 101',
  };

  // Replace variables in text with sample data
  const replaceVariables = (text: string): string => {
    let result = text;
    Object.keys(sampleData).forEach((key) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, sampleData[key]);
    });
    return result;
  };

  const previewStyle: React.CSSProperties = {
    width: `${formData.body_width}px`,
    minHeight: `${formData.header_height + formData.body_height + formData.footer_height}px`,
    border: '2px solid var(--gray-300)',
    borderRadius: 'var(--border-radius)',
    overflow: 'hidden',
    backgroundColor: formData.background_image ? 'transparent' : 'var(--white)',
    backgroundImage: formData.background_image ? `url(${formData.background_image})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    margin: '0 auto',
    boxShadow: 'var(--shadow-lg)',
  };

  const headerStyle: React.CSSProperties = {
    height: `${formData.header_height}px`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--spacing-md)',
    borderBottom: '1px solid var(--gray-300)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  };

  const bodyStyle: React.CSSProperties = {
    minHeight: `${formData.body_height}px`,
    padding: 'var(--spacing-lg)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-md)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  };

  const footerStyle: React.CSSProperties = {
    height: `${formData.footer_height}px`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--spacing-md)',
    borderTop: '1px solid var(--gray-300)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    fontSize: 'var(--font-size-sm)',
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-lg)', backgroundColor: 'var(--gray-100)', borderRadius: 'var(--border-radius)', overflowX: 'auto' }}>
      <div style={previewStyle}>
        {/* Header */}
        {(formData.heading || formData.title || formData.header_left_text || formData.header_center_text || formData.header_right_text) && (
          <div style={headerStyle}>
            <div style={{ flex: 1, textAlign: 'left' }}>{replaceVariables(formData.header_left_text || '')}</div>
            <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: 'var(--font-size-xl)' }}>
              {formData.heading || replaceVariables(formData.header_center_text || '')}
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>{replaceVariables(formData.header_right_text || '')}</div>
          </div>
        )}
        
        {/* Title Section */}
        {formData.title && (
          <div style={{ padding: 'var(--spacing-md)', textAlign: 'center', fontWeight: 'bold', fontSize: 'var(--font-size-lg)', borderBottom: '1px solid var(--gray-300)' }}>
            {replaceVariables(formData.title)}
          </div>
        )}
        
        {/* Exam Name Section */}
        {formData.exam_name && (
          <div style={{ padding: 'var(--spacing-sm) var(--spacing-md)', textAlign: 'center', fontSize: 'var(--font-size-base)', borderBottom: '1px solid var(--gray-300)' }}>
            {replaceVariables(formData.exam_name)}
          </div>
        )}

        {/* Body */}
        <div style={bodyStyle}>
          {formData.show_student_photo && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-md)' }}>
              <div
                style={{
                  width: `${formData.photo_height}px`,
                  height: `${formData.photo_height}px`,
                  border: '2px solid var(--gray-300)',
                  borderRadius: 'var(--border-radius)',
                  backgroundColor: 'var(--gray-200)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gray-500)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                Photo
              </div>
            </div>
          )}
          {formData.body_text && (
            <div
              style={{
                whiteSpace: 'pre-wrap',
                lineHeight: '1.6',
                textAlign: 'left',
              }}
              dangerouslySetInnerHTML={{
                __html: replaceVariables(formData.body_text).replace(/\n/g, '<br />'),
              }}
            />
          )}
        </div>

        {/* Footer */}
        {(formData.footer_left_text || formData.footer_center_text || formData.footer_right_text) && (
          <div style={footerStyle}>
            <div style={{ flex: 1, textAlign: 'left' }}>{replaceVariables(formData.footer_left_text || '')}</div>
            <div style={{ flex: 1, textAlign: 'center' }}>{replaceVariables(formData.footer_center_text || '')}</div>
            <div style={{ flex: 1, textAlign: 'right' }}>{replaceVariables(formData.footer_right_text || '')}</div>
          </div>
        )}
      </div>
    </div>
  );
};

const DesignMarksheetTab = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MarksheetTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    header_left_text: '',
    header_center_text: '',
    header_right_text: '',
    body_text: '',
    footer_left_text: '',
    footer_center_text: '',
    footer_right_text: '',
    header_height: 100,
    footer_height: 50,
    body_height: 500,
    body_width: 800,
    show_student_photo: true,
    photo_height: 100,
    background_image: '',
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: templates, isLoading } = useQuery('marksheet-templates', examinationsService.getMarksheetTemplates);

  const createMutation = useMutation(examinationsService.createMarksheetTemplate, {
    onSuccess: () => {
      queryClient.invalidateQueries('marksheet-templates');
      showToast('Marksheet template created successfully', 'success');
      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create template', 'error');
    },
  });

  const updateMutation = useMutation(
    (data: { id: number; template: Partial<MarksheetTemplate> }) =>
      examinationsService.updateMarksheetTemplate(data.id, data.template),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('marksheet-templates');
        showToast('Template updated successfully', 'success');
        setShowModal(false);
        setSelectedTemplate(null);
        resetForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update template', 'error');
      },
    }
  );

  const resetForm = () => {
    setFormData({
      name: '',
      header_left_text: '',
      header_center_text: '',
      header_right_text: '',
      body_text: '',
      footer_left_text: '',
      footer_center_text: '',
      footer_right_text: '',
      header_height: 100,
      footer_height: 50,
      body_height: 500,
      body_width: 800,
      show_student_photo: true,
      photo_height: 100,
      background_image: '',
    });
  };

  const handleEdit = (template: MarksheetTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      header_left_text: template.header_left_text || '',
      header_center_text: template.header_center_text || '',
      header_right_text: template.header_right_text || '',
      body_text: template.body_text || '',
      footer_left_text: template.footer_left_text || '',
      footer_center_text: template.footer_center_text || '',
      footer_right_text: template.footer_right_text || '',
      header_height: template.header_height,
      footer_height: template.footer_height,
      body_height: template.body_height,
      body_width: template.body_width,
      show_student_photo: template.show_student_photo,
      photo_height: template.photo_height,
      background_image: template.background_image || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Template name is required', 'error');
      return;
    }

    if (selectedTemplate) {
      updateMutation.mutate({ id: selectedTemplate.id, template: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="examinations-tab-content">
      <div className="tab-header">
        <h2>Design Marksheet</h2>
        <button className="btn-primary" onClick={() => {
          setSelectedTemplate(null);
          resetForm();
          setShowModal(true);
        }}>
          + Add Template
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : templates && templates.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Body Width</th>
              <th>Body Height</th>
              <th>Show Photo</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.id}>
                <td>{template.name}</td>
                <td>{template.body_width}px</td>
                <td>{template.body_height}px</td>
                <td>{template.show_student_photo ? 'Yes' : 'No'}</td>
                <td>
                  <button className="btn-sm btn-secondary" onClick={() => handleEdit(template)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">No templates found</div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedTemplate(null);
          resetForm();
        }}
        title={selectedTemplate ? 'Edit Marksheet Template' : 'Create Marksheet Template'}
        size="large"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Template Name <span className="required">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Header Left Text</label>
              <input
                type="text"
                value={formData.header_left_text}
                onChange={(e) => setFormData({ ...formData, header_left_text: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Header Center Text</label>
              <input
                type="text"
                value={formData.header_center_text}
                onChange={(e) => setFormData({ ...formData, header_center_text: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Header Right Text</label>
              <input
                type="text"
                value={formData.header_right_text}
                onChange={(e) => setFormData({ ...formData, header_right_text: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Body Text</label>
            <textarea
              value={formData.body_text}
              onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
              rows={4}
              placeholder="Use variables like {student_name}, {admission_no}, {class}, {section}, {exam_name}, {marks}, etc."
            />
            <small>Use variables: {'{student_name}'}, {'{admission_no}'}, {'{class}'}, {'{section}'}, {'{exam_name}'}, {'{marks}'}, {'{percentage}'}, {'{grade}'}, etc.</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Footer Left Text</label>
              <input
                type="text"
                value={formData.footer_left_text}
                onChange={(e) => setFormData({ ...formData, footer_left_text: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Footer Center Text</label>
              <input
                type="text"
                value={formData.footer_center_text}
                onChange={(e) => setFormData({ ...formData, footer_center_text: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Footer Right Text</label>
              <input
                type="text"
                value={formData.footer_right_text}
                onChange={(e) => setFormData({ ...formData, footer_right_text: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Header Height (px)</label>
              <input
                type="number"
                min="0"
                value={formData.header_height}
                onChange={(e) => setFormData({ ...formData, header_height: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Footer Height (px)</label>
              <input
                type="number"
                min="0"
                value={formData.footer_height}
                onChange={(e) => setFormData({ ...formData, footer_height: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Body Width (px)</label>
              <input
                type="number"
                min="0"
                value={formData.body_width}
                onChange={(e) => setFormData({ ...formData, body_width: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Body Height (px)</label>
              <input
                type="number"
                min="0"
                value={formData.body_height}
                onChange={(e) => setFormData({ ...formData, body_height: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.show_student_photo}
                  onChange={(e) => setFormData({ ...formData, show_student_photo: e.target.checked })}
                />
                Show Student Photo
              </label>
            </div>
            <div className="form-group">
              <label>Photo Height (px)</label>
              <input
                type="number"
                min="0"
                value={formData.photo_height}
                onChange={(e) => setFormData({ ...formData, photo_height: Number(e.target.value) })}
                disabled={!formData.show_student_photo}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Background Image URL</label>
            <input
              type="text"
              value={formData.background_image}
              onChange={(e) => setFormData({ ...formData, background_image: e.target.value })}
              placeholder="Enter image URL"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowModal(false);
                setSelectedTemplate(null);
                if (typeof resetForm === 'function') resetForm();
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {createMutation.isLoading || updateMutation.isLoading
                ? 'Saving...'
                : selectedTemplate
                ? 'Update Template'
                : 'Create Template'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const PrintMarksheetTab = () => {
  const [filters, setFilters] = useState({
    exam_group_id: '',
    exam_id: '',
    session_id: '',
    class_id: '',
    section_id: '',
  });
  const [showPreview, setShowPreview] = useState(false);
  const [examResults, setExamResults] = useState<any[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [examDetails, setExamDetails] = useState<any>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  const { showToast } = useToast();

  const { data: examGroups = [] } = useQuery('exam-groups', examinationsService.getExamGroups);
  
  const { data: sessions = [] } = useQuery(
    'sessions',
    () => settingsService.getSessions().then(res => res.data)
  );

  const { data: exams = [] } = useQuery(
    ['exams', filters.exam_group_id],
    () => examinationsService.getExams({ exam_group_id: Number(filters.exam_group_id) }),
    { enabled: !!filters.exam_group_id }
  );

  const { data: classes = [] } = useQuery(
    ['classes', filters.session_id],
    () => academicsService.getClasses().then(res => res.data),
    { enabled: !!filters.session_id }
  );

  const { data: sections = [] } = useQuery(
    ['sections', filters.class_id],
    () => academicsService.getSections().then(res => res.data),
    { enabled: !!filters.class_id }
  );

  // Don't auto-load - wait for search button

  // Load school info
  useEffect(() => {
    const loadSchoolInfo = async () => {
      try {
        const settings = await settingsService.getGeneralSettings();
        if (settings?.data) {
          setSchoolInfo({
            name: settings.data.schoolName || 'School Name',
            address: settings.data.address || '',
            phone: settings.data.phone || '',
            email: settings.data.email || '',
            logo: settings.data.printLogo || settings.data.adminLogo || '',
            affiliation_no: '', // Not available in GeneralSettings
            board_name: '', // Not available in GeneralSettings
          });
        }
      } catch (error) {
        setSchoolInfo({ name: 'School Name' });
      }
    };
    loadSchoolInfo();
  }, []);

  const handleSearch = async () => {
    if (!filters.exam_group_id || !filters.exam_id) {
      showToast('Please select exam group and exam', 'error');
      return;
    }

    setIsLoadingResults(true);
    try {
      // Fetch exam details
      const examData = await examinationsService.getExamById(Number(filters.exam_id));
      setExamDetails(examData);

      // Get session_id from exam details if available, otherwise use filter
      const sessionId = examData?.session_id || filters.session_id;
      
      // Get class_id and section_id from first student if filters don't have them
      let classId = filters.class_id;
      let sectionId = filters.section_id;
      
      if (!classId || !sectionId || !sessionId) {
        showToast('Please select class, section, and session', 'error');
        setIsLoadingResults(false);
        return;
      }

      // Fetch exam results
      const resultsResponse = await examinationsService.getExamResults({
        exam_id: Number(filters.exam_id),
        class_id: Number(classId),
        section_id: Number(sectionId),
        session_id: Number(sessionId),
      });
      
      if (resultsResponse.success && resultsResponse.data) {
        const resultsArray = resultsResponse.data.results || [];
        setExamResults(resultsArray);
        setShowPreview(true);
      } else {
        showToast('Failed to load exam results', 'error');
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to load exam results', 'error');
    } finally {
      setIsLoadingResults(false);
    }
  };

  const handlePrint = () => {
    if (!examDetails || !schoolInfo || examResults.length === 0) {
      showToast('No data available to print', 'error');
      return;
    }

    // Generate HTML for marksheets (same approach as admit card)
    const generateMarksheetHTML = (result: any, exam: any, schoolInfo: any) => {
      const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      };

      const studentName = `${result.first_name || ''} ${result.last_name || ''}`.trim();
      const marks = result.subjects || [];
      
      // Helper function to get logo URL
      const getLogoUrl = (logo: string | null | undefined): string => {
        if (!logo) return '';
        const logoStr = String(logo).trim();
        if (!logoStr || logoStr === 'null' || logoStr === 'undefined') return '';
        
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

      const logoUrl = getLogoUrl(schoolInfo.logo);
      const gradeScale = [
        { marks_range: '91-100', grade: 'A+' },
        { marks_range: '81-90', grade: 'A' },
        { marks_range: '71-80', grade: 'B+' },
        { marks_range: '61-70', grade: 'B' },
        { marks_range: '51-60', grade: 'C+' },
        { marks_range: '41-50', grade: 'C' },
        { marks_range: '32-40', grade: 'D' },
      ];

      const marksHTML = marks.map((mark: any) => `
        <tr class="${mark.is_pass === false ? 'failed-row' : ''}">
          <td class="subject-name">${mark.subject_name || '-'}</td>
          <td>${mark.max_marks || '-'}</td>
          <td>${mark.passing_marks || '-'}</td>
          <td class="${mark.is_pass === false ? 'failed-marks' : ''}">${mark.marks_obtained || '-'}</td>
          <td>${mark.grade || '-'}</td>
          <td>${mark.is_pass ? 'PASS' : 'FAIL'}</td>
        </tr>
      `).join('');

      const gradeScaleHTML = gradeScale.map((gs) => `
        <th class="scale-value">${gs.marks_range}</th>
      `).join('');

      const gradeScaleValuesHTML = gradeScale.map((gs) => `
        <td class="scale-value">${gs.grade}</td>
      `).join('');

      return `
        <div class="marksheet-page">
          <div class="marksheet-container">
            <div class="marksheet-border">
              <div class="marksheet-inner">
                <div class="marksheet-header">
                  <div class="header-logo-section">
                    ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="marksheet-logo" />` : '<div class="marksheet-logo-placeholder"><span>🏫</span></div>'}
                  </div>
                  <div class="header-content">
                    <h1 class="school-title">${schoolInfo.name || 'School Name'}</h1>
                    ${schoolInfo.board_name ? `<div class="affiliation-text">Affiliated to ${schoolInfo.board_name}${schoolInfo.affiliation_no ? ` / Affiliation No.: ${schoolInfo.affiliation_no}` : ''}</div>` : ''}
                  </div>
                </div>
                <div class="marksheet-title">
                  <h2>Academic Record</h2>
                  <div class="session-info">Academic Session - ${exam.session_name || '-'}</div>
                  <div class="class-info">Class: ${result.class_name || '-'}${result.section_name ? ` (${result.section_name})` : ''}</div>
                </div>
                <div class="student-info-section">
                  <div class="info-row">
                    <div class="info-group">
                      <span class="info-label">Name of Student</span>
                      <span class="info-value dotted">${studentName}</span>
                    </div>
                    <div class="info-group">
                      <span class="info-label">Roll No</span>
                      <span class="info-value dotted">${result.roll_no || '-'}</span>
                    </div>
                  </div>
                  <div class="info-row">
                    <div class="info-group">
                      <span class="info-label">Mother's Name</span>
                      <span class="info-value dotted">${result.mother_name || '-'}</span>
                    </div>
                    <div class="info-group">
                      <span class="info-label">Admission No</span>
                      <span class="info-value dotted">${result.admission_no || '-'}</span>
                    </div>
                  </div>
                  <div class="info-row">
                    <div class="info-group">
                      <span class="info-label">Father's Name</span>
                      <span class="info-value dotted">${result.father_name || '-'}</span>
                    </div>
                    <div class="info-group">
                      <span class="info-label">Date of Birth</span>
                      <span class="info-value dotted">${formatDate(result.date_of_birth)}</span>
                    </div>
                  </div>
                </div>
                <div class="marks-section">
                  <table class="marks-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Max Marks</th>
                        <th>Passing Marks</th>
                        <th>Marks Obtained</th>
                        <th>Grade</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${marksHTML}
                      <tr style="font-weight: bold; background: #f5f5f5;">
                        <td>Total</td>
                        <td>${result.total_max_marks || 0}</td>
                        <td>-</td>
                        <td>${result.total_marks_obtained || 0}</td>
                        <td>${Number(result.percentage || 0).toFixed(2)}%</td>
                        <td>${result.is_pass ? 'PASS' : 'FAIL'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="results-summary">
                  <div class="summary-row">
                    <div class="summary-item">
                      <span class="summary-label">Total Marks</span>
                      <span class="summary-value">${result.total_marks_obtained || 0} / ${result.total_max_marks || 0}</span>
                    </div>
                    <div class="summary-item">
                      <span class="summary-label">Percentage</span>
                      <span class="summary-value">${Number(result.percentage || 0).toFixed(2)}%</span>
                    </div>
                    <div class="summary-item">
                      <span class="summary-label">Grade</span>
                      <span class="summary-value">${result.grade || '-'}</span>
                    </div>
                    ${result.rank ? `
                    <div class="summary-item">
                      <span class="summary-label">Rank</span>
                      <span class="summary-value">${result.rank}</span>
                    </div>
                    ` : ''}
                  </div>
                </div>
                <div class="grade-scale-section">
                  <div class="grade-scale-title">Grading Scale</div>
                  <table class="grade-scale-table">
                    <thead>
                      <tr>
                        <th class="scale-header">Marks Range</th>
                        ${gradeScaleHTML}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td class="scale-header">Grade</td>
                        ${gradeScaleValuesHTML}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="signatures-section">
                  <div class="signature-box">
                    <div class="signature-line"></div>
                    <div class="signature-label">Class Teacher's Signature</div>
                  </div>
                  <div class="signature-box">
                    <div class="signature-line"></div>
                    <div class="signature-label">Principal's Signature</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    };

    // Generate HTML for all marksheets
    const marksheetsHTML = examResults.map((result) => generateMarksheetHTML(result, examDetails, schoolInfo)).join('');

    // Get CSS content (inline for reliability - same approach as admit card)
    const cssContent = `
      /* Marksheet Styles */
      .marksheets-container {
        width: 100%;
        background: #f5f5f5;
        padding: 20px;
      }
      .marksheet-page {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto 20px;
        background: white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        page-break-after: always;
        box-sizing: border-box;
      }
      .marksheet-container {
        width: 100%;
        height: 100%;
        padding: 5mm;
        box-sizing: border-box;
      }
      .marksheet-border {
        width: 100%;
        height: 100%;
        border: 3px double #2c8c4a;
        padding: 3mm;
        box-sizing: border-box;
        position: relative;
        background: repeating-linear-gradient(to right, transparent, transparent 5px, rgba(44, 140, 74, 0.1) 5px, rgba(44, 140, 74, 0.1) 10px);
      }
      .marksheet-inner {
        width: 100%;
        height: 100%;
        border: 1px solid #2c8c4a;
        padding: 4mm;
        box-sizing: border-box;
        background: white;
        font-family: 'Times New Roman', Times, serif;
      }
      .marksheet-header {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 3mm;
        padding-bottom: 2mm;
        border-bottom: 2px solid #1a5c8f;
      }
      .header-logo-section { width: 70px; flex-shrink: 0; }
      .marksheet-logo { width: 65px; height: 65px; object-fit: contain; }
      .marksheet-logo-placeholder {
        width: 65px; height: 65px; border: 1px solid #999; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 28px; background: #f0f0f0;
      }
      .header-content { flex: 1; text-align: center; }
      .school-title {
        font-size: 22px; font-weight: bold; color: #1a5c8f;
        text-transform: uppercase; margin: 0; font-style: italic; letter-spacing: 1px;
      }
      .affiliation-text { font-size: 10px; color: #666; margin-top: 2px; }
      .marksheet-title { text-align: center; margin-bottom: 4mm; }
      .marksheet-title h2 {
        font-size: 18px; color: #c00; margin: 0 0 2px 0; font-weight: normal;
      }
      .session-info { font-size: 12px; color: #1a5c8f; }
      .class-info { font-size: 11px; color: #666; }
      .student-info-section { margin-bottom: 4mm; font-size: 11px; }
      .info-row { display: flex; margin-bottom: 2px; }
      .info-group { flex: 1; display: flex; align-items: baseline; }
      .info-label { font-weight: normal; min-width: 100px; color: #333; }
      .info-value { flex: 1; }
      .info-value.dotted { border-bottom: 1px dotted #999; padding-left: 5px; }
      .marks-section { margin-bottom: 3mm; }
      .marks-table {
        width: 100%; border-collapse: collapse; font-size: 9px;
      }
      .marks-table th, .marks-table td {
        border: 1px solid #333; padding: 2px 3px; text-align: center;
      }
      .marks-table th {
        background: #4a90d9; color: white; font-weight: bold;
      }
      .marks-table .subject-name {
        text-align: left; font-weight: bold; padding-left: 5px;
      }
      .marks-table .failed-row { background: #ffe6e6; }
      .marks-table .failed-marks { color: #c00; font-weight: bold; }
      .results-summary { margin: 3mm 0; }
      .summary-row { display: flex; justify-content: center; gap: 20px; }
      .summary-item { display: flex; align-items: center; gap: 5px; }
      .summary-label {
        font-size: 10px; font-weight: bold; color: #c00;
        padding: 2px 6px; border: 1px solid #c00; border-radius: 2px;
      }
      .summary-value {
        font-size: 10px; font-weight: bold; padding: 2px 10px;
        background: #fffde7; border: 1px solid #333;
      }
      .grade-scale-section { margin-bottom: 4mm; }
      .grade-scale-title {
        font-size: 10px; font-weight: bold; text-align: center; margin-bottom: 2mm;
      }
      .grade-scale-table {
        width: 100%; border-collapse: collapse; font-size: 9px;
      }
      .grade-scale-table th, .grade-scale-table td {
        border: 1px solid #333; padding: 2px 5px; text-align: center;
      }
      .scale-header { background: #4a90d9; color: white; font-weight: bold; }
      .scale-value { background: #ffeaa7; }
      .signatures-section {
        display: flex; justify-content: space-between; margin-top: 5mm; padding: 0 20mm;
      }
      .signature-box { text-align: center; width: 120px; }
      .signature-box .signature-line {
        border-bottom: 1px solid #333; height: 30px; margin-bottom: 3px;
      }
      .signature-box .signature-label {
        font-size: 9px; color: #c00; font-style: italic;
      }
      @media print {
        @page { size: A4 portrait; margin: 0; }
        body { margin: 0; padding: 0; }
        .marksheets-container { padding: 0; background: none; }
        .marksheet-page { box-shadow: none; margin: 0; page-break-after: always; }
        .marksheet-page:last-child { page-break-after: auto; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      }
    `;

    // Create new window with HTML
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      showToast('Please allow popups to print', 'error');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Marksheets</title>
          <style>${cssContent}</style>
        </head>
        <body>
          <div class="marksheets-container">
            ${marksheetsHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="examinations-tab-content">
      <div className="tab-header">
        <h2>Print Marksheet</h2>
        <p className="tab-description">Predefined template - Full A4 portrait page per student</p>
      </div>

      <div className="filters-section no-print" style={{ marginBottom: 'var(--spacing-lg)', background: 'var(--white)', padding: 'var(--spacing-lg)', borderRadius: 'var(--border-radius)' }}>
        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label>Exam Group <span className="required">*</span></label>
            <select
              value={filters.exam_group_id}
              onChange={(e) => {
                setFilters({ ...filters, exam_group_id: e.target.value, exam_id: '' });
                setExamResults([]);
                setShowPreview(false);
              }}
            >
              <option value="">Select Exam Group</option>
              {examGroups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Exam <span className="required">*</span></label>
            <select
              value={filters.exam_id}
              onChange={(e) => {
                setFilters({ ...filters, exam_id: e.target.value });
                setExamResults([]);
                setShowPreview(false);
              }}
              disabled={!filters.exam_group_id}
            >
              <option value="">Select Exam</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>{exam.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Session</label>
            <select
              value={filters.session_id}
              onChange={(e) => {
                setFilters({ ...filters, session_id: e.target.value, class_id: '', section_id: '' });
                setExamResults([]);
                setShowPreview(false);
              }}
            >
              <option value="">All Sessions</option>
              {sessions && Array.isArray(sessions) && sessions.map((session: any) => (
                <option key={session.id} value={session.id}>{session.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Class</label>
            <select
              value={filters.class_id}
              onChange={(e) => {
                setFilters({ ...filters, class_id: e.target.value, section_id: '' });
                setExamResults([]);
                setShowPreview(false);
              }}
              disabled={!filters.session_id}
            >
              <option value="">All Classes</option>
              {classes && classes.map((cls: any) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Section</label>
            <select
              value={filters.section_id}
              onChange={(e) => {
                setFilters({ ...filters, section_id: e.target.value });
                setExamResults([]);
                setShowPreview(false);
              }}
              disabled={!filters.class_id}
            >
              <option value="">All Sections</option>
              {sections && sections.map((sec: any) => (
                <option key={sec.id} value={sec.id}>{sec.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 'var(--spacing-md)', textAlign: 'right' }}>
          <button
            className="btn-primary"
            onClick={handleSearch}
            disabled={!filters.exam_group_id || !filters.exam_id || isLoadingResults}
          >
            {isLoadingResults ? 'Loading...' : '🔍 Search'}
          </button>
        </div>
      </div>

      {/* Marksheet Preview Modal with Predefined Template */}
      {showPreview && examResults.length > 0 && examDetails && schoolInfo && (
        <Modal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title="Marksheet Preview"
          size="large"
        >
          <div className="marksheet-preview-wrapper">
            <div className="print-actions no-print" style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>
              <button className="btn-primary" onClick={handlePrint} style={{ marginRight: 'var(--spacing-sm)' }}>
                🖨️ Print Marksheets
              </button>
              <button className="btn-secondary" onClick={() => setShowPreview(false)}>
                Close Preview
              </button>
            </div>
            <div className="marksheets-container">
              {examResults.map((result, index) => (
                <MarksheetPredefinedTemplate
                  key={result.student_id || index}
                  student={{
                    ...result,
                    first_name: result.first_name,
                    last_name: result.last_name,
                    admission_no: result.admission_no,
                    roll_no: result.roll_no,
                    class_name: result.class_name,
                    section_name: result.section_name,
                    father_name: result.father_name,
                    mother_name: result.mother_name,
                    date_of_birth: result.date_of_birth,
                  }}
                  exam={examDetails}
                  marks={result.subjects || []}
                  schoolInfo={schoolInfo}
                  totalMarks={Number(result.total_marks_obtained) || 0}
                  maxMarks={Number(result.total_max_marks) || 0}
                  percentage={Number(result.percentage) || 0}
                  grade={result.grade}
                  rank={result.rank}
                  result={result.is_pass ? 'PASS' : 'FAIL'}
                />
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ========== Exam Modals ==========

interface ExamDetailsModalProps {
  exam: Exam;
  isOpen: boolean;
  onClose: () => void;
  onAssignStudents: () => void;
  onAddSubject: () => void;
  onEnterMarks: (subjectId: number) => void;
  onPublish?: () => void;
}

const ExamDetailsModal = ({
  exam,
  isOpen,
  onClose,
  onAssignStudents,
  onAddSubject,
  onEnterMarks,
  onPublish,
}: ExamDetailsModalProps) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  // Fetch latest exam data to ensure we have the most up-to-date information
  const { data: latestExamData } = useQuery(
    ['exam', exam.id],
    () => examinationsService.getExamById(exam.id),
    { enabled: isOpen, refetchOnWindowFocus: false }
  );
  
  // Use latest exam data if available, otherwise use prop
  const currentExam = latestExamData || exam;
  
  if (!currentExam) {
    return null;
  }

  // Ensure subjects and students are always arrays
  const subjects = Array.isArray(currentExam.subjects) ? currentExam.subjects : [];
  const students = Array.isArray(currentExam.students) ? currentExam.students : [];
  
  // Publish/Unpublish exam mutation
  const publishMutation = useMutation(
    (isPublished: boolean) => examinationsService.updateExam(currentExam.id, { is_published: isPublished }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['exam', currentExam.id]);
        queryClient.invalidateQueries('exams');
        showToast(
          currentExam.is_published ? 'Exam unpublished successfully' : 'Exam published successfully',
          'success'
        );
        if (onPublish) {
          onPublish();
        }
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update exam status', 'error');
      },
    }
  );
  
  const handlePublishToggle = () => {
    publishMutation.mutate(!currentExam.is_published);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Exam: ${currentExam.name || 'Loading...'}`} 
      size="large"
      headerActions={
        <>
          <button className="btn-sm btn-primary" onClick={onAssignStudents}>
            <span className="icon">👥</span> Assign / View Students
          </button>
          <button className="btn-sm btn-primary" onClick={onAddSubject}>
            <span className="icon">+</span> Add Subject
          </button>
          <button 
            className={`btn-sm ${currentExam.is_published ? 'btn-secondary' : 'btn-primary'}`}
            onClick={handlePublishToggle}
            disabled={publishMutation.isLoading}
            title={currentExam.is_published ? 'Unpublish Exam' : 'Publish Exam'}
          >
            <span className="icon">{currentExam.is_published ? '🔒' : '📢'}</span>
            {publishMutation.isLoading 
              ? (currentExam.is_published ? 'Unpublishing...' : 'Publishing...')
              : (currentExam.is_published ? 'Unpublish' : 'Publish')
            }
          </button>
        </>
      }
    >
      <div className="exam-details">
        {/* Exam Information Section */}
        <div className="exam-info-section">
          <h3>Exam Information</h3>
          <div className="info-grid">
            <div>
              <strong>Exam Group:</strong> {currentExam.exam_group_name || '-'}
            </div>
            <div>
              <strong>Session:</strong> {currentExam.session_name || '-'}
            </div>
            <div>
              <strong>Type:</strong>{' '}
              {currentExam.exam_type
                ? currentExam.exam_type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
                : '-'}
            </div>
            <div>
              <strong>Status:</strong>{' '}
              <span className={`badge ${currentExam.is_published ? 'badge-success' : 'badge-warning'}`}>
                {currentExam.is_published ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>
          {currentExam.description && (
            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <strong>Description:</strong>
              <p>{currentExam.description}</p>
            </div>
          )}
        </div>

        {/* Main Content Grid: Subjects and Students Side by Side */}
        <div className="exam-content-grid">
          {/* Exam Subjects Section */}
          <div className="exam-subjects-section">
            <div className="section-header">
              <h3>Exam Subjects</h3>
              <span className="section-count">({subjects.length})</span>
            </div>
            {subjects.length > 0 ? (
              <div className="section-content">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Room</th>
                      <th>Max Marks</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((subject) => (
                      <tr key={subject.id}>
                        <td>
                          <strong>{subject.subject_name || '-'}</strong>
                          {subject.subject_code && (
                            <span className="subject-code"> ({subject.subject_code})</span>
                          )}
                        </td>
                        <td>{subject.exam_date ? new Date(subject.exam_date).toLocaleDateString() : '-'}</td>
                        <td>
                          {subject.exam_time_from && subject.exam_time_to
                            ? `${subject.exam_time_from} - ${subject.exam_time_to}`
                            : '-'}
                        </td>
                        <td>{subject.room_number || '-'}</td>
                        <td><strong>{subject.max_marks || '-'}</strong></td>
                        <td>
                          <button
                            className="btn-sm btn-primary"
                            onClick={() => onEnterMarks(subject.id)}
                            title="Enter marks for this subject"
                          >
                            Enter Marks
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📚</div>
                <p>No subjects added yet</p>
                <button className="btn-sm btn-secondary" onClick={onAddSubject}>
                  Add First Subject
                </button>
              </div>
            )}
          </div>

          {/* Assigned Students Section */}
          <div className="exam-students-section">
            <div className="section-header">
              <h3>Assigned Students</h3>
              <span className="section-count">({students.length})</span>
            </div>
            {students.length > 0 ? (
              <div className="section-content">
                <div className="students-list">
                  {students.slice(0, 10).map((student, index) => (
                    <div key={student.id || student.student_id || index} className="student-item">
                      <div className="student-info">
                        <span className="student-admission">{student.admission_no || '-'}</span>
                        <span className="student-name">
                          {student.first_name || ''} {student.last_name || ''}
                        </span>
                      </div>
                    </div>
                  ))}
                  {students.length > 10 && (
                    <div className="students-more">
                      <span>... and {students.length - 10} more student{students.length - 10 > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
                <div className="section-footer">
                  <button className="btn-sm btn-secondary" onClick={onAssignStudents}>
                    Manage Students
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <p>No students assigned yet</p>
                <button className="btn-sm btn-secondary" onClick={onAssignStudents}>
                  Assign Students
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

interface AssignStudentsModalProps {
  exam: Exam;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AssignStudentsModal = ({ exam, isOpen, onClose, onSuccess }: AssignStudentsModalProps) => {
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: classesResponse } = useQuery('classes', academicsService.getClasses);
  const { data: sectionsResponse } = useQuery('sections', () => academicsService.getSections());
  const { data: studentsData, isLoading } = useQuery(
    ['students', classId, sectionId],
    () =>
      studentsService.getStudents({
        class_id: classId ? Number(classId) : undefined,
        section_id: sectionId ? Number(sectionId) : undefined,
      }),
    { enabled: !!classId && !!sectionId }
  );

  // Load existing assigned students
  const { data: examDetails } = useQuery(
    ['exam', exam.id],
    () => examinationsService.getExamById(exam.id),
    { enabled: isOpen }
  );

  // Safely get classes and sections arrays from response
  const classes = Array.isArray(classesResponse?.data) ? classesResponse.data : [];
  const sections = Array.isArray(sectionsResponse?.data) ? sectionsResponse.data : [];

  useEffect(() => {
    if (examDetails && examDetails.students && Array.isArray(examDetails.students) && examDetails.students.length > 0) {
      const studentIds = examDetails.students
        .map((s: any) => s.student_id || s.id)
        .filter((id: any) => id !== undefined && id !== null);
      setSelectedStudents(studentIds);
    } else {
      setSelectedStudents([]);
    }
  }, [examDetails]);

  const assignMutation = useMutation(
    (studentIds: number[]) => examinationsService.assignExamStudents(exam.id, studentIds),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['exam', exam.id]);
        queryClient.invalidateQueries('exams');
        showToast('Students assigned successfully', 'success');
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to assign students', 'error');
      },
    }
  );

  const handleToggleStudent = (studentId: number) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (studentsData?.data && Array.isArray(studentsData.data)) {
      if (selectedStudents.length === studentsData.data.length) {
        setSelectedStudents([]);
      } else {
        setSelectedStudents(studentsData.data.map((s) => s.id).filter((id) => id !== undefined));
      }
    }
  };

  const handleSubmit = () => {
    assignMutation.mutate(selectedStudents);
  };

  if (!isOpen || !exam) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Students - ${exam.name || 'Exam'}`} size="large">
      <div className="assign-students-modal">
        <div className="form-row">
          <div className="form-group">
            <label>Class</label>
            <select value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Select Class</option>
              {classes && Array.isArray(classes) && classes.length > 0 ? (
                classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>Loading classes...</option>
              )}
            </select>
          </div>
          <div className="form-group">
            <label>Section</label>
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
              <option value="">Select Section</option>
              {sections && Array.isArray(sections) && sections.length > 0 ? (
                sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>Loading sections...</option>
              )}
            </select>
          </div>
        </div>

        {classId && sectionId && (
          <>
            {isLoading ? (
              <div className="loading">Loading students...</div>
            ) : studentsData?.data && Array.isArray(studentsData.data) && studentsData.data.length > 0 ? (
              <>
                <div style={{ marginTop: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)' }}>
                  <button className="btn-sm btn-secondary" onClick={handleSelectAll}>
                    {selectedStudents.length === studentsData.data.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span style={{ marginLeft: 'var(--spacing-md)' }}>
                    {selectedStudents.length} student(s) selected
                  </span>
                </div>
                <div className="students-checkbox-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {studentsData.data.map((student) => (
                    <label key={student.id} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleToggleStudent(student.id)}
                      />
                      <span>
                        {student.admission_no || '-'} - {student.first_name || ''} {student.last_name || ''}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ marginTop: 'var(--spacing-md)' }}>
                No students found
              </div>
            )}
          </>
        )}

        <div className="form-actions" style={{ marginTop: 'var(--spacing-lg)' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={assignMutation.isLoading || selectedStudents.length === 0}
          >
            {assignMutation.isLoading ? 'Assigning...' : 'Assign Students'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

interface AddSubjectModalProps {
  exam: Exam;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddSubjectModal = ({ exam, isOpen, onClose, onSuccess }: AddSubjectModalProps) => {
  const [formData, setFormData] = useState({
    subject_id: '',
    exam_date: '',
    exam_time_from: '',
    exam_time_to: '',
    room_number: '',
    credit_hours: '',
    max_marks: '100',
    passing_marks: '33',
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: subjectsResponse } = useQuery('subjects', academicsService.getSubjects);
  const subjects = Array.isArray(subjectsResponse?.data) ? subjectsResponse.data : [];

  const createMutation = useMutation(examinationsService.createExamSubject, {
    onSuccess: () => {
      queryClient.invalidateQueries(['exam', exam.id]);
      queryClient.invalidateQueries('exams');
      showToast('Subject added successfully', 'success');
      onClose();
      setFormData({
        subject_id: '',
        exam_date: '',
        exam_time_from: '',
        exam_time_to: '',
        room_number: '',
        credit_hours: '',
        max_marks: '100',
        passing_marks: '33',
      });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to add subject', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject_id || !formData.max_marks) {
      showToast('Subject and max marks are required', 'error');
      return;
    }
    createMutation.mutate({
      exam_id: exam.id,
      subject_id: Number(formData.subject_id),
      exam_date: formData.exam_date || undefined,
      exam_time_from: formData.exam_time_from || undefined,
      exam_time_to: formData.exam_time_to || undefined,
      room_number: formData.room_number || undefined,
      credit_hours: formData.credit_hours ? Number(formData.credit_hours) : undefined,
      max_marks: Number(formData.max_marks),
      passing_marks: formData.passing_marks ? Number(formData.passing_marks) : undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Subject - ${exam.name}`}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            Subject <span className="required">*</span>
          </label>
          <select
            value={formData.subject_id}
            onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
            required
          >
            <option value="">Select Subject</option>
            {subjects?.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name} {subject.code && `(${subject.code})`}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Exam Date</label>
            <input
              type="date"
              value={formData.exam_date}
              onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Room Number</label>
            <input
              type="text"
              value={formData.room_number}
              onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Time From</label>
            <input
              type="time"
              value={formData.exam_time_from}
              onChange={(e) => setFormData({ ...formData, exam_time_from: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Time To</label>
            <input
              type="time"
              value={formData.exam_time_to}
              onChange={(e) => setFormData({ ...formData, exam_time_to: e.target.value })}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>
              Max Marks <span className="required">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.max_marks}
              onChange={(e) => setFormData({ ...formData, max_marks: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Passing Marks</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.passing_marks}
              onChange={(e) => setFormData({ ...formData, passing_marks: e.target.value })}
            />
          </div>
        </div>
        {exam.exam_type === 'gpa' && (
          <div className="form-group">
            <label>Credit Hours</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.credit_hours}
              onChange={(e) => setFormData({ ...formData, credit_hours: e.target.value })}
            />
          </div>
        )}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>
            {createMutation.isLoading ? 'Adding...' : 'Add Subject'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

interface EnterMarksModalProps {
  exam: Exam;
  examSubjectId: number;
  isOpen: boolean;
  onClose: () => void;
}

const EnterMarksModal = ({ exam, examSubjectId, isOpen, onClose }: EnterMarksModalProps) => {
  const [marksRecords, setMarksRecords] = useState<Record<number, { marks: string; note: string }>>({});
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: examDetails } = useQuery(
    ['exam', exam.id],
    () => examinationsService.getExamById(exam.id),
    { enabled: isOpen }
  );

  const { data: existingMarks } = useQuery(
    ['exam-marks', exam.id, examSubjectId],
    () => examinationsService.getExamMarks({ exam_id: exam.id, exam_subject_id: examSubjectId }),
    { enabled: isOpen && !!examSubjectId }
  );

  useEffect(() => {
    if (existingMarks && examDetails?.students) {
      const records: Record<number, { marks: string; note: string }> = {};
      examDetails.students.forEach((student) => {
        const existingMark = existingMarks.find((m) => m.student_id === student.student_id);
        records[student.student_id] = {
          marks: existingMark?.marks_obtained?.toString() || '',
          note: existingMark?.note || '',
        };
      });
      setMarksRecords(records);
    }
  }, [existingMarks, examDetails]);

  const submitMutation = useMutation(examinationsService.submitExamMarks, {
    onSuccess: () => {
      queryClient.invalidateQueries(['exam-marks', exam.id, examSubjectId]);
      showToast('Marks submitted successfully', 'success');
      onClose();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to submit marks', 'error');
    },
  });

  const handleSubmit = () => {
    const subject = examDetails?.subjects?.find((s) => s.id === examSubjectId);
    if (!subject) {
      showToast('Subject not found', 'error');
      return;
    }

    const records = Object.entries(marksRecords)
      .filter(([_, data]) => data.marks !== '')
      .map(([studentId, data]) => ({
        student_id: Number(studentId),
        marks_obtained: Number(data.marks),
        note: data.note || undefined,
      }));

    if (records.length === 0) {
      showToast('Please enter at least one mark', 'error');
      return;
    }

    submitMutation.mutate({
      exam_id: exam.id,
      exam_subject_id: examSubjectId,
      marks_records: records,
    });
  };

  const subject = examDetails?.subjects?.find((s) => s.id === examSubjectId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Enter Marks - ${subject?.subject_name || ''}`} size="large">
      <div className="enter-marks-modal">
        {subject && (
          <div style={{ marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-md)', background: 'var(--gray-50)', borderRadius: 'var(--border-radius)' }}>
            <strong>Max Marks:</strong> {subject.max_marks} | <strong>Passing Marks:</strong> {subject.passing_marks}
          </div>
        )}
        {examDetails?.students && examDetails.students.length > 0 ? (
          <div className="marks-entry-table" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Marks Obtained</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {examDetails.students.map((student) => (
                  <tr key={student.student_id}>
                    <td>{student.admission_no}</td>
                    <td>
                      {student.first_name} {student.last_name}
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={subject?.max_marks || 100}
                        value={marksRecords[student.student_id]?.marks || ''}
                        onChange={(e) =>
                          setMarksRecords({
                            ...marksRecords,
                            [student.student_id]: {
                              ...marksRecords[student.student_id],
                              marks: e.target.value,
                            },
                          })
                        }
                        style={{ width: '100px' }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={marksRecords[student.student_id]?.note || ''}
                        onChange={(e) =>
                          setMarksRecords({
                            ...marksRecords,
                            [student.student_id]: {
                              ...marksRecords[student.student_id],
                              note: e.target.value,
                            },
                          })
                        }
                        placeholder="Optional note"
                        style={{ width: '200px' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No students assigned to this exam</div>
        )}
        <div className="form-actions" style={{ marginTop: 'var(--spacing-lg)' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={submitMutation.isLoading}
          >
            {submitMutation.isLoading ? 'Submitting...' : 'Submit Marks'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Marksheet Preview Modal Component
interface MarksheetPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: any[];
  examId: number;
  templateId: number;
}

const MarksheetPreviewModal = ({ isOpen, onClose, students, examId, templateId }: MarksheetPreviewModalProps) => {
  const [template, setTemplate] = useState<MarksheetTemplate | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    if (isOpen && examId && templateId) {
      loadData();
    }
  }, [isOpen, examId, templateId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load template
      const templates = await examinationsService.getMarksheetTemplates();
      const selectedTemplate = templates.find(t => t.id === templateId);
      setTemplate(selectedTemplate || null);

      // Load exam details
      const examDetails = await examinationsService.getExamById(examId);
      setExam(examDetails);

      // Load exam marks for all students
      const marksData = await examinationsService.getExamMarks({ exam_id: examId });

      // Load full student data with marks
      const fullStudentsData = await Promise.all(
        students.map(async (student) => {
          try {
            const studentDetails = await studentsService.getStudentById(String(student.student_id || student.id));
            const studentMarks = marksData.filter((m: any) => m.student_id === (student.student_id || student.id));
            return {
              ...studentDetails.data,
              marks: studentMarks,
            };
          } catch {
            return {
              ...student,
              marks: marksData.filter((m: any) => m.student_id === (student.student_id || student.id)),
            };
          }
        })
      );
      setStudentsData(fullStudentsData);
    } catch (error) {
      console.error('Error loading marksheet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Marksheet Preview" size="large">
      <div className="marksheet-preview-container">
        {isLoading ? (
          <div className="loading">Loading marksheets...</div>
        ) : template && exam ? (
          <div className="marksheets-print-view">
            {studentsData.map((student, index) => (
              <MarksheetComponent
                key={student.id || index}
                student={student}
                exam={exam}
                template={template}
              />
            ))}
          </div>
        ) : (
          <div className="error-state">Failed to load template or exam data</div>
        )}
        <div className="marksheet-actions" style={{ marginTop: 'var(--spacing-lg)', textAlign: 'center' }}>
          <button className="btn-primary" onClick={() => window.print()}>
            🖨️ Print
          </button>
          <button className="btn-secondary" onClick={onClose} style={{ marginLeft: 'var(--spacing-sm)' }}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Individual Marksheet Component
interface MarksheetComponentProps {
  student: any;
  exam: Exam;
  template: MarksheetTemplate;
}

const MarksheetComponent = ({ student, exam, template }: MarksheetComponentProps) => {
  // Replace variables in text
  const replaceVariables = (text: string): string => {
    if (!text) return '';
    let result = text;
    const variables: Record<string, string> = {
      student_name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
      admission_no: student.admission_no || '',
      roll_no: student.roll_no || '',
      exam_roll_no: student.roll_no || '',
      class: student.class_name || '',
      section: student.section_name || '',
      session: exam.session_name || '',
      exam_name: exam.name || '',
      exam_group: exam.exam_group_name || '',
      father_name: student.father_name || '',
      mother_name: student.mother_name || '',
      guardian_name: student.guardian_name || student.father_name || '',
      date_of_birth: student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '',
      gender: student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : '',
      blood_group: student.blood_group || '',
      address: student.current_address || student.permanent_address || '',
      phone: student.student_mobile || student.father_phone || '',
      email: student.email || '',
    };

    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, variables[key]);
    });
    return result;
  };

  // Calculate totals and percentage
  const marks = student.marks || [];
  const totalMarks = marks.reduce((sum: number, m: any) => sum + (m.marks_obtained || 0), 0);
  const maxMarks = marks.reduce((sum: number, m: any) => sum + (m.max_marks || 0), 0);
  const percentage = maxMarks > 0 ? ((totalMarks / maxMarks) * 100).toFixed(2) : '0.00';

  const cardStyle: React.CSSProperties = {
    width: `${template.body_width || 800}px`,
    minHeight: `${(template.header_height || 100) + (template.body_height || 600) + (template.footer_height || 50)}px`,
    border: '2px solid #000',
    margin: '0 auto 20px',
    padding: '20px',
    backgroundColor: template.background_image ? 'transparent' : '#fff',
    backgroundImage: template.background_image ? `url(${template.background_image})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    pageBreakAfter: 'always',
  };

  return (
    <div className="marksheet" style={cardStyle}>
      {/* Header */}
      {(template.header_left_text || template.header_center_text || template.header_right_text) && (
        <div
          className="marksheet-header"
          style={{
            height: `${template.header_height || 100}px`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #000',
            marginBottom: '20px',
            paddingBottom: '10px',
          }}
        >
          <div style={{ flex: 1, textAlign: 'left' }}>
            {template.header_left_text && <div>{replaceVariables(template.header_left_text)}</div>}
          </div>
          <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>
            {template.header_center_text && <div>{replaceVariables(template.header_center_text)}</div>}
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            {template.header_right_text && <div>{replaceVariables(template.header_right_text)}</div>}
          </div>
        </div>
      )}

      {/* Title */}
      {(template as any).title && (
        <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '20px', fontWeight: 'bold', textDecoration: 'underline' }}>
          {replaceVariables((template as any).title)}
        </div>
      )}

      {/* Body */}
      <div
        className="marksheet-body"
        style={{
          minHeight: `${template.body_height || 600}px`,
        }}
      >
        {/* Student Info Section */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            {template.body_text && (
              <div style={{ whiteSpace: 'pre-line', lineHeight: '1.8' }}>
                {replaceVariables(template.body_text)}
              </div>
            )}
          </div>
          {template.show_student_photo && (() => {
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

            const photoUrl = getPhotoUrl(student.photo);

            return (
              <div style={{ width: '150px', textAlign: 'center' }}>
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={student.first_name}
                    style={{
                      width: '100%',
                      height: `${template.photo_height || 100}px`,
                      objectFit: 'cover',
                      border: '2px solid #000',
                      borderRadius: '4px',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: `${template.photo_height || 100}px`,
                      border: '2px solid #000',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f0f0f0',
                    }}
                  >
                    No Photo
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Marks Table */}
        {exam.subjects && exam.subjects.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginTop: '15px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Subject</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Max Marks</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Passing Marks</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Marks Obtained</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {exam.subjects.map((subject: any, idx: number) => {
                  const subjectMark = marks.find((m: any) => m.exam_subject_id === subject.id);
                  return (
                    <tr key={subject.id || idx}>
                      <td style={{ border: '1px solid #000', padding: '8px' }}>
                        {subject.subject_name || '-'} {subject.subject_code && `(${subject.subject_code})`}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                        {subject.max_marks || '-'}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                        {subject.passing_marks || '-'}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                        {subjectMark ? subjectMark.marks_obtained : '-'}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                        {subjectMark?.grade || '-'}
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>Total:</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{maxMarks}</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>-</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{totalMarks}</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{percentage}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      {(template.footer_left_text || template.footer_center_text || template.footer_right_text) && (
        <div
          className="marksheet-footer"
          style={{
            height: `${template.footer_height || 50}px`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: '2px solid #000',
            marginTop: '20px',
            paddingTop: '10px',
          }}
        >
          <div style={{ flex: 1, textAlign: 'left' }}>
            {template.footer_left_text && <div>{replaceVariables(template.footer_left_text)}</div>}
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            {template.footer_center_text && <div>{replaceVariables(template.footer_center_text)}</div>}
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            {template.footer_right_text && <div>{replaceVariables(template.footer_right_text)}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Examinations;

