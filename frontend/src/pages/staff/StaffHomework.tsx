import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { hrService } from '../../services/api/hrService';
import { homeworkService } from '../../services/api/homeworkService';
import { settingsService } from '../../services/api/settingsService';
import { apiClient } from '../../services/api/apiClient';
import { useToast } from '../../contexts/ToastContext';
import './StaffHomework.css';

const StaffHomework = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<{ class_id: number; section_id: number } | null>(null);
  const [formData, setFormData] = useState({
    subject_id: '',
    homework_date: new Date().toISOString().split('T')[0],
    submission_date: '',
    title: '',
    description: '',
  });

  const { showToast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: classesData } = useQuery('my-classes', () => hrService.getMyClasses(), {
    refetchOnWindowFocus: false,
  });

  const { data: sessionsData } = useQuery('sessions', () => settingsService.getSessions());
  const sessions = sessionsData?.data || [];
  const currentSession = sessions.find((s) => s.is_current) || sessions[0];

  const classes = classesData?.data || [];

  // Auto-select first class if none selected
  React.useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass({
        class_id: classes[0].class_id,
        section_id: classes[0].section_id,
      });
    }
  }, [classes, selectedClass]);

  // Get subjects for selected class
  const selectedClassData = classes.find(
    (c: any) => c.class_id === selectedClass?.class_id && c.section_id === selectedClass?.section_id
  );
  const subjects = selectedClassData?.subjects || [];

  const { data: homeworkData, isLoading } = useQuery(
    ['homework', selectedClass],
    () =>
      homeworkService.getHomework({
        class_id: selectedClass?.class_id,
        section_id: selectedClass?.section_id,
      }),
    {
      enabled: !!selectedClass,
      refetchOnWindowFocus: false,
    }
  );

  const homework = (Array.isArray(homeworkData) ? homeworkData : []) || [];

  const createMutation = useMutation(homeworkService.createHomework, {
    onSuccess: () => {
      queryClient.invalidateQueries('homework');
      showToast('Homework created successfully', 'success');
      setShowCreateModal(false);
      setFormData({
        subject_id: '',
        homework_date: new Date().toISOString().split('T')[0],
        submission_date: '',
        title: '',
        description: '',
      });
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create homework', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !currentSession) {
      showToast('Please select a class', 'error');
      return;
    }

    const homeworkData: {
      class_id: number;
      section_id: number;
      subject_id: number;
      homework_date: string;
      submission_date: string;
      title: string;
      description?: string;
    } = {
      class_id: selectedClass.class_id,
      section_id: selectedClass.section_id,
      subject_id: Number(formData.subject_id),
      homework_date: formData.homework_date,
      submission_date: formData.submission_date,
      title: formData.title,
      description: formData.description,
    };

    createMutation.mutate(homeworkData);
  };

  if (classes.length === 0) {
    return (
      <div className="staff-homework-page">
        <div className="empty-state">
          <p>No classes assigned to you yet.</p>
          <p className="empty-state-subtitle">Please contact the administrator to get assigned to classes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-homework-page">
      <div className="page-header">
        <h1>Homework Management</h1>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          Assign Homework
        </button>
      </div>

      <div className="homework-filters">
        <div className="filter-group">
          <label>Select Class:</label>
          <select
            value={selectedClass ? `${selectedClass.class_id}-${selectedClass.section_id}` : ''}
            onChange={(e) => {
              if (e.target.value) {
                const [class_id, section_id] = e.target.value.split('-').map(Number);
                setSelectedClass({ class_id, section_id });
              }
            }}
          >
            {classes.map((classItem: any) => (
              <option
                key={`${classItem.class_id}-${classItem.section_id}`}
                value={`${classItem.class_id}-${classItem.section_id}`}
              >
                {classItem.class_name} - {classItem.section_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading homework...</div>
      ) : homework.length === 0 ? (
        <div className="empty-state">No homework assignments found for the selected class</div>
      ) : (
        <div className="homework-list">
          {homework.map((hw: any) => (
            <div key={hw.id} className="homework-card">
              <div className="homework-header">
                <div>
                  <h3>{hw.title}</h3>
                  <p className="homework-subject">Subject: {hw.subject_name}</p>
                </div>
                <div className="homework-dates">
                  <span className="date-label">Assigned: {new Date(hw.homework_date).toLocaleDateString()}</span>
                  <span className="date-label">Due: {new Date(hw.submission_date).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="homework-body">
                <p>{hw.description}</p>
                {hw.attachment_url && (
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      handleDownloadAttachment(hw.attachment_url);
                    }}
                    className="attachment-link"
                    style={{ cursor: 'pointer' }}
                  >
                    📎 View Attachment
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Assign Homework</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Subject *</label>
                <select
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject: any) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Homework Date *</label>
                <input
                  type="date"
                  value={formData.homework_date}
                  onChange={(e) => setFormData({ ...formData, homework_date: e.target.value })}
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label>Submission Date *</label>
                <input
                  type="date"
                  value={formData.submission_date}
                  onChange={(e) => setFormData({ ...formData, submission_date: e.target.value })}
                  required
                  min={formData.homework_date}
                />
              </div>

              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Enter homework title"
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  placeholder="Enter homework description"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>
                  {createMutation.isLoading ? 'Creating...' : 'Create Homework'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffHomework;

