import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { onlineExaminationsService } from '../../services/api/onlineExaminationsService';
import { studentsService } from '../../services/api/studentsService';
import ChildSelector from '../../components/parent/ChildSelector';
import './ParentOnlineExam.css';

const ParentOnlineExam = () => {
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

  const { data: examsData, isLoading } = useQuery(
    ['parent-online-exams', selectedChild?.class_id, selectedChild?.section_id, statusFilter],
    () =>
      onlineExaminationsService.getOnlineExams({
        class_id: selectedChild?.class_id,
        session_id: selectedChild?.session_id,
        is_published: true,
      }),
    { enabled: !!selectedChild?.class_id && !!selectedChild?.section_id, refetchOnWindowFocus: false }
  );

  const exams = examsData || [];

  const filteredExams = statusFilter
    ? exams.filter((exam) => {
        const startDate = new Date((exam as any).start_date || exam.exam_date || '');
        const endDate = new Date((exam as any).end_date || '');
        const now = new Date();

        if (statusFilter === 'scheduled') return startDate > now;
        if (statusFilter === 'ongoing') return startDate <= now && endDate >= now;
        if (statusFilter === 'completed') return endDate < now;
        return true;
      })
    : exams;

  if (children.length === 0) {
    return <div className="empty-state">No children found</div>;
  }

  return (
    <div className="parent-online-exam-page">
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

      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onSelectChild={setSelectedChildId}
      />

      {selectedChild && (
        <div className="exam-content">
          {isLoading ? (
            <div className="loading">Loading exams...</div>
          ) : filteredExams.length === 0 ? (
            <div className="empty-state">No exams available</div>
          ) : (
            <div className="exams-list">
              {filteredExams.map((exam) => {
                const startDate = new Date((exam as any).start_date || exam.exam_date || '');
                const endDate = new Date((exam as any).end_date || exam.exam_date || '');
                const now = new Date();
                const isUpcoming = startDate > now;
                const isOngoing = startDate <= now && endDate >= now;
                const isCompleted = endDate < now;

                return (
                  <div key={exam.id} className="exam-card">
                    <div className="exam-header-card">
                      <div>
                        <h3>{(exam as any).exam_title || exam.name || (exam as any).title || 'Online Exam'}</h3>
                        <p className="subject-name">{exam.subject_name}</p>
                      </div>
                      <div className="exam-status">
                        {isUpcoming && <span className="status-badge scheduled">Scheduled</span>}
                        {isOngoing && <span className="status-badge ongoing">Ongoing</span>}
                        {isCompleted && <span className="status-badge completed">Completed</span>}
                      </div>
                    </div>

                    <div className="exam-details">
                      <div className="detail-item">
                        <label>Exam Date:</label>
                        <span>{exam.exam_date ? new Date(exam.exam_date).toLocaleDateString() : '-'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Time:</label>
                        <span>
                          {exam.exam_time_from ? new Date(exam.exam_time_from).toLocaleTimeString() : '-'} -{' '}
                          {exam.exam_time_to ? new Date(exam.exam_time_to).toLocaleTimeString() : '-'}
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

export default ParentOnlineExam;

