import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { academicsService, Class, Section, Subject, SubjectGroup, TimetableEntry } from '../../services/api/academicsService';
import { rolesService } from '../../services/api/rolesService';
import { hrService } from '../../services/api/hrService';
import { profileService } from '../../services/api/profileService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import './Academics.css';

type TabType = 'classes' | 'sections' | 'subjects' | 'subject-groups' | 'class-teachers' | 'timetable' | 'class-timetable' | 'teachers-timetable';

const Academics = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType;
  const validTabs: TabType[] = ['classes', 'sections', 'subjects', 'subject-groups', 'class-teachers', 'timetable', 'class-timetable', 'teachers-timetable'];
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
              ref={activeTab === 'class-timetable' ? activeTabRef : null}
              className={activeTab === 'class-timetable' ? 'active' : ''}
              onClick={() => handleTabChange('class-timetable')}
            >
              Class Timetable
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
        {activeTab === 'class-timetable' && (
          <ClassTimetableTab
            classes={classesData?.data || []}
            sections={sectionsData?.data || []}
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
    const subjectIds = (group.subject_ids || '')
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => !isNaN(id));
    setFormData({
      name: group.name,
      class_id: String(group.class_id),
      section_id: String(group.section_id),
      subject_ids: subjectIds,
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
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | ''>('');
  const [showAssignModal, setShowAssignModal] = useState(false);

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: rolesData } = useQuery('roles', rolesService.getRoles, {
    refetchOnWindowFocus: false,
  });

  const teacherRoleId = rolesData?.data?.find(
    (role) => role.name?.toLowerCase() === 'teacher'
  )?.id;

  const { data: teachersData } = useQuery(
    ['teachers-for-assignment', teacherRoleId],
    () =>
      hrService.getStaff({
        role_id: teacherRoleId,
        is_active: true,
        page: 1,
        limit: 100,
      }),
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
      setSelectedTeacherId('');
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
    if (!selectedClassId || !selectedSectionId || !selectedTeacherId) {
      showToast('Please select class, section, and a teacher', 'error');
      return;
    }
    setShowAssignModal(true);
  };

  const handleConfirmAssign = () => {
    if (!selectedTeacherId) {
      showToast('Please select a teacher', 'error');
      return;
    }

    const selectedTeacher = teachers.find(t => t.id === Number(selectedTeacherId));
    const teacherUserId = selectedTeacher?.user_id;

    if (!teacherUserId) {
      showToast('Selected teacher does not have a user account. Please select a teacher with a user account.', 'error');
      return;
    }

    const isAssigned = classTeachers.some(ct => ct.teacher_id === teacherUserId);
    if (isAssigned) {
      showToast(
        'This teacher is already assigned to this class-section. Please check the Class Teachers List below.',
        'error'
      );
      setShowAssignModal(false);
      return;
    }

    assignMutation.mutate({
      class_id: Number(selectedClassId),
      section_id: Number(selectedSectionId),
      teacher_id: teacherUserId, // Use user_id, not staff.id
    });
  };

  const handleRemove = (id: number) => {
    if (window.confirm('Are you sure you want to remove this teacher?')) {
      removeMutation.mutate(String(id));
    }
  };

  const teachers = (teachersData?.data || []).filter((staff) => {
    if (teacherRoleId) return true;
    return staff.role_name?.toLowerCase() === 'teacher';
  });
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
                setSelectedTeacherId('');
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
              onChange={(e) => {
                setSelectedSectionId(e.target.value ? Number(e.target.value) : '');
                setSelectedTeacherId('');
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
              <label>Select Teacher</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Select Teacher</option>
                {teachers
                  .filter(teacher => teacher.user_id) // Only show teachers with user accounts
                  .map((teacher) => {
                    const name = `${teacher.first_name} ${teacher.last_name || ''}`.trim();
                    return (
                      <option key={teacher.id} value={teacher.id}>
                        {`${teacher.staff_id || 'STAFF'} - ${name || teacher.email || 'Teacher'}`}
                      </option>
                    );
                  })}
              </select>
            </div>
            <div className="form-group" style={{ marginLeft: '20px', display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={handleAssign}
                disabled={!selectedTeacherId}
              >
                Assign Teacher
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
            <p>Are you sure you want to assign this teacher to this class-section?</p>
            {selectedTeacherId && (
              <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                <strong>Selected Teacher:</strong>
                <div style={{ marginTop: '8px' }}>
                  {(() => {
                    const teacher = teachers.find(t => t.id === Number(selectedTeacherId));
                    const name = teacher ? `${teacher.first_name} ${teacher.last_name || ''}`.trim() || teacher.email || 'Unknown' : 'Unknown';
                    return `${teacher?.staff_id || 'STAFF'} - ${name}`;
                  })()}
                </div>
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
  const [selectedDay, setSelectedDay] = useState<string>('monday');

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: rolesData } = useQuery('roles', rolesService.getRoles, {
    refetchOnWindowFocus: false,
  });

  const teacherRoleId = rolesData?.data?.find(
    (role) => role.name?.toLowerCase() === 'teacher'
  )?.id;

  const { data: teachersData } = useQuery(
    ['teachers-for-timetable', teacherRoleId],
    () =>
      hrService.getStaff({
        role_id: teacherRoleId,
        is_active: true,
        page: 1,
        limit: 100,
      }),
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
    : [])
    .filter((teacher: any) => (teacherRoleId ? true : teacher.role_name?.toLowerCase() === 'teacher'))
    .filter((teacher: any) => teacher.user_id != null);

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
      {/* Mode Toggle Header */}
      <div className="timetable-mode-header">
        <h3>Select Criteria</h3>
        <div className="toggle-switch-container">
          <label className="toggle-switch-label left">View Timetable</label>
          <button
            className={`toggle-switch ${viewMode === 'add' ? 'active' : ''}`}
            onClick={() => {
              const newMode = viewMode === 'view' ? 'add' : 'view';
              setViewMode(newMode);
              setTimetableEntries({});
              setSelectedDay('monday');
            }}
            title={viewMode === 'view' ? 'Switch to Add/Edit mode' : 'Switch to View mode'}
            aria-label={`Toggle between View and Add/Edit mode (currently ${viewMode})`}
          >
            <div className="toggle-switch-thumb">
              <span className="toggle-switch-icon">{viewMode === 'view' ? '👁️' : '✏️'}</span>
            </div>
          </button>
          <label className="toggle-switch-label right">Add/Edit Timetable</label>
        </div>
      </div>

      {/* Selection Criteria Section */}
      <div className="timetable-criteria-section">
        <div className="form-row">
          <div className="form-group">
            <label>Class <span className="required">*</span></label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value ? Number(e.target.value) : '');
                setSelectedSectionId('');
                setSelectedSubjectGroupId('');
                setSelectedDay('monday');
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
        </div>

        {viewMode === 'add' && (
          <div style={{ marginTop: '15px' }}>
            <div className="form-row">
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
              <div className="form-actions" style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleAddTimetable}
                  disabled={!selectedClassId || !selectedSectionId || !selectedSubjectGroupId}
                >
                  Start Adding
                </button>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'view' && (
          <div style={{ marginTop: '15px' }}>
            <div className="form-actions" style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={handleViewTimetable}
                disabled={!selectedClassId || !selectedSectionId}
              >
                Search
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Viewing Mode */}
      {viewMode === 'view' && selectedClassId && selectedSectionId && (
        <div className="timetable-view-section">
          {timetable.length === 0 ? (
            <div className="empty-state">
              No timetable entries found for {classes.find(c => c.id === Number(selectedClassId))?.name} - {sections.find(s => s.id === Number(selectedSectionId))?.name}
            </div>
          ) : (
            <>
              {/* Days Tabs */}
              <div className="timetable-days-tabs">
                {daysOfWeek.map((day) => (
                  <button
                    key={day}
                    className={`day-tab ${selectedDay === day ? 'active' : ''} ${timetableByDay[day]?.length > 0 ? 'has-entries' : ''}`}
                    onClick={() => setSelectedDay(day)}
                  >
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </button>
                ))}
              </div>

              {/* Timetable Grid */}
              <div className="timetable-entries-section">
                {timetableByDay[selectedDay]?.length > 0 ? (
                  <table className="timetable-table-view">
                    <thead>
                      <tr>
                        <th>Time From</th>
                        <th>Time To</th>
                        <th>Subject</th>
                        <th>Teacher</th>
                        <th>Room No</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timetableByDay[selectedDay]
                        .sort((a, b) => a.time_from.localeCompare(b.time_from))
                        .map((entry) => (
                          <tr key={entry.id}>
                            <td>{entry.time_from}</td>
                            <td>{entry.time_to}</td>
                            <td>
                              <strong>{entry.subject_name}</strong>
                              {entry.subject_code && <span className="code"> ({entry.subject_code})</span>}
                            </td>
                            <td>{entry.teacher_name || '-'}</td>
                            <td>{entry.room_no || '-'}</td>
                            <td>
                              <button
                                className="btn-edit"
                                onClick={() => handleEditEntry(entry)}
                                style={{ marginRight: '5px' }}
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
                  <div className="empty-day-state">
                    <p>No classes scheduled for {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Adding Mode */}
      {viewMode === 'add' && selectedClassId && selectedSectionId && selectedSubjectGroupId && (
        <div className="timetable-add-section">
          {/* Days Tabs for Adding */}
          <div className="timetable-days-tabs add-mode">
            {daysOfWeek.map((day) => (
              <button
                key={day}
                className={`day-tab ${selectedDay === day ? 'active' : ''} ${timetableEntries[day] ? 'has-entry' : ''}`}
                onClick={() => setSelectedDay(day)}
              >
                <span>{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                {timetableEntries[day] && <span className="entry-indicator">+</span>}
              </button>
            ))}
          </div>

          {/* Add Entry Form */}
          <div className="timetable-add-form-section">
            <h4>Add Entry for {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}</h4>
            <div className="add-entry-form">
              <div className="form-group">
                <label>Subject <span className="required">*</span></label>
                <select
                  value={timetableEntries[selectedDay]?.subject_id || ''}
                  onChange={(e) =>
                    setTimetableEntries({
                      ...timetableEntries,
                      [selectedDay]: { ...timetableEntries[selectedDay], subject_id: e.target.value ? Number(e.target.value) : undefined }
                    })
                  }
                >
                  <option value="">Select Subject</option>
                  {availableSubjects?.map((subj) => (
                    <option key={subj.id} value={subj.id}>
                      {subj.name} {subj.code ? `(${subj.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Teacher</label>
                <select
                  value={timetableEntries[selectedDay]?.teacher_id || ''}
                  onChange={(e) =>
                    setTimetableEntries({
                      ...timetableEntries,
                      [selectedDay]: { ...timetableEntries[selectedDay], teacher_id: e.target.value ? Number(e.target.value) : undefined }
                    })
                  }
                >
                  <option value="">Select Teacher (Optional)</option>
                  {teachers?.map((teacher: any) => (
                    <option key={teacher.id} value={teacher.user_id}>
                      {teacher.first_name} {teacher.last_name || ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Time From <span className="required">*</span></label>
                  <input
                    type="time"
                    value={timetableEntries[selectedDay]?.time_from || ''}
                    onChange={(e) =>
                      setTimetableEntries({
                        ...timetableEntries,
                        [selectedDay]: { ...timetableEntries[selectedDay], time_from: e.target.value }
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Time To <span className="required">*</span></label>
                  <input
                    type="time"
                    value={timetableEntries[selectedDay]?.time_to || ''}
                    onChange={(e) =>
                      setTimetableEntries({
                        ...timetableEntries,
                        [selectedDay]: { ...timetableEntries[selectedDay], time_to: e.target.value }
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Room No</label>
                <input
                  type="text"
                  value={timetableEntries[selectedDay]?.room_no || ''}
                  onChange={(e) =>
                    setTimetableEntries({
                      ...timetableEntries,
                      [selectedDay]: { ...timetableEntries[selectedDay], room_no: e.target.value }
                    })
                  }
                  placeholder="Optional"
                />
              </div>

              <div className="form-actions" style={{ marginTop: '15px' }}>
                <button
                  className="btn-primary"
                  onClick={() => {
                    const entry = timetableEntries[selectedDay];
                    if (entry?.subject_id && entry?.time_from && entry?.time_to) {
                      showToast(`Entry added for ${selectedDay}`, 'success');
                    } else {
                      showToast('Please fill in required fields (Subject, Time From, Time To)', 'error');
                    }
                  }}
                >
                  + Add New
                </button>
              </div>
            </div>

            {/* Entries Summary */}
            <div className="timetable-entries-summary">
              <h4>Added Entries</h4>
              {Object.keys(timetableEntries).length === 0 ? (
                <p className="empty-summary">No entries added yet</p>
              ) : (
                <ul className="entries-list">
                  {Object.entries(timetableEntries).map(([day, entry]) => (
                    entry.subject_id && entry.time_from && entry.time_to && (
                      <li key={day}>
                        <strong>{day.charAt(0).toUpperCase() + day.slice(1)}</strong>: {entry.time_from} - {entry.time_to}
                      </li>
                    )
                  ))}
                </ul>
              )}
            </div>

            {/* Save Actions */}
            <div className="form-actions" style={{ marginTop: '20px' }}>
              <button
                className="btn-primary"
                onClick={handleSaveTimetable}
                disabled={createMutation.isLoading || Object.keys(timetableEntries).length === 0}
              >
                {createMutation.isLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setViewMode('view');
                  setTimetableEntries({});
                  setSelectedDay('monday');
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
              {availableSubjects?.map((subj) => (
                <option key={subj.id} value={subj.id}>
                  {subj.name} {subj.code ? `(${subj.code})` : ''}
                </option>
              ))}
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
              {teachers?.map((teacher: any) => (
                <option key={teacher.id} value={teacher.user_id}>
                  {teacher.first_name} {teacher.last_name || ''}
                </option>
              ))}
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
                  setTimetableEntries({ ...timetableEntries, [editingDay]: editingEntry });
                  setShowEditModal(false);
                  setEditingEntry(null);
                } else {
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

// ========== Class Timetable Tab ==========
const ClassTimetableTab = ({ classes, sections, subjects }: { classes: Class[]; sections: Section[]; subjects: Subject[] }) => {
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('');
  const [selectedSectionId, setSelectedSectionId] = useState<number | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partial<TimetableEntry> | null>(null);

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: rolesData } = useQuery('roles', rolesService.getRoles, {
    refetchOnWindowFocus: false,
  });

  const teacherRoleId = rolesData?.data?.find(
    (role) => role.name?.toLowerCase() === 'teacher'
  )?.id;

  const { data: staffData } = useQuery(
    ['staff-for-class-timetable', teacherRoleId],
    () =>
      hrService.getStaff({
        role_id: teacherRoleId,
        is_active: true,
        page: 1,
        limit: 100,
      }),
    { refetchOnWindowFocus: false }
  );

  const { data: timetableData, refetch: refetchTimetable } = useQuery(
    ['class-timetable', selectedClassId, selectedSectionId],
    () => {
      if (!selectedClassId || !selectedSectionId) return Promise.resolve({ success: true, data: [] as TimetableEntry[] });
      return academicsService.getTimetable({ class_id: Number(selectedClassId), section_id: Number(selectedSectionId) });
    },
    { enabled: false }
  );

  const createMutation = useMutation(academicsService.createTimetableEntry, {
    onSuccess: () => {
      queryClient.invalidateQueries(['class-timetable']);
      refetchTimetable();
      setShowForm(false);
      showToast('Timetable entry added successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to add timetable entry', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<TimetableEntry> }) => academicsService.updateTimetableEntry(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['class-timetable']);
        refetchTimetable();
        setShowForm(false);
        setEditing(null);
        showToast('Timetable entry updated successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update timetable entry', 'error');
      },
    }
  );

  const deleteMutation = useMutation(academicsService.deleteTimetableEntry, {
    onSuccess: () => {
      queryClient.invalidateQueries(['class-timetable']);
      refetchTimetable();
      showToast('Timetable entry deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete timetable entry', 'error');
    },
  });

  const { data: permsData } = useQuery('user-permissions', () => profileService.getUserPermissions());
  const userPermissions = permsData?.data || {};
  const modulePerms: string[] = userPermissions['academics'] || [];
  const canAdd = modulePerms.includes('add');
  const canEdit = modulePerms.includes('edit');
  const canDelete = modulePerms.includes('delete');

  const staff = (staffData?.data || []).filter((s: any) => s.user_id);
  const timetable = timetableData?.data || [];

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const grouped = useMemo(() => {
    const g: Record<string, TimetableEntry[]> = {};
    daysOfWeek.forEach((d) => { g[d] = timetable.filter((t) => t.day_of_week === d); });
    return g;
  }, [timetable]);

  const availableSections = selectedClassId
    ? sections.filter(s => {
        const selectedClass = classes.find(c => c.id === Number(selectedClassId));
        if (!selectedClass?.section_ids) return false;
        const sectionIds = selectedClass.section_ids.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id));
        return sectionIds.includes(s.id);
      })
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedSectionId) {
      showToast('Please select class and section first', 'error');
      return;
    }
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const payload: Partial<TimetableEntry> = {
      class_id: Number(selectedClassId),
      section_id: Number(selectedSectionId),
      subject_id: Number(formData.get('subject_id')) || undefined,
      teacher_id: Number(formData.get('teacher_id')) || undefined,
      day_of_week: String(formData.get('day_of_week')) as any,
      time_from: String(formData.get('time_from')),
      time_to: String(formData.get('time_to')),
      room_no: String(formData.get('room_no')) || undefined,
    };

    if (editing && editing.id) {
      updateMutation.mutate({ id: String(editing.id), data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="tab-content">
      {/* Selection Criteria Section */}
      <div className="timetable-criteria-section">
        <h3>Select Criteria</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Class <span className="required">*</span></label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value ? Number(e.target.value) : '');
                setSelectedSectionId('');
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

          <div className="form-actions" style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => refetchTimetable()}
              disabled={!selectedClassId || !selectedSectionId}
            >
              Search
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => { setShowForm((s) => !s); setEditing(null); }}
              disabled={!selectedClassId || !selectedSectionId}
            >
              {showForm ? '✕ Close' : '+ Add New'}
            </button>
          </div>
        </div>
      </div>

      {/* View Section */}
      {selectedClassId && selectedSectionId && (
        <>
          {timetable.length === 0 && !showForm ? (
            <div className="empty-state">
              <p>No timetable entries found for {classes.find(c => c.id === Number(selectedClassId))?.name} - {sections.find(s => s.id === Number(selectedSectionId))?.name}</p>
              {canAdd && <p style={{ fontSize: '0.95em', marginTop: '10px' }}>Click "+ Add New" button to add timetable entries.</p>}
            </div>
          ) : timetable.length > 0 ? (
            <div className="timetable-view-section">
              {/* Subject x Days Grid */}
              <table className="class-timetable-grid">
                <thead>
                  <tr>
                    <th>Subject</th>
                    {daysOfWeek.map((day) => (
                      <th key={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject) => (
                    <tr key={subject.id}>
                      <td>{subject.name}</td>
                      {daysOfWeek.map((day) => {
                        const entry = timetable.find(
                          (e) => e.subject_id === subject.id && e.day_of_week === day
                        );
                        return (
                          <td key={`${subject.id}-${day}`}>
                            {entry ? (
                              <div className="class-timetable-cell has-entry">
                                <div className="class-timetable-time">{entry.time_from}</div>
                                <div className="class-timetable-teacher">{entry.teacher_name || '-'}</div>
                              </div>
                            ) : (
                              <div className="class-timetable-cell">
                                <div className="class-timetable-empty">-</div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      )}

      {/* Add/Edit Form */}
      {showForm && selectedClassId && selectedSectionId && (
        <div style={{ background: 'var(--panel-bg, #fff)', padding: '16px', borderRadius: '6px', marginTop: '20px', border: '1px solid var(--border-color, #e6e6e6)' }}>
          <form onSubmit={handleSubmit}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>{editing ? 'Edit Timetable Entry' : 'Add Timetable Entry'}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Day <span className="required">*</span></label>
                <select name="day_of_week" defaultValue={editing?.day_of_week || 'monday'} required>
                  {daysOfWeek.map((d) => (
                    <option key={d} value={d}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Subject <span className="required">*</span></label>
                <select name="subject_id" defaultValue={editing?.subject_id ?? ''} required>
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.code ? `(${s.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Teacher</label>
                <select name="teacher_id" defaultValue={editing?.teacher_id ?? ''}>
                  <option value="">Select Teacher</option>
                  {staff.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.first_name} {t.last_name || ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Room</label>
                <input type="text" name="room_no" defaultValue={editing?.room_no ?? ''} />
              </div>

              <div className="form-group">
                <label>From <span className="required">*</span></label>
                <input type="time" name="time_from" defaultValue={editing?.time_from ?? ''} required />
              </div>

              <div className="form-group">
                <label>To <span className="required">*</span></label>
                <input type="time" name="time_to" defaultValue={editing?.time_to ?? ''} required />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={createMutation.isLoading || updateMutation.isLoading}
              >
                {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setShowForm(false); setEditing(null); }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// ========== Teachers Timetable Tab ==========
const TeachersTimetableTab = () => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | ''>('');

  const { data: rolesData } = useQuery('roles', rolesService.getRoles, {
    refetchOnWindowFocus: false,
  });

  const teacherRoleId = rolesData?.data?.find(
    (role) => role.name?.toLowerCase() === 'teacher'
  )?.id;

  const { data: teachersData } = useQuery(
    ['teachers-for-timetable-view', teacherRoleId],
    () =>
      hrService.getStaff({
        role_id: teacherRoleId,
        is_active: true,
        page: 1,
        limit: 100,
      }),
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

  const teachers = (teachersData?.data || []).filter((staff: any) => {
    if (teacherRoleId) return true;
    return staff.role_name?.toLowerCase() === 'teacher';
  });
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
      {/* Selection Criteria Section */}
      <div className="timetable-criteria-section">
        <h3>Select Teacher</h3>
        <div className="form-row">
          <div className="form-group" style={{ flex: 1, maxWidth: '400px' }}>
            <label>Teachers</label>
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

          <div className="form-actions" style={{ display: 'flex' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                if (selectedTeacherId) {
                  refetchTimetable();
                }
              }}
              disabled={!selectedTeacherId}
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* View Section */}
      {!selectedTeacherId ? (
        <div className="empty-state">
          <p>Please select a teacher to view their timetable.</p>
        </div>
      ) : timetable.length === 0 ? (
        <div className="empty-state">
          <p>No timetable entries found for {selectedTeacher ? `${selectedTeacher.first_name} ${selectedTeacher.last_name || ''}`.trim() : 'the selected teacher'}.</p>
        </div>
      ) : (
        <div className="timetable-view-section">
          {/* Days Layout View */}
          <div className="teacher-days-grid">
            {daysOfWeek.map((day) => (
              <div key={day} className="teacher-day-column">
                <div className="teacher-day-header">
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </div>
                <div className="teacher-day-entries">
                  {timetableByDay[day]?.length > 0 ? (
                    timetableByDay[day].map((entry: TimetableEntry, index: number) => (
                      <div key={`${day}-${index}`} className="teacher-entry-card">
                        <div className="entry-class">
                          <span className="entry-label">Class:</span> {entry.class_name}({entry.section_name})
                        </div>
                        <div className="entry-subject">
                          <span className="entry-label">Subject:</span> {entry.subject_name} {entry.subject_code ? `(${entry.subject_code})` : ''}
                        </div>
                        <div className="entry-time">
                          {entry.time_from} - {entry.time_to}
                        </div>
                        {entry.room_no && (
                          <div className="entry-room">
                            <span className="entry-label">Room:</span> {entry.room_no}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="teacher-day-empty">Not Scheduled</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Academics;

