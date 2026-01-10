import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { contactMessagesService, ContactMessage } from '../../services/api/contactMessagesService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import './ContactMessages.css';

const ContactMessages: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: 'new', notes: '' });

  const { data: messages = [], isLoading } = useQuery(
    ['contact-messages', selectedStatus],
    () => contactMessagesService.getMessages(selectedStatus || undefined),
    { refetchOnWindowFocus: false }
  );

  const updateStatusMutation = useMutation(
    ({ id, data }: { id: number; data: { status: string; notes?: string } }) =>
      contactMessagesService.updateMessageStatus(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('contact-messages');
        showToast('Message status updated successfully', 'success');
        setShowDetailModal(false);
        setSelectedMessage(null);
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update status', 'error');
      },
    }
  );

  const deleteMutation = useMutation(contactMessagesService.deleteMessage, {
    onSuccess: () => {
      queryClient.invalidateQueries('contact-messages');
      showToast('Message deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete message', 'error');
    },
  });

  const handleView = (message: ContactMessage) => {
    setSelectedMessage(message);
    setStatusForm({ status: message.status, notes: message.notes || '' });
    setShowDetailModal(true);
    
    // Mark as read if it's new
    if (message.status === 'new') {
      contactMessagesService.updateMessageStatus(message.id, { status: 'read' })
        .then(() => {
          queryClient.invalidateQueries('contact-messages');
        })
        .catch(() => {
          // Silently fail - not critical
        });
    }
  };

  const handleStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMessage?.id) {
      updateStatusMutation.mutate({ id: selectedMessage.id, data: statusForm });
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'new':
        return 'badge-new';
      case 'read':
        return 'badge-read';
      case 'replied':
        return 'badge-replied';
      case 'archived':
        return 'badge-archived';
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

  const newMessagesCount = messages.filter((m) => m.status === 'new').length;

  return (
    <div className="contact-messages">
      <div className="page-header">
        <h1>Contact Messages</h1>
        <p>View and manage contact messages from the public portal</p>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Filter by Status:</label>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="">All Messages</option>
            <option value="new">New ({newMessagesCount})</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading messages...</div>
      ) : messages.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-inbox"></i>
          <p>No contact messages found</p>
        </div>
      ) : (
        <div className="messages-table-container">
          <table className="messages-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((message) => (
                <tr key={message.id}>
                  <td>{message.name}</td>
                  <td>{message.email}</td>
                  <td>{message.phone || '-'}</td>
                  <td>{message.subject || '-'}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(message.status)}`}>
                      {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                    </span>
                  </td>
                  <td>{formatDate(message.created_at)}</td>
                  <td>
                    <button className="btn-view" onClick={() => handleView(message)}>
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
      {showDetailModal && selectedMessage && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedMessage(null);
          }}
          title="Contact Message Details"
          size="large"
        >
          <div className="message-detail">
            <div className="message-info-grid">
              <div className="info-item">
                <label>Name:</label>
                <span>{selectedMessage.name}</span>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <span>
                  <a href={`mailto:${selectedMessage.email}`}>{selectedMessage.email}</a>
                </span>
              </div>
              {selectedMessage.phone && (
                <div className="info-item">
                  <label>Phone:</label>
                  <span>
                    <a href={`tel:${selectedMessage.phone}`}>{selectedMessage.phone}</a>
                  </span>
                </div>
              )}
              {selectedMessage.subject && (
                <div className="info-item">
                  <label>Subject:</label>
                  <span>{selectedMessage.subject}</span>
                </div>
              )}
            </div>

            <div className="message-content-section">
              <label>Message:</label>
              <div className="message-text">{selectedMessage.message}</div>
            </div>

            <form onSubmit={handleStatusUpdate} className="status-form">
              <div className="form-group">
                <label>Status:</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                >
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  value={statusForm.notes}
                  onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                  rows={4}
                  placeholder="Add any notes or comments about this message..."
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={updateStatusMutation.isLoading}>
                  {updateStatusMutation.isLoading ? 'Updating...' : 'Update Status'}
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this message?')) {
                      deleteMutation.mutate(selectedMessage.id!);
                      setShowDetailModal(false);
                      setSelectedMessage(null);
                    }
                  }}
                  disabled={deleteMutation.isLoading}
                >
                  Delete
                </button>
              </div>
            </form>

            <div className="message-meta">
              <p><strong>Submitted:</strong> {formatDate(selectedMessage.created_at)}</p>
              {selectedMessage.replied_at && (
                <p><strong>Replied:</strong> {formatDate(selectedMessage.replied_at)}</p>
              )}
              {selectedMessage.updated_at && selectedMessage.updated_at !== selectedMessage.created_at && (
                <p><strong>Last Updated:</strong> {formatDate(selectedMessage.updated_at)}</p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ContactMessages;
