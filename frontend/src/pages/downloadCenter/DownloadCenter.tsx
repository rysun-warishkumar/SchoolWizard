import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import {
  downloadCenterService,
  DownloadContent,
} from '../../services/api/downloadCenterService';
import { academicsService } from '../../services/api/academicsService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import './DownloadCenter.css';

type TabType = 'upload-content' | 'assignments' | 'study-material' | 'syllabus' | 'other-downloads';

const DownloadCenter = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType;
  const validTabs: TabType[] = ['upload-content', 'assignments', 'study-material', 'syllabus', 'other-downloads'];
  const defaultTab: TabType = validTabs.includes(tabFromUrl) ? tabFromUrl : 'upload-content';

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Scroll to active tab
  const scrollToActiveTab = () => {
    if (activeTabRef.current && tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const tab = activeTabRef.current;
      const containerRect = container.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      
      const scrollLeft = container.scrollLeft;
      const tabLeft = tabRect.left - containerRect.left + scrollLeft;
      const tabWidth = tabRect.width;
      const containerWidth = containerRect.width;
      
      const targetScroll = tabLeft - (containerWidth / 2) + (tabWidth / 2);
      
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
  };

  // Check if arrows should be visible
  const checkArrows = () => {
    if (tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const hasOverflow = container.scrollWidth > container.clientWidth;
      
      if (hasOverflow) {
        setShowLeftArrow(container.scrollLeft > 5);
        setShowRightArrow(
          container.scrollLeft < container.scrollWidth - container.clientWidth - 5
        );
      } else {
        setShowLeftArrow(false);
        setShowRightArrow(false);
      }
    }
  };

  // Scroll tabs left/right
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const scrollAmount = 250;
      const currentScroll = container.scrollLeft;
      const newScrollLeft = direction === 'left' 
        ? Math.max(0, currentScroll - scrollAmount)
        : Math.min(container.scrollWidth - container.clientWidth, currentScroll + scrollAmount);
      
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
      
      setTimeout(() => {
        checkArrows();
      }, 300);
    }
  };

  // Initialize and check arrows
  useEffect(() => {
    checkArrows();
    scrollToActiveTab();
  }, []);

  // Check arrows on scroll and window resize
  useEffect(() => {
    const container = tabsContainerRef.current;
    if (container) {
      checkArrows();
      container.addEventListener('scroll', checkArrows);
      window.addEventListener('resize', checkArrows);
      
      const resizeObserver = new ResizeObserver(() => {
        checkArrows();
      });
      resizeObserver.observe(container);
      
      return () => {
        container.removeEventListener('scroll', checkArrows);
        window.removeEventListener('resize', checkArrows);
        resizeObserver.disconnect();
      };
    }
  }, []);

  // Scroll to active tab when it changes
  useEffect(() => {
    scrollToActiveTab();
  }, [activeTab]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="download-center-page">
      <div className="page-header">
        <h1>Download Center</h1>
      </div>

      <div className="download-center-tabs-wrapper">
        <div className="download-center-tabs-container">
          {showLeftArrow && (
            <button
              className="download-center-tabs-arrow download-center-tabs-arrow-left"
              onClick={() => scrollTabs('left')}
              aria-label="Scroll tabs left"
            >
              ‹
            </button>
          )}
          <div className="download-center-tabs" ref={tabsContainerRef}>
            <button
              ref={activeTab === 'upload-content' ? activeTabRef : null}
              className={activeTab === 'upload-content' ? 'active' : ''}
              onClick={() => handleTabChange('upload-content')}
            >
              Upload Content
            </button>
            <button
              ref={activeTab === 'assignments' ? activeTabRef : null}
              className={activeTab === 'assignments' ? 'active' : ''}
              onClick={() => handleTabChange('assignments')}
            >
              Assignments
            </button>
            <button
              ref={activeTab === 'study-material' ? activeTabRef : null}
              className={activeTab === 'study-material' ? 'active' : ''}
              onClick={() => handleTabChange('study-material')}
            >
              Study Material
            </button>
            <button
              ref={activeTab === 'syllabus' ? activeTabRef : null}
              className={activeTab === 'syllabus' ? 'active' : ''}
              onClick={() => handleTabChange('syllabus')}
            >
              Syllabus
            </button>
            <button
              ref={activeTab === 'other-downloads' ? activeTabRef : null}
              className={activeTab === 'other-downloads' ? 'active' : ''}
              onClick={() => handleTabChange('other-downloads')}
            >
              Other Downloads
            </button>
          </div>
          {showRightArrow && (
            <button
              className="download-center-tabs-arrow download-center-tabs-arrow-right"
              onClick={() => scrollTabs('right')}
              aria-label="Scroll tabs right"
            >
              ›
            </button>
          )}
        </div>
      </div>

      <div className="download-center-content">
        {activeTab === 'upload-content' && <UploadContentTab />}
        {activeTab === 'assignments' && <ContentListTab content_type="assignments" />}
        {activeTab === 'study-material' && <ContentListTab content_type="study_material" />}
        {activeTab === 'syllabus' && <ContentListTab content_type="syllabus" />}
        {activeTab === 'other-downloads' && <ContentListTab content_type="other_downloads" />}
      </div>
    </div>
  );
};

