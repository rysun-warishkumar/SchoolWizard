import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { hrService } from '../../services/api/hrService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import './StaffLeave.css';

const StaffLeave = () => {
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    leave_type_id: '',
    apply_date: new Date().toISOString().split('T')[0],
    leave_date: '',
    reason: '',
    note: '',
  });

  const { data: staffProfile } = useQuery('my-staff-profile', () => hrService.getMyStaffProfile(), {
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
  });

  const { data: leaveTypesData } = useQuery('leave-types', () => hrService.getLeaveTypes(), {
    refetchOnWindowFocus: false,
  });

  const { data: leaveRequestsData, isLoading } = useQuery(
    ['staff-leave-requests', staffProfile?.data?.id],
    () => hrService.getLeaveRequests({ staff_id: staffProfile?.data?.id }),
    {
      enabled: !!staffProfile?.data?.id,
      refetchOnWindowFocus: false,
    }
  );

  const leaveTypes = leaveTypesData?.data || [];
  const leaveRequests = leaveRequestsData?.data || [];

  const createLeaveMutation = useMutation(
    (data: any) => hrService.createLeaveRequest(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('staff-leave-requests');
        setShowModal(false);
        setFormData({
          leave_type_id: '',
          apply_date: new Date().toISOString().split('T')[0],
          leave_date: '',
          reason: '',
          note: '',
        });
        showToast('Leave request submitted successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to submit leave request', 'error');
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffProfile?.data) {
      showToast('Staff profile not found', 'error');
      return;
    }

    createLeaveMutation.mutate({
      staff_id: staffProfile.data.id,
      leave_type_id: Number(formData.leave_type_id),
      apply_date: formData.apply_date,
      leave_date: formData.leave_date,
      reason: formData.reason,
      note: formData.note || null,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="status-badge approved">Approved</span>;
      case 'rejected':
        return <span className="status-badge rejected">Rejected</span>;
      case 'pending':
      default:
        return <span className="status-badge pending">Pending</span>;
    }
  };

  if (isLoading) {
    return <div className="loading">Loading leave requests...</div>;
  }

  return (
    <div className="staff-leave-page">
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
            {leaveRequests.map((request: any) => (
              <div key={request.id} className="leave-request-card">
                <div className="leave-request-header">
                  <div>
                    <h3>Leave Request #{request.id}</h3>
                    <p className="leave-date">
                      Leave Date: {new Date(request.leave_date).toLocaleDateString()}
                    </p>
                    <p className="apply-date">
                      Applied On: {new Date(request.apply_date).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                <div className="leave-request-body">
                  <div className="leave-info">
                    <div className="info-item">
                      <label>Leave Type:</label>
                      <span>{request.leave_type_name || '-'}</span>
                    </div>
                    <div className="info-item">
                      <label>Reason:</label>
                      <span>{request.reason || '-'}</span>
                    </div>
                    {request.note && (
                      <div className="info-item">
                        <label>Note:</label>
                        <span>{request.note}</span>
                      </div>
                    )}
                    {request.approved_by_name && (
                      <div className="info-item">
                        <label>Approved By:</label>
                        <span>{request.approved_by_name}</span>
                      </div>
                    )}
                    {request.approved_at && (
                      <div className="info-item">
                        <label>Approved At:</label>
                        <span>{new Date(request.approved_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Apply for Leave</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Leave Type *</label>
                <select
                  value={formData.leave_type_id}
                  onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
                  required
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map((type: any) => (
                    <option key={type.id} value={type.id}>
                      {type.name} {type.max_days ? `(Max: ${type.max_days} days)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Apply Date *</label>
                <input
                  type="date"
                  value={formData.apply_date}
                  onChange={(e) => setFormData({ ...formData, apply_date: e.target.value })}
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label>Leave Date *</label>
                <input
                  type="date"
                  value={formData.leave_date}
                  onChange={(e) => setFormData({ ...formData, leave_date: e.target.value })}
                  required
                  min={formData.apply_date}
                />
              </div>

              <div className="form-group">
                <label>Reason *</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                  rows={3}
                  placeholder="Enter reason for leave"
                />
              </div>

              <div className="form-group">
                <label>Note (Optional)</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={2}
                  placeholder="Additional notes"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>
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

export default StaffLeave;

