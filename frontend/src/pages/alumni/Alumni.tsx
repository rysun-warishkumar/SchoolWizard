import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import {
  alumniService,
  Alumni,
  AlumniEvent,
  EventRegistration,
} from '../../services/api/alumniService';
import { academicsService } from '../../services/api/academicsService';
import { studentsService } from '../../services/api/studentsService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import './Alumni.css';

type TabType = 'alumni-records' | 'alumni-events';

const AlumniPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType;
  const validTabs: TabType[] = ['alumni-records', 'alumni-events'];
  const defaultTab: TabType = validTabs.includes(tabFromUrl) ? tabFromUrl : 'alumni-records';

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
    <div className="alumni-page">
      <div className="page-header">
        <h1>Alumni</h1>
      </div>

      <div className="alumni-tabs-wrapper">
        <div className="alumni-tabs-container">
          {showLeftArrow && (
            <button
              className="alumni-tabs-arrow alumni-tabs-arrow-left"
              onClick={() => scrollTabs('left')}
              aria-label="Scroll tabs left"
            >
              ‹
            </button>
          )}
          <div className="alumni-tabs" ref={tabsContainerRef}>
            <button
              ref={activeTab === 'alumni-records' ? activeTabRef : null}
              className={activeTab === 'alumni-records' ? 'active' : ''}
              onClick={() => handleTabChange('alumni-records')}
            >
              Alumni Records
            </button>
            <button
              ref={activeTab === 'alumni-events' ? activeTabRef : null}
              className={activeTab === 'alumni-events' ? 'active' : ''}
              onClick={() => handleTabChange('alumni-events')}
            >
              Alumni Events
            </button>
          </div>
          {showRightArrow && (
            <button
              className="alumni-tabs-arrow alumni-tabs-arrow-right"
              onClick={() => scrollTabs('right')}
              aria-label="Scroll tabs right"
            >
              ›
            </button>
          )}
        </div>
      </div>

      <div className="alumni-content">
        {activeTab === 'alumni-records' && <AlumniRecordsTab />}
        {activeTab === 'alumni-events' && <AlumniEventsTab />}
      </div>
    </div>
  );
};

// ========== Alumni Records Tab ==========

const AlumniRecordsTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [graduationYearFilter, setGraduationYearFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: alumni = [], isLoading } = useQuery(
    ['alumni', searchTerm, graduationYearFilter, classFilter, statusFilter],
    () =>
      alumniService.getAlumni({
        search: searchTerm || undefined,
        graduation_year: graduationYearFilter ? parseInt(graduationYearFilter) : undefined,
        class_id: classFilter ? parseInt(classFilter) : undefined,
        status: statusFilter || undefined,
      }),
    { refetchOnWindowFocus: true }
  );

  const { data: classesData } = useQuery(
    ['classes'],
    academicsService.getClasses,
    { refetchOnWindowFocus: false }
  );
  const classes = classesData?.data || [];

  const createMutation = useMutation(alumniService.createAlumni, {
    onSuccess: () => {
      queryClient.invalidateQueries(['alumni']);
      setShowCreateModal(false);
      showToast('Alumni record created successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create alumni record', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: FormData }) => alumniService.updateAlumni(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['alumni']);
        setShowEditModal(false);
        setSelectedAlumni(null);
        showToast('Alumni record updated successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update alumni record', 'error');
      },
    }
  );

  const deleteMutation = useMutation(alumniService.deleteAlumni, {
    onSuccess: () => {
      queryClient.invalidateQueries(['alumni']);
      showToast('Alumni record deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete alumni record', 'error');
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate(formData);
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAlumni) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({ id: selectedAlumni.id, data: formData });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this alumni record?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEditClick = (alumni: Alumni) => {
    setSelectedAlumni(alumni);
    setShowEditModal(true);
  };

  const currentYear = new Date().getFullYear();
  const graduationYears = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search alumni..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={graduationYearFilter} onChange={(e) => setGraduationYearFilter(e.target.value)}>
            <option value="">All Years</option>
            {graduationYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Add Alumni
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Graduation Year</th>
                <th>Class</th>
                <th>Profession</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {alumni.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-state">
                    No alumni records found
                  </td>
                </tr>
              ) : (
                alumni.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.photo ? (
                        <img
                          src={`${import.meta.env.VITE_API_BASE_URL}${item.photo}`}
                          alt={`${item.first_name} ${item.last_name || ''}`}
                          className="alumni-photo"
                        />
                      ) : (
                        <div className="alumni-photo-placeholder">
                          {item.first_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td>
                      {item.first_name} {item.last_name || ''}
                    </td>
                    <td>{item.email || '-'}</td>
                    <td>{item.phone || '-'}</td>
                    <td>{item.graduation_year}</td>
                    <td>
                      {item.class_name_display || item.class_name || '-'}
                      {item.section_name_display || item.section_name
                        ? ` - ${item.section_name_display || item.section_name}`
                        : ''}
                    </td>
                    <td>{item.current_profession || '-'}</td>
                    <td>
                      <span className={`badge ${item.status === 'active' ? 'badge-success' : 'badge-inactive'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-sm btn-edit" onClick={() => handleEditClick(item)}>
                        Edit
                      </button>
                      <button className="btn-sm btn-delete" onClick={() => handleDelete(item.id)}>
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
        title="Add Alumni"
        size="large"
      >
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input type="text" name="first_name" required />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" name="last_name" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" name="phone" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" name="date_of_birth" />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select name="gender" defaultValue="male">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Graduation Year *</label>
              <input type="number" name="graduation_year" min="1900" max={currentYear} required />
            </div>
            <div className="form-group">
              <label>Class</label>
              <select name="class_id">
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Current Profession</label>
            <input type="text" name="current_profession" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Current Company</label>
              <input type="text" name="current_company" />
            </div>
            <div className="form-group">
              <label>Current Designation</label>
              <input type="text" name="current_designation" />
            </div>
          </div>
          <div className="form-group">
            <label>Current Address</label>
            <textarea name="current_address" rows={2}></textarea>
          </div>
          <div className="form-group">
            <label>Photo</label>
            <input type="file" name="photo" accept="image/*" />
          </div>
          <div className="form-group">
            <label>LinkedIn URL</label>
            <input type="url" name="linkedin_url" />
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea name="bio" rows={3}></textarea>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="status" defaultValue="active">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
          setSelectedAlumni(null);
        }}
        title="Edit Alumni"
        size="large"
      >
        {selectedAlumni && (
          <form onSubmit={handleEdit}>
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input type="text" name="first_name" defaultValue={selectedAlumni.first_name} required />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" name="last_name" defaultValue={selectedAlumni.last_name || ''} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" defaultValue={selectedAlumni.email || ''} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" name="phone" defaultValue={selectedAlumni.phone || ''} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  defaultValue={selectedAlumni.date_of_birth ? selectedAlumni.date_of_birth.split('T')[0] : ''}
                />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select name="gender" defaultValue={selectedAlumni.gender}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Graduation Year *</label>
                <input
                  type="number"
                  name="graduation_year"
                  defaultValue={selectedAlumni.graduation_year}
                  min="1900"
                  max={currentYear}
                  required
                />
              </div>
              <div className="form-group">
                <label>Class</label>
                <select name="class_id" defaultValue={selectedAlumni.class_id?.toString() || ''}>
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Current Profession</label>
              <input type="text" name="current_profession" defaultValue={selectedAlumni.current_profession || ''} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Current Company</label>
                <input type="text" name="current_company" defaultValue={selectedAlumni.current_company || ''} />
              </div>
              <div className="form-group">
                <label>Current Designation</label>
                <input type="text" name="current_designation" defaultValue={selectedAlumni.current_designation || ''} />
              </div>
            </div>
            <div className="form-group">
              <label>Current Address</label>
              <textarea name="current_address" rows={2} defaultValue={selectedAlumni.current_address || ''}></textarea>
            </div>
            <div className="form-group">
              <label>Photo</label>
              <input type="file" name="photo" accept="image/*" />
              {selectedAlumni.photo && (
                <div className="current-photo">
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL}${selectedAlumni.photo}`}
                    alt="Current photo"
                    className="photo-preview"
                  />
                </div>
              )}
            </div>
            <div className="form-group">
              <label>LinkedIn URL</label>
              <input type="url" name="linkedin_url" defaultValue={selectedAlumni.linkedin_url || ''} />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea name="bio" rows={3} defaultValue={selectedAlumni.bio || ''}></textarea>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" defaultValue={selectedAlumni.status}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedAlumni(null);
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

// ========== Alumni Events Tab ==========

const AlumniEventsTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AlumniEvent | null>(null);
  const [selectedEventForRegistrations, setSelectedEventForRegistrations] = useState<AlumniEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery(
    ['alumni-events', searchTerm, eventTypeFilter, statusFilter],
    () =>
      alumniService.getAlumniEvents({
        search: searchTerm || undefined,
        event_type: eventTypeFilter || undefined,
        status: statusFilter || undefined,
      }),
    { refetchOnWindowFocus: true }
  );

  const createMutation = useMutation(alumniService.createAlumniEvent, {
    onSuccess: () => {
      queryClient.invalidateQueries(['alumni-events']);
      setShowCreateModal(false);
      showToast('Alumni event created successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create alumni event', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: FormData }) => alumniService.updateAlumniEvent(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['alumni-events']);
        setShowEditModal(false);
        setSelectedEvent(null);
        showToast('Alumni event updated successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update alumni event', 'error');
      },
    }
  );

  const deleteMutation = useMutation(alumniService.deleteAlumniEvent, {
    onSuccess: () => {
      queryClient.invalidateQueries(['alumni-events']);
      showToast('Alumni event deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete alumni event', 'error');
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate(formData);
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEvent) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({ id: selectedEvent.id, data: formData });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this alumni event?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEditClick = (event: AlumniEvent) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const handleViewRegistrations = (event: AlumniEvent) => {
    setSelectedEventForRegistrations(event);
    setShowRegistrationsModal(true);
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="reunion">Reunion</option>
            <option value="networking">Networking</option>
            <option value="seminar">Seminar</option>
            <option value="workshop">Workshop</option>
            <option value="other">Other</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Add Event
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Event Title</th>
                <th>Type</th>
                <th>Date</th>
                <th>Venue</th>
                <th>Registrations</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    No events found
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.event_title}</td>
                    <td>
                      <span className={`badge badge-${event.event_type}`}>{event.event_type}</span>
                    </td>
                    <td>{new Date(event.event_date).toLocaleDateString()}</td>
                    <td>{event.event_venue || '-'}</td>
                    <td>
                      {event.registrations_count || 0} registered
                      {event.attended_count ? ` (${event.attended_count} attended)` : ''}
                    </td>
                    <td>
                      <span className={`badge badge-${event.status}`}>{event.status}</span>
                    </td>
                    <td>
                      <button className="btn-sm btn-edit" onClick={() => handleEditClick(event)}>
                        Edit
                      </button>
                      <button
                        className="btn-sm btn-primary"
                        onClick={() => handleViewRegistrations(event)}
                      >
                        Registrations
                      </button>
                      <button className="btn-sm btn-delete" onClick={() => handleDelete(event.id)}>
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
        title="Add Alumni Event"
        size="large"
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Event Title *</label>
            <input type="text" name="event_title" required />
          </div>
          <div className="form-group">
            <label>Event Description</label>
            <textarea name="event_description" rows={4}></textarea>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Event Date *</label>
              <input type="date" name="event_date" required />
            </div>
            <div className="form-group">
              <label>Event Time</label>
              <input type="time" name="event_time" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>End Date</label>
              <input type="date" name="event_end_date" />
            </div>
            <div className="form-group">
              <label>End Time</label>
              <input type="time" name="event_end_time" />
            </div>
          </div>
          <div className="form-group">
            <label>Event Venue</label>
            <input type="text" name="event_venue" />
          </div>
          <div className="form-group">
            <label>Event Address</label>
            <textarea name="event_address" rows={2}></textarea>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Event Type</label>
              <select name="event_type" defaultValue="reunion">
                <option value="reunion">Reunion</option>
                <option value="networking">Networking</option>
                <option value="seminar">Seminar</option>
                <option value="workshop">Workshop</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" defaultValue="upcoming">
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" name="registration_required" />
              Registration Required
            </label>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Registration Deadline</label>
              <input type="date" name="registration_deadline" />
            </div>
            <div className="form-group">
              <label>Max Participants</label>
              <input type="number" name="max_participants" min="1" />
            </div>
          </div>
          <div className="form-group">
            <label>Registration Fee</label>
            <input type="number" name="registration_fee" step="0.01" min="0" defaultValue="0" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Contact Person</label>
              <input type="text" name="contact_person" />
            </div>
            <div className="form-group">
              <label>Contact Email</label>
              <input type="email" name="contact_email" />
            </div>
          </div>
          <div className="form-group">
            <label>Contact Phone</label>
            <input type="tel" name="contact_phone" />
          </div>
          <div className="form-group">
            <label>Event Image</label>
            <input type="file" name="event_image" accept="image/*" />
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
          setSelectedEvent(null);
        }}
        title="Edit Alumni Event"
        size="large"
      >
        {selectedEvent && (
          <form onSubmit={handleEdit}>
            <div className="form-group">
              <label>Event Title *</label>
              <input type="text" name="event_title" defaultValue={selectedEvent.event_title} required />
            </div>
            <div className="form-group">
              <label>Event Description</label>
              <textarea name="event_description" rows={4} defaultValue={selectedEvent.event_description || ''}></textarea>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Event Date *</label>
                <input
                  type="date"
                  name="event_date"
                  defaultValue={selectedEvent.event_date.split('T')[0]}
                  required
                />
              </div>
              <div className="form-group">
                <label>Event Time</label>
                <input
                  type="time"
                  name="event_time"
                  defaultValue={selectedEvent.event_time ? selectedEvent.event_time.substring(0, 5) : ''}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  name="event_end_date"
                  defaultValue={selectedEvent.event_end_date ? selectedEvent.event_end_date.split('T')[0] : ''}
                />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  name="event_end_time"
                  defaultValue={selectedEvent.event_end_time ? selectedEvent.event_end_time.substring(0, 5) : ''}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Event Venue</label>
              <input type="text" name="event_venue" defaultValue={selectedEvent.event_venue || ''} />
            </div>
            <div className="form-group">
              <label>Event Address</label>
              <textarea name="event_address" rows={2} defaultValue={selectedEvent.event_address || ''}></textarea>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Event Type</label>
                <select name="event_type" defaultValue={selectedEvent.event_type}>
                  <option value="reunion">Reunion</option>
                  <option value="networking">Networking</option>
                  <option value="seminar">Seminar</option>
                  <option value="workshop">Workshop</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" defaultValue={selectedEvent.status}>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="registration_required"
                  defaultChecked={selectedEvent.registration_required}
                />
                Registration Required
              </label>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Registration Deadline</label>
                <input
                  type="date"
                  name="registration_deadline"
                  defaultValue={
                    selectedEvent.registration_deadline ? selectedEvent.registration_deadline.split('T')[0] : ''
                  }
                />
              </div>
              <div className="form-group">
                <label>Max Participants</label>
                <input
                  type="number"
                  name="max_participants"
                  min="1"
                  defaultValue={selectedEvent.max_participants || ''}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Registration Fee</label>
              <input
                type="number"
                name="registration_fee"
                step="0.01"
                min="0"
                defaultValue={selectedEvent.registration_fee || 0}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Contact Person</label>
                <input type="text" name="contact_person" defaultValue={selectedEvent.contact_person || ''} />
              </div>
              <div className="form-group">
                <label>Contact Email</label>
                <input type="email" name="contact_email" defaultValue={selectedEvent.contact_email || ''} />
              </div>
            </div>
            <div className="form-group">
              <label>Contact Phone</label>
              <input type="tel" name="contact_phone" defaultValue={selectedEvent.contact_phone || ''} />
            </div>
            <div className="form-group">
              <label>Event Image</label>
              <input type="file" name="event_image" accept="image/*" />
              {selectedEvent.event_image && (
                <div className="current-photo">
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL}${selectedEvent.event_image}`}
                    alt="Current event image"
                    className="photo-preview"
                  />
                </div>
              )}
            </div>
            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedEvent(null);
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

      {/* Registrations Modal */}
      {showRegistrationsModal && selectedEventForRegistrations && (
        <EventRegistrationsManager
          event={selectedEventForRegistrations}
          onClose={() => {
            setShowRegistrationsModal(false);
            setSelectedEventForRegistrations(null);
          }}
        />
      )}
    </div>
  );
};

// ========== Event Registrations Manager ==========

const EventRegistrationsManager = ({
  event,
  onClose,
}: {
  event: AlumniEvent;
  onClose: () => void;
}) => {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<EventRegistration | null>(null);
  const [alumniList, setAlumniList] = useState<Alumni[]>([]);

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: registrations = [], isLoading } = useQuery(
    ['alumni-event-registrations', event.id],
    () => alumniService.getEventRegistrations({ event_id: event.id }),
    { refetchOnWindowFocus: true }
  );

  useQuery(['alumni'], () => alumniService.getAlumni(), {
    onSuccess: (data) => setAlumniList(data),
  });

  const registerMutation = useMutation(alumniService.registerForEvent, {
    onSuccess: () => {
      queryClient.invalidateQueries(['alumni-event-registrations', event.id]);
      queryClient.invalidateQueries(['alumni-events']);
      setShowRegisterModal(false);
      showToast('Alumni registered for event successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to register alumni', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => alumniService.updateRegistration(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['alumni-event-registrations', event.id]);
        queryClient.invalidateQueries(['alumni-events']);
        setSelectedRegistration(null);
        showToast('Registration updated successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update registration', 'error');
      },
    }
  );

  const deleteMutation = useMutation(alumniService.deleteRegistration, {
    onSuccess: () => {
      queryClient.invalidateQueries(['alumni-event-registrations', event.id]);
      queryClient.invalidateQueries(['alumni-events']);
      showToast('Registration deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete registration', 'error');
    },
  });

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    registerMutation.mutate({
      event_id: event.id,
      alumni_id: parseInt(formData.get('alumni_id') as string),
      special_requirements: formData.get('special_requirements') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    });
  };

  const handleUpdateAttendance = (registration: EventRegistration, status: string) => {
    updateMutation.mutate({
      id: registration.id,
      data: {
        attendance_status: status,
      },
    });
  };

  const handleUpdatePayment = (registration: EventRegistration) => {
    updateMutation.mutate({
      id: registration.id,
      data: {
        payment_status: 'paid',
        payment_date: new Date().toISOString(),
      },
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this registration?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Event Registrations - ${event.event_title}`} size="large">
      <div className="registrations-manager">
        <div className="tab-header">
          <div>
            <p>
              <strong>Total Registered:</strong> {registrations.length} | <strong>Attended:</strong>{' '}
              {registrations.filter((r) => r.attendance_status === 'attended').length}
            </p>
          </div>
          <button className="btn-primary" onClick={() => setShowRegisterModal(true)}>
            + Register Alumni
          </button>
        </div>

        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Alumni</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Payment</th>
                  <th>Attendance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      No registrations found
                    </td>
                  </tr>
                ) : (
                  registrations.map((registration) => (
                    <tr key={registration.id}>
                      <td>
                        {registration.first_name} {registration.last_name || ''}
                      </td>
                      <td>{registration.email || '-'}</td>
                      <td>{registration.phone || '-'}</td>
                      <td>
                        <span
                          className={`badge ${
                            registration.payment_status === 'paid'
                              ? 'badge-success'
                              : registration.payment_status === 'free'
                              ? 'badge-info'
                              : 'badge-warning'
                          }`}
                        >
                          {registration.payment_status}
                        </span>
                        {registration.payment_status === 'pending' && event.registration_fee > 0 && (
                          <button
                            className="btn-xs btn-primary"
                            onClick={() => handleUpdatePayment(registration)}
                            style={{ marginLeft: '8px' }}
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            registration.attendance_status === 'attended'
                              ? 'badge-success'
                              : registration.attendance_status === 'absent'
                              ? 'badge-error'
                              : 'badge-info'
                          }`}
                        >
                          {registration.attendance_status}
                        </span>
                        {registration.attendance_status !== 'attended' && (
                          <button
                            className="btn-xs btn-primary"
                            onClick={() => handleUpdateAttendance(registration, 'attended')}
                            style={{ marginLeft: '8px' }}
                          >
                            Mark Attended
                          </button>
                        )}
                      </td>
                      <td>
                        <button className="btn-sm btn-delete" onClick={() => handleDelete(registration.id)}>
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

        {/* Register Modal */}
        <Modal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          title="Register Alumni for Event"
        >
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Alumni *</label>
              <select name="alumni_id" required>
                <option value="">Select Alumni</option>
                {alumniList
                  .filter(
                    (alumni) => !registrations.some((reg) => reg.alumni_id === alumni.id)
                  )
                  .map((alumni) => (
                    <option key={alumni.id} value={alumni.id}>
                      {alumni.first_name} {alumni.last_name || ''} ({alumni.graduation_year})
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label>Special Requirements</label>
              <textarea name="special_requirements" rows={3}></textarea>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea name="notes" rows={2}></textarea>
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setShowRegisterModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Register
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Modal>
  );
};

export default AlumniPage;

