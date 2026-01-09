import { useState } from 'react';
import { useQuery } from 'react-query';
import { homeworkService } from '../../services/api/homeworkService';
import { studentsService } from '../../services/api/studentsService';
import { apiClient } from '../../services/api/apiClient';
import './StudentHomework.css';

const StudentHomework = () => {
  const [statusFilter, setStatusFilter] = useState('');

  const { data: student } = useQuery('my-student-profile', () => studentsService.getMyProfile(), {
    refetchOnWindowFocus: false,
  });

  const handleDownloadAttachment = async (attachmentUrl: string) => {
    try {
      if (!attachmentUrl) return;

      // If it's an external URL, open directly
      if (attachmentUrl.startsWith('http://') || attachmentUrl.startsWith('https://')) {
        window.open(attachmentUrl, '_blank');
        return;
      }

      // For internal files, construct the correct URL
      // Backend serves static files at /uploads (root level), not /api/v1/uploads
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
      const serverBaseUrl = baseUrl.replace('/api/v1', ''); // Remove /api/v1 to get server root
      
      const url = attachmentUrl.startsWith('/') 
        ? `${serverBaseUrl}${attachmentUrl}`
        : `${serverBaseUrl}/${attachmentUrl}`;

      // Use API client to download with auth token
      const response = await apiClient.get(url, {
        responseType: 'blob',
      });

      // Create blob URL and trigger download
      const blob = new Blob([response.data]);
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // Extract filename from URL
      const filename = attachmentUrl.split('/').pop() || 'homework-attachment';
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      console.error('Error downloading attachment:', error);
      // Fallback: try opening in new tab with correct URL
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
      const serverBaseUrl = baseUrl.replace('/api/v1', '');
      const url = attachmentUrl.startsWith('http') 
        ? attachmentUrl 
        : `${serverBaseUrl}${attachmentUrl.startsWith('/') ? attachmentUrl : '/' + attachmentUrl}`;
      window.open(url, '_blank');
    }
  };

  const { data: homework = [], isLoading } = useQuery(
    ['student-homework', student?.class_id, student?.section_id, student?.id, statusFilter],
    () =>
      homeworkService.getHomework({
        class_id: student?.class_id,
        section_id: student?.section_id,
      }),
    { enabled: !!student?.class_id && !!student?.section_id && !!student?.id, refetchOnWindowFocus: false }
  );

  const filteredHomework = homework.filter((hw) => {
    const studentEvaluation = hw.evaluations?.find((e: any) => e.student_id === student?.id);
    const hasEvaluation = !!studentEvaluation;
    const isCompleted = studentEvaluation?.is_completed === true;
    const submissionDate = new Date(hw.submission_date);
    const isOverdue = submissionDate < new Date() && !isCompleted;
    
    if (statusFilter === 'pending') {
      return !hasEvaluation && submissionDate >= new Date();
    }
    if (statusFilter === 'completed') {
      return isCompleted;
    }
    if (statusFilter === 'overdue') {
      return isOverdue;
    }
    return true;
  });

  if (isLoading) {
    return <div className="loading">Loading homework...</div>;
  }

  return (
    <div className="student-homework-page">
      <div className="homework-header">
        <h1>Homework</h1>
        <div className="homework-filters">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Homework</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div className="homework-content">
        {filteredHomework.length === 0 ? (
          <div className="empty-state">No homework found</div>
        ) : (
          <div className="homework-list">
            {filteredHomework.map((hw) => {
              const submissionDate = new Date(hw.submission_date);
              // Check if this student's evaluation exists
              // For students, the backend should already filter evaluations to only their own
              // So we can just take the first evaluation if any exist, or check by student_id
              const studentEvaluation = (hw.evaluations && hw.evaluations.length > 0)
                ? (hw.evaluations.find((e: any) => e.student_id === student?.id) || hw.evaluations[0])
                : null;
              
              // Determine status from evaluation
              let homeworkStatus: 'pending' | 'completed' | 'in_progress' | 'overdue' = 'pending';
              let cleanRemarks = '';
              
              if (studentEvaluation) {
                // Check is_completed (can be 0/1 from DB or boolean)
                const isCompletedFlag = studentEvaluation.is_completed !== undefined 
                  ? (Number(studentEvaluation.is_completed) === 1 || studentEvaluation.is_completed === true)
                  : false;
                
                if (isCompletedFlag) {
                  homeworkStatus = 'completed';
                } else {
                  // Check if status is in remarks
                  const remarks = studentEvaluation.remarks || '';
                  if (remarks.includes('[Status: In Progress]') || remarks.includes('Status: In Progress')) {
                    homeworkStatus = 'in_progress';
                  } else if (remarks.includes('[Status: Pending]') || remarks.includes('Status: Pending')) {
                    homeworkStatus = 'pending';
                  } else {
                    // If is_completed is 0 but no status in remarks, default to pending
                    homeworkStatus = 'pending';
                  }
                }
                
                // Clean remarks by removing status prefix
                if (studentEvaluation.remarks) {
                  cleanRemarks = studentEvaluation.remarks.replace(/\[Status: [^\]]+\]\s*/gi, '').trim();
                }
              } else {
                // No evaluation - check if overdue
                if (submissionDate < new Date()) {
                  homeworkStatus = 'overdue';
                } else {
                  homeworkStatus = 'pending';
                }
              }
              
              const isCompleted = homeworkStatus === 'completed';
              const isOverdue = homeworkStatus === 'overdue';
              const isInProgress = homeworkStatus === 'in_progress';

              return (
                <div key={hw.id} className={`homework-card ${isOverdue ? 'overdue' : ''}`}>
                  <div className="homework-header-card">
                    <div>
                      <h3>{hw.title}</h3>
                      <p className="subject">{hw.subject_name}</p>
                    </div>
                    <div className="homework-status">
                      {isCompleted ? (
                        <span className="status-badge completed">Completed</span>
                      ) : isInProgress ? (
                        <span className="status-badge" style={{ background: '#ff9800', color: 'white' }}>In Progress</span>
                      ) : isOverdue ? (
                        <span className="status-badge overdue">Overdue</span>
                      ) : (
                        <span className="status-badge pending">Pending</span>
                      )}
                    </div>
                  </div>

                  {hw.description && (
                    <div className="homework-description">
                      <p>{hw.description}</p>
                    </div>
                  )}

                  <div className="homework-details">
                    <div className="detail-item">
                      <label>Homework Date:</label>
                      <span>{new Date(hw.homework_date).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <label>Submission Date:</label>
                      <span className={isOverdue ? 'overdue-text' : ''}>
                        {submissionDate.toLocaleDateString()}
                      </span>
                    </div>
                    {hw.attachment_url && (
                      <div className="detail-item">
                        <label>Attachment:</label>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (hw.attachment_url) {
                              handleDownloadAttachment(hw.attachment_url);
                            }
                          }}
                          className="attachment-link"
                          style={{ cursor: 'pointer' }}
                        >
                          Download
                        </a>
                      </div>
                    )}
                  </div>

                  {studentEvaluation && (
                    <div className="homework-evaluation">
                      <h4>Evaluation</h4>
                      <div className="evaluation-details">
                        <div className="detail-item">
                          <label>Status:</label>
                          <span className={isCompleted ? 'completed-text' : isInProgress ? 'in-progress-text' : 'pending-text'}>
                            {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Pending'}
                          </span>
                        </div>
                        {studentEvaluation.marks !== null && studentEvaluation.marks !== undefined && (
                          <div className="detail-item">
                            <label>Marks:</label>
                            <span>{studentEvaluation.marks}</span>
                          </div>
                        )}
                        {cleanRemarks && (
                          <div className="detail-item full-width">
                            <label>Remarks:</label>
                            <span style={{ whiteSpace: 'pre-wrap' }}>
                              {cleanRemarks}
                            </span>
                          </div>
                        )}
                        {studentEvaluation.evaluation_date && (
                          <div className="detail-item">
                            <label>Evaluated On:</label>
                            <span>{new Date(studentEvaluation.evaluation_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentHomework;