// ========== Upload Content Tab ==========

const UploadContentTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<DownloadContent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: contents = [], isLoading, refetch } = useQuery(
    ['download-contents', 'all', searchTerm],
    () =>
      downloadCenterService.getDownloadContents({
        search: searchTerm || undefined,
      }),
    {
      refetchOnWindowFocus: true,
    }
  );

  const { data: classes = [] } = useQuery('classes', () =>
    academicsService.getClasses().then((res) => res.data)
  );
  const { data: sections = [] } = useQuery('sections', () =>
    academicsService.getSections().then((res) => res.data)
  );

  const [formData, setFormData] = useState({
    content_title: '',
    content_type: 'assignments' as 'assignments' | 'study_material' | 'syllabus' | 'other_downloads',
    available_for: 'students' as 'students' | 'staff' | 'both',
    class_id: '',
    section_id: '',
    upload_date: new Date().toISOString().split('T')[0],
    description: '',
    file: null as File | null,
  });

  const [filePreview, setFilePreview] = useState<string>('');

  const createMutation = useMutation(
    (data: FormData) => downloadCenterService.createDownloadContent(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('download-contents');
        refetch();
        showToast('Content uploaded successfully', 'success');
        setShowCreateModal(false);
        resetForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to upload content', 'error');
      },
    }
  );

  const updateMutation = useMutation(
    (data: { id: number; formData: FormData }) => downloadCenterService.updateDownloadContent(data.id, data.formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('download-contents');
        refetch();
        showToast('Content updated successfully', 'success');
        setShowEditModal(false);
        setSelectedContent(null);
        resetForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update content', 'error');
      },
    }
  );

  const deleteMutation = useMutation(downloadCenterService.deleteDownloadContent, {
    onSuccess: () => {
      queryClient.invalidateQueries('download-contents');
      refetch();
      showToast('Content deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete content', 'error');
    },
  });

  const resetForm = () => {
    setFormData({
      content_title: '',
      content_type: 'assignments',
      available_for: 'students',
      class_id: '',
      section_id: '',
      upload_date: new Date().toISOString().split('T')[0],
      description: '',
      file: null,
    });
    setFilePreview('');
  };

  // Reset class and section when available_for changes to 'staff'
  const handleAvailableForChange = (value: 'students' | 'staff' | 'both') => {
    if (value === 'staff') {
      setFormData({ ...formData, available_for: value, class_id: '', section_id: '' });
    } else {
      setFormData({ ...formData, available_for: value });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, file });
      setFilePreview(file.name);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.content_title || !formData.content_type || !formData.upload_date) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    if (!formData.file) {
      showToast('Please select a file to upload', 'error');
      return;
    }

    // Validate file size (50MB limit)
    if (formData.file.size > 50 * 1024 * 1024) {
      showToast('File size exceeds 50MB limit', 'error');
      return;
    }

    // If available_for is "students" or "both", class_id is optional but section_id should match class
    if ((formData.available_for === 'students' || formData.available_for === 'both') && formData.class_id && formData.section_id) {
      // Validate that section belongs to the selected class
      // This validation is handled on backend, but we can add frontend check if needed
    }

    const submitFormData = new FormData();
    submitFormData.append('content_title', formData.content_title.trim());
    submitFormData.append('content_type', formData.content_type);
    submitFormData.append('available_for', formData.available_for);
    
    // Only append class_id and section_id if available_for is "students" or "both"
    if (formData.available_for === 'students' || formData.available_for === 'both') {
      if (formData.class_id) submitFormData.append('class_id', formData.class_id);
      if (formData.section_id) submitFormData.append('section_id', formData.section_id);
    }
    
    submitFormData.append('upload_date', formData.upload_date);
    if (formData.description) submitFormData.append('description', formData.description.trim());
    submitFormData.append('file', formData.file);

    createMutation.mutate(submitFormData);
  };

  const handleEdit = (content: DownloadContent) => {
    setSelectedContent(content);
    setFormData({
      content_title: content.content_title,
      content_type: content.content_type,
      available_for: content.available_for,
      class_id: content.class_id?.toString() || '',
      section_id: content.section_id?.toString() || '',
      upload_date: content.upload_date,
      description: content.description || '',
      file: null,
    });
    setFilePreview(content.file_name);
    setShowEditModal(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!selectedContent || !formData.content_title || !formData.content_type || !formData.upload_date) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    // Validate file size if new file is provided
    if (formData.file && formData.file.size > 50 * 1024 * 1024) {
      showToast('File size exceeds 50MB limit', 'error');
      return;
    }

    const submitFormData = new FormData();
    submitFormData.append('content_title', formData.content_title.trim());
    submitFormData.append('content_type', formData.content_type);
    submitFormData.append('available_for', formData.available_for);
    
    // Only append class_id and section_id if available_for is "students" or "both"
    if (formData.available_for === 'students' || formData.available_for === 'both') {
      if (formData.class_id) submitFormData.append('class_id', formData.class_id);
      if (formData.section_id) submitFormData.append('section_id', formData.section_id);
    } else {
      // Clear class and section for staff-only content
      submitFormData.append('class_id', '');
      submitFormData.append('section_id', '');
    }
    
    submitFormData.append('upload_date', formData.upload_date);
    if (formData.description) submitFormData.append('description', formData.description.trim());
    if (formData.file) {
      submitFormData.append('file', formData.file);
    }

    updateMutation.mutate({ id: selectedContent.id, formData: submitFormData });
  };

  const handleDownload = async (content: DownloadContent) => {
    try {
      const blob = await downloadCenterService.downloadFile(content.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = content.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to download file', 'error');
    }
  };

  return (
    <div className="download-center-tab-content">
      <div className="upload-content-header">
        <input
          type="text"
          placeholder="Search content..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
          + Upload Content
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : contents.length > 0 ? (
        <div className="table-responsive-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Content Title</th>
                <th>Type</th>
                <th>Available For</th>
                <th>Class - Section</th>
                <th>Upload Date</th>
                <th>File Name</th>
                <th>Uploaded By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contents.map((content) => (
                <tr key={content.id}>
                  <td>{content.content_title}</td>
                  <td>
                    <span className="content-type-badge">{content.content_type.replace('_', ' ')}</span>
                  </td>
                  <td>{content.available_for}</td>
                  <td>
                    {content.class_name && content.section_name
                      ? `${content.class_name} - ${content.section_name}`
                      : content.class_name || '-'}
                  </td>
                  <td>{new Date(content.upload_date).toLocaleDateString()}</td>
                  <td>{content.file_name}</td>
                  <td>{content.uploaded_by_name || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-sm btn-primary"
                        onClick={() => handleDownload(content)}
                        title="Download"
                      >
                        Download
                      </button>
                      <button
                        className="btn-sm btn-secondary"
                        onClick={() => handleEdit(content)}
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        className="btn-sm btn-danger"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this content?')) {
                            deleteMutation.mutate(content.id);
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
        <div className="empty-state">No content found</div>
      )}

      {/* Create Content Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Upload Content"
        size="large"
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>
                Content Title <span className="required">*</span>
              </label>
              <input
                type="text"
                value={formData.content_title}
                onChange={(e) => setFormData({ ...formData, content_title: e.target.value })}
                required
                placeholder="Enter content title"
              />
            </div>
            <div className="form-group">
              <label>
                Content Type <span className="required">*</span>
              </label>
              <select
                value={formData.content_type}
                onChange={(e) => setFormData({ ...formData, content_type: e.target.value as any })}
                required
              >
                <option value="assignments">Assignments</option>
                <option value="study_material">Study Material</option>
                <option value="syllabus">Syllabus</option>
                <option value="other_downloads">Other Downloads</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Available For <span className="required">*</span>
              </label>
              <select
                value={formData.available_for}
                onChange={(e) => handleAvailableForChange(e.target.value as any)}
                required
              >
                <option value="students">Students</option>
                <option value="staff">Staff</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="form-group">
              <label>Class</label>
              <select
                value={formData.class_id}
                onChange={(e) => {
                  setFormData({ ...formData, class_id: e.target.value, section_id: '' });
                }}
                disabled={formData.available_for === 'staff'}
              >
                <option value="">All Classes</option>
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              {formData.available_for === 'staff' && (
                <small className="field-hint">Class selection is only available for Students</small>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Section</label>
              <select
                value={formData.section_id}
                onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                disabled={!formData.class_id || formData.available_for === 'staff'}
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
              <label>
                Upload Date <span className="required">*</span>
              </label>
              <input
                type="date"
                value={formData.upload_date}
                onChange={(e) => setFormData({ ...formData, upload_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              File <span className="required">*</span>
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              required
              accept="*/*"
            />
            {filePreview && (
              <small className="file-preview">Selected: {filePreview}</small>
            )}
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Enter description"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>
              {createMutation.isLoading ? 'Uploading...' : 'Upload Content'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Content Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedContent(null);
          resetForm();
        }}
        title="Edit Content"
        size="large"
      >
        <form onSubmit={handleUpdateSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>
                Content Title <span className="required">*</span>
              </label>
              <input
                type="text"
                value={formData.content_title}
                onChange={(e) => setFormData({ ...formData, content_title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>
                Content Type <span className="required">*</span>
              </label>
              <select
                value={formData.content_type}
                onChange={(e) => setFormData({ ...formData, content_type: e.target.value as any })}
                required
              >
                <option value="assignments">Assignments</option>
                <option value="study_material">Study Material</option>
                <option value="syllabus">Syllabus</option>
                <option value="other_downloads">Other Downloads</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Available For <span className="required">*</span>
              </label>
              <select
                value={formData.available_for}
                onChange={(e) => handleAvailableForChange(e.target.value as any)}
                required
              >
                <option value="students">Students</option>
                <option value="staff">Staff</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="form-group">
              <label>Class</label>
              <select
                value={formData.class_id}
                onChange={(e) => {
                  setFormData({ ...formData, class_id: e.target.value, section_id: '' });
                }}
                disabled={formData.available_for === 'staff'}
              >
                <option value="">All Classes</option>
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              {formData.available_for === 'staff' && (
                <small className="field-hint">Class selection is only available for Students</small>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Section</label>
              <select
                value={formData.section_id}
                onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                disabled={!formData.class_id || formData.available_for === 'staff'}
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
              <label>
                Upload Date <span className="required">*</span>
              </label>
              <input
                type="date"
                value={formData.upload_date}
                onChange={(e) => setFormData({ ...formData, upload_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>File (Leave empty to keep current file)</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept="*/*"
            />
            {filePreview && (
              <small className="file-preview">
                {formData.file ? `New: ${filePreview}` : `Current: ${filePreview}`}
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowEditModal(false); setSelectedContent(null); resetForm(); }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={updateMutation.isLoading}>
              {updateMutation.isLoading ? 'Updating...' : 'Update Content'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ========== Content List Tab (for Assignments, Study Material, Syllabus, Other Downloads) ==========

interface ContentListTabProps {
  content_type: 'assignments' | 'study_material' | 'syllabus' | 'other_downloads';
}

const ContentListTab = ({ content_type }: ContentListTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: contents = [], isLoading, refetch } = useQuery(
    ['download-contents', content_type, searchTerm, classFilter, sectionFilter],
    () =>
      downloadCenterService.getDownloadContents({
        content_type,
        class_id: classFilter ? Number(classFilter) : undefined,
        section_id: sectionFilter ? Number(sectionFilter) : undefined,
        search: searchTerm || undefined,
      }),
    {
      refetchOnWindowFocus: true,
    }
  );

  const { data: classes = [] } = useQuery('classes', () =>
    academicsService.getClasses().then((res) => res.data)
  );
  const { data: sections = [] } = useQuery('sections', () =>
    academicsService.getSections().then((res) => res.data)
  );

  const deleteMutation = useMutation(downloadCenterService.deleteDownloadContent, {
    onSuccess: () => {
      queryClient.invalidateQueries('download-contents');
      refetch();
      showToast('Content deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete content', 'error');
    },
  });

  const handleDownload = async (content: DownloadContent) => {
    try {
      const blob = await downloadCenterService.downloadFile(content.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = content.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to download file', 'error');
    }
  };

  const getContentTypeLabel = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="download-center-tab-content">
      <div className="content-list-header">
        <div className="filters-section">
          <input
            type="text"
            placeholder="Search..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setSectionFilter('');
            }}
            className="filter-select"
          >
            <option value="">All Classes</option>
            {classes.map((cls: any) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="filter-select"
            disabled={!classFilter}
          >
            <option value="">All Sections</option>
            {sections.map((sec: any) => (
              <option key={sec.id} value={sec.id}>
                {sec.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : contents.length > 0 ? (
        <div className="table-responsive-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Content Title</th>
                <th>Available For</th>
                <th>Class - Section</th>
                <th>Upload Date</th>
                <th>File Name</th>
                <th>File Size</th>
                <th>Uploaded By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contents.map((content) => (
                <tr key={content.id}>
                  <td>{content.content_title}</td>
                  <td>{content.available_for}</td>
                  <td>
                    {content.class_name && content.section_name
                      ? `${content.class_name} - ${content.section_name}`
                      : content.class_name || '-'}
                  </td>
                  <td>{new Date(content.upload_date).toLocaleDateString()}</td>
                  <td>{content.file_name}</td>
                  <td>
                    {content.file_size
                      ? `${(content.file_size / 1024).toFixed(2)} KB`
                      : '-'}
                  </td>
                  <td>{content.uploaded_by_name || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-sm btn-primary"
                        onClick={() => handleDownload(content)}
                        title="Download"
                      >
                        Download
                      </button>
                      <button
                        className="btn-sm btn-danger"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this content?')) {
                            deleteMutation.mutate(content.id);
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
          No {getContentTypeLabel(content_type)} found
        </div>
      )}
    </div>
  );
};

export default DownloadCenter;

