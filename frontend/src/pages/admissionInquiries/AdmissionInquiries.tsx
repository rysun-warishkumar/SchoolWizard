import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { admissionManagementService, AdmissionInquiry } from '../../services/api/admissionManagementService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import './AdmissionInquiries.css';

const AdmissionInquiries: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedInquiry, setSelectedInquiry] = useState<AdmissionInquiry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: 'pending', notes: '' });

  const { data: inquiries = [], isLoading } = useQuery(
    ['admission-inquiries', selectedStatus],
    () => admissionManagementService.getInquiries(selectedStatus || undefined),
    { refetchOnWindowFocus: false }
  );

  const updateStatusMutation = useMutation(
    ({ id, data }: { id: number; data: { status: string; notes?: string } }) =>
      admissionManagementService.updateInquiryStatus(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admission-inquiries');
        queryClient.invalidateQueries('admission-inquiries-count');
        showToast('Inquiry status updated successfully', 'success');
        setShowDetailModal(false);
        setSelectedInquiry(null);
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update status', 'error');
      },
    }
  );

  const deleteMutation = useMutation(admissionManagementService.deleteInquiry, {
    onSuccess: () => {
      queryClient.invalidateQueries('admission-inquiries');
      queryClient.invalidateQueries('admission-inquiries-count');
      showToast('Inquiry deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete inquiry', 'error');
    },
  });

  const handleView = (inquiry: AdmissionInquiry) => {
    setSelectedInquiry(inquiry);
    setStatusForm({ status: inquiry.status, notes: inquiry.notes || '' });
    setShowDetailModal(true);
  };

  const handleStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInquiry?.id) {
      updateStatusMutation.mutate({ id: selectedInquiry.id, data: statusForm });
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'badge-pending';
      case 'contacted':
        return 'badge-contacted';
      case 'approved':
        return 'badge-approved';
      case 'rejected':
        return 'badge-rejected';
      default:
        return '';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="admission-inquiries">
      <div className="page-header">
        <h1>Admission Inquiries</h1>
        <p>Manage and track admission inquiries from prospective students</p>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Filter by Status:</label>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="">All Inquiries</option>
            <option value="pending">Pending</option>
            <option value="contacted">Contacted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="inquiry-count">
          Total: <strong>{inquiries.length}</strong> inquiries
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading inquiries...</div>
      ) : inquiries.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-inbox"></i>
          <p>No admission inquiries found</p>
        </div>
      ) : (
        <div className="inquiries-table-container">
          <table className="inquiries-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Parent Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Grade</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id}>
                  <td>{inquiry.student_name}</td>
                  <td>{inquiry.parent_name}</td>
                  <td>{inquiry.email}</td>
                  <td>{inquiry.phone}</td>
                  <td>{inquiry.grade}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(inquiry.status)}`}>
                      {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                    </span>
                  </td>
                  <td>{formatDate(inquiry.created_at)}</td>
                  <td>
                    <button className="btn-view" onClick={() => handleView(inquiry)}>
                      <i className="fas fa-eye"></i> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedInquiry && (
        <Modal
          isOpen={showDetailModal}
          title="Admission Inquiry Details"
          onClose={() => {
            setShowDetailModal(false);
            setSelectedInquiry(null);
          }}
          size="large"
        >
          <div className="inquiry-detail">
            <div className="detail-section">
              <h3>Student Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Student Name:</label>
                  <span>{selectedInquiry.student_name}</span>
                </div>
                <div className="detail-item">
                  <label>Parent/Guardian Name:</label>
                  <span>{selectedInquiry.parent_name}</span>
                </div>
                <div className="detail-item">
                  <label>Email:</label>
                  <span>{selectedInquiry.email}</span>
                </div>
                <div className="detail-item">
                  <label>Phone:</label>
                  <span>{selectedInquiry.phone}</span>
                </div>
                <div className="detail-item">
                  <label>Grade Applying For:</label>
                  <span>{selectedInquiry.grade}</span>
                </div>
                <div className="detail-item">
                  <label>Previous School:</label>
                  <span>{selectedInquiry.previous_school || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>Address</h3>
              <p>{selectedInquiry.address}</p>
            </div>

            {selectedInquiry.message && (
              <div className="detail-section">
                <h3>Additional Information</h3>
                <p>{selectedInquiry.message}</p>
              </div>
            )}

            <div className="detail-section">
              <h3>Status & Notes</h3>
              <form onSubmit={handleStatusUpdate}>
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    value={statusForm.status}
                    onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    rows={4}
                    value={statusForm.notes}
                    onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                    placeholder="Add any notes or comments about this inquiry..."
                  />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowDetailModal(false)}>
                    Close
                  </button>
                  <button type="submit" className="btn-primary" disabled={updateStatusMutation.isLoading}>
                    {updateStatusMutation.isLoading ? 'Updating...' : 'Update Status'}
                  </button>
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this inquiry?')) {
                        deleteMutation.mutate(selectedInquiry.id!);
                        setShowDetailModal(false);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </form>
            </div>

            <div className="detail-section">
              <div className="meta-info">
                <p><strong>Submitted:</strong> {formatDate(selectedInquiry.created_at)}</p>
                {selectedInquiry.updated_at && selectedInquiry.updated_at !== selectedInquiry.created_at && (
                  <p><strong>Last Updated:</strong> {formatDate(selectedInquiry.updated_at)}</p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdmissionInquiries;

