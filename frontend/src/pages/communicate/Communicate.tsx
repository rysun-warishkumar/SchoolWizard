import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import {
  communicateService,
  Notice,
  EmailLog,
  SMSLog,
} from '../../services/api/communicateService';
import { academicsService } from '../../services/api/academicsService';
import { studentsService } from '../../services/api/studentsService';
import { hrService } from '../../services/api/hrService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import './Communicate.css';

type TabType = 'notice-board' | 'send-email' | 'send-sms' | 'email-sms-log';

const Communicate = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType;
  const validTabs: TabType[] = ['notice-board', 'send-email', 'send-sms', 'email-sms-log'];
  const defaultTab: TabType = validTabs.includes(tabFromUrl) ? tabFromUrl : 'notice-board';

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="communicate-page">
      <div className="page-header">
        <h1>Communicate</h1>
      </div>

      <div className="communicate-tabs">
        <button
          className={activeTab === 'notice-board' ? 'active' : ''}
          onClick={() => handleTabChange('notice-board')}
        >
          Notice Board
        </button>
        <button
          className={activeTab === 'send-email' ? 'active' : ''}
          onClick={() => handleTabChange('send-email')}
        >
          Send Email
        </button>
        <button
          className={activeTab === 'send-sms' ? 'active' : ''}
          onClick={() => handleTabChange('send-sms')}
        >
          Send SMS
        </button>
        <button
          className={activeTab === 'email-sms-log' ? 'active' : ''}
          onClick={() => handleTabChange('email-sms-log')}
        >
          Email / SMS Log
        </button>
      </div>

      <div className="communicate-content">
        {activeTab === 'notice-board' && <NoticeBoardTab />}
        {activeTab === 'send-email' && <SendEmailTab />}
        {activeTab === 'send-sms' && <SendSMSTab />}
        {activeTab === 'email-sms-log' && <EmailSMSLogTab />}
      </div>
    </div>
  );
};

// ========== Notice Board Tab ==========

const NoticeBoardTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageToFilter, setMessageToFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: notices = [], isLoading, refetch } = useQuery(
    ['notices', searchTerm, messageToFilter, dateFrom, dateTo],
    () =>
      communicateService.getNotices({
        search: searchTerm || undefined,
        message_to: messageToFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }),
    {
      refetchOnWindowFocus: true,
    }
  );

  const [formData, setFormData] = useState({
    message_title: '',
    message: '',
    notice_date: new Date().toISOString().split('T')[0],
    publish_date: new Date().toISOString().split('T')[0],
    message_to: 'all' as 'students' | 'guardians' | 'staff' | 'all',
  });

  const createMutation = useMutation(communicateService.createNotice, {
    onSuccess: () => {
      queryClient.invalidateQueries('notices');
      refetch();
      showToast('Notice created successfully', 'success');
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create notice', 'error');
    },
  });

  const updateMutation = useMutation(
    (data: { id: number; data: Partial<Notice> }) => communicateService.updateNotice(data.id, data.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notices');
        refetch();
        showToast('Notice updated successfully', 'success');
        setShowEditModal(false);
        setSelectedNotice(null);
        resetForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update notice', 'error');
      },
    }
  );

  const deleteMutation = useMutation(communicateService.deleteNotice, {
    onSuccess: () => {
      queryClient.invalidateQueries('notices');
      refetch();
      showToast('Notice deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete notice', 'error');
    },
  });

  const resetForm = () => {
    setFormData({
      message_title: '',
      message: '',
      notice_date: new Date().toISOString().split('T')[0],
      publish_date: new Date().toISOString().split('T')[0],
      message_to: 'all',
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message_title || !formData.message || !formData.notice_date || !formData.publish_date) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    createMutation.mutate(formData);
  };

  const handleEdit = (notice: Notice) => {
    setSelectedNotice(notice);
    setFormData({
      message_title: notice.message_title,
      message: notice.message,
      notice_date: notice.notice_date,
      publish_date: notice.publish_date,
      message_to: notice.message_to,
    });
    setShowEditModal(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNotice || !formData.message_title || !formData.message || !formData.notice_date || !formData.publish_date) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    updateMutation.mutate({ id: selectedNotice.id, data: formData });
  };

  return (
    <div className="communicate-tab-content">
      <div className="notice-board-header">
        <div className="filters-section">
          <input
            type="text"
            placeholder="Search notices..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={messageToFilter}
            onChange={(e) => setMessageToFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Recipients</option>
            <option value="students">Students</option>
            <option value="guardians">Guardians</option>
            <option value="staff">Staff</option>
            <option value="all">All</option>
          </select>
          <input
            type="date"
            placeholder="From Date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="filter-select"
          />
          <input
            type="date"
            placeholder="To Date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="filter-select"
          />
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
          + Post New Message
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : notices.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Message Title</th>
              <th>Message To</th>
              <th>Notice Date</th>
              <th>Publish Date</th>
              <th>Created By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {notices.map((notice) => (
              <tr key={notice.id}>
                <td>{notice.message_title}</td>
                <td>
                  <span className="recipient-badge">{notice.message_to}</span>
                </td>
                <td>{new Date(notice.notice_date).toLocaleDateString()}</td>
                <td>{new Date(notice.publish_date).toLocaleDateString()}</td>
                <td>{notice.created_by_name || '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-sm btn-secondary"
                      onClick={() => handleEdit(notice)}
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this notice?')) {
                          deleteMutation.mutate(notice.id);
                        }
                      }}
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">No notices found</div>
      )}

      {/* Create Notice Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Post New Message"
        size="large"
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label>
              Message Title <span className="required">*</span>
            </label>
            <input
              type="text"
              value={formData.message_title}
              onChange={(e) => setFormData({ ...formData, message_title: e.target.value })}
              required
              placeholder="Enter message title"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Notice Date <span className="required">*</span>
              </label>
              <input
                type="date"
                value={formData.notice_date}
                onChange={(e) => setFormData({ ...formData, notice_date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>
                Publish Date <span className="required">*</span>
              </label>
              <input
                type="date"
                value={formData.publish_date}
                onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              Message To <span className="required">*</span>
            </label>
            <select
              value={formData.message_to}
              onChange={(e) => setFormData({ ...formData, message_to: e.target.value as any })}
              required
            >
              <option value="all">All</option>
              <option value="students">Students</option>
              <option value="guardians">Guardians</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              Message <span className="required">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              rows={6}
              placeholder="Enter message content"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>
              {createMutation.isLoading ? 'Posting...' : 'Post Message'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Notice Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedNotice(null);
          resetForm();
        }}
        title="Edit Notice"
        size="large"
      >
        <form onSubmit={handleUpdateSubmit}>
          <div className="form-group">
            <label>
              Message Title <span className="required">*</span>
            </label>
            <input
              type="text"
              value={formData.message_title}
              onChange={(e) => setFormData({ ...formData, message_title: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Notice Date <span className="required">*</span>
              </label>
              <input
                type="date"
                value={formData.notice_date}
                onChange={(e) => setFormData({ ...formData, notice_date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>
                Publish Date <span className="required">*</span>
              </label>
              <input
                type="date"
                value={formData.publish_date}
                onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              Message To <span className="required">*</span>
            </label>
            <select
              value={formData.message_to}
              onChange={(e) => setFormData({ ...formData, message_to: e.target.value as any })}
              required
            >
              <option value="all">All</option>
              <option value="students">Students</option>
              <option value="guardians">Guardians</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              Message <span className="required">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              rows={6}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowEditModal(false); setSelectedNotice(null); resetForm(); }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={updateMutation.isLoading}>
              {updateMutation.isLoading ? 'Updating...' : 'Update Notice'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ========== Send Email Tab ==========

const SendEmailTab = () => {
  const [activeSubTab, setActiveSubTab] = useState<'group' | 'individual' | 'class' | 'birthday'>('group');
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    recipient_type: 'students' as 'students' | 'guardians' | 'staff',
    recipient_ids: [] as number[],
    class_id: '',
    section_id: '',
  });

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: classes = [] } = useQuery('classes', () =>
    academicsService.getClasses().then((res) => res.data)
  );
  const { data: sections = [] } = useQuery('sections', () =>
    academicsService.getSections().then((res) => res.data)
  );

  const sendEmailMutation = useMutation(communicateService.sendEmail, {
    onSuccess: (data) => {
      queryClient.invalidateQueries('email-logs');
      showToast(data.message, 'success');
      setFormData({
        subject: '',
        message: '',
        recipient_type: 'students',
        recipient_ids: [],
        class_id: '',
        section_id: '',
      });
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to send email', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) {
      showToast('Subject and message are required', 'error');
      return;
    }

    if (activeSubTab === 'individual' && formData.recipient_ids.length === 0) {
      showToast('Please select at least one recipient', 'error');
      return;
    }

    if (activeSubTab === 'class' && (!formData.class_id || !formData.section_id)) {
      showToast('Please select class and section', 'error');
      return;
    }

    const submitData: any = {
      subject: formData.subject.trim(),
      message: formData.message.trim(),
      recipient_type: activeSubTab === 'group' ? formData.recipient_type : activeSubTab,
    };

    if (activeSubTab === 'individual') {
      submitData.recipient_ids = formData.recipient_ids;
    } else if (activeSubTab === 'class') {
      submitData.class_id = Number(formData.class_id);
      submitData.section_id = Number(formData.section_id);
    }

    sendEmailMutation.mutate(submitData);
  };

  return (
    <div className="communicate-tab-content">
      <div className="send-email-tabs">
        <button
          className={activeSubTab === 'group' ? 'active' : ''}
          onClick={() => setActiveSubTab('group')}
        >
          Group
        </button>
        <button
          className={activeSubTab === 'individual' ? 'active' : ''}
          onClick={() => setActiveSubTab('individual')}
        >
          Individual
        </button>
        <button
          className={activeSubTab === 'class' ? 'active' : ''}
          onClick={() => setActiveSubTab('class')}
        >
          Class
        </button>
        <button
          className={activeSubTab === 'birthday' ? 'active' : ''}
          onClick={() => setActiveSubTab('birthday')}
        >
          Today's Birthday
        </button>
      </div>

      <form onSubmit={handleSubmit} className="send-email-form">
        {activeSubTab === 'group' && (
          <div className="form-group">
            <label>
              Send To <span className="required">*</span>
            </label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.recipient_type === 'students'}
                  onChange={() => setFormData({ ...formData, recipient_type: 'students' })}
                />
                Students
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.recipient_type === 'guardians'}
                  onChange={() => setFormData({ ...formData, recipient_type: 'guardians' })}
                />
                Guardians
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.recipient_type === 'staff'}
                  onChange={() => setFormData({ ...formData, recipient_type: 'staff' })}
                />
                Staff
              </label>
            </div>
          </div>
        )}

        {activeSubTab === 'class' && (
          <div className="form-row">
            <div className="form-group">
              <label>
                Class <span className="required">*</span>
              </label>
              <select
                value={formData.class_id}
                onChange={(e) => {
                  setFormData({ ...formData, class_id: e.target.value, section_id: '' });
                }}
                required
              >
                <option value="">Select Class</option>
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>
                Section <span className="required">*</span>
              </label>
              <select
                value={formData.section_id}
                onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                required
                disabled={!formData.class_id}
              >
                <option value="">Select Section</option>
                {sections.map((sec: any) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeSubTab === 'individual' && (
          <IndividualRecipientSelector
            recipientIds={formData.recipient_ids}
            onChange={(ids) => setFormData({ ...formData, recipient_ids: ids })}
          />
        )}

        {activeSubTab === 'birthday' && (
          <div className="info-banner">
            <p>Email will be sent to all students and guardians who have birthdays today.</p>
          </div>
        )}

        <div className="form-group">
          <label>
            Subject <span className="required">*</span>
          </label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
            placeholder="Enter email subject"
          />
        </div>

        <div className="form-group">
          <label>
            Message <span className="required">*</span>
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
            rows={8}
            placeholder="Enter email message (HTML supported)"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={sendEmailMutation.isLoading}>
            {sendEmailMutation.isLoading ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ========== Send SMS Tab ==========

const SendSMSTab = () => {
  const [activeSubTab, setActiveSubTab] = useState<'group' | 'individual' | 'class' | 'birthday'>('group');
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    recipient_type: 'students' as 'students' | 'guardians' | 'staff',
    recipient_ids: [] as number[],
    class_id: '',
    section_id: '',
  });

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: classes = [] } = useQuery('classes', () =>
    academicsService.getClasses().then((res) => res.data)
  );
  const { data: sections = [] } = useQuery('sections', () =>
    academicsService.getSections().then((res) => res.data)
  );

  const sendSMSMutation = useMutation(communicateService.sendSMS, {
    onSuccess: (data) => {
      queryClient.invalidateQueries('sms-logs');
      showToast(data.message, 'success');
      setFormData({
        subject: '',
        message: '',
        recipient_type: 'students',
        recipient_ids: [],
        class_id: '',
        section_id: '',
      });
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to send SMS', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) {
      showToast('Subject and message are required', 'error');
      return;
    }

    if (activeSubTab === 'individual' && formData.recipient_ids.length === 0) {
      showToast('Please select at least one recipient', 'error');
      return;
    }

    if (activeSubTab === 'class' && (!formData.class_id || !formData.section_id)) {
      showToast('Please select class and section', 'error');
      return;
    }

    const submitData: any = {
      subject: formData.subject.trim(),
      message: formData.message.trim(),
      recipient_type: activeSubTab === 'group' ? formData.recipient_type : activeSubTab,
    };

    if (activeSubTab === 'individual') {
      submitData.recipient_ids = formData.recipient_ids;
    } else if (activeSubTab === 'class') {
      submitData.class_id = Number(formData.class_id);
      submitData.section_id = Number(formData.section_id);
    }

    sendSMSMutation.mutate(submitData);
  };

  return (
    <div className="communicate-tab-content">
      <div className="send-sms-tabs">
        <button
          className={activeSubTab === 'group' ? 'active' : ''}
          onClick={() => setActiveSubTab('group')}
        >
          Group
        </button>
        <button
          className={activeSubTab === 'individual' ? 'active' : ''}
          onClick={() => setActiveSubTab('individual')}
        >
          Individual
        </button>
        <button
          className={activeSubTab === 'class' ? 'active' : ''}
          onClick={() => setActiveSubTab('class')}
        >
          Class
        </button>
        <button
          className={activeSubTab === 'birthday' ? 'active' : ''}
          onClick={() => setActiveSubTab('birthday')}
        >
          Today's Birthday
        </button>
      </div>

      <form onSubmit={handleSubmit} className="send-sms-form">
        {activeSubTab === 'group' && (
          <div className="form-group">
            <label>
              Send To <span className="required">*</span>
            </label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.recipient_type === 'students'}
                  onChange={() => setFormData({ ...formData, recipient_type: 'students' })}
                />
                Students
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.recipient_type === 'guardians'}
                  onChange={() => setFormData({ ...formData, recipient_type: 'guardians' })}
                />
                Guardians
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.recipient_type === 'staff'}
                  onChange={() => setFormData({ ...formData, recipient_type: 'staff' })}
                />
                Staff
              </label>
            </div>
          </div>
        )}

        {activeSubTab === 'class' && (
          <div className="form-row">
            <div className="form-group">
              <label>
                Class <span className="required">*</span>
              </label>
              <select
                value={formData.class_id}
                onChange={(e) => {
                  setFormData({ ...formData, class_id: e.target.value, section_id: '' });
                }}
                required
              >
                <option value="">Select Class</option>
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>
                Section <span className="required">*</span>
              </label>
              <select
                value={formData.section_id}
                onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                required
                disabled={!formData.class_id}
              >
                <option value="">Select Section</option>
                {sections.map((sec: any) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeSubTab === 'individual' && (
          <IndividualRecipientSelector
            recipientIds={formData.recipient_ids}
            onChange={(ids) => setFormData({ ...formData, recipient_ids: ids })}
          />
        )}

        {activeSubTab === 'birthday' && (
          <div className="info-banner">
            <p>SMS will be sent to all students and guardians who have birthdays today.</p>
          </div>
        )}

        <div className="form-group">
          <label>
            Subject <span className="required">*</span>
          </label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
            placeholder="Enter SMS subject"
          />
        </div>

        <div className="form-group">
          <label>
            Message <span className="required">*</span>
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
            rows={6}
            placeholder="Enter SMS message"
            maxLength={160}
          />
          <small className="char-count">{formData.message.length}/160 characters</small>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={sendSMSMutation.isLoading}>
            {sendSMSMutation.isLoading ? 'Sending...' : 'Send SMS'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ========== Individual Recipient Selector Component ==========

interface IndividualRecipientSelectorProps {
  recipientIds: number[];
  onChange: (ids: number[]) => void;
}

const IndividualRecipientSelector = ({ recipientIds, onChange }: IndividualRecipientSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userType, setUserType] = useState<'students' | 'staff'>('students');

  const { data: studentsData } = useQuery(
    ['students', 'all', searchTerm],
    () =>
      studentsService.getStudents({
        search: searchTerm || undefined,
        page: 1,
        limit: 1000,
      }),
    { enabled: userType === 'students' }
  );

  const { data: staffData } = useQuery(
    ['staff', 'all', searchTerm],
    () =>
      hrService.getStaff({
        search: searchTerm || undefined,
        page: 1,
        limit: 1000,
      }).then((res) => res.data),
    { enabled: userType === 'staff' }
  );

  const students = studentsData?.data || [];
  const staff = staffData || [];

  const handleToggle = (id: number) => {
    if (recipientIds.includes(id)) {
      onChange(recipientIds.filter((i) => i !== id));
    } else {
      onChange([...recipientIds, id]);
    }
  };

  return (
    <div className="individual-recipient-selector">
      <div className="selector-header">
        <select
          value={userType}
          onChange={(e) => {
            setUserType(e.target.value as any);
            onChange([]);
          }}
          className="filter-select"
        >
          <option value="students">Students</option>
          <option value="staff">Staff</option>
        </select>
        <input
          type="text"
          placeholder="Search..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="recipient-list">
        {userType === 'students' ? (
          students.length > 0 ? (
            students.map((student: any) => (
              <label key={student.id} className="recipient-item">
                <input
                  type="checkbox"
                  checked={recipientIds.includes(student.id)}
                  onChange={() => handleToggle(student.id)}
                />
                <span>
                  {student.admission_no} - {student.first_name} {student.last_name || ''}
                </span>
              </label>
            ))
          ) : (
            <div className="empty-list">No students found</div>
          )
        ) : (
          staff.length > 0 ? (
            staff.map((staffMember: any) => (
              <label key={staffMember.id} className="recipient-item">
                <input
                  type="checkbox"
                  checked={recipientIds.includes(staffMember.id)}
                  onChange={() => handleToggle(staffMember.id)}
                />
                <span>
                  {staffMember.staff_id} - {staffMember.first_name} {staffMember.last_name || ''}
                </span>
              </label>
            ))
          ) : (
            <div className="empty-list">No staff found</div>
          )
        )}
      </div>
      {recipientIds.length > 0 && (
        <div className="selected-count">
          {recipientIds.length} recipient(s) selected
        </div>
      )}
    </div>
  );
};

// ========== Email / SMS Log Tab ==========

const EmailSMSLogTab = () => {
  const [logType, setLogType] = useState<'email' | 'sms'>('email');
  const [statusFilter, setStatusFilter] = useState('');
  const [recipientTypeFilter, setRecipientTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: emailLogs = [], isLoading: emailLoading } = useQuery(
    ['email-logs', statusFilter, recipientTypeFilter, dateFrom, dateTo, searchTerm],
    () =>
      communicateService.getEmailLogs({
        status: statusFilter || undefined,
        recipient_type: recipientTypeFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        search: searchTerm || undefined,
      }),
    {
      enabled: logType === 'email',
      refetchOnWindowFocus: true,
    }
  );

  const { data: smsLogs = [], isLoading: smsLoading } = useQuery(
    ['sms-logs', statusFilter, recipientTypeFilter, dateFrom, dateTo, searchTerm],
    () =>
      communicateService.getSMSLogs({
        status: statusFilter || undefined,
        recipient_type: recipientTypeFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        search: searchTerm || undefined,
      }),
    {
      enabled: logType === 'sms',
      refetchOnWindowFocus: true,
    }
  );

  const logs = logType === 'email' ? emailLogs : smsLogs;
  const isLoading = logType === 'email' ? emailLoading : smsLoading;

  return (
    <div className="communicate-tab-content">
      <div className="log-type-tabs">
        <button
          className={logType === 'email' ? 'active' : ''}
          onClick={() => setLogType('email')}
        >
          Email Log
        </button>
        <button
          className={logType === 'sms' ? 'active' : ''}
          onClick={() => setLogType('sms')}
        >
          SMS Log
        </button>
      </div>

      <div className="log-filters">
        <input
          type="text"
          placeholder="Search..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
        <select
          value={recipientTypeFilter}
          onChange={(e) => setRecipientTypeFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Types</option>
          <option value="students">Students</option>
          <option value="guardians">Guardians</option>
          <option value="staff">Staff</option>
          <option value="individual">Individual</option>
          <option value="class">Class</option>
          <option value="birthday">Birthday</option>
        </select>
        <input
          type="date"
          placeholder="From Date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="filter-select"
        />
        <input
          type="date"
          placeholder="To Date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="filter-select"
        />
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : logs.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Recipient Type</th>
              <th>Recipients</th>
              <th>Status</th>
              <th>Sent At</th>
              <th>Sent By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: EmailLog | SMSLog) => {
              const recipients = logType === 'email'
                ? (log as EmailLog).recipient_emails
                  ? JSON.parse((log as EmailLog).recipient_emails || '[]')
                  : []
                : (log as SMSLog).recipient_phones
                  ? JSON.parse((log as SMSLog).recipient_phones || '[]')
                  : [];
              
              return (
                <tr key={log.id}>
                  <td>{log.subject}</td>
                  <td>
                    <span className="recipient-type-badge">{log.recipient_type}</span>
                  </td>
                  <td>
                    {recipients.length > 0 ? (
                      <span title={recipients.join(', ')}>
                        {recipients.length} recipient(s)
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${log.status}`}>
                      {log.status}
                    </span>
                  </td>
                  <td>{new Date(log.sent_at).toLocaleString()}</td>
                  <td>{logType === 'email' ? (log as EmailLog).sent_by_name : (log as SMSLog).sent_by_name || '-'}</td>
                  <td>
                    <button
                      className="btn-sm btn-secondary"
                      onClick={() => {
                        const modal = document.createElement('div');
                        modal.className = 'log-details-modal';
                        modal.innerHTML = `
                          <div class="modal-overlay" onclick="this.parentElement.remove()">
                            <div class="modal-content" onclick="event.stopPropagation()">
                              <h3>${log.subject}</h3>
                              <p><strong>Message:</strong></p>
                              <div class="message-content">${log.message}</div>
                              ${log.error_message ? `<p><strong>Error:</strong> ${log.error_message}</p>` : ''}
                              <button onclick="this.closest('.log-details-modal').remove()">Close</button>
                            </div>
                          </div>
                        `;
                        document.body.appendChild(modal);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">No logs found</div>
      )}
    </div>
  );
};

export default Communicate;

