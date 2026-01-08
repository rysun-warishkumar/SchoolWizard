import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { attendanceService } from '../../services/api/attendanceService';
import { studentsService } from '../../services/api/studentsService';
import { useToast } from '../../contexts/ToastContext';
import './StudentLeave.css';

const StudentLeave = () => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    leave_date: '',
    leave_type: 'casual' as 'sick' | 'casual' | 'emergency' | 'other',
    reason: '',
  });

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: student } = useQuery('my-student-profile', () => studentsService.getMyProfile(), {
    refetchOnWindowFocus: false,
  });

  const { data: leaveData, isLoading } = useQuery(
    ['student-leave-requests', student?.id],
    () =>
      attendanceService.getStudentLeaveRequests({
        student_id: student?.id,
      }),
    { enabled: !!student?.id, refetchOnWindowFocus: false }
  );

  const leaveRequests = leaveData?.data || [];

  const createLeaveMutation = useMutation(
    (data: {
      student_id: number;
      class_id: number;
      section_id: number;
      session_id: number;
      apply_date: string;
      leave_date: string;
      leave_type: 'sick' | 'casual' | 'emergency' | 'other';
      reason: string;
    }) => attendanceService.createStudentLeaveRequest(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('student-leave-requests');
        setShowModal(false);
        setFormData({ leave_date: '', leave_type: 'casual', reason: '' });
        showToast('Leave request submitted successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to submit leave request', 'error');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    const currentDate = new Date().toISOString().split('T')[0];

    createLeaveMutation.mutate({
      student_id: student.id,
      class_id: student.class_id,
      section_id: student.section_id,
      session_id: student.session_id,
      apply_date: currentDate,
      leave_date: formData.leave_date,
      leave_type: formData.leave_type,
      reason: formData.reason,
    });
  };

  if (isLoading) {
    return <div className="loading">Loading leave requests...</div>;
  }

  return (
    <div className="student-leave-page">
      <div className="leave-header">
        <h1>Apply Leave</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          Apply for Leave
        </button>
      </div>

      <div className="leave-content">
        {leaveRequests.length === 0 ? (
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Apply for Leave</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="leave-form">
              <div className="form-group">
                <label>Leave Date *</label>
                <input
                  type="date"
                  value={formData.leave_date}
                  onChange={(e) => setFormData({ ...formData, leave_date: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="form-group">
                <label>Leave Type *</label>
                <select
                  value={formData.leave_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      leave_type: e.target.value as 'sick' | 'casual' | 'emergency' | 'other',
                    })
                  }
                  required
                >
                  <option value="casual">Casual</option>
                  <option value="sick">Sick</option>
                  <option value="emergency">Emergency</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Reason *</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                  rows={4}
                  placeholder="Please provide a reason for leave"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={createLeaveMutation.isLoading}>
                  {createLeaveMutation.isLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLeave;

