import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import {
  lessonPlanService,
  SubjectStatus,
  LessonPlan as LessonPlanType,
  LessonPlanTopic,
} from '../../services/api/lessonPlanService';
import { academicsService } from '../../services/api/academicsService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import './LessonPlan.css';

type TabType = 'subject-status' | 'lesson-plans';

const LessonPlan = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType;
  const validTabs: TabType[] = ['subject-status', 'lesson-plans'];
  const defaultTab: TabType = validTabs.includes(tabFromUrl) ? tabFromUrl : 'subject-status';

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
    <div className="lesson-plan-page">
      <div className="page-header">
        <h1>Lesson Plan</h1>
      </div>

      <div className="lesson-plan-tabs-wrapper">
        <div className="lesson-plan-tabs-container">
          {showLeftArrow && (
            <button
              className="lesson-plan-tabs-arrow lesson-plan-tabs-arrow-left"
              onClick={() => scrollTabs('left')}
              aria-label="Scroll tabs left"
            >
              ‹
            </button>
          )}
          <div className="lesson-plan-tabs" ref={tabsContainerRef}>
            <button
              ref={activeTab === 'subject-status' ? activeTabRef : null}
              className={activeTab === 'subject-status' ? 'active' : ''}
              onClick={() => handleTabChange('subject-status')}
            >
              Subject Status
            </button>
            <button
              ref={activeTab === 'lesson-plans' ? activeTabRef : null}
              className={activeTab === 'lesson-plans' ? 'active' : ''}
              onClick={() => handleTabChange('lesson-plans')}
            >
              Lesson Plans
            </button>
          </div>
          {showRightArrow && (
            <button
              className="lesson-plan-tabs-arrow lesson-plan-tabs-arrow-right"
              onClick={() => scrollTabs('right')}
              aria-label="Scroll tabs right"
            >
              ›
            </button>
          )}
        </div>
      </div>

      <div className="lesson-plan-content">
        {activeTab === 'subject-status' && <SubjectStatusTab />}
        {activeTab === 'lesson-plans' && <LessonPlansTab />}
      </div>
    </div>
  );
};

// ========== Subject Status Tab ==========

const SubjectStatusTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<SubjectStatus | null>(null);
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: classesData } = useQuery(['classes'], academicsService.getClasses, {
    refetchOnWindowFocus: false,
  });
  const classes = classesData?.data || [];

  const { data: sectionsData } = useQuery(['sections'], () => academicsService.getSections(), {
    refetchOnWindowFocus: false,
  });
  const sections = sectionsData?.data || [];

  const { data: subjectsData } = useQuery(['subjects'], academicsService.getSubjects, {
    refetchOnWindowFocus: false,
  });
  const subjects = subjectsData?.data || [];

  const { data: statuses = [], isLoading } = useQuery(
    ['subject-status', classFilter, sectionFilter, subjectFilter, statusFilter],
    () =>
      lessonPlanService.getSubjectStatus({
        class_id: classFilter ? parseInt(classFilter) : undefined,
        section_id: sectionFilter ? parseInt(sectionFilter) : undefined,
        subject_id: subjectFilter ? parseInt(subjectFilter) : undefined,
        status: statusFilter || undefined,
      }),
    { refetchOnWindowFocus: true }
  );

  const createMutation = useMutation(lessonPlanService.createSubjectStatus, {
    onSuccess: () => {
      queryClient.invalidateQueries(['subject-status']);
      setShowCreateModal(false);
      showToast('Subject status created successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create subject status', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<SubjectStatus> }) =>
      lessonPlanService.updateSubjectStatus(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['subject-status']);
        setShowEditModal(false);
        setSelectedStatus(null);
        showToast('Subject status updated successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update subject status', 'error');
      },
    }
  );

  const deleteMutation = useMutation(lessonPlanService.deleteSubjectStatus, {
    onSuccess: () => {
      queryClient.invalidateQueries(['subject-status']);
      showToast('Subject status deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete subject status', 'error');
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      class_id: parseInt(formData.get('class_id') as string),
      section_id: parseInt(formData.get('section_id') as string),
      subject_id: parseInt(formData.get('subject_id') as string),
      topic_name: formData.get('topic_name') as string,
      start_date: formData.get('start_date') as string || undefined,
      completion_date: formData.get('completion_date') as string || undefined,
      status: (formData.get('status') as any) || 'not_started',
      completion_percentage: formData.get('completion_percentage')
        ? parseInt(formData.get('completion_percentage') as string)
        : 0,
      notes: formData.get('notes') as string || undefined,
    });
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedStatus) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: selectedStatus.id,
      data: {
        topic_name: formData.get('topic_name') as string,
        start_date: formData.get('start_date') as string || undefined,
        completion_date: formData.get('completion_date') as string || undefined,
        status: (formData.get('status') as any),
        completion_percentage: formData.get('completion_percentage')
          ? parseInt(formData.get('completion_percentage') as string)
          : undefined,
        notes: formData.get('notes') as string || undefined,
      },
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this subject status?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEditClick = (status: SubjectStatus) => {
    setSelectedStatus(status);
    setShowEditModal(true);
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div className="search-filter">
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
            <option value="">All Sections</option>
            {sections
              .filter((sec) => !classFilter || (sec as any).class_id === parseInt(classFilter))
              .map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
          </select>
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
            <option value="">All Subjects</option>
            {subjects.map((subj) => (
              <option key={subj.id} value={subj.id}>
                {subj.name}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Add Subject Status
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>Section</th>
                <th>Subject</th>
                <th>Topic</th>
                <th>Start Date</th>
                <th>Completion Date</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {statuses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-state">
                    No subject status records found
                  </td>
                </tr>
              ) : (
                statuses.map((status) => (
                  <tr key={status.id}>
                    <td>{status.class_name || '-'}</td>
                    <td>{status.section_name || '-'}</td>
                    <td>{status.subject_name || '-'}</td>
                    <td>{status.topic_name}</td>
                    <td>{status.start_date ? new Date(status.start_date).toLocaleDateString() : '-'}</td>
                    <td>{status.completion_date ? new Date(status.completion_date).toLocaleDateString() : '-'}</td>
                    <td>
                      <span
                        className={`badge ${
                          status.status === 'completed'
                            ? 'badge-success'
                            : status.status === 'in_progress'
                            ? 'badge-warning'
                            : 'badge-inactive'
                        }`}
                      >
                        {status.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${status.completion_percentage}%` }}
                        ></div>
                        <span className="progress-text">{status.completion_percentage}%</span>
                      </div>
                    </td>
                    <td>
                      <button className="btn-sm btn-edit" onClick={() => handleEditClick(status)}>
                        Edit
                      </button>
                      <button className="btn-sm btn-delete" onClick={() => handleDelete(status.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Subject Status"
        size="large"
      >
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <div className="form-group">
              <label>Class *</label>
              <select name="class_id" required>
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Section *</label>
              <select name="section_id" required>
                <option value="">Select Section</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Subject *</label>
            <select name="subject_id" required>
              <option value="">Select Subject</option>
              {subjects.map((subj) => (
                <option key={subj.id} value={subj.id}>
                  {subj.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Topic Name *</label>
            <input type="text" name="topic_name" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" name="start_date" />
            </div>
            <div className="form-group">
              <label>Completion Date</label>
              <input type="date" name="completion_date" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select name="status" defaultValue="not_started">
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="form-group">
              <label>Completion Percentage</label>
              <input
                type="number"
                name="completion_percentage"
                min="0"
                max="100"
                defaultValue="0"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea name="notes" rows={3}></textarea>
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStatus(null);
        }}
        title="Edit Subject Status"
        size="large"
      >
        {selectedStatus && (
          <form onSubmit={handleEdit}>
            <div className="form-group">
              <label>Topic Name *</label>
              <input type="text" name="topic_name" defaultValue={selectedStatus.topic_name} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  defaultValue={selectedStatus.start_date ? selectedStatus.start_date.split('T')[0] : ''}
                />
              </div>
              <div className="form-group">
                <label>Completion Date</label>
                <input
                  type="date"
                  name="completion_date"
                  defaultValue={
                    selectedStatus.completion_date ? selectedStatus.completion_date.split('T')[0] : ''
                  }
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select name="status" defaultValue={selectedStatus.status}>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="form-group">
                <label>Completion Percentage</label>
                <input
                  type="number"
                  name="completion_percentage"
                  min="0"
                  max="100"
                  defaultValue={selectedStatus.completion_percentage}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea name="notes" rows={3} defaultValue={selectedStatus.notes || ''}></textarea>
            </div>
            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedStatus(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Update
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

// ========== Lesson Plans Tab ==========

const LessonPlansTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<LessonPlanType | null>(null);
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: classesData } = useQuery(['classes'], academicsService.getClasses, {
    refetchOnWindowFocus: false,
  });
  const classes = classesData?.data || [];

  const { data: sectionsData } = useQuery(['sections'], () => academicsService.getSections(), {
    refetchOnWindowFocus: false,
  });
  const sections = sectionsData?.data || [];

  const { data: subjectsData } = useQuery(['subjects'], academicsService.getSubjects, {
    refetchOnWindowFocus: false,
  });
  const subjects = subjectsData?.data || [];

  const { data: plans = [], isLoading } = useQuery(
    ['lesson-plans', classFilter, sectionFilter, subjectFilter, statusFilter],
    () =>
      lessonPlanService.getLessonPlans({
        class_id: classFilter ? parseInt(classFilter) : undefined,
        section_id: sectionFilter ? parseInt(sectionFilter) : undefined,
        subject_id: subjectFilter ? parseInt(subjectFilter) : undefined,
        status: statusFilter || undefined,
      }),
    { refetchOnWindowFocus: true }
  );

  const createMutation = useMutation(lessonPlanService.createLessonPlan, {
    onSuccess: () => {
      queryClient.invalidateQueries(['lesson-plans']);
      setShowCreateModal(false);
      showToast('Lesson plan created successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create lesson plan', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<LessonPlanType> }) =>
      lessonPlanService.updateLessonPlan(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['lesson-plans']);
        setShowEditModal(false);
        setSelectedPlan(null);
        showToast('Lesson plan updated successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update lesson plan', 'error');
      },
    }
  );

  const deleteMutation = useMutation(lessonPlanService.deleteLessonPlan, {
    onSuccess: () => {
      queryClient.invalidateQueries(['lesson-plans']);
      showToast('Lesson plan deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete lesson plan', 'error');
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      class_id: parseInt(formData.get('class_id') as string),
      section_id: parseInt(formData.get('section_id') as string),
      subject_id: parseInt(formData.get('subject_id') as string),
      lesson_title: formData.get('lesson_title') as string,
      lesson_date: formData.get('lesson_date') as string,
      topic: formData.get('topic') as string || undefined,
      learning_objectives: formData.get('learning_objectives') as string || undefined,
      teaching_methods: formData.get('teaching_methods') as string || undefined,
      materials_needed: formData.get('materials_needed') as string || undefined,
      activities: formData.get('activities') as string || undefined,
      homework: formData.get('homework') as string || undefined,
      assessment: formData.get('assessment') as string || undefined,
      notes: formData.get('notes') as string || undefined,
      status: (formData.get('status') as any) || 'draft',
    });
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPlan) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: selectedPlan.id,
      data: {
        lesson_title: formData.get('lesson_title') as string,
        lesson_date: formData.get('lesson_date') as string,
        topic: formData.get('topic') as string || undefined,
        learning_objectives: formData.get('learning_objectives') as string || undefined,
        teaching_methods: formData.get('teaching_methods') as string || undefined,
        materials_needed: formData.get('materials_needed') as string || undefined,
        activities: formData.get('activities') as string || undefined,
        homework: formData.get('homework') as string || undefined,
        assessment: formData.get('assessment') as string || undefined,
        notes: formData.get('notes') as string || undefined,
        status: (formData.get('status') as any),
      },
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this lesson plan?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEditClick = (plan: LessonPlanType) => {
    setSelectedPlan(plan);
    setShowEditModal(true);
  };

  const handleViewClick = async (plan: LessonPlanType) => {
    const fullPlan = await lessonPlanService.getLessonPlanById(plan.id);
    setSelectedPlan(fullPlan);
    setShowViewModal(true);
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div className="search-filter">
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
            <option value="">All Sections</option>
            {sections
              .filter((sec) => !classFilter || (sec as any).class_id === parseInt(classFilter))
              .map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
          </select>
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
            <option value="">All Subjects</option>
            {subjects.map((subj) => (
              <option key={subj.id} value={subj.id}>
                {subj.name}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Add Lesson Plan
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Lesson Title</th>
                <th>Class</th>
                <th>Section</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Topics</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-state">
                    No lesson plans found
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id}>
                    <td>{plan.lesson_title}</td>
                    <td>{plan.class_name || '-'}</td>
                    <td>{plan.section_name || '-'}</td>
                    <td>{plan.subject_name || '-'}</td>
                    <td>{new Date(plan.lesson_date).toLocaleDateString()}</td>
                    <td>{plan.topics_count || 0}</td>
                    <td>
                      <span
                        className={`badge ${
                          plan.status === 'completed'
                            ? 'badge-success'
                            : plan.status === 'published'
                            ? 'badge-info'
                            : 'badge-warning'
                        }`}
                      >
                        {plan.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-sm btn-view" onClick={() => handleViewClick(plan)}>
                        View
                      </button>
                      <button className="btn-sm btn-edit" onClick={() => handleEditClick(plan)}>
                        Edit
                      </button>
                      <button className="btn-sm btn-delete" onClick={() => handleDelete(plan.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Lesson Plan"
        size="large"
      >
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <div className="form-group">
              <label>Class *</label>
              <select name="class_id" required>
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Section *</label>
              <select name="section_id" required>
                <option value="">Select Section</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Subject *</label>
            <select name="subject_id" required>
              <option value="">Select Subject</option>
              {subjects.map((subj) => (
                <option key={subj.id} value={subj.id}>
                  {subj.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Lesson Title *</label>
              <input type="text" name="lesson_title" required />
            </div>
            <div className="form-group">
              <label>Lesson Date *</label>
              <input type="date" name="lesson_date" required />
            </div>
          </div>
          <div className="form-group">
            <label>Topic</label>
            <input type="text" name="topic" />
          </div>
          <div className="form-group">
            <label>Learning Objectives</label>
            <textarea name="learning_objectives" rows={3}></textarea>
          </div>
          <div className="form-group">
            <label>Teaching Methods</label>
            <textarea name="teaching_methods" rows={2}></textarea>
          </div>
          <div className="form-group">
            <label>Materials Needed</label>
            <textarea name="materials_needed" rows={2}></textarea>
          </div>
          <div className="form-group">
            <label>Activities</label>
            <textarea name="activities" rows={3}></textarea>
          </div>
          <div className="form-group">
            <label>Homework</label>
            <textarea name="homework" rows={2}></textarea>
          </div>
          <div className="form-group">
            <label>Assessment</label>
            <textarea name="assessment" rows={2}></textarea>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea name="notes" rows={2}></textarea>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="status" defaultValue="draft">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPlan(null);
        }}
        title="Edit Lesson Plan"
        size="large"
      >
        {selectedPlan && (
          <form onSubmit={handleEdit}>
            <div className="form-row">
              <div className="form-group">
                <label>Lesson Title *</label>
                <input type="text" name="lesson_title" defaultValue={selectedPlan.lesson_title} required />
              </div>
              <div className="form-group">
                <label>Lesson Date *</label>
                <input
                  type="date"
                  name="lesson_date"
                  defaultValue={selectedPlan.lesson_date.split('T')[0]}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Topic</label>
              <input type="text" name="topic" defaultValue={selectedPlan.topic || ''} />
            </div>
            <div className="form-group">
              <label>Learning Objectives</label>
              <textarea name="learning_objectives" rows={3} defaultValue={selectedPlan.learning_objectives || ''}></textarea>
            </div>
            <div className="form-group">
              <label>Teaching Methods</label>
              <textarea name="teaching_methods" rows={2} defaultValue={selectedPlan.teaching_methods || ''}></textarea>
            </div>
            <div className="form-group">
              <label>Materials Needed</label>
              <textarea name="materials_needed" rows={2} defaultValue={selectedPlan.materials_needed || ''}></textarea>
            </div>
            <div className="form-group">
              <label>Activities</label>
              <textarea name="activities" rows={3} defaultValue={selectedPlan.activities || ''}></textarea>
            </div>
            <div className="form-group">
              <label>Homework</label>
              <textarea name="homework" rows={2} defaultValue={selectedPlan.homework || ''}></textarea>
            </div>
            <div className="form-group">
              <label>Assessment</label>
              <textarea name="assessment" rows={2} defaultValue={selectedPlan.assessment || ''}></textarea>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea name="notes" rows={2} defaultValue={selectedPlan.notes || ''}></textarea>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" defaultValue={selectedPlan.status}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedPlan(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Update
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedPlan(null);
        }}
        title="View Lesson Plan"
        size="large"
      >
        {selectedPlan && (
          <div className="lesson-plan-view">
            <div className="view-section">
              <h3>{selectedPlan.lesson_title}</h3>
              <p>
                <strong>Class:</strong> {selectedPlan.class_name} - {selectedPlan.section_name} |{' '}
                <strong>Subject:</strong> {selectedPlan.subject_name} | <strong>Date:</strong>{' '}
                {new Date(selectedPlan.lesson_date).toLocaleDateString()}
              </p>
            </div>
            {selectedPlan.topic && (
              <div className="view-section">
                <h4>Topic</h4>
                <p>{selectedPlan.topic}</p>
              </div>
            )}
            {selectedPlan.learning_objectives && (
              <div className="view-section">
                <h4>Learning Objectives</h4>
                <p>{selectedPlan.learning_objectives}</p>
              </div>
            )}
            {selectedPlan.teaching_methods && (
              <div className="view-section">
                <h4>Teaching Methods</h4>
                <p>{selectedPlan.teaching_methods}</p>
              </div>
            )}
            {selectedPlan.materials_needed && (
              <div className="view-section">
                <h4>Materials Needed</h4>
                <p>{selectedPlan.materials_needed}</p>
              </div>
            )}
            {selectedPlan.activities && (
              <div className="view-section">
                <h4>Activities</h4>
                <p>{selectedPlan.activities}</p>
              </div>
            )}
            {selectedPlan.homework && (
              <div className="view-section">
                <h4>Homework</h4>
                <p>{selectedPlan.homework}</p>
              </div>
            )}
            {selectedPlan.assessment && (
              <div className="view-section">
                <h4>Assessment</h4>
                <p>{selectedPlan.assessment}</p>
              </div>
            )}
            {selectedPlan.notes && (
              <div className="view-section">
                <h4>Notes</h4>
                <p>{selectedPlan.notes}</p>
              </div>
            )}
            {selectedPlan.topics && selectedPlan.topics.length > 0 && (
              <div className="view-section">
                <h4>Topics</h4>
                <ul>
                  {selectedPlan.topics.map((topic) => (
                    <li key={topic.id}>
                      {topic.topic_name} ({topic.status}) - {topic.estimated_duration} min
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selectedPlan.attachments && selectedPlan.attachments.length > 0 && (
              <div className="view-section">
                <h4>Attachments</h4>
                <ul>
                  {selectedPlan.attachments.map((attachment) => (
                    <li key={attachment.id}>
                      <a
                        href={`${import.meta.env.VITE_API_BASE_URL}${attachment.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {attachment.file_name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LessonPlan;

