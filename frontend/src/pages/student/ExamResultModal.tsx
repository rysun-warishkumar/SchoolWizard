import React from 'react';
import Modal from '../../components/common/Modal';
import './ExamResultModal.css';

interface ExamResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  resultData: any;
}

const ExamResultModal: React.FC<ExamResultModalProps> = ({ isOpen, onClose, resultData }) => {
  if (!isOpen || !resultData) return null;

  const { attempt, statistics, questions } = resultData;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Exam Result: ${attempt.exam_name}`} size="xlarge">
      <div className="exam-result-container">
        {/* Result Summary */}
        <div className="result-summary">
          <div className="result-summary-card">
            <div className="result-header">
              <h2>{attempt.exam_name}</h2>
              <span className={`result-status ${attempt.is_passed ? 'passed' : 'failed'}`}>
                {attempt.is_passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
            <div className="result-stats-grid">
              <div className="stat-item">
                <label>Total Marks</label>
                <span className="stat-value">{attempt.total_marks}</span>
              </div>
              <div className="stat-item">
                <label>Obtained Marks</label>
                <span className={`stat-value ${attempt.is_passed ? 'passed' : 'failed'}`}>
                  {Number(attempt.obtained_marks || 0).toFixed(2)}
                </span>
              </div>
              <div className="stat-item">
                <label>Percentage</label>
                <span className={`stat-value ${attempt.is_passed ? 'passed' : 'failed'}`}>
                  {Number(attempt.percentage || 0).toFixed(2)}%
                </span>
              </div>
              <div className="stat-item">
                <label>Passing Marks</label>
                <span className="stat-value">{attempt.passing_marks}</span>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="statistics-cards">
            <div className="stat-card correct">
              <div className="stat-icon">✓</div>
              <div className="stat-info">
                <label>Correct Answers</label>
                <span className="stat-number">{statistics.correct_answers}</span>
              </div>
            </div>
            <div className="stat-card wrong">
              <div className="stat-icon">✗</div>
              <div className="stat-info">
                <label>Wrong Answers</label>
                <span className="stat-number">{statistics.wrong_answers}</span>
              </div>
            </div>
            <div className="stat-card not-answered">
              <div className="stat-icon">—</div>
              <div className="stat-info">
                <label>Not Answered</label>
                <span className="stat-number">{statistics.not_answered}</span>
              </div>
            </div>
            <div className="stat-card total">
              <div className="stat-icon">#</div>
              <div className="stat-info">
                <label>Total Questions</label>
                <span className="stat-number">{statistics.total_questions}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Questions Review */}
        <div className="questions-review">
          <h3>Question Review</h3>
          <div className="questions-list">
            {questions.map((question: any, index: number) => (
              <div key={question.id} className={`question-review-item ${question.is_correct ? 'correct' : 'wrong'}`}>
                <div className="question-header">
                  <span className="question-number">Q{index + 1}</span>
                  <span className={`question-status ${question.is_correct ? 'correct' : 'wrong'}`}>
                    {question.is_correct ? '✓ Correct' : '✗ Wrong'}
                  </span>
                  <span className="question-marks">
                    {question.marks_obtained}/{question.marks} marks
                  </span>
                </div>
                <div className="question-content">
                  <p className="question-text">{question.question}</p>
                  <div className="question-options">
                    {question.option_a && (
                      <div className={`option ${question.correct_answer === 'A' ? 'correct-answer' : ''} ${question.selected_answer === 'A' ? 'selected-answer' : ''}`}>
                        <span className="option-label">A.</span> {question.option_a}
                        {question.correct_answer === 'A' && <span className="correct-badge">Correct</span>}
                        {question.selected_answer === 'A' && question.correct_answer !== 'A' && <span className="wrong-badge">Your Answer</span>}
                      </div>
                    )}
                    {question.option_b && (
                      <div className={`option ${question.correct_answer === 'B' ? 'correct-answer' : ''} ${question.selected_answer === 'B' ? 'selected-answer' : ''}`}>
                        <span className="option-label">B.</span> {question.option_b}
                        {question.correct_answer === 'B' && <span className="correct-badge">Correct</span>}
                        {question.selected_answer === 'B' && question.correct_answer !== 'B' && <span className="wrong-badge">Your Answer</span>}
                      </div>
                    )}
                    {question.option_c && (
                      <div className={`option ${question.correct_answer === 'C' ? 'correct-answer' : ''} ${question.selected_answer === 'C' ? 'selected-answer' : ''}`}>
                        <span className="option-label">C.</span> {question.option_c}
                        {question.correct_answer === 'C' && <span className="correct-badge">Correct</span>}
                        {question.selected_answer === 'C' && question.correct_answer !== 'C' && <span className="wrong-badge">Your Answer</span>}
                      </div>
                    )}
                    {question.option_d && (
                      <div className={`option ${question.correct_answer === 'D' ? 'correct-answer' : ''} ${question.selected_answer === 'D' ? 'selected-answer' : ''}`}>
                        <span className="option-label">D.</span> {question.option_d}
                        {question.correct_answer === 'D' && <span className="correct-badge">Correct</span>}
                        {question.selected_answer === 'D' && question.correct_answer !== 'D' && <span className="wrong-badge">Your Answer</span>}
                      </div>
                    )}
                    {question.option_e && (
                      <div className={`option ${question.correct_answer === 'E' ? 'correct-answer' : ''} ${question.selected_answer === 'E' ? 'selected-answer' : ''}`}>
                        <span className="option-label">E.</span> {question.option_e}
                        {question.correct_answer === 'E' && <span className="correct-badge">Correct</span>}
                        {question.selected_answer === 'E' && question.correct_answer !== 'E' && <span className="wrong-badge">Your Answer</span>}
                      </div>
                    )}
                  </div>
                  {!question.selected_answer && (
                    <div className="not-answered-notice">Not Answered</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ExamResultModal;

