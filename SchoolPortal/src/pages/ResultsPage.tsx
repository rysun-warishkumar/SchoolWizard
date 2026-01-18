import React, { useState, useEffect } from 'react';
import { websiteService } from '../services/api';
import './ResultsPage.css';

interface Exam {
  id: number;
  name: string;
  exam_group_name: string;
  session_name: string;
  exam_type: string;
}

interface StudentResult {
  student_id: number;
  admission_no: string;
  roll_no?: string;
  exam_roll_number?: string;
  first_name: string;
  last_name?: string;
  subjects: Array<{
    subject_id: number;
    subject_name: string;
    subject_code?: string;
    marks_obtained: number;
    max_marks: number;
    is_pass: boolean;
  }>;
  total_marks_obtained: number;
  total_max_marks: number;
  percentage: number;
  grade?: string;
  grade_point?: number;
  is_pass: boolean;
}

const ResultsPage: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchData, setSearchData] = useState({
    roll_number: '',
    date_of_birth: '',
  });
  const [result, setResult] = useState<StudentResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [resultFound, setResultFound] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const data = await websiteService.getPublishedExams();
      setExams(data);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExamClick = (exam: Exam) => {
    setSelectedExam(exam);
    setShowSearchModal(true);
    setSearchData({ roll_number: '', date_of_birth: '' });
    setResult(null);
    setSearchError('');
    setResultFound(false);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchData.roll_number || !searchData.date_of_birth) {
      setSearchError('Please enter both Roll Number and Date of Birth');
      return;
    }

    if (!selectedExam) return;

    setSearching(true);
    setSearchError('');
    setResultFound(false);

    try {
      const data = await websiteService.getStudentResult({
        exam_id: selectedExam.id,
        roll_number: searchData.roll_number,
        date_of_birth: searchData.date_of_birth,
      });

      if (data) {
        setResult(data);
        setResultFound(true);
      } else {
        setSearchError('Result not found. Please check your Roll Number and Date of Birth.');
      }
    } catch (error: any) {
      console.error('Error fetching result:', error);
      setSearchError(
        error.response?.data?.message || 'Failed to fetch result. Please try again.'
      );
    } finally {
      setSearching(false);
    }
  };

  const closeModal = () => {
    setShowSearchModal(false);
    setSelectedExam(null);
    setSearchData({ roll_number: '', date_of_birth: '' });
    setResult(null);
    setSearchError('');
    setResultFound(false);
  };

  return (
    <div className="results-page">
      <div className="results-header">
        <h1>Check Your Results</h1>
        <p>Select an examination to view your results</p>
      </div>

      {loading ? (
        <div className="loading-state">
          <p>Loading examinations...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="empty-state">
          <p>No published results available at the moment.</p>
        </div>
      ) : (
        <div className="exams-grid">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="exam-card"
              onClick={() => handleExamClick(exam)}
            >
              <div className="exam-card-icon">
                <span>📋</span>
              </div>
              <div className="exam-card-content">
                <h3>{exam.name}</h3>
                <p className="exam-group">{exam.exam_group_name}</p>
                <p className="exam-session">{exam.session_name}</p>
              </div>
              <div className="exam-card-arrow">
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search Modal */}
      {showSearchModal && selectedExam && (
        <div className="results-modal-overlay" onClick={closeModal}>
          <div className="results-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Search Your Result</h2>
              <button className="close-btn" onClick={closeModal}>
                ✕
              </button>
            </div>

            {!resultFound ? (
              <form onSubmit={handleSearchSubmit} className="search-form">
                <div className="exam-info">
                  <p className="exam-title">{selectedExam.name}</p>
                  <p className="exam-meta">
                    {selectedExam.exam_group_name} • {selectedExam.session_name}
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="roll_number">Roll Number *</label>
                  <input
                    id="roll_number"
                    type="text"
                    placeholder="Enter your roll number"
                    value={searchData.roll_number}
                    onChange={(e) =>
                      setSearchData({ ...searchData, roll_number: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="date_of_birth">Date of Birth *</label>
                  <input
                    id="date_of_birth"
                    type="date"
                    value={searchData.date_of_birth}
                    onChange={(e) =>
                      setSearchData({ ...searchData, date_of_birth: e.target.value })
                    }
                    required
                  />
                </div>

                {searchError && <div className="error-message">{searchError}</div>}

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeModal}
                    disabled={searching}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={searching}
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </form>
            ) : result ? (
              <div className="result-display">
                <div className="result-header">
                  <div className="student-info">
                    <h3>
                      {result.first_name} {result.last_name || ''}
                    </h3>
                    <p className="roll-no">Roll No: {result.exam_roll_number || result.roll_no || '-'}</p>
                  </div>
                  <div className={`status-badge ${result.is_pass ? 'pass' : 'fail'}`}>
                    {result.is_pass ? 'PASS' : 'FAIL'}
                  </div>
                </div>

                <div className="result-summary">
                  <div className="summary-item">
                    <span className="label">Total Marks</span>
                    <span className="value">
                      {Number(result.total_marks_obtained).toFixed(2)} / {Number(result.total_max_marks).toFixed(2)}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Percentage</span>
                    <span className="value">{Number(result.percentage).toFixed(2)}%</span>
                  </div>
                  {result.grade && (
                    <div className="summary-item">
                      <span className="label">Grade</span>
                      <span className="value">{result.grade}</span>
                    </div>
                  )}
                  {result.grade_point && (
                    <div className="summary-item">
                      <span className="label">Grade Point</span>
                      <span className="value">{Number(result.grade_point).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="result-table-wrapper">
                  <table className="result-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Code</th>
                        <th>Obtained</th>
                        <th>Maximum</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.subjects.map((subject, index) => (
                        <tr key={index} className={subject.is_pass ? '' : 'fail-row'}>
                          <td className="subject-name">{subject.subject_name}</td>
                          <td>{subject.subject_code || '-'}</td>
                          <td className={subject.is_pass ? '' : 'fail-marks'}>
                            {Number(subject.marks_obtained).toFixed(2)}
                          </td>
                          <td>{Number(subject.max_marks).toFixed(2)}</td>
                          <td>
                            <span className={`badge ${subject.is_pass ? 'pass' : 'fail'}`}>
                              {subject.is_pass ? 'Pass' : 'Fail'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="form-actions">
                  <button className="btn-primary" onClick={closeModal}>
                    Close
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setResult(null);
                      setResultFound(false);
                      setSearchData({ roll_number: '', date_of_birth: '' });
                      setSearchError('');
                    }}
                  >
                    Search Another
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
