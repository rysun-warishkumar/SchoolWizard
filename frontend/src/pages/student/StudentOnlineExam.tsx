import { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { onlineExaminationsService } from '../../services/api/onlineExaminationsService';
import { studentsService } from '../../services/api/studentsService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import ExamAttempt from './ExamAttempt';
import ExamResultModal from './ExamResultModal';
import './StudentOnlineExam.css';

const StudentOnlineExam = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [attemptData, setAttemptData] = useState<any>(null);
  const [isAttempting, setIsAttempting] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [loadingResult, setLoadingResult] = useState(false);

  const { showToast } = useToast();

  const { data: student } = useQuery('my-student-profile', () => studentsService.getMyProfile(), {
    refetchOnWindowFocus: false,
  });

  const { data: examsData, isLoading } = useQuery(
    ['my-online-exams', statusFilter],
    () => onlineExaminationsService.getMyOnlineExams(),
    { enabled: !!student, refetchOnWindowFocus: false }
  );

  const startExamMutation = useMutation(
    (examId: number) => onlineExaminationsService.startExamAttempt(examId),
    {
      onSuccess: (data) => {
        setAttemptData(data);
        setShowInstructions(false);
        setIsAttempting(true);
      },
      onError: (error: any) => {
        console.error('Error starting exam:', error);
        let errorMessage = 'Failed to start exam';
        
        // Check for network/connection errors
        if (
          error.code === 'ERR_NETWORK' || 
          error.code === 'ECONNREFUSED' ||
          error.message?.includes('ERR_CONNECTION_REFUSED') ||
          error.message?.includes('Network Error') ||
          !error.response
        ) {
          errorMessage = 'Unable to connect to server. Please check if the backend server is running.';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.status === 400) {
          errorMessage = 'Invalid request. Please try again.';
        } else if (error.response?.status === 401) {
          errorMessage = 'You are not authorized to start this exam.';
        } else if (error.response?.status === 404) {
          errorMessage = 'Exam not found or not accessible.';
        } else if (error.response?.status === 403) {
          errorMessage = 'You do not have permission to start this exam.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        showToast(errorMessage, 'error');
      },
    }
  );

  const exams = examsData || [];
  
  // Filter by status on frontend
  const filteredExams = statusFilter
    ? exams.filter((exam) => {
        // const examDate = exam.exam_date ? new Date(exam.exam_date) : null;
        const examTimeFrom = exam.exam_time_from && exam.exam_date 
          ? new Date(`${exam.exam_date}T${exam.exam_time_from}`) 
          : null;
        const examTimeTo = exam.exam_time_to && exam.exam_date 
          ? new Date(`${exam.exam_date}T${exam.exam_time_to}`) 
          : null;
        const now = new Date();
        
        if (statusFilter === 'scheduled') {
          return examTimeFrom ? examTimeFrom > now : false;
        }
        if (statusFilter === 'ongoing') {
          return examTimeFrom && examTimeTo 
            ? examTimeFrom <= now && examTimeTo >= now 
            : false;
        }
        if (statusFilter === 'completed') {
          return examTimeTo ? examTimeTo < now : false;
        }
        return true;
      })
    : exams;

  const handleStartExam = (exam: any) => {
    setSelectedExam(exam);
    setShowInstructions(true);
  };

  const handleStartAfterInstructions = () => {
    if (selectedExam) {
      startExamMutation.mutate(selectedExam.id);
    }
  };

  const handleExamComplete = () => {
    setIsAttempting(false);
    setAttemptData(null);
    setSelectedExam(null);
    // Refetch exams to update status
    window.location.reload();
  };

  const handleExamTerminate = () => {
    setIsAttempting(false);
    setAttemptData(null);
    setSelectedExam(null);
  };

  const handleViewResult = async (examId: number) => {
    setLoadingResult(true);
    try {
      const result = await onlineExaminationsService.getMyExamResult(examId);
      setResultData(result);
      setShowResultModal(true);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to load result', 'error');
    } finally {
      setLoadingResult(false);
    }
  };

  const formatTime = (timeString: string | null, dateString: string | null): string => {
    if (!timeString || !dateString) return '-';
    try {
      const time = new Date(`${dateString}T${timeString}`);
      if (isNaN(time.getTime())) return '-';
      return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '-';
    }
  };

  if (isLoading) {
    return <div className="loading">Loading exams...</div>;
  }

  // Show exam attempt interface
  if (isAttempting && attemptData && student) {
    return (
      <ExamAttempt
        attemptData={attemptData}
        studentName={`${student.first_name} ${student.last_name || ''}`}
        onExamComplete={handleExamComplete}
        onTerminate={handleExamTerminate}
      />
    );
  }

  return (
    <div className="student-online-exam-page">
      <div className="exam-header">
        <h1>Online Exam</h1>
        <div className="exam-filters">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Exams</option>
            <option value="scheduled">Scheduled</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="exam-content">
        {filteredExams.length === 0 ? (
          <div className="empty-state">No exams available</div>
        ) : (
          <div className="exams-list">
            {filteredExams.map((exam) => {
              const examDate = exam.exam_date ? new Date(exam.exam_date) : null;
              const now = new Date();
              
              // Parse exam times - handle both TIME format (HH:MM:SS) and full datetime
              let examTimeFrom: Date | null = null;
              let examTimeTo: Date | null = null;
              
              if (exam.exam_date && exam.exam_time_from) {
                try {
                  const dateStr = exam.exam_date ? (typeof exam.exam_date === 'string' ? exam.exam_date : String(exam.exam_date)) : '';
                  const timeStr = typeof exam.exam_time_from === 'string' 
                    ? exam.exam_time_from.split('T').pop()?.split('.')[0] || exam.exam_time_from
                    : exam.exam_time_from ? String(exam.exam_time_from) : '';
                  examTimeFrom = new Date(`${dateStr}T${timeStr}`);
                  if (isNaN(examTimeFrom.getTime())) examTimeFrom = null;
                } catch {
                  examTimeFrom = null;
                }
              }
              
              if (exam.exam_date && exam.exam_time_to) {
                try {
                  const dateStr = (exam.exam_date && typeof exam.exam_date === 'object' && 'toISOString' in (exam.exam_date as any))
                    ? (exam.exam_date as any).toISOString().split('T')[0] 
                    : String(exam.exam_date || '');
                  const timeStr = typeof exam.exam_time_to === 'string' 
                    ? exam.exam_time_to.split('T').pop()?.split('.')[0] || exam.exam_time_to
                    : exam.exam_time_to;
                  examTimeTo = new Date(`${dateStr}T${timeStr}`);
                  if (isNaN(examTimeTo.getTime())) examTimeTo = null;
                } catch {
                  examTimeTo = null;
                }
              }
              
              // Determine status for display
              let isUpcoming = false;
              let isOngoing = false;
              let isCompleted = false;
              
              if (examTimeFrom && examTimeTo) {
                // Has time constraints
                isUpcoming = examTimeFrom > now;
                isOngoing = examTimeFrom <= now && examTimeTo >= now;
                isCompleted = examTimeTo < now;
              } else if (examDate) {
                // Only has date, no time constraints
                const examDateOnly = new Date(examDate);
                examDateOnly.setHours(0, 0, 0, 0);
                const todayOnly = new Date(now);
                todayOnly.setHours(0, 0, 0, 0);
                
                if (examDateOnly > todayOnly) {
                  isUpcoming = true;
                } else if (examDateOnly < todayOnly) {
                  isCompleted = true;
                } else {
                  // Date is today - allow starting
                  isOngoing = true;
                }
              } else {
                // No date/time constraints - show as ongoing
                isOngoing = true;
              }
              
              // Check if student has submitted the exam (using type assertion for extended properties)
              const examWithAttempts = exam as any;
              const hasSubmitted = examWithAttempts.has_submitted_attempt > 0;
              const canViewResult = hasSubmitted && examWithAttempts.is_result_published;
              // Show "Start Exam" button if exam is published and not yet submitted
              const canStartExam = exam.is_published && !hasSubmitted;

              return (
                <div key={exam.id} className="exam-card">
                  <div className="exam-header-card">
                    <div>
                      <h3>{exam.name || (examWithAttempts.exam_title as string)}</h3>
                      <p className="subject-name">{exam.subject_name}</p>
                    </div>
                    <div className="exam-status">
                      {hasSubmitted && <span className="status-badge completed">Completed</span>}
                      {!hasSubmitted && isUpcoming && <span className="status-badge scheduled">Scheduled</span>}
                      {!hasSubmitted && isOngoing && <span className="status-badge ongoing">Ongoing</span>}
                      {!hasSubmitted && isCompleted && <span className="status-badge completed">Completed</span>}
                    </div>
                  </div>

                  <div className="exam-details">
                    <div className="detail-item">
                      <label>Exam Date:</label>
                      <span>{exam.exam_date ? (() => {
                        const dateStr = String(exam.exam_date).split('T')[0];
                        const [year, month, day] = dateStr.split('-');
                        return month && day ? `${month}/${day}/${year}` : dateStr;
                      })() : '-'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Time:</label>
                      <span>
                        {formatTime(exam.exam_time_from || null, exam.exam_date ? String(exam.exam_date) : null)} - {formatTime(exam.exam_time_to || null, exam.exam_date ? String(exam.exam_date) : null)}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Duration:</label>
                      <span>{exam.duration_minutes} minutes</span>
                    </div>
                    {exam.total_marks && (
                      <div className="detail-item">
                        <label>Total Marks:</label>
                        <span>{exam.total_marks}</span>
                      </div>
                    )}
                    {exam.passing_marks && (
                      <div className="detail-item">
                        <label>Passing Marks:</label>
                        <span>{exam.passing_marks}</span>
                      </div>
                    )}
                    {exam.instructions && (
                      <div className="detail-item full-width">
                        <label>Instructions:</label>
                        <span>{exam.instructions}</span>
                      </div>
                    )}
                  </div>

                  <div className="exam-actions">
                    {canStartExam && (
                      <button 
                        className="btn-start-exam" 
                        onClick={() => handleStartExam(exam)}
                        disabled={startExamMutation.isLoading}
                      >
                        {startExamMutation.isLoading 
                          ? 'Starting...' 
                          : (exam as any).has_in_progress_attempt 
                            ? 'Resume Exam' 
                            : 'Start Exam'}
                      </button>
                    )}
                    {hasSubmitted && !canViewResult && (
                      <button className="btn-secondary" disabled>
                        Result Not Published
                      </button>
                    )}
                    {canViewResult && (
                      <button 
                        className="btn-view-result" 
                        onClick={() => handleViewResult(exam.id)}
                        disabled={loadingResult}
                      >
                        {loadingResult ? 'Loading...' : 'View Result'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Instructions Modal */}
      {selectedExam && (
        <Modal
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
          title="Exam Instructions"
          size="large"
        >
          <div className="exam-instructions">
            <div className="instructions-content">
              <h3>{selectedExam.name}</h3>
              <div className="instructions-details">
                <p><strong>Subject:</strong> {selectedExam.subject_name}</p>
                <p><strong>Duration:</strong> {selectedExam.duration_minutes} minutes</p>
                <p><strong>Total Marks:</strong> {selectedExam.total_marks}</p>
              </div>
              
              {selectedExam.instructions && (
                <div className="instructions-text">
                  <h4>Instructions:</h4>
                  <div className="instructions-body">
                    {selectedExam.instructions.split('\n').map((line: string, index: number) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="instructions-warnings">
                <h4>Important:</h4>
                <ul>
                  <li>Do not switch to another window or tab during the exam</li>
                  <li>The exam will automatically switch to fullscreen mode</li>
                  <li>Switching windows will terminate the exam</li>
                  <li>Answers are auto-saved every 30 seconds</li>
                  <li>The exam will auto-submit when time expires</li>
                </ul>
              </div>
            </div>

            <div className="instructions-actions">
              <button className="btn-secondary" onClick={() => setShowInstructions(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleStartAfterInstructions}
                disabled={startExamMutation.isLoading}
              >
                {startExamMutation.isLoading ? 'Starting...' : 'Start Exam'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Result Modal */}
      <ExamResultModal
        isOpen={showResultModal}
        onClose={() => {
          setShowResultModal(false);
          setResultData(null);
        }}
        resultData={resultData}
      />
    </div>
  );
};

export default StudentOnlineExam;

