import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { academicsService, Class, Section, Subject, SubjectGroup, TimetableEntry } from '../../services/api/academicsService';
import { hrService } from '../../services/api/hrService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import './Academics.css';

type TabType = 'classes' | 'sections' | 'subjects' | 'subject-groups' | 'class-teachers' | 'timetable' | 'teachers-timetable';

const Academics = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType;
  const validTabs: TabType[] = ['classes', 'sections', 'subjects', 'subject-groups', 'class-teachers', 'timetable', 'teachers-timetable'];
  const defaultTab: TabType = validTabs.includes(tabFromUrl) ? tabFromUrl : 'classes';

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const queryClient = useQueryClient();

  const { data: classesData } = useQuery('classes', () => academicsService.getClasses());
  const { data: sectionsData } = useQuery('sections', () => academicsService.getSections());
  const { data: subjectsData } = useQuery('subjects', () => academicsService.getSubjects());
  const { data: subjectGroupsData } = useQuery('subject-groups', () => academicsService.getSubjectGroups());

  const deleteClassMutation = useMutation(academicsService.deleteClass, {
    onSuccess: () => queryClient.invalidateQueries('classes'),
  });

  const deleteSectionMutation = useMutation(academicsService.deleteSection, {
    onSuccess: () => queryClient.invalidateQueries('sections'),
  });

  const deleteSubjectMutation = useMutation(academicsService.deleteSubject, {
    onSuccess: () => queryClient.invalidateQueries('subjects'),
  });

  const handleDelete = (type: string, id: number) => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      switch (type) {
        case 'class':
          deleteClassMutation.mutate(String(id));
          break;
        case 'section':
          deleteSectionMutation.mutate(String(id));
          break;
        case 'subject':
          deleteSubjectMutation.mutate(String(id));
          break;
      }
    }
  };

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
      
      // Calculate scroll position to center the tab
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
      // Only show arrows if tabs overflow the container width
      const hasOverflow = container.scrollWidth > container.clientWidth;
      
      if (hasOverflow) {
        const hasLeftScroll = container.scrollLeft > 5;
        const hasRightScroll = container.scrollLeft < (container.scrollWidth - container.clientWidth - 5);
        setShowLeftArrow(hasLeftScroll);
        setShowRightArrow(hasRightScroll);
      } else {
        // Hide arrows if no overflow
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
      
      // Update arrow visibility after scroll
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

  // Handle tab change and update URL
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setTimeout(() => {
      scrollToActiveTab();
    }, 100);
  };

  // Scroll to active tab when it changes
  useEffect(() => {
    scrollToActiveTab();
  }, [activeTab]);

  return (
    <div className="academics-page">
      <div className="page-header">
        <h1>Academics Management</h1>
      </div>

      <div className="academics-tabs-wrapper">
        <div className="academics-tabs-container">
          {showLeftArrow && (
            <button
              className="academics-tabs-arrow academics-tabs-arrow-left"
              onClick={() => scrollTabs('left')}
              aria-label="Scroll tabs left"
            >
              ‹
            </button>
          )}
          <div className="academics-tabs" ref={tabsContainerRef}>
            <button
              ref={activeTab === 'classes' ? activeTabRef : null}
              className={activeTab === 'classes' ? 'active' : ''}
              onClick={() => handleTabChange('classes')}
            >
              Classes
            </button>
            <button
              ref={activeTab === 'sections' ? activeTabRef : null}
              className={activeTab === 'sections' ? 'active' : ''}
              onClick={() => handleTabChange('sections')}
            >
              Sections
            </button>
            <button
              ref={activeTab === 'subjects' ? activeTabRef : null}
              className={activeTab === 'subjects' ? 'active' : ''}
              onClick={() => handleTabChange('subjects')}
            >
              Subjects
            </button>
            <button
              ref={activeTab === 'subject-groups' ? activeTabRef : null}
              className={activeTab === 'subject-groups' ? 'active' : ''}
              onClick={() => handleTabChange('subject-groups')}
            >
              Subject Groups
            </button>
            <button
              ref={activeTab === 'class-teachers' ? activeTabRef : null}
              className={activeTab === 'class-teachers' ? 'active' : ''}
              onClick={() => handleTabChange('class-teachers')}
            >
              Class Teachers
            </button>
            <button
              ref={activeTab === 'timetable' ? activeTabRef : null}
              className={activeTab === 'timetable' ? 'active' : ''}
              onClick={() => handleTabChange('timetable')}
            >
              Timetable
            </button>
            <button
              ref={activeTab === 'teachers-timetable' ? activeTabRef : null}
              className={activeTab === 'teachers-timetable' ? 'active' : ''}
              onClick={() => handleTabChange('teachers-timetable')}
            >
              Teachers Timetable
            </button>
          </div>
          {showRightArrow && (
            <button
              className="academics-tabs-arrow academics-tabs-arrow-right"
              onClick={() => scrollTabs('right')}
              aria-label="Scroll tabs right"
            >
              ›
            </button>
          )}
        </div>
      </div>

      <div className="academics-content">
        {activeTab === 'classes' && (
          <ClassesTab
            classes={classesData?.data || []}
            sections={sectionsData?.data || []}
            onDelete={handleDelete}
          />
        )}
        {activeTab === 'sections' && (
          <SectionsTab
            sections={sectionsData?.data || []}
            onDelete={handleDelete}
          />
        )}
        {activeTab === 'subjects' && (
          <SubjectsTab
            subjects={subjectsData?.data || []}
            onDelete={handleDelete}
          />
        )}
        {activeTab === 'subject-groups' && (
          <SubjectGroupsTab
            subjectGroups={subjectGroupsData?.data || []}
            classes={classesData?.data || []}
            sections={sectionsData?.data || []}
            subjects={subjectsData?.data || []}
          />
        )}
        {activeTab === 'class-teachers' && (
          <ClassTeachersTab
            classes={classesData?.data || []}
            sections={sectionsData?.data || []}
          />
        )}
        {activeTab === 'timetable' && (
          <TimetableTab
            classes={classesData?.data || []}
            sections={sectionsData?.data || []}
            subjectGroups={subjectGroupsData?.data || []}
            subjects={subjectsData?.data || []}
          />
        )}
        {activeTab === 'teachers-timetable' && (
          <TeachersTimetableTab />
        )}
      </div>
    </div>
  );
};

