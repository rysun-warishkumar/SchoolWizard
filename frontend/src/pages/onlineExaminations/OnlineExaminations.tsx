import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import {
  onlineExaminationsService,
  Question,
  OnlineExam,
} from '../../services/api/onlineExaminationsService';
import { academicsService } from '../../services/api/academicsService';
import { settingsService } from '../../services/api/settingsService';
import { studentsService } from '../../services/api/studentsService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import ExamResultsModal from './ExamResultsModal';
import './OnlineExaminations.css';

type TabType = 'question-bank' | 'online-exams';

const OnlineExaminations = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType;
  const validTabs: TabType[] = ['question-bank', 'online-exams'];
  const defaultTab: TabType = validTabs.includes(tabFromUrl) ? tabFromUrl : 'question-bank';

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setTimeout(() => {
      scrollToActiveTab();
    }, 100);
  };

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

      const targetScroll = tabLeft - containerWidth / 2 + tabWidth / 2;

      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
  };

  const checkArrows = () => {
    if (tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      // Only show arrows if tabs overflow the container width
      const hasOverflow = container.scrollWidth > container.clientWidth;
      
      if (hasOverflow) {
        setShowLeftArrow(container.scrollLeft > 5);
        setShowRightArrow(
          container.scrollLeft < container.scrollWidth - container.clientWidth - 5
        );
      } else {
        // Hide arrows if no overflow
        setShowLeftArrow(false);
        setShowRightArrow(false);
      }
    }
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = 250;
      const container = tabsContainerRef.current;
      const currentScroll = container.scrollLeft;
      const newScrollLeft =
        direction === 'left'
          ? Math.max(0, currentScroll - scrollAmount)
          : Math.min(
              container.scrollWidth - container.clientWidth,
              currentScroll + scrollAmount
            );
      container.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    checkArrows();
    const resizeObserver = new ResizeObserver(() => {
      checkArrows();
      scrollToActiveTab();
    });
    if (tabsContainerRef.current) {
      resizeObserver.observe(tabsContainerRef.current);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToActiveTab();
  }, [activeTab]);

  return (
    <div className="online-examinations-page">
      <div className="page-header">
        <h1>Online Examinations</h1>
      </div>

      <div className="online-examinations-tabs-wrapper">
        <div className="online-examinations-tabs-container">
          {showLeftArrow && (
            <button
              className="online-examinations-tabs-arrow online-examinations-tabs-arrow-left"
              onClick={() => scrollTabs('left')}
              aria-label="Scroll tabs left"
            >
              ‹
            </button>
          )}
          <div className="online-examinations-tabs" ref={tabsContainerRef}>
            <button
              ref={activeTab === 'question-bank' ? activeTabRef : null}
              className={activeTab === 'question-bank' ? 'active' : ''}
              onClick={() => handleTabChange('question-bank')}
            >
              Question Bank
            </button>
            <button
              ref={activeTab === 'online-exams' ? activeTabRef : null}
              className={activeTab === 'online-exams' ? 'active' : ''}
              onClick={() => handleTabChange('online-exams')}
            >
              Online Exam
            </button>
          </div>
          {showRightArrow && (
            <button
              className="online-examinations-tabs-arrow online-examinations-tabs-arrow-right"
              onClick={() => scrollTabs('right')}
              aria-label="Scroll tabs right"
            >
              ›
            </button>
          )}
        </div>
      </div>

      <div className="online-examinations-content">
        {activeTab === 'question-bank' && <QuestionBankTab />}
        {activeTab === 'online-exams' && <OnlineExamsTab />}
      </div>
    </div>
  );
};

// ========== Question Bank Tab ==========

