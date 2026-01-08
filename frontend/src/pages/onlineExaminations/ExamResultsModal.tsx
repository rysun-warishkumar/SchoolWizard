import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { onlineExaminationsService } from '../../services/api/onlineExaminationsService';
import { academicsService } from '../../services/api/academicsService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import './ExamResultsModal.css';

interface ExamResultsModalProps {
  exam: any;
  isOpen: boolean;
  onClose: () => void;
}

const ExamResultsModal: React.FC<ExamResultsModalProps> = ({ exam, isOpen, onClose }) => {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: classes = [] } = useQuery('classes', () => academicsService.getClasses().then(res => res.data));
  const { data: sections = [] } = useQuery(
    ['sections', selectedClassId],
    () => academicsService.getSections(selectedClassId ? Number(selectedClassId) : undefined).then(res => res.data),
    { enabled: !!selectedClassId }
  );

  const { data: resultsData, isLoading, refetch } = useQuery(
    ['exam-results', exam.id, selectedClassId, selectedSectionId],
    () => onlineExaminationsService.getExamResults(exam.id, {
      class_id: selectedClassId ? Number(selectedClassId) : undefined,
      section_id: selectedSectionId ? Number(selectedSectionId) : undefined,
    }),
    { enabled: isOpen && !!exam }
  );

  const { data: studentResultData, isLoading: loadingStudentResult } = useQuery(
    ['student-exam-result', exam.id, selectedStudentId],
    () => onlineExaminationsService.getStudentExamResult(exam.id, selectedStudentId!),
    { enabled: isOpen && !!exam && selectedStudentId !== null }
  );

  const publishMutation = useMutation(
    (is_published: boolean) => onlineExaminationsService.publishExamResults(exam.id, is_published),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['exam-results', exam.id]);
        showToast('Result publication status updated successfully', 'success');
        refetch();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update publication status', 'error');
      },
    }
  );

  const handlePublishToggle = () => {
    if (resultsData?.exam?.is_result_published) {
      publishMutation.mutate(false);
    } else {
      publishMutation.mutate(true);
    }
  };

  const handleViewStudentResult = (studentId: number) => {
    setSelectedStudentId(studentId);
  };

  const handleCloseStudentResult = () => {
    setSelectedStudentId(null);
  };

  if (!isOpen || !exam) return null;

  // Show student detailed result
  if (selectedStudentId && studentResultData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Student Exam Result" size="xlarge">
        <div className="student-result-detail">
          <button className="btn-back" onClick={handleCloseStudentResult}>
            ← Back to Results
          </button>
          <StudentResultDetail resultData={studentResultData} />
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Exam Results: ${exam.name}`} size="xlarge">
      <div className="exam-results-container">
        {/* Filters and Actions */}
        <div className="results-header">
          <div className="results-filters">
            <div className="form-group">
              <label>Filter by Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedSectionId('');
                }}
              >
                <option value="">All Classes</option>
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Filter by Section</label>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                disabled={!selectedClassId}
              >
                <option value="">All Sections</option>
                {sections.map((sec: any) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="results-actions">
            <button
              className={`btn-publish ${resultsData?.exam?.is_result_published ? 'published' : 'unpublished'}`}
              onClick={handlePublishToggle}
              disabled={publishMutation.isLoading}
            >
              {publishMutation.isLoading
                ? 'Updating...'
                : resultsData?.exam?.is_result_published
                ? 'Unpublish Results'
                : 'Publish Results'}
            </button>
          </div>
        </div>

        {/* Results Summary */}
        {resultsData?.exam && (
          <div className="results-summary">
            <div className="summary-item">
              <label>Total Students:</label>
              <span>{resultsData.total_students || 0}</span>
            </div>
            <div className="summary-item">
              <label>Status:</label>
              <span className={resultsData.exam.is_result_published ? 'published' : 'unpublished'}>
                {resultsData.exam.is_result_published ? 'Published' : 'Not Published'}
              </span>
            </div>
          </div>
        )}

        {/* Results Table */}
        {isLoading ? (
          <div className="loading">Loading results...</div>
        ) : resultsData?.results && resultsData.results.length > 0 ? (
          <div className="results-table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Roll No</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Obtained Marks</th>
                  <th>Total Marks</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resultsData.results.map((result: any) => (
                  <tr key={result.id}>
                    <td>
                      <span className="rank-badge">{result.rank}</span>
                    </td>
                    <td>{result.admission_no}</td>
                    <td>{`${result.first_name} ${result.last_name || ''}`}</td>
                    <td>{result.roll_no || '-'}</td>
                    <td>{result.class_name || '-'}</td>
                    <td>{result.section_name || '-'}</td>
                    <td className={(Number(result.obtained_marks) || 0) >= (Number(result.passing_marks) || 0) ? 'passed' : 'failed'}>
                      {Number(result.obtained_marks || 0).toFixed(2)}
                    </td>
                    <td>{Number(result.total_marks || exam.total_marks || 0)}</td>
                    <td className={(Number(result.percentage) || 0) >= ((Number(result.passing_marks) || 0) / (Number(result.total_marks || exam.total_marks) || 1)) * 100 ? 'passed' : 'failed'}>
                      {Number(result.percentage || 0).toFixed(2)}%
                    </td>
                    <td>
                      <span className={`status-badge ${(Number(result.obtained_marks) || 0) >= (Number(result.passing_marks) || 0) ? 'passed' : 'failed'}`}>
                        {(Number(result.obtained_marks) || 0) >= (Number(result.passing_marks) || 0) ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-view-detail"
                        onClick={() => handleViewStudentResult(result.student_id)}
                      >
                        View Details
                      </button>
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
    </Modal>
  );
};

// Student Result Detail Component
const StudentResultDetail: React.FC<{ resultData: any }> = ({ resultData }) => {
  const { student, attempt, statistics, questions } = resultData;

  return (
    <div className="student-result-detail-content">
      {/* Student Info */}
      <div className="student-info-card">
        <h3>Student Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Name:</label>
            <span>{`${student.first_name} ${student.last_name || ''}`}</span>
          </div>
          <div className="info-item">
            <label>Admission No:</label>
            <span>{student.admission_no}</span>
          </div>
          <div className="info-item">
            <label>Roll No:</label>
            <span>{student.roll_no || '-'}</span>
          </div>
          <div className="info-item">
            <label>Class:</label>
            <span>{student.class_name || '-'}</span>
          </div>
          <div className="info-item">
            <label>Section:</label>
            <span>{student.section_name || '-'}</span>
          </div>
        </div>
      </div>

      {/* Result Summary */}
      <div className="result-summary-card">
        <h3>Result Summary</h3>
        <div className="result-stats">
          <div className="stat-box">
            <label>Total Marks</label>
            <span className="stat-value">{attempt.total_marks}</span>
          </div>
          <div className="stat-box">
            <label>Obtained Marks</label>
            <span className={`stat-value ${attempt.is_passed ? 'passed' : 'failed'}`}>
              {Number(attempt.obtained_marks || 0).toFixed(2)}
            </span>
          </div>
          <div className="stat-box">
            <label>Percentage</label>
            <span className={`stat-value ${attempt.is_passed ? 'passed' : 'failed'}`}>
              {Number(attempt.percentage || 0).toFixed(2)}%
            </span>
          </div>
          <div className="stat-box">
            <label>Status</label>
            <span className={`stat-value ${attempt.is_passed ? 'passed' : 'failed'}`}>
              {attempt.is_passed ? 'Passed' : 'Failed'}
            </span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="statistics-grid">
        <div className="stat-card correct">
          <div className="stat-label">Correct Answers</div>
          <div className="stat-number">{statistics.correct_answers}</div>
        </div>
        <div className="stat-card wrong">
          <div className="stat-label">Wrong Answers</div>
          <div className="stat-number">{statistics.wrong_answers}</div>
        </div>
        <div className="stat-card not-answered">
          <div className="stat-label">Not Answered</div>
          <div className="stat-number">{statistics.not_answered}</div>
        </div>
        <div className="stat-card total">
          <div className="stat-label">Total Questions</div>
          <div className="stat-number">{statistics.total_questions}</div>
        </div>
      </div>

      {/* Questions Review */}
      <div className="questions-review-section">
        <h3>Question Review</h3>
        <div className="questions-list">
          {questions.map((question: any, index: number) => (
            <div key={question.id} className={`question-item ${question.is_correct ? 'correct' : 'wrong'}`}>
              <div className="question-header">
                <span className="question-num">Q{index + 1}</span>
                <span className={`question-status ${question.is_correct ? 'correct' : 'wrong'}`}>
                  {question.is_correct ? '✓ Correct' : '✗ Wrong'}
                </span>
                <span className="question-marks">
                  {question.marks_obtained}/{question.marks} marks
                </span>
              </div>
              <div className="question-content">
                <p>{question.question}</p>
                <div className="options-list">
                  {['A', 'B', 'C', 'D', 'E'].map((opt) => {
                    const optionKey = `option_${opt.toLowerCase()}` as keyof typeof question;
                    const optionValue = question[optionKey];
                    if (!optionValue) return null;
                    const isCorrect = question.correct_answer === opt;
                    const isSelected = question.selected_answer === opt;
                    return (
                      <div
                        key={opt}
                        className={`option ${isCorrect ? 'correct' : ''} ${isSelected ? 'selected' : ''}`}
                      >
                        <span className="option-label">{opt}.</span>
                        <span className="option-text">{optionValue}</span>
                        {isCorrect && <span className="badge correct-badge">Correct</span>}
                        {isSelected && !isCorrect && <span className="badge wrong-badge">Your Answer</span>}
                      </div>
                    );
                  })}
                </div>
                {!question.selected_answer && (
                  <div className="not-answered">Not Answered</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExamResultsModal;

