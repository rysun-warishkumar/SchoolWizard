import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { attendanceService } from '../../services/api/attendanceService';
import { studentsService } from '../../services/api/studentsService';
import ChildSelector from '../../components/parent/ChildSelector';
import './ParentLeave.css';

const ParentLeave = () => {
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

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

  const { data: leaveData, isLoading } = useQuery(
    ['parent-leave-requests', selectedChildId],
    () =>
      attendanceService.getStudentLeaveRequests({
        student_id: selectedChildId || undefined,
      }),
    { enabled: !!selectedChildId, refetchOnWindowFocus: false }
  );

  const leaveRequests = leaveData?.data || [];

  if (children.length === 0) {
    return <div className="empty-state">No children found</div>;
  }

  return (
    <div className="parent-leave-page">
      <div className="leave-header">
        <h1>Leave Requests</h1>
        <p className="page-subtitle">View leave requests for your child</p>
      </div>

      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onSelectChild={setSelectedChildId}
      />

      {selectedChild && (
        <div className="leave-content">
          {isLoading ? (
            <div className="loading">Loading leave requests...</div>
          ) : leaveRequests.length === 0 ? (
            <div className="empty-state">No leave requests found</div>
          ) : (
            <div className="leave-requests-list">
              {leaveRequests.map((request) => (
                <div key={request.id} className="leave-request-card">
                  <div className="leave-request-header">
                    <div>
                      <h3>Leave Request #{request.id}</h3>
                      <p className="leave-date">
                        Leave Date: {new Date(request.leave_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`status-badge ${request.status}`}>{request.status}</span>
                  </div>
                  <div className="leave-request-details">
                    <div className="detail-item">
                      <label>Apply Date:</label>
                      <span>{new Date(request.apply_date).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <label>Leave Type:</label>
                      <span>{request.leave_type}</span>
                    </div>
                    <div className="detail-item full-width">
                      <label>Reason:</label>
                      <span>{request.reason}</span>
                    </div>
                    {request.approved_by_name && (
                      <div className="detail-item">
                        <label>Approved By:</label>
                        <span>{request.approved_by_name}</span>
                      </div>
                    )}
                    {request.approved_at && (
                      <div className="detail-item">
                        <label>Approved At:</label>
                        <span>{new Date(request.approved_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    {request.rejection_reason && (
                      <div className="detail-item full-width">
                        <label>Rejection Reason:</label>
                        <span className="rejection-reason">{request.rejection_reason}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default ParentLeave;

