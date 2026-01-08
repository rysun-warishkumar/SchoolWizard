import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { calendarService, CalendarEvent, TodoTask } from '../../services/api/calendarService';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/common/Modal';
import './Calendar.css';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedTask, setSelectedTask] = useState<TodoTask | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'tasks' | 'events'>('calendar');

  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Get start and end of current month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const startDate = new Date(year, month, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

  const { data: events = [], refetch: refetchEvents, error: eventsError } = useQuery(
    ['calendar-events', startDate, endDate],
    () => calendarService.getCalendarEvents({ start_date: startDate, end_date: endDate }),
    { 
      refetchOnWindowFocus: true,
      retry: false,
      onError: (err: any) => {
        console.error('Error fetching calendar events:', err);
      }
    }
  );

  const { data: tasks = [], refetch: refetchTasks } = useQuery(
    ['todo-tasks', startDate, endDate],
    () => calendarService.getTodoTasks({ start_date: startDate, end_date: endDate }),
    { refetchOnWindowFocus: true }
  );

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(year, month + (direction === 'next' ? 1 : -1), 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedDate(new Date(event.event_date));
    setShowEventModal(true);
  };

  const handleTaskClick = (task: TodoTask) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const deleteEventMutation = useMutation(calendarService.deleteCalendarEvent, {
    onSuccess: () => {
      showToast('Event deleted successfully', 'success');
      refetchEvents();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete event', 'error');
    },
  });

  const handleDeleteEvent = (eventId: number, eventTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
      deleteEventMutation.mutate(eventId);
    }
  };

  // Calendar grid generation
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  // Get events for a specific date
  const getEventsForDate = (day: number | null) => {
    if (day === null) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    // Handle both date string and Date object formats
    return events.filter((event) => {
      const eventDate = typeof event.event_date === 'string' 
        ? event.event_date.split('T')[0] 
        : new Date(event.event_date).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar-page">
      <div className="page-header">
        <h1>Calendar & ToDo List</h1>
        <div className="header-actions">
          <button
            className={`btn-secondary ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            Calendar
          </button>
          <button
            className={`btn-secondary ${viewMode === 'events' ? 'active' : ''}`}
            onClick={() => setViewMode('events')}
          >
            Events
          </button>
          <button
            className={`btn-secondary ${viewMode === 'tasks' ? 'active' : ''}`}
            onClick={() => setViewMode('tasks')}
          >
            ToDo List
          </button>
        </div>
      </div>

      <div className="calendar-content">
        {viewMode === 'calendar' && (
          <div className="calendar-view">
            <div className="calendar-header">
              <button className="btn-secondary" onClick={() => navigateMonth('prev')}>
                ← Previous
              </button>
              <h2>
                {monthNames[month]} {year}
              </h2>
              <div>
                <button className="btn-secondary" onClick={goToToday} style={{ marginRight: '10px' }}>
                  Today
                </button>
                <button className="btn-secondary" onClick={() => navigateMonth('next')}>
                  Next →
                </button>
              </div>
            </div>

            <div className="calendar-grid">
              {dayNames.map((day) => (
                <div key={day} className="calendar-day-header">
                  {day}
                </div>
              ))}

              {days.map((day, index) => {
                const dayEvents = getEventsForDate(day);
                const isToday =
                  day !== null &&
                  new Date().getDate() === day &&
                  new Date().getMonth() === month &&
                  new Date().getFullYear() === year;

                return (
                  <div
                    key={index}
                    className={`calendar-day ${day === null ? 'empty' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => day !== null && handleDateClick(new Date(year, month, day))}
                  >
                    {day !== null && (
                      <>
                        <div className="day-header">
                          <div className="day-number">{day}</div>
                          {dayEvents.length > 0 && (
                            <div 
                              className="event-count-badge" 
                              title={`${dayEvents.length} event(s)`}
                              style={{ zIndex: 10 }}
                            >
                              {dayEvents.length}
                            </div>
                          )}
                        </div>
                        <div className="day-events">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className="event-item"
                              style={{ borderLeftColor: event.event_color }}
                              title={event.title}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEventClick(event);
                              }}
                            >
                              <span className="event-title">{event.title}</span>
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div
                              className="more-events"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDate(new Date(year, month, day));
                                setViewMode('events');
                              }}
                            >
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="calendar-sidebar">
              <div className="sidebar-section">
                <div className="sidebar-header">
                  <h3>Events</h3>
                  <button
                    className="btn-primary btn-sm"
                    onClick={() => {
                      setSelectedEvent(null);
                      setSelectedDate(null);
                      setShowEventModal(true);
                    }}
                  >
                    + Add
                  </button>
                </div>
                <div className="events-list-sidebar">
                  {eventsError ? (
                    <div className="empty-state" style={{ fontSize: '11px', color: 'var(--danger-color)' }}>
                      Error loading events
                    </div>
                  ) : events.length > 0 ? (
                    events.slice(0, 5).map((event) => (
                      <div
                        key={event.id}
                        className="event-item-sidebar"
                      >
                        <div
                          className="event-item-sidebar-content"
                          onClick={() => handleEventClick(event)}
                        >
                          <div
                            className="event-dot-sidebar"
                            style={{ backgroundColor: event.event_color }}
                          />
                          <div className="event-content-sidebar">
                            <div className="event-title-sidebar">{event.title}</div>
                            <div className="event-date-sidebar">
                              {new Date(event.event_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <button
                          className="btn-danger btn-sm event-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEvent(event.id, event.title);
                          }}
                          disabled={deleteEventMutation.isLoading}
                          title="Delete event"
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">No events</div>
                  )}
                  {events.length > 5 && (
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => setViewMode('events')}
                      style={{ width: '100%', marginTop: '8px' }}
                    >
                      View All Events
                    </button>
                  )}
                </div>
              </div>

              <div className="sidebar-section">
                <div className="sidebar-header">
                  <h3>ToDo List</h3>
                  <button
                    className="btn-primary btn-sm"
                    onClick={() => {
                      setSelectedTask(null);
                      setShowTaskModal(true);
                    }}
                  >
                    + Add
                  </button>
                </div>
                <div className="tasks-list">
                  {tasks.filter((t) => !t.is_completed).length > 0 ? (
                    tasks
                      .filter((t) => !t.is_completed)
                      .slice(0, 5)
                      .map((task) => (
                        <div key={task.id} className="task-item" onClick={() => handleTaskClick(task)}>
                          <input
                            type="checkbox"
                            checked={task.is_completed}
                            onChange={(e) => {
                              e.stopPropagation();
                              calendarService.updateTodoTask(task.id, { is_completed: e.target.checked });
                              queryClient.invalidateQueries('todo-tasks');
                              refetchTasks();
                            }}
                          />
                          <div className="task-content">
                            <div className="task-title">{task.title}</div>
                            <div className="task-date">
                              {new Date(task.task_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="empty-state">No pending tasks</div>
                  )}
                  {tasks.filter((t) => !t.is_completed).length > 5 && (
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => setViewMode('tasks')}
                      style={{ width: '100%', marginTop: '8px' }}
                    >
                      View All Tasks
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'events' && (
          <div className="events-view">
            <div className="events-header">
              <h2>All Events</h2>
              <button
                className="btn-primary"
                onClick={() => {
                  setSelectedEvent(null);
                  setSelectedDate(null);
                  setShowEventModal(true);
                }}
              >
                + Add Event
              </button>
            </div>

            <div className="events-container">
              {eventsError ? (
                <div className="empty-state" style={{ color: 'var(--danger-color)' }}>
                  Error loading events. Please ensure the database tables are created.
                </div>
              ) : events.length > 0 ? (
                <div className="events-list">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="event-item-full"
                      onClick={() => handleEventClick(event)}
                    >
                      <div
                        className="event-color-bar"
                        style={{ backgroundColor: event.event_color }}
                      />
                      <div className="event-content">
                        <div className="event-title">{event.title}</div>
                        {event.description && (
                          <div className="event-description">{event.description}</div>
                        )}
                        <div className="event-meta">
                          <span className="event-date">
                            {new Date(event.event_date).toLocaleDateString()}
                          </span>
                          <span className="event-type-badge">{event.event_type}</span>
                          {event.user_name && (
                            <span className="event-creator">
                              by {event.user_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="event-actions">
                        <button
                          className="btn-sm btn-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-sm btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEvent(event.id, event.title);
                          }}
                          disabled={deleteEventMutation.isLoading}
                        >
                          {deleteEventMutation.isLoading ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No events found for this month</div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'tasks' && (
          <div className="tasks-view">
            <div className="tasks-header">
              <h2>All Tasks</h2>
              <button
                className="btn-primary"
                onClick={() => {
                  setSelectedTask(null);
                  setShowTaskModal(true);
                }}
              >
                + Add Task
              </button>
            </div>

            <div className="tasks-container">
              <div className="tasks-section">
                <h3>Pending Tasks</h3>
                {tasks.filter((t) => !t.is_completed).length > 0 ? (
                  <div className="tasks-list-full">
                    {tasks
                      .filter((t) => !t.is_completed)
                      .map((task) => (
                        <div key={task.id} className="task-item-full" onClick={() => handleTaskClick(task)}>
                          <input
                            type="checkbox"
                            checked={task.is_completed}
                            onChange={(e) => {
                              e.stopPropagation();
                              calendarService.updateTodoTask(task.id, { is_completed: e.target.checked });
                              queryClient.invalidateQueries('todo-tasks');
                              refetchTasks();
                            }}
                          />
                          <div className="task-content">
                            <div className="task-title">{task.title}</div>
                            <div className="task-date">
                              {new Date(task.task_date).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            className="btn-sm btn-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to delete this task?')) {
                                calendarService.deleteTodoTask(task.id);
                                queryClient.invalidateQueries('todo-tasks');
                                refetchTasks();
                                showToast('Task deleted successfully', 'success');
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="empty-state">No pending tasks</div>
                )}
              </div>

              <div className="tasks-section">
                <h3>Completed Tasks</h3>
                {tasks.filter((t) => t.is_completed).length > 0 ? (
                  <div className="tasks-list-full">
                    {tasks
                      .filter((t) => t.is_completed)
                      .map((task) => (
                        <div key={task.id} className="task-item-full completed" onClick={() => handleTaskClick(task)}>
                          <input
                            type="checkbox"
                            checked={task.is_completed}
                            onChange={(e) => {
                              e.stopPropagation();
                              calendarService.updateTodoTask(task.id, { is_completed: e.target.checked });
                              queryClient.invalidateQueries('todo-tasks');
                              refetchTasks();
                            }}
                          />
                          <div className="task-content">
                            <div className="task-title">{task.title}</div>
                            <div className="task-date">
                              {new Date(task.task_date).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            className="btn-sm btn-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to delete this task?')) {
                                calendarService.deleteTodoTask(task.id);
                                queryClient.invalidateQueries('todo-tasks');
                                refetchTasks();
                                showToast('Task deleted successfully', 'success');
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="empty-state">No completed tasks</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
          setSelectedDate(null);
        }}
        event={selectedEvent}
        defaultDate={selectedDate}
        userRole={user?.role || ''}
        onSuccess={() => {
          queryClient.invalidateQueries('calendar-events');
          refetchEvents();
        }}
      />

      {/* Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onSuccess={() => {
          queryClient.invalidateQueries('todo-tasks');
          refetchTasks();
        }}
      />
    </div>
  );
};

// Event Modal Component
interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  defaultDate: Date | null;
  userRole: string;
  onSuccess: () => void;
}

const EventModal = ({ isOpen, onClose, event, defaultDate, userRole, onSuccess }: EventModalProps) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: defaultDate ? defaultDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    event_color: '#3B82F6',
    event_type: 'private' as 'public' | 'private' | 'role' | 'protected',
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        event_date: event.event_date,
        event_color: event.event_color,
        event_type: event.event_type,
      });
    } else if (defaultDate) {
      setFormData((prev) => ({
        ...prev,
        event_date: defaultDate.toISOString().split('T')[0],
      }));
    }
  }, [event, defaultDate]);

  const createMutation = useMutation(calendarService.createCalendarEvent, {
    onSuccess: () => {
      showToast('Event created successfully', 'success');
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create event', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<CalendarEvent> }) =>
      calendarService.updateCalendarEvent(id, data),
    {
      onSuccess: () => {
        showToast('Event updated successfully', 'success');
        onSuccess();
        onClose();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update event', 'error');
      },
    }
  );

  const deleteMutation = useMutation(calendarService.deleteCalendarEvent, {
    onSuccess: () => {
      showToast('Event deleted successfully', 'success');
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete event', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      showToast('Event title is required', 'error');
      return;
    }

    if (event) {
      updateMutation.mutate({ id: event.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={event ? 'Edit Event' : 'Add Event'}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Event Title <span className="required">*</span></label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Event Date <span className="required">*</span></label>
          <input
            type="date"
            value={formData.event_date}
            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Event Color</label>
          <input
            type="color"
            value={formData.event_color}
            onChange={(e) => setFormData({ ...formData, event_color: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Event Type <span className="required">*</span></label>
          <select
            value={formData.event_type}
            onChange={(e) =>
              setFormData({ ...formData, event_type: e.target.value as any })
            }
            required
          >
            <option value="private">Private (Only you)</option>
            <option value="public">Public (All users)</option>
            <option value="role">All {userRole}</option>
            <option value="protected">Protected (All staff)</option>
          </select>
        </div>

        <div className="form-actions">
          {event && (
            <button
              type="button"
              className="btn-danger"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this event?')) {
                  deleteMutation.mutate(event.id);
                }
              }}
              disabled={deleteMutation.isLoading}
            >
              {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={createMutation.isLoading || updateMutation.isLoading}
          >
            {createMutation.isLoading || updateMutation.isLoading
              ? 'Saving...'
              : event
              ? 'Update'
              : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Task Modal Component
interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TodoTask | null;
  onSuccess: () => void;
}

const TaskModal = ({ isOpen, onClose, task, onSuccess }: TaskModalProps) => {
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    task_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        task_date: task.task_date,
      });
    } else {
      setFormData({
        title: '',
        task_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [task]);

  const createMutation = useMutation(calendarService.createTodoTask, {
    onSuccess: () => {
      showToast('Task created successfully', 'success');
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create task', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<TodoTask> }) =>
      calendarService.updateTodoTask(id, data),
    {
      onSuccess: () => {
        showToast('Task updated successfully', 'success');
        onSuccess();
        onClose();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update task', 'error');
      },
    }
  );

  const deleteMutation = useMutation(calendarService.deleteTodoTask, {
    onSuccess: () => {
      showToast('Task deleted successfully', 'success');
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete task', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      showToast('Task title is required', 'error');
      return;
    }

    if (task) {
      updateMutation.mutate({ id: task.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? 'Edit Task' : 'Add Task'}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Task Title <span className="required">*</span></label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Task Date <span className="required">*</span></label>
          <input
            type="date"
            value={formData.task_date}
            onChange={(e) => setFormData({ ...formData, task_date: e.target.value })}
            required
          />
        </div>

        <div className="form-actions">
          {task && (
            <button
              type="button"
              className="btn-danger"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this task?')) {
                  deleteMutation.mutate(task.id);
                }
              }}
              disabled={deleteMutation.isLoading}
            >
              {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={createMutation.isLoading || updateMutation.isLoading}
          >
            {createMutation.isLoading || updateMutation.isLoading
              ? 'Saving...'
              : task
              ? 'Update'
              : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default Calendar;