const QuestionBankTab = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [formData, setFormData] = useState({
    subject_id: '',
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    option_e: '',
    correct_answer: 'A' as 'A' | 'B' | 'C' | 'D' | 'E',
    marks: '1.00',
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: subjectsData } = useQuery('subjects', () => academicsService.getSubjects().then(res => res.data || []));
  const subjects = Array.isArray(subjectsData) ? subjectsData : [];
  const { data: questions = [], isLoading } = useQuery(
    ['question-bank', subjectFilter],
    () => onlineExaminationsService.getQuestionBank(subjectFilter ? Number(subjectFilter) : undefined)
  );

  const createMutation = useMutation(onlineExaminationsService.createQuestion, {
    onSuccess: () => {
      queryClient.invalidateQueries('question-bank');
      showToast('Question created successfully', 'success');
      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create question', 'error');
    },
  });

  const updateMutation = useMutation(
    (data: { id: number; data: Partial<Question> }) => onlineExaminationsService.updateQuestion(data.id, data.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('question-bank');
        showToast('Question updated successfully', 'success');
        setShowModal(false);
        resetForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update question', 'error');
      },
    }
  );

  const deleteMutation = useMutation(onlineExaminationsService.deleteQuestion, {
    onSuccess: () => {
      queryClient.invalidateQueries('question-bank');
      showToast('Question deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete question', 'error');
    },
  });

  const resetForm = () => {
    setFormData({
      subject_id: '',
      question: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      option_e: '',
      correct_answer: 'A',
      marks: '1.00',
    });
    setSelectedQuestion(null);
  };

  const handleEdit = (question: Question) => {
    setSelectedQuestion(question);
    setFormData({
      subject_id: String(question.subject_id),
      question: question.question,
      option_a: question.option_a || '',
      option_b: question.option_b || '',
      option_c: question.option_c || '',
      option_d: question.option_d || '',
      option_e: question.option_e || '',
      correct_answer: question.correct_answer,
      marks: String(question.marks),
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject_id || !formData.question || !formData.correct_answer) {
      showToast('Subject, question, and correct answer are required', 'error');
      return;
    }

    const questionData = {
      subject_id: Number(formData.subject_id),
      question: formData.question.trim(),
      option_a: formData.option_a.trim() || undefined,
      option_b: formData.option_b.trim() || undefined,
      option_c: formData.option_c.trim() || undefined,
      option_d: formData.option_d.trim() || undefined,
      option_e: formData.option_e.trim() || undefined,
      correct_answer: formData.correct_answer,
      marks: Number(formData.marks),
    };

    if (selectedQuestion) {
      updateMutation.mutate({ id: selectedQuestion.id, data: questionData });
    } else {
      createMutation.mutate(questionData);
    }
  };

  return (
    <div className="online-examinations-tab-content">
      <div className="tab-header">
        <h2>Question Bank</h2>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Filter by Subject:</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              style={{ minWidth: '200px' }}
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </div>
          <button className="btn-primary btn-wm" onClick={() => { resetForm(); setShowModal(true); }}>
            + Add Question
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : questions && questions.length > 0 ? (
        <div className="table-responsive-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Question</th>
                <th>Options</th>
                <th>Correct Answer</th>
                <th>Marks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <tr key={question.id}>
                  <td>
                    {question.subject_name} ({question.subject_code})
                  </td>
                  <td style={{ maxWidth: '300px', wordWrap: 'break-word' }}>
                    {question.question}
                  </td>
                  <td style={{ maxWidth: '200px', fontSize: 'var(--font-size-sm)' }}>
                    {question.option_a && <div>A. {question.option_a}</div>}
                    {question.option_b && <div>B. {question.option_b}</div>}
                    {question.option_c && <div>C. {question.option_c}</div>}
                    {question.option_d && <div>D. {question.option_d}</div>}
                    {question.option_e && <div>E. {question.option_e}</div>}
                  </td>
                  <td>
                    <span className="badge badge-success">{question.correct_answer}</span>
                  </td>
                  <td>{question.marks}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-sm btn-secondary"
                        onClick={() => handleEdit(question)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-sm btn-danger"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this question?')) {
                            deleteMutation.mutate(question.id);
                          }
                        }}
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
        <div className="empty-state">No questions found</div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={selectedQuestion ? 'Edit Question' : 'Add Question'}
        size="large"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Subject <span className="required">*</span>
            </label>
            <select
              value={formData.subject_id}
              onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
              required
            >
              <option value="">Select Subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              Question <span className="required">*</span>
            </label>
            <textarea
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              rows={4}
              required
              placeholder="Enter the question text"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Option A</label>
              <input
                type="text"
                value={formData.option_a}
                onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Option B</label>
              <input
                type="text"
                value={formData.option_b}
                onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Option C</label>
              <input
                type="text"
                value={formData.option_c}
                onChange={(e) => setFormData({ ...formData, option_c: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Option D</label>
              <input
                type="text"
                value={formData.option_d}
                onChange={(e) => setFormData({ ...formData, option_d: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Option E (Optional)</label>
              <input
                type="text"
                value={formData.option_e}
                onChange={(e) => setFormData({ ...formData, option_e: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>
                Correct Answer <span className="required">*</span>
              </label>
              <select
                value={formData.correct_answer}
                onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value as any })}
                required
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Marks</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.marks}
              onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {createMutation.isLoading || updateMutation.isLoading
                ? 'Saving...'
                : selectedQuestion
                ? 'Update Question'
                : 'Create Question'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ========== Online Exams Tab ==========

const OnlineExamsTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignStudentsModal, setShowAssignStudentsModal] = useState(false);
  const [showAddQuestionsModal, setShowAddQuestionsModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<OnlineExam | null>(null);
  const [filters, setFilters] = useState({
    session_id: '',
    subject_id: '',
    class_id: '',
    is_published: '',
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: sessionsResponse } = useQuery('sessions', () => settingsService.getSessions());
  const sessions = Array.isArray(sessionsResponse?.data) ? sessionsResponse.data : [];
  const { data: subjectsData } = useQuery('subjects', () => academicsService.getSubjects().then(res => res.data || []));
  const subjects = Array.isArray(subjectsData) ? subjectsData : [];
  const { data: classes = [] } = useQuery('classes', () => academicsService.getClasses().then(res => res.data));
  const { data: sections = [] } = useQuery(
    ['sections', filters.class_id],
    () => academicsService.getSections(filters.class_id ? Number(filters.class_id) : undefined).then(res => res.data),
    { enabled: !!filters.class_id }
  );

  const { data: exams = [], isLoading } = useQuery(
    ['online-exams', filters],
    () =>
      onlineExaminationsService.getOnlineExams({
        session_id: filters.session_id ? Number(filters.session_id) : undefined,
        subject_id: filters.subject_id ? Number(filters.subject_id) : undefined,
        class_id: filters.class_id ? Number(filters.class_id) : undefined,
        is_published: filters.is_published ? filters.is_published === 'true' : undefined,
      }),
    {
      onError: (error: any) => {
        console.error('Error fetching online exams:', error);
      },
    }
  );

  const [createFormData, setCreateFormData] = useState({
    name: '',
    subject_id: '',
    session_id: '',
    class_id: '',
    section_id: '',
    exam_date: '',
    exam_time_from: '',
    exam_time_to: '',
    duration_minutes: '60',
    total_marks: '0',
    passing_marks: '0',
    instructions: '',
    is_published: false,
  });

  const createMutation = useMutation(onlineExaminationsService.createOnlineExam, {
    onSuccess: () => {
      queryClient.invalidateQueries('online-exams');
      showToast('Online exam created successfully', 'success');
      setShowCreateModal(false);
      resetCreateForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create online exam', 'error');
    },
  });

  const updateMutation = useMutation(
    (data: { id: number; data: Partial<OnlineExam> }) => onlineExaminationsService.updateOnlineExam(data.id, data.data),
    {
      onSuccess: async (response: any, variables) => {
        queryClient.invalidateQueries('online-exams');
        queryClient.invalidateQueries(['online-exam', variables.id]);
        // Use the updated exam data from the response if available, otherwise refetch
        if (selectedExam) {
          try {
            let updatedExam;
            if (response?.data?.data) {
              // Use the exam data returned from the update response
              updatedExam = response.data.data;
            } else {
              // Fallback: refetch if response doesn't include exam data
              updatedExam = await onlineExaminationsService.getOnlineExamById(variables.id);
            }
            // Create a new object to ensure React detects the change
            setSelectedExam({ ...updatedExam });
            showToast('Online exam updated successfully', 'success');
          } catch (error) {
            console.error('Error updating exam:', error);
            showToast('Exam updated but failed to refresh details', 'warning');
          }
        } else {
          showToast('Online exam updated successfully', 'success');
        }
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update online exam', 'error');
      },
    }
  );

  const deleteMutation = useMutation(onlineExaminationsService.deleteOnlineExam, {
    onSuccess: () => {
      queryClient.invalidateQueries('online-exams');
      showToast('Online exam deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete online exam', 'error');
    },
  });

  const resetCreateForm = () => {
    setCreateFormData({
      name: '',
      subject_id: '',
      session_id: '',
      class_id: '',
      section_id: '',
      exam_date: '',
      exam_time_from: '',
      exam_time_to: '',
      duration_minutes: '60',
      total_marks: '0',
      passing_marks: '0',
      instructions: '',
      is_published: false,
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.name || !createFormData.subject_id || !createFormData.session_id) {
      showToast('Name, subject, and session are required', 'error');
      return;
    }
    createMutation.mutate({
      name: createFormData.name.trim(),
      subject_id: Number(createFormData.subject_id),
      session_id: Number(createFormData.session_id),
      class_id: createFormData.class_id ? Number(createFormData.class_id) : undefined,
      section_id: createFormData.section_id ? Number(createFormData.section_id) : undefined,
      exam_date: createFormData.exam_date || undefined,
      exam_time_from: createFormData.exam_time_from || undefined,
      exam_time_to: createFormData.exam_time_to || undefined,
      duration_minutes: Number(createFormData.duration_minutes),
      total_marks: Number(createFormData.total_marks),
      passing_marks: Number(createFormData.passing_marks),
      instructions: createFormData.instructions || undefined,
      is_published: createFormData.is_published,
    });
  };

  const handleViewDetails = async (exam: OnlineExam) => {
    try {
      setShowDetailsModal(true);
      setSelectedExam(exam);
      const examDetails = await onlineExaminationsService.getOnlineExamById(exam.id);
      setSelectedExam(examDetails);
    } catch (error: any) {
      console.error('Error loading exam details:', error);
      setShowDetailsModal(false);
      setSelectedExam(null);
      showToast(error.response?.data?.message || 'Failed to load exam details', 'error');
    }
  };

  return (
    <div className="online-examinations-tab-content">
      <div className="tab-header">
        <h2>Online Exams</h2>
        <button className="btn-primary" onClick={() => { resetCreateForm(); setShowCreateModal(true); }}>
          + New Exam
        </button>
      </div>

      <div className="filters-section" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="form-row">
          <div className="form-group">
            <label>Filter by Session:</label>
            <select
              value={filters.session_id}
              onChange={(e) => setFilters({ ...filters, session_id: e.target.value, class_id: '' })}
            >
              <option value="">All Sessions</option>
              {sessions && Array.isArray(sessions) && sessions.map((session: any) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Filter by Subject:</label>
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
          <div className="form-group">
            <label>Filter by Class:</label>
            <select
              value={filters.class_id}
              onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
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
            <label>Filter by Status:</label>
            <select
              value={filters.is_published}
              onChange={(e) => setFilters({ ...filters, is_published: e.target.value })}
            >
              <option value="">All</option>
              <option value="true">Published</option>
              <option value="false">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : exams && Array.isArray(exams) && exams.length > 0 ? (
        <div className="table-responsive-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Exam Name</th>
                <th>Subject</th>
                <th>Session</th>
                <th>Class</th>
                <th>Date</th>
                <th>Duration</th>
                <th>Total Marks</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id}>
                  <td>{exam.name}</td>
                  <td>{exam.subject_name} ({exam.subject_code})</td>
                  <td>{exam.session_name}</td>
                  <td>{exam.class_name || '-'} {exam.section_name ? `- ${exam.section_name}` : ''}</td>
                  <td>{exam.exam_date ? (() => {
                    // Parse date string directly to avoid timezone conversion issues
                    const dateStr = String(exam.exam_date).split('T')[0]; // Get YYYY-MM-DD part
                    const [year, month, day] = dateStr.split('-');
                    return month && day ? `${month}/${day}/${year}` : dateStr;
                  })() : '-'}</td>
                  <td>{exam.duration_minutes} min</td>
                  <td>{exam.total_marks}</td>
                  <td>
                    <span className={`badge ${exam.is_published ? 'badge-success' : 'badge-warning'}`}>
                      {exam.is_published ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-sm btn-secondary"
                        onClick={() => handleViewDetails(exam)}
                      >
                        View
                      </button>
                      <button
                        className="btn-sm btn-danger"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this exam?')) {
                            deleteMutation.mutate(exam.id);
                          }
                        }}
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
        <div className="empty-state">No online exams found</div>
      )}

      {/* Create Exam Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetCreateForm();
        }}
        title="Create New Online Exam"
        size="large"
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label>
              Exam Name <span className="required">*</span>
            </label>
            <input
              type="text"
              value={createFormData.name}
              onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
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
                {subjects.map((subject: any) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>
                Session <span className="required">*</span>
              </label>
              <select
                value={createFormData.session_id}
                onChange={(e) => setCreateFormData({ ...createFormData, session_id: e.target.value, class_id: '', section_id: '' })}
                required
              >
                <option value="">Select Session</option>
                {sessions && Array.isArray(sessions) && sessions.map((session: any) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Class</label>
              <select
                value={createFormData.class_id}
                onChange={(e) => setCreateFormData({ ...createFormData, class_id: e.target.value, section_id: '' })}
                disabled={!createFormData.session_id}
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
                value={createFormData.section_id}
                onChange={(e) => setCreateFormData({ ...createFormData, section_id: e.target.value })}
                disabled={!createFormData.class_id}
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

          <div className="form-row">
            <div className="form-group">
              <label>Exam Date</label>
              <input
                type="date"
                value={createFormData.exam_date}
                onChange={(e) => setCreateFormData({ ...createFormData, exam_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Duration (minutes)</label>
              <input
                type="number"
                min="1"
                value={createFormData.duration_minutes}
                onChange={(e) => setCreateFormData({ ...createFormData, duration_minutes: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Time From</label>
              <input
                type="time"
                value={createFormData.exam_time_from}
                onChange={(e) => setCreateFormData({ ...createFormData, exam_time_from: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Time To</label>
              <input
                type="time"
                value={createFormData.exam_time_to}
                onChange={(e) => setCreateFormData({ ...createFormData, exam_time_to: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Total Marks</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={createFormData.total_marks}
                onChange={(e) => setCreateFormData({ ...createFormData, total_marks: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Passing Marks</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={createFormData.passing_marks}
                onChange={(e) => setCreateFormData({ ...createFormData, passing_marks: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Instructions</label>
            <textarea
              value={createFormData.instructions}
              onChange={(e) => setCreateFormData({ ...createFormData, instructions: e.target.value })}
              rows={4}
              placeholder="Enter exam instructions for students"
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={createFormData.is_published}
                onChange={(e) => setCreateFormData({ ...createFormData, is_published: e.target.checked })}
              />
              Publish Exam
            </label>
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
              {createMutation.isLoading ? 'Creating...' : 'Create Exam'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Exam Details Modal */}
      {selectedExam && (
        <OnlineExamDetailsModal
          exam={selectedExam}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedExam(null);
          }}
          onAssignStudents={() => {
            setShowDetailsModal(false);
            setShowAssignStudentsModal(true);
          }}
          onAddQuestions={() => {
            setShowDetailsModal(false);
            setShowAddQuestionsModal(true);
          }}
          onViewResults={() => {
            setShowDetailsModal(false);
            setShowResultsModal(true);
          }}
          onUpdate={updateMutation}
        />
      )}

      {/* Assign Students Modal */}
      {selectedExam && (
        <AssignStudentsToExamModal
          exam={selectedExam}
          isOpen={showAssignStudentsModal}
          onClose={() => {
            setShowAssignStudentsModal(false);
            setSelectedExam(null);
          }}
        />
      )}

      {/* Add Questions Modal */}
      {selectedExam && (
        <AddQuestionsToExamModal
          exam={selectedExam}
          isOpen={showAddQuestionsModal}
          onClose={() => {
            setShowAddQuestionsModal(false);
            setSelectedExam(null);
          }}
        />
      )}

      {/* Results Modal */}
      {selectedExam && (
        <ExamResultsModal
          exam={selectedExam}
          isOpen={showResultsModal}
          onClose={() => {
            setShowResultsModal(false);
            setSelectedExam(null);
          }}
        />
      )}
    </div>
  );
};

// ========== Online Exam Modals ==========

interface OnlineExamDetailsModalProps {
  exam: OnlineExam;
  isOpen: boolean;
  onClose: () => void;
  onAssignStudents: () => void;
  onAddQuestions: () => void;
  onViewResults: () => void;
  onUpdate: any;
}

const OnlineExamDetailsModal = ({
  exam,
  isOpen,
  onClose,
  onAssignStudents,
  onAddQuestions,
  onViewResults,
  onUpdate,
}: OnlineExamDetailsModalProps) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  // Helper function to format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateValue: any): string => {
    if (!dateValue) return '';
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      // Format as YYYY-MM-DD for date input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  // Helper function to format time for input field (HH:MM)
  const formatTimeForInput = (timeValue: any): string => {
    if (!timeValue) return '';
    try {
      // If it's already in HH:MM format, return as is
      if (typeof timeValue === 'string' && /^\d{2}:\d{2}/.test(timeValue)) {
        return timeValue.substring(0, 5); // Return HH:MM part only
      }
      // If it's a Date object or datetime string, extract time
      const date = timeValue instanceof Date ? timeValue : new Date(timeValue);
      if (isNaN(date.getTime())) return '';
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  const [formData, setFormData] = useState({
    name: exam.name,
    subject_id: String(exam.subject_id),
    session_id: String(exam.session_id),
    class_id: exam.class_id ? String(exam.class_id) : '',
    section_id: exam.section_id ? String(exam.section_id) : '',
    exam_date: formatDateForInput(exam.exam_date),
    exam_time_from: formatTimeForInput(exam.exam_time_from),
    exam_time_to: formatTimeForInput(exam.exam_time_to),
    duration_minutes: String(exam.duration_minutes),
    total_marks: String(exam.total_marks),
    passing_marks: String(exam.passing_marks),
    instructions: exam.instructions || '',
    is_published: exam.is_published,
    is_active: exam.is_active,
  });

  // Update formData when exam changes or when exiting edit mode
  useEffect(() => {
    if (!isEditing) {
      setFormData({
        name: exam.name,
        subject_id: String(exam.subject_id),
        session_id: String(exam.session_id),
        class_id: exam.class_id ? String(exam.class_id) : '',
        section_id: exam.section_id ? String(exam.section_id) : '',
        exam_date: formatDateForInput(exam.exam_date),
        exam_time_from: formatTimeForInput(exam.exam_time_from),
        exam_time_to: formatTimeForInput(exam.exam_time_to),
        duration_minutes: String(exam.duration_minutes),
        total_marks: String(exam.total_marks),
        passing_marks: String(exam.passing_marks),
        instructions: exam.instructions || '',
        is_published: exam.is_published,
        is_active: exam.is_active,
      });
    }
  }, [exam, isEditing]);

  // Exit edit mode when update is successful
  useEffect(() => {
    if (onUpdate.isSuccess && isEditing) {
      setIsEditing(false);
      // Reset mutation state after a delay to allow exam prop to update
      const timer = setTimeout(() => {
        onUpdate.reset();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [onUpdate.isSuccess, isEditing, onUpdate]);

  const { data: subjectsData } = useQuery('subjects', () => academicsService.getSubjects().then(res => res.data || []));
  const subjects = Array.isArray(subjectsData) ? subjectsData : [];
  const { data: sessionsResponse } = useQuery('sessions', () => settingsService.getSessions());
  const sessions = Array.isArray(sessionsResponse?.data) ? sessionsResponse.data : [];
  const { data: classes = [] } = useQuery('classes', () => academicsService.getClasses().then(res => res.data));
  const { data: sections = [] } = useQuery(
    ['sections', formData.class_id],
    () => academicsService.getSections(formData.class_id ? Number(formData.class_id) : undefined).then(res => res.data),
    { enabled: !!formData.class_id }
  );

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate.mutate({
      id: exam.id,
      data: {
        name: formData.name.trim(),
        subject_id: Number(formData.subject_id),
        session_id: Number(formData.session_id),
        class_id: formData.class_id ? Number(formData.class_id) : undefined,
        section_id: formData.section_id ? Number(formData.section_id) : undefined,
        exam_date: formData.exam_date || undefined,
        exam_time_from: formData.exam_time_from || undefined,
        exam_time_to: formData.exam_time_to || undefined,
        duration_minutes: Number(formData.duration_minutes),
        total_marks: Number(formData.total_marks),
        passing_marks: Number(formData.passing_marks),
        instructions: formData.instructions || undefined,
        is_published: formData.is_published,
        is_active: formData.is_active,
      },
    });
    // Don't set isEditing to false here - let the useEffect handle it after exam is updated
  };
  
  // Exit edit mode when update is successful and exam is refreshed
  useEffect(() => {
    if (onUpdate.isSuccess && isEditing) {
      setIsEditing(false);
      // Reset mutation state after a short delay to allow exam prop to update
      setTimeout(() => {
        onUpdate.reset();
      }, 100);
    }
  }, [onUpdate.isSuccess, isEditing, onUpdate]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Online Exam: ${exam.name}`} size="xlarge">
      <div className="online-exam-details">
        {!isEditing ? (
          <>
            {/* Action Buttons Section - Moved to Top */}
            <div className="online-exam-actions-section">
              <button className="online-exam-action-btn" onClick={() => setIsEditing(true)}>
                <i className="fas fa-edit"></i>
                <span>Edit Exam</span>
              </button>
              <button className="online-exam-action-btn" onClick={onAssignStudents}>
                <i className="fas fa-user-plus"></i>
                <span>Assign / View Students</span>
              </button>
              <button className="online-exam-action-btn" onClick={onAddQuestions}>
                <i className="fas fa-question-circle"></i>
                <span>Add Question</span>
              </button>
              <button className="online-exam-action-btn" onClick={onViewResults}>
                <i className="fas fa-chart-line"></i>
                <span>View Results</span>
              </button>
            </div>

            {/* Exam Information Section */}
            <div className="online-exam-info-section">
              <h3 className="section-title">Exam Information</h3>
              <div className="online-exam-info-grid">
                <div className="info-item">
                  <span className="info-label">Subject:</span>
                  <span className="info-value">{exam.subject_name} ({exam.subject_code})</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Session:</span>
                  <span className="info-value">{exam.session_name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Class:</span>
                  <span className="info-value">{exam.class_name || '-'} {exam.section_name ? `- ${exam.section_name}` : ''}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Date:</span>
                  <span className="info-value">{exam.exam_date ? (() => {
                    // Parse date string directly to avoid timezone conversion issues
                    const dateStr = String(exam.exam_date).split('T')[0]; // Get YYYY-MM-DD part
                    const [year, month, day] = dateStr.split('-');
                    return month && day ? `${month}/${day}/${year}` : dateStr;
                  })() : '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Time:</span>
                  <span className="info-value">{exam.exam_time_from && exam.exam_time_to ? `${exam.exam_time_from} - ${exam.exam_time_to}` : '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Duration:</span>
                  <span className="info-value">{exam.duration_minutes} minutes</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Total Marks:</span>
                  <span className="info-value">{exam.total_marks}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Passing Marks:</span>
                  <span className="info-value">{exam.passing_marks}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className={`badge ${exam.is_published ? 'badge-success' : 'badge-warning'}`}>
                    {exam.is_published ? 'PUBLISHED' : 'DRAFT'}
                  </span>
                </div>
              </div>
              {exam.instructions && (
                <div className="instructions-section">
                  <span className="info-label">Instructions:</span>
                  <div className="instructions-content">{exam.instructions}</div>
                </div>
              )}
            </div>

            {/* Summary Cards Section */}
            <div className="online-exam-summary-section">
              <div className="summary-card summary-card-questions">
                <div className="summary-card-header">
                  <i className="fas fa-question"></i>
                  <h4>Questions ({exam.questions?.length || 0})</h4>
                </div>
                <div className="summary-card-content">
                  {exam.questions && exam.questions.length > 0 ? (
                    <div className="summary-list">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Question</th>
                            <th>Marks</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exam.questions.map((q) => (
                            <tr key={q.id}>
                              <td style={{ maxWidth: '300px', wordWrap: 'break-word' }}>{q.question}</td>
                              <td>{q.marks}</td>
                              <td>
                                <button
                                  className="btn-sm btn-danger"
                                  onClick={async () => {
                                    if (window.confirm('Remove this question from exam?')) {
                                      try {
                                        await onlineExaminationsService.removeQuestionFromExam(exam.id, q.question_id);
                                        queryClient.invalidateQueries(['online-exam', exam.id]);
                                        showToast('Question removed successfully', 'success');
                                      } catch (error: any) {
                                        showToast(error.response?.data?.message || 'Failed to remove question', 'error');
                                      }
                                    }
                                  }}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="summary-empty">No questions added yet</div>
                  )}
                </div>
              </div>

              <div className="summary-card summary-card-students">
                <div className="summary-card-header">
                  <i className="fas fa-users"></i>
                  <h4>Assigned Students ({exam.students?.length || 0})</h4>
                </div>
                <div className="summary-card-content">
                  {exam.students && exam.students.length > 0 ? (
                    <div className="summary-list">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Admission No</th>
                            <th>Name</th>
                            <th>Roll No</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exam.students.map((s) => (
                            <tr key={s.id}>
                              <td>{s.admission_no}</td>
                              <td>{s.first_name} {s.last_name}</td>
                              <td>{s.roll_no || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="summary-empty">No students assigned yet</div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Exam Name <span className="required">*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Subject <span className="required">*</span></label>
                <select
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  required
                >
                  {subjects.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Session <span className="required">*</span></label>
                <select
                  value={formData.session_id}
                  onChange={(e) => setFormData({ ...formData, session_id: e.target.value, class_id: '', section_id: '' })}
                  required
                >
                  {sessions && Array.isArray(sessions) && sessions.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Class</label>
                <select
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value, section_id: '' })}
                >
                  <option value="">All Classes</option>
                  {classes.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Section</label>
                <select
                  value={formData.section_id}
                  onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                  disabled={!formData.class_id}
                >
                  <option value="">All Sections</option>
                  {sections.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Exam Date</label>
                <input
                  type="date"
                  value={formData.exam_date}
                  onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Time From</label>
                <input
                  type="time"
                  value={formData.exam_time_from}
                  onChange={(e) => setFormData({ ...formData, exam_time_from: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Time To</label>
                <input
                  type="time"
                  value={formData.exam_time_to}
                  onChange={(e) => setFormData({ ...formData, exam_time_to: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Total Marks</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total_marks}
                  onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Passing Marks</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.passing_marks}
                  onChange={(e) => setFormData({ ...formData, passing_marks: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Instructions</label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                rows={4}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  />
                  Publish Exam
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  Active
                </label>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={onUpdate.isLoading}>
                {onUpdate.isLoading ? 'Updating...' : 'Update Exam'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

interface AssignStudentsToExamModalProps {
  exam: OnlineExam;
  isOpen: boolean;
  onClose: () => void;
}

const AssignStudentsToExamModal = ({ exam, isOpen, onClose }: AssignStudentsToExamModalProps) => {
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: classes = [] } = useQuery('classes', () => academicsService.getClasses().then(res => res.data));
  const { data: sections = [] } = useQuery(
    ['sections', classId],
    () => academicsService.getSections().then(res => res.data),
    { enabled: !!classId }
  );
  const { data: studentsData } = useQuery(
    ['students', classId, sectionId],
    () =>
      studentsService.getStudents({
        class_id: classId ? Number(classId) : undefined,
        section_id: sectionId ? Number(sectionId) : undefined,
      }),
    { enabled: !!classId && !!sectionId }
  );

  const students = studentsData?.data || [];

  // Load existing assigned students
  const { data: examDetails } = useQuery(
    ['online-exam', exam.id],
    () => onlineExaminationsService.getOnlineExamById(exam.id),
    { enabled: isOpen }
  );

  React.useEffect(() => {
    if (examDetails?.students) {
      setSelectedStudents(examDetails.students.map((s) => s.student_id));
    }
  }, [examDetails]);

  const assignMutation = useMutation(
    (studentIds: number[]) => onlineExaminationsService.assignStudentsToExam(exam.id, studentIds),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['online-exam', exam.id]);
        queryClient.invalidateQueries('online-exams');
        showToast('Students assigned successfully', 'success');
        onClose();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to assign students', 'error');
      },
    }
  );

  const handleToggleStudent = (studentId: number) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (students.length > 0) {
      const allSelected = students.every((s: any) => selectedStudents.includes(s.id));
      if (allSelected) {
        setSelectedStudents([]);
      } else {
        setSelectedStudents(students.map((s: any) => s.id));
      }
    }
  };

  const handleSubmit = () => {
    if (selectedStudents.length === 0) {
      showToast('Please select at least one student', 'error');
      return;
    }
    assignMutation.mutate(selectedStudents);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Students - ${exam.name}`} size="large">
      <div className="assign-students-modal">
        <div className="form-row">
          <div className="form-group">
            <label>Class</label>
            <select value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(''); }}>
              <option value="">Select Class</option>
              {classes.map((cls: any) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Section</label>
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!classId}>
              <option value="">Select Section</option>
              {sections.map((sec: any) => (
                <option key={sec.id} value={sec.id}>{sec.name}</option>
              ))}
            </select>
          </div>
        </div>

        {students.length > 0 && (
          <div style={{ marginTop: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
              <h3>Select Students ({selectedStudents.length} selected)</h3>
              <button className="btn-secondary" onClick={handleSelectAll}>
                {students.every((s: any) => selectedStudents.includes(s.id)) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="students-checkbox-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {students.map((student: any) => (
                <div key={student.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => handleToggleStudent(student.id)}
                  />
                  <label>
                    {student.admission_no} - {student.first_name} {student.last_name || ''}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-actions" style={{ marginTop: 'var(--spacing-lg)' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={assignMutation.isLoading || selectedStudents.length === 0}
          >
            {assignMutation.isLoading ? 'Assigning...' : 'Assign Students'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

interface AddQuestionsToExamModalProps {
  exam: OnlineExam;
  isOpen: boolean;
  onClose: () => void;
}

const AddQuestionsToExamModal = ({ exam, isOpen, onClose }: AddQuestionsToExamModalProps) => {
  const [subjectFilter, setSubjectFilter] = useState(String(exam.subject_id));
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: subjectsData } = useQuery('subjects', () => academicsService.getSubjects().then(res => res.data || []));
  const subjects = Array.isArray(subjectsData) ? subjectsData : [];
  const { data: questions = [] } = useQuery(
    ['question-bank', subjectFilter],
    () => onlineExaminationsService.getQuestionBank(subjectFilter ? Number(subjectFilter) : undefined)
  );

  // Load existing questions in exam
  const { data: examDetails } = useQuery(
    ['online-exam', exam.id],
    () => onlineExaminationsService.getOnlineExamById(exam.id),
    { enabled: isOpen }
  );

  React.useEffect(() => {
    if (examDetails?.questions) {
      const existingQuestionIds = examDetails.questions.map((q) => q.question_id);
      // Filter out questions that are already in the exam
      setSelectedQuestions([]);
    }
  }, [examDetails]);

  const addQuestionsMutation = useMutation(
    async (questionIds: number[]) => {
      const promises = questionIds.map((questionId) =>
        onlineExaminationsService.addQuestionToExam(exam.id, { question_id: questionId })
      );
      await Promise.all(promises);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['online-exam', exam.id]);
        queryClient.invalidateQueries('online-exams');
        showToast('Questions added successfully', 'success');
        setSelectedQuestions([]);
        onClose();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to add questions', 'error');
      },
    }
  );

  const handleToggleQuestion = (questionId: number) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    );
  };

  const handleSelectAll = () => {
    const existingQuestionIds = examDetails?.questions?.map((q) => q.question_id) || [];
    const availableQuestions = questions.filter((q: any) => !existingQuestionIds.includes(q.id));
    
    if (availableQuestions.length > 0) {
      const allSelected = availableQuestions.every((q: any) => selectedQuestions.includes(q.id));
      if (allSelected) {
        setSelectedQuestions([]);
      } else {
        setSelectedQuestions(availableQuestions.map((q: any) => q.id));
      }
    }
  };

  const handleSubmit = () => {
    if (selectedQuestions.length === 0) {
      showToast('Please select at least one question', 'error');
      return;
    }
    addQuestionsMutation.mutate(selectedQuestions);
  };

  const existingQuestionIds = examDetails?.questions?.map((q) => q.question_id) || [];
  const availableQuestions = questions.filter((q: any) => !existingQuestionIds.includes(q.id));

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Questions - ${exam.name}`} size="large">
      <div className="add-questions-modal">
        <div className="form-group">
          <label>Filter by Subject</label>
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
            <option value="">All Subjects</option>
            {subjects.map((subject: any) => (
              <option key={subject.id} value={subject.id}>
                {subject.name} ({subject.code})
              </option>
            ))}
          </select>
        </div>

        {availableQuestions.length > 0 && (
          <div style={{ marginTop: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
              <h3>Select Questions ({selectedQuestions.length} selected)</h3>
              <button className="btn-secondary" onClick={handleSelectAll}>
                {availableQuestions.every((q: any) => selectedQuestions.includes(q.id)) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="questions-checkbox-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {availableQuestions.map((question: any) => (
                <div key={question.id} className="checkbox-item" style={{ padding: 'var(--spacing-md)', border: '1px solid var(--gray-300)', borderRadius: 'var(--border-radius)', marginBottom: 'var(--spacing-sm)' }}>
                  <input
                    type="checkbox"
                    checked={selectedQuestions.includes(question.id)}
                    onChange={() => handleToggleQuestion(question.id)}
                  />
                  <div style={{ flex: 1, marginLeft: 'var(--spacing-sm)' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>{question.question}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--gray-600)' }}>
                      {question.option_a && <div>A. {question.option_a}</div>}
                      {question.option_b && <div>B. {question.option_b}</div>}
                      {question.option_c && <div>C. {question.option_c}</div>}
                      {question.option_d && <div>D. {question.option_d}</div>}
                      {question.option_e && <div>E. {question.option_e}</div>}
                      <div style={{ marginTop: 'var(--spacing-xs)', fontWeight: 'bold', color: 'var(--success-color)' }}>
                        Correct: {question.correct_answer} | Marks: {question.marks}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {availableQuestions.length === 0 && questions.length > 0 && (
          <div className="empty-state" style={{ marginTop: 'var(--spacing-lg)' }}>
            All questions from this subject are already added to the exam
          </div>
        )}

        {questions.length === 0 && (
          <div className="empty-state" style={{ marginTop: 'var(--spacing-lg)' }}>
            No questions available
          </div>
        )}

        <div className="form-actions" style={{ marginTop: 'var(--spacing-lg)' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={addQuestionsMutation.isLoading || selectedQuestions.length === 0}
          >
            {addQuestionsMutation.isLoading ? 'Adding...' : 'Add Questions'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default OnlineExaminations;

