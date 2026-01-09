import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from 'react-query';
import { onlineExaminationsService } from '../../services/api/onlineExaminationsService';
import { useToast } from '../../contexts/ToastContext';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import './ExamAttempt.css';

interface Question {
  id: number;
  question: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  option_e?: string;
  marks: number;
  display_order: number;
  selected_answer: string;
}

interface ExamAttemptProps {
  attemptData: {
    attempt_id: number;
    exam: {
      id: number;
      name: string;
      subject_name: string;
      duration_minutes: number;
      total_marks: number;
      instructions?: string;
    };
    questions: Question[];
    started_at: string;
    remaining_seconds: number;
  };
  studentName: string;
  onExamComplete: () => void;
  onTerminate: () => void;
}

const ExamAttempt: React.FC<ExamAttemptProps> = ({
  attemptData,
  studentName,
  onExamComplete,
  onTerminate,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, string>>(
    new Map(attemptData.questions.map((q) => [q.id, q.selected_answer]))
  );
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [remainingSeconds, setRemainingSeconds] = useState(attemptData.remaining_seconds);
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [windowBlurCount, setWindowBlurCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);

  const { showToast } = useToast();
  const examContainerRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastBlurTimeRef = useRef<number>(0);

  const saveAnswerMutation = useMutation(
    ({ questionId, answer }: { questionId: number; answer: string }) =>
      onlineExaminationsService.saveAnswer(attemptData.attempt_id, questionId, answer),
    {
      onError: (error: any) => {
        console.error('Error saving answer:', error);
      },
    }
  );

  const submitMutation = useMutation(
    () => onlineExaminationsService.submitExam(attemptData.attempt_id),
    {
      onSuccess: () => {
        setIsSubmitting(false);
        exitFullscreen();
        showToast('Exam submitted successfully!', 'success');
        onExamComplete();
      },
      onError: (error: any) => {
        setIsSubmitting(false);
        showToast(error.response?.data?.message || 'Failed to submit exam', 'error');
      },
    }
  );

  const terminateMutation = useMutation(
    () => onlineExaminationsService.terminateExam(attemptData.attempt_id),
    {
      onSuccess: () => {
        setIsTerminating(false);
        exitFullscreen();
        showToast('Exam terminated due to window switch', 'error');
        onTerminate();
      },
      onError: (error: any) => {
        setIsTerminating(false);
        showToast(error.response?.data?.message || 'Failed to terminate exam', 'error');
      },
    }
  );

  // Timer countdown
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          // Time's up - auto submit
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Auto-save answers every 30 seconds
  useEffect(() => {
    autoSaveIntervalRef.current = setInterval(() => {
      const currentQuestion = attemptData.questions[currentQuestionIndex];
      if (currentQuestion && answers.get(currentQuestion.id)) {
        saveAnswerMutation.mutate({
          questionId: currentQuestion.id,
          answer: answers.get(currentQuestion.id) || '',
        });
      }
    }, 30000);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [currentQuestionIndex, answers]);

  // Fullscreen on mount
  useEffect(() => {
    enterFullscreen();
    return () => {
      exitFullscreen();
    };
  }, []);

  // Window blur/focus detection
  useEffect(() => {
    const handleBlur = () => {
      const now = Date.now();
      // Prevent multiple rapid blur events
      if (now - lastBlurTimeRef.current < 1000) {
        return;
      }
      lastBlurTimeRef.current = now;

      setWindowBlurCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= 1) {
          // First blur - show warning
          setShowTerminateConfirm(true);
        }
        return newCount;
      });
    };

    const handleFocus = () => {
      // Reset blur count if user returns quickly
      if (windowBlurCount > 0) {
        // User returned, but we still show the warning
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [windowBlurCount]);

  // Prevent context menu, copy, paste, etc.
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    const handlePaste = (e: ClipboardEvent) => e.preventDefault();
    const handleCut = (e: ClipboardEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const enterFullscreen = async () => {
    try {
      const element = examContainerRef.current || document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (error) {
      console.error('Error entering fullscreen:', error);
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      newAnswers.set(questionId, answer);
      return newAnswers;
    });

    // Auto-save answer
    saveAnswerMutation.mutate({ questionId, answer });
  };

  const handleSaveAndNext = () => {
    if (currentQuestionIndex < attemptData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleClear = () => {
    const currentQuestion = attemptData.questions[currentQuestionIndex];
    if (currentQuestion) {
      handleAnswerChange(currentQuestion.id, '');
    }
  };

  const handleSaveAndMarkForReview = () => {
    const currentQuestion = attemptData.questions[currentQuestionIndex];
    if (currentQuestion) {
      setMarkedForReview((prev) => new Set(prev).add(currentQuestion.id));
      if (currentQuestionIndex < attemptData.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    }
  };

  const handleMarkForReviewAndNext = () => {
    const currentQuestion = attemptData.questions[currentQuestionIndex];
    if (currentQuestion) {
      setMarkedForReview((prev) => new Set(prev).add(currentQuestion.id));
      if (currentQuestionIndex < attemptData.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < attemptData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleQuestionClick = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleSubmit = () => {
    if (window.confirm('Are you sure you want to submit the exam? You cannot change your answers after submission.')) {
      setIsSubmitting(true);
      submitMutation.mutate();
    }
  };

  const handleAutoSubmit = () => {
    setIsSubmitting(true);
    submitMutation.mutate();
  };

  const handleTerminateConfirm = () => {
    setShowTerminateConfirm(false);
    setIsTerminating(true);
    terminateMutation.mutate();
  };

  const getQuestionStatus = (questionId: number): 'not-visited' | 'not-answered' | 'answered' | 'marked' | 'answered-marked' => {
    const isAnswered = answers.get(questionId) && answers.get(questionId) !== '';
    const isMarked = markedForReview.has(questionId);

    if (isAnswered && isMarked) return 'answered-marked';
    if (isMarked) return 'marked';
    if (isAnswered) return 'answered';
    // Check if question has been visited (answered or marked)
    if (isAnswered || isMarked) return 'not-answered';
    return 'not-visited';
  };

  const currentQuestion = attemptData.questions[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === attemptData.questions.length - 1;
  const currentAnswer = answers.get(currentQuestion.id) || '';

  const answeredCount = Array.from(answers.values()).filter((a) => a && a !== '').length;
  const notAnsweredCount = attemptData.questions.length - answeredCount;
  const markedCount = markedForReview.size;

  return (
    <div ref={examContainerRef} className="exam-attempt-container">
      {/* Header */}
      <div className="exam-attempt-header">
        <div className="exam-header-left">
          <div className="candidate-info">
            <span className="info-label">Candidate Name:</span>
            <span className="info-value">{studentName}</span>
          </div>
          <div className="exam-info">
            <span className="info-label">Exam Name:</span>
            <span className="info-value">{attemptData.exam.name}</span>
          </div>
          <div className="subject-info">
            <span className="info-label">Subject Name:</span>
            <span className="info-value">{attemptData.exam.subject_name}</span>
          </div>
        </div>
        <div className="exam-header-right">
          <div className="timer">
            <span className="timer-label">Remaining Time:</span>
            <span className={`timer-value ${remainingSeconds < 300 ? 'timer-warning' : ''}`}>
              {formatTime(remainingSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="exam-attempt-content">
        {/* Question Area */}
        <div className="exam-question-area">
          <div className="question-header">
            <h3>Question {currentQuestionIndex + 1}</h3>
            <span className="question-marks">({currentQuestion.marks} marks)</span>
          </div>

          <div className="question-text">{currentQuestion.question}</div>

          <div className="question-options">
            {currentQuestion.option_a && (
              <label className={`option-label ${currentAnswer === 'A' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value="A"
                  checked={currentAnswer === 'A'}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                />
                <span className="option-text">A. {currentQuestion.option_a}</span>
              </label>
            )}
            {currentQuestion.option_b && (
              <label className={`option-label ${currentAnswer === 'B' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value="B"
                  checked={currentAnswer === 'B'}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                />
                <span className="option-text">B. {currentQuestion.option_b}</span>
              </label>
            )}
            {currentQuestion.option_c && (
              <label className={`option-label ${currentAnswer === 'C' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value="C"
                  checked={currentAnswer === 'C'}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                />
                <span className="option-text">C. {currentQuestion.option_c}</span>
              </label>
            )}
            {currentQuestion.option_d && (
              <label className={`option-label ${currentAnswer === 'D' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value="D"
                  checked={currentAnswer === 'D'}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                />
                <span className="option-text">D. {currentQuestion.option_d}</span>
              </label>
            )}
            {currentQuestion.option_e && (
              <label className={`option-label ${currentAnswer === 'E' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value="E"
                  checked={currentAnswer === 'E'}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                />
                <span className="option-text">E. {currentQuestion.option_e}</span>
              </label>
            )}
          </div>

          {/* Action Buttons */}
          <div className="question-actions">
            <button className="btn-save-next" onClick={handleSaveAndNext} disabled={isLastQuestion}>
              SAVE & NEXT
            </button>
            <button className="btn-clear" onClick={handleClear}>
              CLEAR
            </button>
            <button className="btn-save-mark" onClick={handleSaveAndMarkForReview} disabled={isLastQuestion}>
              SAVE & MARK FOR REVIEW
            </button>
            <button className="btn-mark-next" onClick={handleMarkForReviewAndNext} disabled={isLastQuestion}>
              MARK FOR REVIEW & NEXT
            </button>
          </div>

          {/* Navigation */}
          <div className="question-navigation">
            <button className="btn-nav" onClick={handlePrevious} disabled={isFirstQuestion}>
              &lt;&lt; BACK
            </button>
            <button className="btn-submit" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'SUBMITTING...' : 'SUBMIT'}
            </button>
            <button className="btn-nav" onClick={handleNext} disabled={isLastQuestion}>
              NEXT &gt;&gt;
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="exam-sidebar">
          <div className="status-legend">
            <div className="legend-item">
              <div className="legend-box not-visited">
                {attemptData.questions.filter((q: Question) => {
                  const status = getQuestionStatus(q.id);
                  return status === 'not-visited';
                }).length}
              </div>
              <span>Not Visited</span>
            </div>
            <div className="legend-item">
              <div className="legend-box not-answered">{notAnsweredCount}</div>
              <span>Not Answered</span>
            </div>
            <div className="legend-item">
              <div className="legend-box answered">{answeredCount}</div>
              <span>Answered</span>
            </div>
            <div className="legend-item">
              <div className="legend-box marked">{markedCount}</div>
              <span>Marked for Review</span>
            </div>
            <div className="legend-item">
              <div className="legend-box answered-marked">
                {Array.from(markedForReview).filter((id) => answers.get(id) && answers.get(id) !== '').length}
              </div>
              <span>Answered & Marked for Review</span>
            </div>
          </div>

          <div className="question-grid">
            {attemptData.questions.map((question, index) => {
              const status = getQuestionStatus(question.id);
              const isCurrent = index === currentQuestionIndex;
              return (
                <button
                  key={question.id}
                  className={`question-number ${status} ${isCurrent ? 'current' : ''}`}
                  onClick={() => handleQuestionClick(index)}
                >
                  {String(index + 1).padStart(2, '0')}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Terminate Confirmation Modal */}
      <ConfirmationModal
        isOpen={showTerminateConfirm}
        onClose={() => setShowTerminateConfirm(false)}
        onConfirm={handleTerminateConfirm}
        title="Window Switch Detected"
        message="You have switched to another window. This is a violation of exam rules. The exam will be terminated. Are you sure you want to continue?"
        confirmText="Yes, Terminate Exam"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default ExamAttempt;

