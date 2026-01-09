import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { homeworkService, Homework as HomeworkType, HomeworkEvaluation } from '../../services/api/homeworkService';
import { academicsService } from '../../services/api/academicsService';
import { settingsService } from '../../services/api/settingsService';
import { studentsService } from '../../services/api/studentsService';
import { apiClient } from '../../services/api/apiClient';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import './Homework.css';

const Homework = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEvaluateModal, setShowEvaluateModal] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<HomeworkType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    session_id: '',
    class_id: '',
    section_id: '',
    subject_id: '',
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

  // Fetch sessions - handle errors gracefully
  const { data: sessionsData } = useQuery(
    'sessions', 
    () => settingsService.getSessions().then(res => res.data || []),
    {
      refetchOnWindowFocus: false,
      retry: false,
      onError: (error: any) => {
        // Silently handle errors - sessions are optional for filtering
        if (error?.response?.status !== 403) {
          console.error('Failed to load sessions:', error);
        }
      },
    }
  );
  const sessions = Array.isArray(sessionsData) ? sessionsData : [];
  
  // Initialize createFormData state first
  const [createFormData, setCreateFormData] = useState({
    class_id: '',
    section_id: '',
    subject_group_id: '',
    subject_id: '',
    homework_date: '',
    submission_date: '',
    title: '',
    description: '',
    attachment_url: '',
  });
  
  // Classes query - always enabled for modal use
  const { data: classesData } = useQuery('classes', () => academicsService.getClasses().then(res => res.data));
  const classes = Array.isArray(classesData) ? classesData : [];
  
  // Sections query - always enabled for modal use
  const { data: sectionsData } = useQuery('sections', () => academicsService.getSections().then(res => res.data));
  const sections = Array.isArray(sectionsData) ? sectionsData : [];
  
  // Subjects query - always enabled
  const { data: subjectsData } = useQuery('subjects', () => academicsService.getSubjects().then(res => res.data));
  const subjects = Array.isArray(subjectsData) ? subjectsData : [];
  
  // Subject Groups query - enabled when class and section are selected
  const { data: subjectGroupsData } = useQuery(
    ['subject-groups', createFormData.class_id, createFormData.section_id],
    () => academicsService.getSubjectGroups().then(res => res.data),
    { enabled: !!createFormData.class_id && !!createFormData.section_id }
  );
  const subjectGroups = subjectGroupsData || [];

  const { data: homework = [], isLoading, refetch } = useQuery(
    ['homework', filters],
    () =>
      homeworkService.getHomework({
        class_id: filters.class_id ? Number(filters.class_id) : undefined,
        section_id: filters.section_id ? Number(filters.section_id) : undefined,
        subject_id: filters.subject_id ? Number(filters.subject_id) : undefined,
        session_id: filters.session_id ? Number(filters.session_id) : undefined,
      }),
    {
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    }
  );

  const createMutation = useMutation(homeworkService.createHomework, {
    onSuccess: () => {
      queryClient.invalidateQueries('homework');
      refetch();
      showToast('Homework created successfully', 'success');
      setShowCreateModal(false);
      resetCreateForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create homework', 'error');
    },
  });

  const deleteMutation = useMutation(homeworkService.deleteHomework, {
    onSuccess: () => {
      queryClient.invalidateQueries('homework');
      showToast('Homework deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete homework', 'error');
    },
  });

  const resetCreateForm = () => {
    setCreateFormData({
      class_id: '',
      section_id: '',
      subject_group_id: '',
      subject_id: '',
      homework_date: '',
      submission_date: '',
      title: '',
      description: '',
      attachment_url: '',
      attachment_file: null,
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !createFormData.class_id ||
      !createFormData.section_id ||
      !createFormData.subject_id ||
      !createFormData.homework_date ||
      !createFormData.submission_date ||
      !createFormData.title
    ) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    // Prepare form data for file upload
    const formData = new FormData();
    formData.append('class_id', String(Number(createFormData.class_id)));
    formData.append('section_id', String(Number(createFormData.section_id)));
    if (createFormData.subject_group_id) {
      formData.append('subject_group_id', String(Number(createFormData.subject_group_id)));
    }
    formData.append('subject_id', String(Number(createFormData.subject_id)));
    formData.append('homework_date', createFormData.homework_date);
    formData.append('submission_date', createFormData.submission_date);
    formData.append('title', createFormData.title.trim());
    if (createFormData.description) {
      formData.append('description', createFormData.description);
    }
    if (createFormData.attachment_file) {
      formData.append('attachment', createFormData.attachment_file);
    } else if (createFormData.attachment_url) {
      formData.append('attachment_url', createFormData.attachment_url);
    }

    // Use the mutation with FormData
    createMutation.mutate(formData as any);
  };

  const handleViewEvaluate = async (homework: HomeworkType) => {
    try {
      const homeworkDetails = await homeworkService.getHomeworkById(homework.id);
      setSelectedHomework(homeworkDetails);
      setShowEvaluateModal(true);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to load homework details', 'error');
    }
  };

  return (
    <div className="homework-page">
      <div className="page-header">
        <h1>Homework</h1>
        <button className="btn-primary" onClick={() => { resetCreateForm(); setShowCreateModal(true); }}>
          + Add Homework
        </button>
      </div>

      <div className="filters-section">
        <div className="form-row">
          <div className="form-group">
            <label>Session <span className="required">*</span></label>
            <select
              value={filters.session_id}
              onChange={(e) => {
                setFilters({ ...filters, session_id: e.target.value, class_id: '', section_id: '' });
              }}
            >
              <option value="">Select Session</option>
              {sessions.map((session: any) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Class</label>
            <select
              value={filters.class_id}
              onChange={(e) => {
                setFilters({ ...filters, class_id: e.target.value, section_id: '' });
              }}
              disabled={!filters.session_id}
            >
              <option value="">All Classes</option>
              {classes.map((cls: any) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Section</label>
            <select
              value={filters.section_id}
              onChange={(e) => setFilters({ ...filters, section_id: e.target.value })}
              disabled={!filters.class_id}
            >
              <option value="">All Sections</option>
              {sections.map((sec: any) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Subject</label>
            <select
              value={filters.subject_id}
              onChange={(e) => setFilters({ ...filters, subject_id: e.target.value })}
            >
              <option value="">All Subjects</option>
              {subjects.map((subject: any) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (() => {
        // Filter homework by search term
        const filteredHomework = homework.filter((hw) => {
          if (!searchTerm) return true;
          const searchLower = searchTerm.toLowerCase();
          return (
            hw.class_name?.toLowerCase().includes(searchLower) ||
            hw.section_name?.toLowerCase().includes(searchLower) ||
            hw.subject_name?.toLowerCase().includes(searchLower) ||
            hw.title?.toLowerCase().includes(searchLower) ||
            hw.created_by_name?.toLowerCase().includes(searchLower)
          );
        });

        return filteredHomework.length > 0 ? (
          <div className="homework-list-section">
            <div className="homework-list-header">
              <h2>Homework List</h2>
              <div className="homework-list-actions">
                <input
                  type="text"
                  placeholder="Search..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Subject</th>
                  <th>Homework Date</th>
                  <th>Submission Date</th>
                  <th>Evaluation Date</th>
                  <th>Created By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredHomework.map((hw) => (
                  <tr key={hw.id}>
                    <td>{hw.class_name}</td>
                    <td>{hw.section_name}</td>
                    <td>
                      {hw.subject_name} {hw.subject_code ? `(${hw.subject_code})` : ''}
                    </td>
                    <td>{new Date(hw.homework_date).toLocaleDateString()}</td>
                    <td>{new Date(hw.submission_date).toLocaleDateString()}</td>
                    <td>{hw.evaluations && hw.evaluations.length > 0 && hw.evaluations[0].evaluation_date ? new Date(hw.evaluations[0].evaluation_date).toLocaleDateString() : '-'}</td>
                    <td>{hw.created_by_name || '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-sm btn-secondary"
                          onClick={() => handleViewEvaluate(hw)}
                          title="View / Evaluate"
                        >
                          View
                        </button>
                        <button
                          className="btn-sm btn-danger"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this homework?')) {
                              deleteMutation.mutate(hw.id);
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
          </div>
        ) : (
          <div className="empty-state">
            {searchTerm ? 'No homework found matching your search.' : 'No homework found. Click "+ Add Homework" to create a new homework assignment.'}
          </div>
        );
      })()}

      {/* Create Homework Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetCreateForm();
        }}
        title="Add Homework"
        size="large"
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>
                Class <span className="required">*</span>
              </label>
              <select
                value={createFormData.class_id}
                onChange={(e) => {
                  setCreateFormData({ ...createFormData, class_id: e.target.value, section_id: '', subject_group_id: '' });
                }}
                required
              >
                <option value="">Select Class</option>
                {classes && Array.isArray(classes) && classes.length > 0 ? (
                  classes.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No classes available</option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label>
                Section <span className="required">*</span>
              </label>
              <select
                value={createFormData.section_id}
                onChange={(e) => {
                  setCreateFormData({ ...createFormData, section_id: e.target.value, subject_group_id: '' });
                }}
                required
                disabled={!createFormData.class_id}
              >
                <option value="">Select Section</option>
                {sections && Array.isArray(sections) && sections.length > 0 ? (
                  sections.map((sec: any) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No sections available</option>
                )}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Subject Group</label>
              <select
                value={createFormData.subject_group_id}
                onChange={(e) => setCreateFormData({ ...createFormData, subject_group_id: e.target.value })}
                disabled={!createFormData.class_id || !createFormData.section_id}
              >
                <option value="">Select Subject Group</option>
                {subjectGroups && Array.isArray(subjectGroups) && subjectGroups.length > 0 ? (
                  subjectGroups
                    .filter((sg: any) => sg.class_id === Number(createFormData.class_id) && sg.section_id === Number(createFormData.section_id))
                    .map((sg: any) => (
                      <option key={sg.id} value={sg.id}>
                        {sg.name}
                      </option>
                    ))
                ) : (
                  <option value="" disabled>No subject groups available</option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label>
                Subject <span className="required">*</span>
              </label>
              <select
                value={createFormData.subject_id}
                onChange={(e) => setCreateFormData({ ...createFormData, subject_id: e.target.value })}
                required
              >
                <option value="">Select Subject</option>
                {subjects && Array.isArray(subjects) && subjects.length > 0 ? (
                  subjects.map((subject: any) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No subjects available</option>
                )}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Homework Date <span className="required">*</span>
              </label>
              <input
                type="date"
                value={createFormData.homework_date}
                onChange={(e) => setCreateFormData({ ...createFormData, homework_date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>
                Submission Date <span className="required">*</span>
              </label>
              <input
                type="date"
                value={createFormData.submission_date}
                onChange={(e) => setCreateFormData({ ...createFormData, submission_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              Title <span className="required">*</span>
            </label>
            <input
              type="text"
              value={createFormData.title}
              onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
              required
              placeholder="Enter homework title"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={createFormData.description}
              onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
              rows={4}
              placeholder="Enter homework description/instructions"
            />
          </div>

          <div className="form-group">
            <label>Attachment</label>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCreateFormData({ ...createFormData, attachment_file: file });
                }
              }}
              accept="*/*"
            />
            <small>Upload a file attachment (max 50MB). You can also enter a URL below if the file is hosted elsewhere.</small>
          </div>
          <div className="form-group">
            <label>Attachment URL (Optional)</label>
            <input
              type="text"
              value={createFormData.attachment_url}
              onChange={(e) => setCreateFormData({ ...createFormData, attachment_url: e.target.value })}
              placeholder="Enter file URL or path (if file is hosted elsewhere)"
            />
            <small>Note: If you upload a file above, it will be used. Otherwise, you can provide a URL here.</small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowCreateModal(false);
                resetCreateForm();
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>
              {createMutation.isLoading ? 'Creating...' : 'Create Homework'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Evaluate Homework Modal */}
      {selectedHomework && (
        <EvaluateHomeworkModal
          homework={selectedHomework}
          isOpen={showEvaluateModal}
          onClose={() => {
            setShowEvaluateModal(false);
            setSelectedHomework(null);
          }}
        />
      )}
    </div>
  );
};

// ========== Evaluate Homework Modal ==========

interface EvaluateHomeworkModalProps {
  homework: HomeworkType;
  isOpen: boolean;
  onClose: () => void;
}

const EvaluateHomeworkModal = ({ homework, isOpen, onClose }: EvaluateHomeworkModalProps) => {
  const [completedStudentIds, setCompletedStudentIds] = useState<number[]>([]);
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchLeft, setSearchLeft] = useState('');
  const [searchRight, setSearchRight] = useState('');
  const [studentRemarks, setStudentRemarks] = useState<Record<number, string>>({});
  const [studentStatuses, setStudentStatuses] = useState<Record<number, 'pending' | 'completed' | 'in_progress'>>({});
  const queryClient = useQueryClient();
  const { showToast } = useToast();

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

  const { data: studentsData } = useQuery(
    ['students', homework.class_id, homework.section_id],
    () =>
      studentsService.getStudents({
        class_id: homework.class_id,
        section_id: homework.section_id,
        page: 1,
        limit: 1000,
      }),
    { enabled: isOpen }
  );

  const allStudents = studentsData?.data || [];

  React.useEffect(() => {
    if (homework.evaluations) {
      const completedIds = homework.evaluations
        .filter((e) => e.is_completed)
        .map((e) => e.student_id);
      setCompletedStudentIds(completedIds);
      // Set evaluation date from existing evaluation if available
      const firstEvaluation = homework.evaluations.find((e) => e.is_completed);
      if (firstEvaluation?.evaluation_date) {
        setEvaluationDate(firstEvaluation.evaluation_date.split('T')[0]);
      }
      // Load existing remarks and statuses
      const remarksMap: Record<number, string> = {};
      const statusesMap: Record<number, 'pending' | 'completed' | 'in_progress'> = {};
      homework.evaluations.forEach((e) => {
        if (e.is_completed) {
          if (e.remarks) {
            remarksMap[e.student_id] = e.remarks;
          }
          // Determine status from is_completed and remarks
          // If is_completed = 1, status is 'completed'
          statusesMap[e.student_id] = 'completed';
        }
      });
      setStudentRemarks(remarksMap);
      setStudentStatuses(statusesMap);
    }
  }, [homework]);

  // Filter students
  const availableStudents = allStudents.filter((s: any) => !completedStudentIds.includes(s.id));
  const completedStudents = allStudents.filter((s: any) => completedStudentIds.includes(s.id));

  const filteredAvailableStudents = availableStudents.filter((s: any) => {
    if (!searchLeft) return true;
    const searchLower = searchLeft.toLowerCase();
    return (
      s.admission_no?.toLowerCase().includes(searchLower) ||
      s.first_name?.toLowerCase().includes(searchLower) ||
      s.last_name?.toLowerCase().includes(searchLower) ||
      s.roll_no?.toLowerCase().includes(searchLower)
    );
  });

  const filteredCompletedStudents = completedStudents.filter((s: any) => {
    if (!searchRight) return true;
    const searchLower = searchRight.toLowerCase();
    return (
      s.admission_no?.toLowerCase().includes(searchLower) ||
      s.first_name?.toLowerCase().includes(searchLower) ||
      s.last_name?.toLowerCase().includes(searchLower) ||
      s.roll_no?.toLowerCase().includes(searchLower)
    );
  });

  const evaluateMutation = useMutation(
    (data: { homework_id: number; student_ids: number[]; evaluation_date?: string; remarks?: string; marks?: number }) =>
      homeworkService.evaluateHomework(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('homework');
        queryClient.invalidateQueries(['homework', homework.id]);
        showToast('Homework evaluated successfully', 'success');
        onClose();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to evaluate homework', 'error');
      },
    }
  );

  const moveToCompleted = (studentId: number) => {
    setCompletedStudentIds((prev) => [...prev, studentId]);
    // Initialize remarks and status for this student if not exists
    if (!studentRemarks[studentId]) {
      setStudentRemarks((prev) => ({ ...prev, [studentId]: '' }));
    }
    if (!studentStatuses[studentId]) {
      setStudentStatuses((prev) => ({ ...prev, [studentId]: 'completed' }));
    }
  };

  const moveToAvailable = (studentId: number) => {
    setCompletedStudentIds((prev) => prev.filter((id) => id !== studentId));
    // Remove remarks and status for this student
    setStudentRemarks((prev) => {
      const newRemarks = { ...prev };
      delete newRemarks[studentId];
      return newRemarks;
    });
    setStudentStatuses((prev) => {
      const newStatuses = { ...prev };
      delete newStatuses[studentId];
      return newStatuses;
    });
  };

  const moveAllToCompleted = () => {
    const allIds = availableStudents.map((s: any) => s.id);
    setCompletedStudentIds(allIds);
    // Initialize remarks and statuses for all students
    const newRemarks: Record<number, string> = { ...studentRemarks };
    const newStatuses: Record<number, 'pending' | 'completed' | 'in_progress'> = { ...studentStatuses };
    allIds.forEach((id) => {
      if (!newRemarks[id]) {
        newRemarks[id] = '';
      }
      if (!newStatuses[id]) {
        newStatuses[id] = 'completed';
      }
    });
    setStudentRemarks(newRemarks);
    setStudentStatuses(newStatuses);
  };

  const moveAllToAvailable = () => {
    setCompletedStudentIds([]);
    setStudentRemarks({});
    setStudentStatuses({});
  };

  const handleSubmit = () => {
    if (completedStudentIds.length === 0) {
      showToast('Please move at least one student to the completed list', 'error');
      return;
    }

    if (!evaluationDate) {
      showToast('Please select an evaluation date', 'error');
      return;
    }

    // Prepare student remarks object (only include non-empty remarks)
    const remarksObject: Record<number, string> = {};
    completedStudentIds.forEach((studentId) => {
      if (studentRemarks[studentId] && studentRemarks[studentId].trim()) {
        remarksObject[studentId] = studentRemarks[studentId].trim();
      }
    });

    // Prepare student statuses object
    const statusesObject: Record<number, 'pending' | 'completed' | 'in_progress'> = {};
    completedStudentIds.forEach((studentId) => {
      statusesObject[studentId] = studentStatuses[studentId] || 'completed';
    });

    evaluateMutation.mutate({
      homework_id: homework.id,
      student_ids: completedStudentIds,
      evaluation_date: evaluationDate,
      remarks: Object.keys(remarksObject).length > 0 ? Object.values(remarksObject).join('; ') : undefined,
      student_statuses: statusesObject as any,
    } as any);
  };

  if (!isOpen) return null;

  const hasEvaluations = homework.evaluations && homework.evaluations.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Evaluate Homework" size="large">
      <div className="evaluate-homework-modal">
        {hasEvaluations && (
          <div className="info-banner" style={{ 
            background: '#e3f2fd', 
            padding: 'var(--spacing-md)', 
            borderRadius: 'var(--border-radius-sm)',
            marginBottom: 'var(--spacing-lg)',
            color: '#1976d2'
          }}>
            Homework already evaluated, now you can update evaluation.
          </div>
        )}

        <div className="evaluate-homework-content" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 'var(--spacing-lg)' }}>
          {/* Students List (Left) */}
          <div className="student-list-panel">
            <div className="panel-header">
              <h3>Students List</h3>
            </div>
            <div className="panel-search">
              <input
                type="text"
                placeholder="Search..."
                value={searchLeft}
                onChange={(e) => setSearchLeft(e.target.value)}
                style={{ width: '100%', padding: 'var(--spacing-sm)', border: '1px solid var(--gray-300)', borderRadius: 'var(--border-radius-sm)' }}
              />
            </div>
            <div className="panel-list" style={{ 
              border: '1px solid var(--gray-300)', 
              borderRadius: 'var(--border-radius-sm)',
              maxHeight: '400px',
              overflowY: 'auto',
              padding: 'var(--spacing-sm)'
            }}>
              {filteredAvailableStudents.length > 0 ? (
                filteredAvailableStudents.map((student: any) => (
                  <div 
                    key={student.id} 
                    className="student-item"
                    style={{ 
                      padding: 'var(--spacing-sm)', 
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--gray-200)'
                    }}
                    onClick={() => moveToCompleted(student.id)}
                  >
                    {student.admission_no} - {student.first_name} {student.last_name || ''}
                  </div>
                ))
              ) : (
                <div style={{ padding: 'var(--spacing-md)', textAlign: 'center', color: 'var(--gray-500)' }}>
                  No students available
                </div>
              )}
            </div>
          </div>

          {/* Transfer Buttons */}
          <div className="transfer-buttons" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            gap: 'var(--spacing-sm)'
          }}>
            <button
              className="btn-secondary"
              onClick={moveAllToCompleted}
              disabled={availableStudents.length === 0}
              title="Move all to completed"
              style={{ padding: 'var(--spacing-sm)', minWidth: '40px' }}
            >
              &gt;&gt;
            </button>
            <button
              className="btn-secondary"
              onClick={moveAllToAvailable}
              disabled={completedStudents.length === 0}
              title="Move all to available"
              style={{ padding: 'var(--spacing-sm)', minWidth: '40px' }}
            >
              &lt;&lt;
            </button>
          </div>

          {/* Homework Completed (Right) */}
          <div className="completed-list-panel">
            <div className="panel-header">
              <h3>Homework Completed</h3>
            </div>
            <div className="panel-search">
              <input
                type="text"
                placeholder="Search..."
                value={searchRight}
                onChange={(e) => setSearchRight(e.target.value)}
                style={{ width: '100%', padding: 'var(--spacing-sm)', border: '1px solid var(--gray-300)', borderRadius: 'var(--border-radius-sm)' }}
              />
            </div>
            <div className="panel-list" style={{ 
              border: '1px solid var(--gray-300)', 
              borderRadius: 'var(--border-radius-sm)',
              maxHeight: '400px',
              overflowY: 'auto',
              padding: 'var(--spacing-sm)'
            }}>
              {filteredCompletedStudents.length > 0 ? (
                filteredCompletedStudents.map((student: any) => {
                  const evaluation = homework.evaluations?.find((e) => e.student_id === student.id);
                  return (
                    <div 
                      key={student.id} 
                      className="student-item"
                      style={{ 
                        padding: 'var(--spacing-sm)', 
                        borderBottom: '1px solid var(--gray-200)',
                        background: evaluation ? '#e8f5e9' : 'transparent',
                        marginBottom: 'var(--spacing-sm)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xs)' }}>
                        <span style={{ cursor: 'pointer' }} onClick={() => moveToAvailable(student.id)}>
                          {student.admission_no} - {student.first_name} {student.last_name || ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => moveToAvailable(student.id)}
                          style={{ 
                            padding: '2px 8px', 
                            fontSize: '12px', 
                            background: 'var(--error-color)', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                      <div style={{ marginTop: 'var(--spacing-xs)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                            Status:
                          </label>
                          <select
                            value={studentStatuses[student.id] || 'completed'}
                            onChange={(e) => setStudentStatuses((prev) => ({ ...prev, [student.id]: e.target.value as 'pending' | 'completed' | 'in_progress' }))}
                            style={{
                              width: '100%',
                              padding: 'var(--spacing-xs)',
                              border: '1px solid var(--gray-300)',
                              borderRadius: 'var(--border-radius-sm)',
                              fontSize: '12px'
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                            Remarks:
                          </label>
                          <textarea
                            value={studentRemarks[student.id] || ''}
                            onChange={(e) => setStudentRemarks((prev) => ({ ...prev, [student.id]: e.target.value }))}
                            placeholder="Enter remarks for this student..."
                            rows={2}
                            style={{
                              width: '100%',
                              padding: 'var(--spacing-xs)',
                              border: '1px solid var(--gray-300)',
                              borderRadius: 'var(--border-radius-sm)',
                              fontSize: '12px',
                              resize: 'vertical'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: 'var(--spacing-md)', textAlign: 'center', color: 'var(--gray-500)' }}>
                  No students completed
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="homework-summary" style={{ 
          marginTop: 'var(--spacing-lg)',
          padding: 'var(--spacing-lg)',
          background: 'var(--gray-50)',
          borderRadius: 'var(--border-radius)',
          border: '1px solid var(--gray-200)'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-md)' }}>Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
            <div><strong>Homework Date:</strong> {new Date(homework.homework_date).toLocaleDateString()}</div>
            <div><strong>Submission Date:</strong> {new Date(homework.submission_date).toLocaleDateString()}</div>
            <div><strong>Evaluation Date:</strong> 
              <input
                type="date"
                value={evaluationDate}
                onChange={(e) => setEvaluationDate(e.target.value)}
                style={{ marginLeft: 'var(--spacing-sm)', padding: 'var(--spacing-xs)' }}
                required
              />
            </div>
            <div><strong>Class:</strong> {homework.class_name}</div>
            <div><strong>Section:</strong> {homework.section_name}</div>
            <div><strong>Subject:</strong> {homework.subject_name}</div>
            <div><strong>Created By:</strong> {homework.created_by_name || '-'}</div>
            {homework.evaluations && homework.evaluations.length > 0 && (
              <div><strong>Evaluated By:</strong> {homework.evaluations[0]?.evaluated_by_name || '-'}</div>
            )}
            {homework.attachment_url && (
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>Attachment:</strong>{' '}
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleDownloadAttachment(homework.attachment_url!);
                  }}
                  style={{ color: 'var(--primary-color)', cursor: 'pointer' }}
                >
                  Download
                </a>
              </div>
            )}
            {homework.description && (
              <div style={{ gridColumn: '1 / -1', marginTop: 'var(--spacing-sm)' }}>
                <strong>Description:</strong>
                <p style={{ whiteSpace: 'pre-wrap', marginTop: 'var(--spacing-xs)', color: 'var(--gray-700)' }}>
                  {homework.description}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: 'var(--spacing-lg)' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={evaluateMutation.isLoading || completedStudentIds.length === 0 || !evaluationDate}
          >
            {evaluateMutation.isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default Homework;

