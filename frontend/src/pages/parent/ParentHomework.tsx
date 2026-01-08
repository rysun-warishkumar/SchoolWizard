import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { homeworkService } from '../../services/api/homeworkService';
import { studentsService } from '../../services/api/studentsService';
import { apiClient } from '../../services/api/apiClient';
import ChildSelector from '../../components/parent/ChildSelector';
import './ParentHomework.css';

const ParentHomework = () => {
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: childrenData } = useQuery('my-children', () => studentsService.getMyChildren(), {
    refetchOnWindowFocus: false,
  });

  const children = childrenData?.data || [];

  React.useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const selectedChild = children.find((c) => c.id === selectedChildId);

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
    ['parent-homework', selectedChild?.class_id, selectedChild?.section_id, selectedChild?.id, statusFilter],
    () =>
      homeworkService.getHomework({
        class_id: selectedChild?.class_id,
        section_id: selectedChild?.section_id,
        student_id: selectedChild?.id,
      }),
    { enabled: !!selectedChild?.class_id && !!selectedChild?.section_id, refetchOnWindowFocus: false }
  );

  const filteredHomework = homework.filter((hw) => {
    // For parent view, check if the selected child's evaluation exists
    const childEvaluation = selectedChild ? hw.evaluations?.find((e: any) => e.student_id === selectedChild.id && e.is_completed) : null;
    
    if (statusFilter === 'pending') {
      const submissionDate = new Date(hw.submission_date);
      return submissionDate >= new Date() && !childEvaluation;
    }
    if (statusFilter === 'completed') {
      return !!childEvaluation;
    }
    if (statusFilter === 'overdue') {
      const submissionDate = new Date(hw.submission_date);
      return submissionDate < new Date() && !childEvaluation;
    }
    return true;
  });

  if (children.length === 0) {
    return <div className="empty-state">No children found</div>;
  }

  return (
    <div className="parent-homework-page">
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

      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onSelectChild={setSelectedChildId}
      />

      {selectedChild && (
        <div className="homework-content">
          {isLoading ? (
            <div className="loading">Loading homework...</div>
          ) : filteredHomework.length === 0 ? (
            <div className="empty-state">No homework found</div>
          ) : (
            <div className="homework-list">
              {filteredHomework.map((hw) => {
                const submissionDate = new Date(hw.submission_date);
                const isOverdue = submissionDate < new Date() && !hw.evaluations?.some((e) => e.is_completed);
                const isCompleted = hw.evaluations?.some((e) => e.is_completed);
                const evaluation = hw.evaluations?.find((e) => e.is_completed);

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
                              handleDownloadAttachment(hw.attachment_url);
                            }}
                            className="attachment-link"
                            style={{ cursor: 'pointer' }}
                          >
                            Download
                          </a>
                        </div>
                      )}
                    </div>

                    {evaluation && (
                      <div className="homework-evaluation">
                        <h4>Evaluation</h4>
                        <div className="evaluation-details">
                          <div className="detail-item">
                            <label>Status:</label>
                            <span className="completed-text">Completed</span>
                          </div>
                          {evaluation.marks !== null && (
                            <div className="detail-item">
                              <label>Marks:</label>
                              <span>{evaluation.marks}</span>
                            </div>
                          )}
                          {evaluation.remarks && (
                            <div className="detail-item full-width">
                              <label>Remarks:</label>
                              <span>{evaluation.remarks}</span>
                            </div>
                          )}
                          {evaluation.evaluation_date && (
                            <div className="detail-item">
                              <label>Evaluated On:</label>
                              <span>{new Date(evaluation.evaluation_date).toLocaleDateString()}</span>
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
      )}
    </div>
  );
};

export default ParentHomework;