// Classes Tab Component
const ClassesTab = ({ classes, sections, onDelete }: { classes: Class[]; sections: Section[]; onDelete: (type: string, id: number) => void }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({ name: '', numeric_value: '', section_ids: [] as number[] });

  const queryClient = useQueryClient();

  const createMutation = useMutation(academicsService.createClass, {
    onSuccess: () => {
      queryClient.invalidateQueries('classes');
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => academicsService.updateClass(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('classes');
        setShowModal(false);
        resetForm();
      },
    }
  );

  const resetForm = () => {
    setFormData({ name: '', numeric_value: '', section_ids: [] });
    setEditingClass(null);
  };

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      numeric_value: String(classItem.numeric_value || ''),
      section_ids: [],
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = {
      name: formData.name,
      numeric_value: formData.numeric_value ? Number(formData.numeric_value) : undefined,
      section_ids: formData.section_ids,
    };

    if (editingClass) {
      updateMutation.mutate({ id: String(editingClass.id), data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Classes</h3>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + Add Class
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Numeric Value</th>
              <th>Sections</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((classItem) => (
              <tr key={classItem.id}>
                <td>{classItem.name}</td>
                <td>{classItem.numeric_value || '-'}</td>
                <td>{classItem.sections || '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button onClick={() => handleEdit(classItem)} className="btn-edit">Edit</button>
                    <button onClick={() => onDelete('class', classItem.id)} className="btn-delete">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingClass ? 'Edit Class' : 'Add Class'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Class Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Numeric Value</label>
                <input
                  type="number"
                  value={formData.numeric_value}
                  onChange={(e) => setFormData({ ...formData, numeric_value: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Sections</label>
                <div className="checkbox-group">
                  {sections.map((section) => (
                    <label key={section.id}>
                      <input
                        type="checkbox"
                        checked={formData.section_ids.includes(section.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, section_ids: [...formData.section_ids, section.id] });
                          } else {
                            setFormData({ ...formData, section_ids: formData.section_ids.filter(id => id !== section.id) });
                          }
                        }}
                      />
                      {section.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn-primary">{editingClass ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Sections Tab Component
const SectionsTab = ({ sections, onDelete }: { sections: Section[]; onDelete: (type: string, id: number) => void }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  const queryClient = useQueryClient();

  const createMutation = useMutation(academicsService.createSection, {
    onSuccess: () => {
      queryClient.invalidateQueries('sections');
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => academicsService.updateSection(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sections');
        setShowModal(false);
        resetForm();
      },
    }
  );

  const resetForm = () => {
    setFormData({ name: '' });
    setEditingSection(null);
  };

  const handleEdit = (section: Section) => {
    setEditingSection(section);
    setFormData({ name: section.name });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSection) {
      updateMutation.mutate({ id: String(editingSection.id), data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Sections</h3>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + Add Section
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <tr key={section.id}>
                <td>{section.name}</td>
                <td>
                  <div className="action-buttons">
                    <button onClick={() => handleEdit(section)} className="btn-edit">Edit</button>
                    <button onClick={() => onDelete('section', section.id)} className="btn-delete">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingSection ? 'Edit Section' : 'Add Section'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Section Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn-primary">{editingSection ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Subjects Tab Component
const SubjectsTab = ({ subjects, onDelete }: { subjects: Subject[]; onDelete: (type: string, id: number) => void }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', type: 'theory' as 'theory' | 'practical' });

  const queryClient = useQueryClient();

  const createMutation = useMutation(academicsService.createSubject, {
    onSuccess: () => {
      queryClient.invalidateQueries('subjects');
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => academicsService.updateSubject(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('subjects');
        setShowModal(false);
        resetForm();
      },
    }
  );

  const resetForm = () => {
    setFormData({ name: '', code: '', type: 'theory' });
    setEditingSubject(null);
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({ name: subject.name, code: subject.code || '', type: subject.type });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubject) {
      updateMutation.mutate({ id: String(editingSubject.id), data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Subjects</h3>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + Add Subject
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject) => (
              <tr key={subject.id}>
                <td>{subject.name}</td>
                <td>{subject.code || '-'}</td>
                <td><span className="type-badge">{subject.type}</span></td>
                <td>
                  <div className="action-buttons">
                    <button onClick={() => handleEdit(subject)} className="btn-edit">Edit</button>
                    <button onClick={() => onDelete('subject', subject.id)} className="btn-delete">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingSubject ? 'Edit Subject' : 'Add Subject'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Subject Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Subject Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'theory' | 'practical' })}
                >
                  <option value="theory">Theory</option>
                  <option value="practical">Practical</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn-primary">{editingSubject ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Subject Groups Tab Component
const SubjectGroupsTab = ({ 
  subjectGroups, 
  classes, 
  sections, 
  subjects 
}: { 
  subjectGroups: SubjectGroup[]; 
  classes: Class[]; 
  sections: Section[]; 
  subjects: Subject[]; 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SubjectGroup | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    class_id: '',
    section_id: '',
    subject_ids: [] as number[],
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Fetch sections dynamically based on selected class
  const { data: sectionsResponse } = useQuery(
    ['sections', formData.class_id],
    () => academicsService.getSections(formData.class_id ? Number(formData.class_id) : undefined),
    {
      enabled: !!formData.class_id,
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );
  const availableSectionsForClass = Array.isArray(sectionsResponse?.data) ? sectionsResponse.data : [];

  const createMutation = useMutation(academicsService.createSubjectGroup, {
    onSuccess: () => {
      queryClient.invalidateQueries('subject-groups');
      setShowModal(false);
      resetForm();
      showToast('Subject group created successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create subject group', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => academicsService.updateSubjectGroup(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('subject-groups');
        setShowModal(false);
        resetForm();
        showToast('Subject group updated successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update subject group', 'error');
      },
    }
  );

  const deleteMutation = useMutation(academicsService.deleteSubjectGroup, {
    onSuccess: () => {
      queryClient.invalidateQueries('subject-groups');
      showToast('Subject group deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete subject group', 'error');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', class_id: '', section_id: '', subject_ids: [] });
    setEditingGroup(null);
  };

  const handleEdit = (group: SubjectGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      class_id: String(group.class_id),
      section_id: String(group.section_id),
      subject_ids: group.subjects ? group.subjects.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id)) : [],
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this subject group?')) {
      deleteMutation.mutate(String(id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = {
      name: formData.name,
      class_id: Number(formData.class_id),
      section_id: Number(formData.section_id),
      subject_ids: formData.subject_ids,
    };

    if (editingGroup) {
      updateMutation.mutate({ id: String(editingGroup.id), data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };


  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Subject Groups</h3>
        <button className="btn-primary" onClick={() => { 
          resetForm(); 
          setShowModal(true); 
        }}>+ Add Subject Group</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Class</th>
              <th>Section</th>
              <th>Subjects</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subjectGroups.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                  No subject groups found
                </td>
              </tr>
            ) : (
              subjectGroups.map((group) => (
                <tr key={group.id}>
                  <td>{group.name}</td>
                  <td>{group.class_name || '-'}</td>
                  <td>{group.section_name || '-'}</td>
                  <td>{group.subjects || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => handleEdit(group)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(group.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal
          isOpen={showModal}
          title={editingGroup ? 'Edit Subject Group' : 'Add Subject Group'}
          onClose={() => { setShowModal(false); resetForm(); }}
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Group Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Class</label>
              <select
                value={formData.class_id}
                onChange={(e) => {
                  setFormData({ ...formData, class_id: e.target.value, section_id: '' });
                }}
                required
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Section</label>
              <select
                value={formData.section_id}
                onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                disabled={!formData.class_id}
                required
              >
                <option value="">Select Section</option>
                {!formData.class_id ? (
                  <option value="" disabled>Please select a class first</option>
                ) : availableSectionsForClass.length === 0 ? (
                  <option value="" disabled>No sections available for this class</option>
                ) : (
                  availableSectionsForClass.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="form-group">
              <label>Subjects</label>
              <div className="checkbox-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {subjects.map((subject) => (
                  <label key={subject.id}>
                    <input
                      type="checkbox"
                      checked={formData.subject_ids.includes(subject.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, subject_ids: [...formData.subject_ids, subject.id] });
                        } else {
                          setFormData({ ...formData, subject_ids: formData.subject_ids.filter(id => id !== subject.id) });
                        }
                      }}
                    />
                    {subject.name} {subject.code ? `(${subject.code})` : ''}
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => { setShowModal(false); resetForm(); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={createMutation.isLoading || updateMutation.isLoading}>
                {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : editingGroup ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ========== Class Teachers Tab ==========

const ClassTeachersTab = ({ classes, sections }: { classes: Class[]; sections: Section[] }) => {
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('');
  const [selectedSectionId, setSelectedSectionId] = useState<number | ''>('');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: teachersData } = useQuery(
    'teachers-for-assignment',
    () => hrService.getStaff({ role_id: 3, is_active: true, limit: 1000 }),
    { refetchOnWindowFocus: false }
  );

  const { data: classTeachersData, refetch: refetchClassTeachers } = useQuery(
    ['class-teachers', selectedClassId, selectedSectionId],
    () => academicsService.getClassTeachers({
      class_id: selectedClassId ? Number(selectedClassId) : undefined,
      section_id: selectedSectionId ? Number(selectedSectionId) : undefined,
    }),
    { 
      enabled: !!selectedClassId && !!selectedSectionId,
      refetchOnWindowFocus: false
    }
  );

  const assignMutation = useMutation(academicsService.assignClassTeacher, {
    onSuccess: () => {
      queryClient.invalidateQueries('class-teachers');
      refetchClassTeachers();
      setShowAssignModal(false);
      setSelectedTeacherIds([]);
      showToast('Teacher assigned successfully', 'success');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to assign teacher';
      showToast(errorMessage, 'error');
      // Refetch class teachers to show updated list
      refetchClassTeachers();
    },
  });

  const removeMutation = useMutation(academicsService.removeClassTeacher, {
    onSuccess: () => {
      queryClient.invalidateQueries('class-teachers');
      refetchClassTeachers();
      showToast('Teacher removed successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to remove teacher', 'error');
    },
  });

  const handleSearch = () => {
    if (selectedClassId && selectedSectionId) {
      refetchClassTeachers();
    }
  };

  const handleAssign = () => {
    if (!selectedClassId || !selectedSectionId || selectedTeacherIds.length === 0) {
      showToast('Please select class, section, and at least one teacher', 'error');
      return;
    }
    setShowAssignModal(true);
  };

  const handleConfirmAssign = () => {
    if (selectedTeacherIds.length === 0) {
      showToast('Please select at least one teacher', 'error');
      return;
    }

    // Get user_id for each selected teacher (staff.id -> staff.user_id)
    const teacherUserIds = selectedTeacherIds
      .map(staffId => {
        const teacher = teachers.find(t => t.id === staffId);
        return teacher?.user_id;
      })
      .filter((userId): userId is number => userId !== undefined && userId !== null);

    if (teacherUserIds.length === 0) {
      showToast('Selected teachers do not have user accounts. Please select teachers with user accounts.', 'error');
      return;
    }

    if (teacherUserIds.length !== selectedTeacherIds.length) {
      showToast('Some selected teachers do not have user accounts. Only teachers with user accounts will be assigned.', 'warning');
    }

    // Check if any selected teacher is already assigned
    const alreadyAssigned: string[] = [];
    teacherUserIds.forEach(userId => {
      const teacher = teachers.find(t => t.user_id === userId);
      const isAssigned = classTeachers.some(ct => ct.teacher_id === userId);
      if (isAssigned && teacher) {
        alreadyAssigned.push(`${teacher.first_name} ${teacher.last_name || ''}`.trim() || teacher.email || 'Teacher');
      }
    });

    if (alreadyAssigned.length > 0) {
      showToast(
        `The following teacher(s) are already assigned: ${alreadyAssigned.join(', ')}. Please check the Class Teachers List below.`,
        'error'
      );
      setShowAssignModal(false);
      return;
    }

    // Assign each selected teacher using their user_id
    const assignments = teacherUserIds.map(userId =>
      assignMutation.mutateAsync({
        class_id: Number(selectedClassId),
        section_id: Number(selectedSectionId),
        teacher_id: userId, // Use user_id, not staff.id
      })
    );

    Promise.all(assignments).catch(() => {
      // Errors are handled in mutation onError
    });
  };

  const handleRemove = (id: number) => {
    if (window.confirm('Are you sure you want to remove this teacher?')) {
      removeMutation.mutate(String(id));
    }
  };

  const teachers = teachersData?.data || [];
  const classTeachers = classTeachersData?.data || [];

  const availableSections = selectedClassId
    ? sections.filter(s => {
        const selectedClass = classes.find(c => c.id === Number(selectedClassId));
        if (!selectedClass?.section_ids) return false;
        const sectionIds = selectedClass.section_ids.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id));
        return sectionIds.includes(s.id);
      })
    : [];

  return (
    <div className="tab-content">
      <div className="form-section">
        <h2>Assign Class Teachers</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value ? Number(e.target.value) : '');
                setSelectedSectionId('');
                setSelectedTeacherIds([]);
              }}
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Section</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value ? Number(e.target.value) : '')}
              disabled={!selectedClassId}
            >
              <option value="">Select Section</option>
              {availableSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <button
              type="button"
              className="btn-primary"
              onClick={handleSearch}
              disabled={!selectedClassId || !selectedSectionId}
              title="Refresh Class Teachers List"
            >
              Refresh List
            </button>
          </div>
        </div>

        {selectedClassId && selectedSectionId && (
          <div className="form-row" style={{ marginTop: '20px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Select Teachers</label>
              <select
                multiple
                value={selectedTeacherIds.map(String)}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => Number(option.value));
                  setSelectedTeacherIds(values);
                }}
                style={{ minHeight: '150px' }}
              >
                {teachers
                  .filter(teacher => teacher.user_id) // Only show teachers with user accounts
                  .map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name || ''} ({teacher.email || teacher.staff_id})
                    </option>
                  ))}
              </select>
              <small>Hold Ctrl/Cmd to select multiple teachers</small>
            </div>
            <div className="form-group" style={{ marginLeft: '20px', display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={handleAssign}
                disabled={selectedTeacherIds.length === 0}
              >
                Assign Teachers
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="list-section">
        <h2>Class Teachers List</h2>
        {!selectedClassId || !selectedSectionId ? (
          <div className="empty-state">Please select a class and section to view assigned teachers</div>
        ) : classTeachers.length === 0 ? (
          <div className="empty-state">No class teachers assigned yet for this class-section</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Section</th>
                <th>Teacher Name</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classTeachers.map((ct) => (
                <tr key={ct.id}>
                  <td>{ct.class_name}</td>
                  <td>{ct.section_name}</td>
                  <td>{ct.teacher_name}</td>
                  <td>{ct.teacher_email}</td>
                  <td>
                    <button
                      className="btn-delete"
                      onClick={() => handleRemove(ct.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAssignModal && (
        <Modal
          isOpen={showAssignModal}
          title="Confirm Assignment"
          onClose={() => setShowAssignModal(false)}
        >
          <div>
            <p>Are you sure you want to assign {selectedTeacherIds.length} teacher(s) to this class-section?</p>
            {selectedTeacherIds.length > 0 && (
              <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                <strong>Selected Teachers:</strong>
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  {selectedTeacherIds.map(staffId => {
                    const teacher = teachers.find(t => t.id === staffId);
                    const isAlreadyAssigned = teacher?.user_id 
                      ? classTeachers.some(ct => ct.teacher_id === teacher.user_id)
                      : false;
                    return (
                      <li key={staffId} style={{ color: isAlreadyAssigned ? '#d32f2f' : 'inherit' }}>
                        {teacher ? `${teacher.first_name} ${teacher.last_name || ''}`.trim() || teacher.email || 'Unknown' : 'Unknown'}
                        {isAlreadyAssigned && <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>(Already Assigned)</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {selectedTeacherIds.some(staffId => {
              const teacher = teachers.find(t => t.id === staffId);
              return teacher?.user_id && classTeachers.some(ct => ct.teacher_id === teacher.user_id);
            }) && (
              <div style={{ 
                padding: '10px', 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffc107', 
                borderRadius: '4px',
                marginBottom: '15px'
              }}>
                <strong>⚠️ Warning:</strong> Some selected teachers are already assigned. They will be skipped.
              </div>
            )}
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowAssignModal(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleConfirmAssign}
              disabled={assignMutation.isLoading}
            >
              {assignMutation.isLoading ? 'Assigning...' : 'Confirm'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ========== Timetable Tab ==========

const TimetableTab = ({
  classes,
  sections,
  subjectGroups,
  subjects,
}: {
  classes: Class[];
  sections: Section[];
  subjectGroups: SubjectGroup[];
  subjects: Subject[];
}) => {
  const [viewMode, setViewMode] = useState<'add' | 'view'>('view');
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('');
  const [selectedSectionId, setSelectedSectionId] = useState<number | ''>('');
  const [selectedSubjectGroupId, setSelectedSubjectGroupId] = useState<number | ''>('');
  const [timetableEntries, setTimetableEntries] = useState<Record<string, Partial<TimetableEntry>>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Partial<TimetableEntry> | null>(null);
  const [editingDay, setEditingDay] = useState<string>('');

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: teachersData } = useQuery(
    'teachers-for-timetable',
    () => hrService.getStaff({ role_id: 3, is_active: true, limit: 1000 }),
    { refetchOnWindowFocus: false }
  );

  const { data: timetableData, refetch: refetchTimetable } = useQuery(
    ['timetable', selectedClassId, selectedSectionId],
    () => academicsService.getTimetable({
      class_id: Number(selectedClassId),
      section_id: Number(selectedSectionId),
    }),
    { enabled: false }
  );

  const createMutation = useMutation(academicsService.createTimetableEntry, {
    onSuccess: () => {
      queryClient.invalidateQueries('timetable');
      refetchTimetable();
      showToast('Timetable entry created successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create timetable entry', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<TimetableEntry> }) =>
      academicsService.updateTimetableEntry(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('timetable');
        refetchTimetable();
        setShowEditModal(false);
        setEditingEntry(null);
        showToast('Timetable entry updated successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update timetable entry', 'error');
      },
    }
  );

  const deleteMutation = useMutation(academicsService.deleteTimetableEntry, {
    onSuccess: () => {
      queryClient.invalidateQueries('timetable');
      refetchTimetable();
      showToast('Timetable entry deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete timetable entry', 'error');
    },
  });

  const handleViewTimetable = () => {
    if (selectedClassId && selectedSectionId) {
      refetchTimetable();
    }
  };

  const handleAddTimetable = () => {
    if (!selectedClassId || !selectedSectionId || !selectedSubjectGroupId) {
      showToast('Please select class, section, and subject group', 'error');
      return;
    }
    setViewMode('add');
    setTimetableEntries({});
  };

  const handleSaveTimetable = () => {
    const entries = Object.entries(timetableEntries).filter(([_, entry]) => entry.subject_id && entry.time_from && entry.time_to);
    
    if (entries.length === 0) {
      showToast('Please add at least one timetable entry', 'error');
      return;
    }

    const savePromises = entries.map(([day, entry]) =>
      createMutation.mutateAsync({
        class_id: Number(selectedClassId),
        section_id: Number(selectedSectionId),
        subject_group_id: Number(selectedSubjectGroupId),
        subject_id: Number(entry.subject_id),
        teacher_id: entry.teacher_id ? Number(entry.teacher_id) : undefined,
        day_of_week: day as any,
        time_from: entry.time_from!,
        time_to: entry.time_to!,
        room_no: entry.room_no,
      })
    );

    Promise.all(savePromises)
      .then(() => {
        setViewMode('view');
        setTimetableEntries({});
        refetchTimetable();
      })
      .catch(() => {
        // Errors handled in mutation
      });
  };

  const handleEditEntry = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setEditingDay(entry.day_of_week);
    setShowEditModal(true);
  };

  const handleUpdateEntry = () => {
    if (!editingEntry || !editingEntry.id) return;

    updateMutation.mutate({
      id: String(editingEntry.id),
      data: {
        subject_id: editingEntry.subject_id ? Number(editingEntry.subject_id) : undefined,
        teacher_id: editingEntry.teacher_id ? Number(editingEntry.teacher_id) : undefined,
        day_of_week: editingDay as any,
        time_from: editingEntry.time_from,
        time_to: editingEntry.time_to,
        room_no: editingEntry.room_no,
      },
    });
  };

  const handleDeleteEntry = (id: number) => {
    if (window.confirm('Are you sure you want to delete this timetable entry?')) {
      deleteMutation.mutate(String(id));
    }
  };

  // Extract teachers - handle different response structures
  // Filter out teachers without user_id (they can't be assigned to timetable)
  const teachers = (Array.isArray(teachersData?.data) 
    ? teachersData.data 
    : Array.isArray(teachersData) 
    ? teachersData 
    : []).filter((teacher: any) => teacher.user_id != null);

  const timetable = timetableData?.data || [];

  const availableSections = selectedClassId
    ? sections.filter(s => {
        const selectedClass = classes.find(c => c.id === Number(selectedClassId));
        if (!selectedClass?.section_ids) return false;
        const sectionIds = selectedClass.section_ids.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id));
        return sectionIds.includes(s.id);
      })
    : [];

  const availableSubjectGroups = selectedClassId && selectedSectionId
    ? subjectGroups.filter(sg => sg.class_id === Number(selectedClassId) && sg.section_id === Number(selectedSectionId))
    : [];

  // Get available subjects based on selected subject group (for add mode) or editing entry's subject group (for edit mode)
  const getAvailableSubjects = () => {
    // When editing, try to get subject group from the entry
    if (editingEntry?.subject_group_id) {
      const group = subjectGroups.find(sg => sg.id === Number(editingEntry.subject_group_id));
      if (group?.subjects) {
        const subjectIds = group.subjects.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id));
        const filtered = subjects.filter(s => subjectIds.includes(s.id));
        if (filtered.length > 0) return filtered;
      }
    }
    
    // When adding, use the selected subject group
    if (selectedSubjectGroupId) {
      const group = subjectGroups.find(sg => sg.id === Number(selectedSubjectGroupId));
      if (group?.subjects) {
        const subjectIds = group.subjects.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id));
        const filtered = subjects.filter(s => subjectIds.includes(s.id));
        if (filtered.length > 0) return filtered;
      }
    }
    
    // If editing and we have class/section, try to get subjects from all subject groups for that class/section
    if (editingEntry && editingEntry.class_id && editingEntry.section_id) {
      const classSectionGroups = subjectGroups.filter(
        sg => sg.class_id === Number(editingEntry.class_id) && sg.section_id === Number(editingEntry.section_id)
      );
      const allSubjectIds = new Set<number>();
      classSectionGroups.forEach(group => {
        if (group?.subjects) {
          const subjectIds = group.subjects.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id));
          subjectIds.forEach(id => allSubjectIds.add(id));
        }
      });
      if (allSubjectIds.size > 0) {
        const filtered = subjects.filter(s => allSubjectIds.has(s.id));
        if (filtered.length > 0) return filtered;
      }
    }
    
    // Fallback: return all subjects if no subject group is available
    return subjects || [];
  };

  const availableSubjects = getAvailableSubjects();

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Group timetable by day
  const timetableByDay: Record<string, TimetableEntry[]> = {};
  daysOfWeek.forEach(day => {
    timetableByDay[day] = timetable.filter(entry => entry.day_of_week === day);
  });

  return (
    <div className="tab-content">
      {/* Mode Selector */}
      <div className="timetable-mode-selector">
        <button
          className={`mode-button ${viewMode === 'view' ? 'active' : ''}`}
          onClick={() => {
            setViewMode('view');
            setTimetableEntries({});
          }}
        >
          <span className="mode-icon">👁️</span>
          <span>View Timetable</span>
        </button>
        <button
          className={`mode-button ${viewMode === 'add' ? 'active' : ''}`}
          onClick={() => {
            setViewMode('add');
            setTimetableEntries({});
          }}
        >
          <span className="mode-icon">➕</span>
          <span>Add/Edit Timetable</span>
        </button>
      </div>

      {/* Selection Form */}
      <div className="timetable-selection-form">
        <h3>{viewMode === 'view' ? 'Select Class & Section to View Timetable' : 'Select Class, Section & Subject Group to Add Timetable'}</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Class <span className="required">*</span></label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value ? Number(e.target.value) : '');
                setSelectedSectionId('');
                setSelectedSubjectGroupId('');
              }}
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Section <span className="required">*</span></label>
            <select
              value={selectedSectionId}
              onChange={(e) => {
                setSelectedSectionId(e.target.value ? Number(e.target.value) : '');
                setSelectedSubjectGroupId('');
              }}
              disabled={!selectedClassId}
            >
              <option value="">Select Section</option>
              {availableSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>
          {viewMode === 'add' && (
            <div className="form-group">
              <label>Subject Group <span className="required">*</span></label>
              <select
                value={selectedSubjectGroupId}
                onChange={(e) => setSelectedSubjectGroupId(e.target.value ? Number(e.target.value) : '')}
                disabled={!selectedClassId || !selectedSectionId}
              >
                <option value="">Select Subject Group</option>
                {availableSubjectGroups.map((sg) => (
                  <option key={sg.id} value={sg.id}>
                    {sg.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="form-actions" style={{ marginTop: '20px' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={viewMode === 'view' ? handleViewTimetable : handleAddTimetable}
            disabled={!selectedClassId || !selectedSectionId || (viewMode === 'add' && !selectedSubjectGroupId)}
          >
            {viewMode === 'view' ? '🔍 View Timetable' : '➕ Start Adding Entries'}
          </button>
          {(selectedClassId || selectedSectionId) && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSelectedClassId('');
                setSelectedSectionId('');
                setSelectedSubjectGroupId('');
                setTimetableEntries({});
              }}
              style={{ marginLeft: '10px' }}
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>

      {viewMode === 'view' && selectedClassId && selectedSectionId && (
        <div className="timetable-view">
          <div className="timetable-view-header">
            <h2>
              Class Timetable - {classes.find(c => c.id === Number(selectedClassId))?.name} 
              ({sections.find(s => s.id === Number(selectedSectionId))?.name})
            </h2>
            {timetable.length === 0 && (
              <p className="timetable-empty-message">
                No timetable entries found for this class and section. Click "Add/Edit Timetable" to create entries.
              </p>
            )}
          </div>
          {timetable.length > 0 && (
          <div className="timetable-grid">
            {daysOfWeek.map((day) => (
              <div key={day} className="timetable-day">
                <h3 style={{ textTransform: 'capitalize', marginBottom: '10px' }}>{day}</h3>
                {timetableByDay[day]?.length > 0 ? (
                  <table className="timetable-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Subject</th>
                        <th>Teacher</th>
                        <th>Room</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timetableByDay[day]
                        .sort((a, b) => a.time_from.localeCompare(b.time_from))
                        .map((entry) => (
                          <tr key={entry.id}>
                            <td>{entry.time_from} - {entry.time_to}</td>
                            <td>{entry.subject_name} {entry.subject_code ? `(${entry.subject_code})` : ''}</td>
                            <td>{entry.teacher_name || '-'}</td>
                            <td>{entry.room_no || '-'}</td>
                            <td>
                              <button
                                className="btn-edit"
                                onClick={() => handleEditEntry(entry)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn-delete"
                                onClick={() => handleDeleteEntry(entry.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">No classes scheduled</div>
                )}
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {viewMode === 'view' && (!selectedClassId || !selectedSectionId) && (
        <div className="timetable-empty-state">
          <p>Please select a class and section to view the timetable.</p>
        </div>
      )}

      {viewMode === 'add' && selectedSubjectGroupId && (
        <div className="timetable-add">
          <div className="timetable-add-header">
            <h2>Add Timetable Entries</h2>
            <p className="timetable-add-subtitle">
              Click on a day to add or edit timetable entries. Days with entries are highlighted.
            </p>
          </div>
          <div className="timetable-days-tabs">
            {daysOfWeek.map((day) => (
              <button
                key={day}
                className={`day-tab ${timetableEntries[day] ? 'has-entry' : ''}`}
                onClick={() => {
                  const entry = timetableEntries[day] || {};
                  setEditingEntry(entry);
                  setEditingDay(day);
                  setShowEditModal(true);
                }}
              >
                <span className="day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                {timetableEntries[day] && (
                  <span className="day-entry-indicator">✓</span>
                )}
              </button>
            ))}
          </div>
          <div className="timetable-add-actions">
            <div className="timetable-add-info">
              <span className="info-text">
                {Object.keys(timetableEntries).length > 0 
                  ? `${Object.keys(timetableEntries).length} day(s) have entries added`
                  : 'No entries added yet. Click on a day to add entries.'}
              </span>
            </div>
            <div className="form-actions">
              <button 
                className="btn-primary" 
                onClick={handleSaveTimetable} 
                disabled={createMutation.isLoading || Object.keys(timetableEntries).length === 0}
              >
                {createMutation.isLoading ? '💾 Saving...' : '💾 Save Timetable'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setViewMode('view');
                  setTimetableEntries({});
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingEntry && (
        <Modal
          isOpen={showEditModal}
          title={`Edit Timetable Entry - ${editingDay.charAt(0).toUpperCase() + editingDay.slice(1)}`}
          onClose={() => {
            setShowEditModal(false);
            setEditingEntry(null);
          }}
        >
          <div className="form-group">
            <label>Subject</label>
            <select
              value={editingEntry.subject_id || ''}
              onChange={(e) =>
                setEditingEntry({ ...editingEntry, subject_id: e.target.value ? Number(e.target.value) : undefined })
              }
            >
              <option value="">Select Subject</option>
              {availableSubjects && availableSubjects.length > 0 ? (
                availableSubjects.map((subj) => (
                  <option key={subj.id} value={subj.id}>
                    {subj.name} {subj.code ? `(${subj.code})` : ''}
                  </option>
                ))
              ) : (
                <option value="" disabled>No subjects available</option>
              )}
            </select>
          </div>
          <div className="form-group">
            <label>Teacher</label>
            <select
              value={editingEntry.teacher_id || ''}
              onChange={(e) =>
                setEditingEntry({ ...editingEntry, teacher_id: e.target.value ? Number(e.target.value) : undefined })
              }
            >
              <option value="">Select Teacher (Optional)</option>
              {teachers && teachers.length > 0 ? (
                teachers.map((teacher: any) => (
                  <option key={teacher.id} value={teacher.user_id}>
                    {teacher.first_name} {teacher.last_name || ''}
                  </option>
                ))
              ) : (
                <option value="" disabled>No teachers available</option>
              )}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Time From</label>
              <input
                type="time"
                value={editingEntry.time_from || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, time_from: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Time To</label>
              <input
                type="time"
                value={editingEntry.time_to || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, time_to: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Room No</label>
            <input
              type="text"
              value={editingEntry.room_no || ''}
              onChange={(e) => setEditingEntry({ ...editingEntry, room_no: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <div className="modal-actions">
            <button
              className="btn-secondary"
              onClick={() => {
                setShowEditModal(false);
                setEditingEntry(null);
              }}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                if (viewMode === 'add') {
                  // Update local state for add mode
                  setTimetableEntries({ ...timetableEntries, [editingDay]: editingEntry });
                  setShowEditModal(false);
                  setEditingEntry(null);
                } else {
                  // Update existing entry
                  handleUpdateEntry();
                }
              }}
              disabled={updateMutation.isLoading}
            >
              {updateMutation.isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ========== Teachers Timetable Tab ==========
const TeachersTimetableTab = () => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | ''>('');

  const { data: teachersData } = useQuery(
    'teachers-for-timetable-view',
    () => hrService.getStaff({ role_id: 3, is_active: true, limit: 1000 }),
    { refetchOnWindowFocus: false }
  );

  const { data: timetableData, refetch: refetchTimetable } = useQuery(
    ['teacher-timetable', selectedTeacherId],
    () => academicsService.getTeacherTimetable({ teacher_id: Number(selectedTeacherId) }),
    { enabled: false }
  );

  useEffect(() => {
    if (selectedTeacherId) {
      refetchTimetable();
    }
  }, [selectedTeacherId, refetchTimetable]);

  const teachers = teachersData?.data || [];
  const timetable = timetableData?.data || [];

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Group timetable by day
  const timetableByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = timetable.filter((entry: TimetableEntry) => entry.day_of_week === day);
    return acc;
  }, {} as Record<string, TimetableEntry[]>);

  // Get all unique time slots
  const timeSlots = Array.from(
    new Set(
      timetable.map((entry: TimetableEntry) => `${entry.time_from}-${entry.time_to}`).sort((a, b) => {
        const [aFrom] = a.split('-');
        const [bFrom] = b.split('-');
        return aFrom.localeCompare(bFrom);
      })
    )
  );

  const selectedTeacher = teachers.find((t: any) => t.user_id === Number(selectedTeacherId));

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Teachers Timetable</h3>
        <p>View timetable for selected teacher</p>
      </div>

      <div className="form-section" style={{ marginBottom: '30px' }}>
        <div className="form-row">
          <div className="form-group">
            <label>Select Teacher</label>
            <select
              value={selectedTeacherId}
              onChange={(e) => {
                setSelectedTeacherId(e.target.value ? Number(e.target.value) : '');
              }}
            >
              <option value="">Select Teacher</option>
              {teachers && teachers.length > 0 ? (
                teachers.map((teacher: any) => (
                  <option key={teacher.id} value={teacher.user_id}>
                    {teacher.first_name} {teacher.last_name || ''} {teacher.email ? `(${teacher.email})` : ''}
                  </option>
                ))
              ) : (
                <option value="" disabled>No teachers available</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {selectedTeacherId && timetable.length > 0 && (
        <div className="table-section">
          <h3>
            Timetable for {selectedTeacher ? `${selectedTeacher.first_name} ${selectedTeacher.last_name || ''}`.trim() : 'Selected Teacher'}
            {selectedTeacher?.email && <span style={{ fontSize: '0.9em', color: 'var(--gray-600)', fontWeight: 'normal' }}> ({selectedTeacher.email})</span>}
          </h3>

          <div className="timetable-grid" style={{ marginTop: '20px' }}>
            <div className="timetable-header">Time</div>
            {daysOfWeek.map((day) => (
              <div key={day} className="timetable-day-header">
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </div>
            ))}

            {timeSlots.length > 0 ? (
              timeSlots.map((timeSlot) => {
                const [timeFrom, timeTo] = timeSlot.split('-');
                return (
                  <React.Fragment key={timeSlot}>
                    <div className="timetable-cell" style={{ fontWeight: 'bold', background: 'var(--gray-50)' }}>
                      <div>{timeFrom}</div>
                      <div style={{ fontSize: '0.85em', color: 'var(--gray-600)' }}>{timeTo}</div>
                    </div>
                    {daysOfWeek.map((day) => {
                      const entry = timetableByDay[day]?.find(
                        (e) => `${e.time_from}-${e.time_to}` === timeSlot
                      );
                      return (
                        <div key={day} className="timetable-cell">
                          {entry ? (
                            <div className="timetable-entry">
                              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                {entry.subject_name} {entry.subject_code ? `(${entry.subject_code})` : ''}
                              </div>
                              <div style={{ fontSize: '0.85em', color: 'var(--gray-700)', marginBottom: '2px' }}>
                                {entry.class_name} - {entry.section_name}
                              </div>
                              {entry.room_no && (
                                <div style={{ fontSize: '0.8em', color: 'var(--gray-600)' }}>
                                  Room: {entry.room_no}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="timetable-cell empty">-</div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })
            ) : (
              <div className="timetable-cell empty" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
                No timetable entries found
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTeacherId && timetable.length === 0 && (
        <div className="empty-state">
          <p>No timetable entries found for the selected teacher.</p>
        </div>
      )}

      {!selectedTeacherId && (
        <div className="empty-state">
          <p>Please select a teacher to view their timetable.</p>
        </div>
      )}
    </div>
  );
};

export default Academics;

