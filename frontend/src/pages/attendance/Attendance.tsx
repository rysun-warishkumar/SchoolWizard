import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { attendanceService, StudentAttendanceRecord, StudentLeaveRequest } from '../../services/api/attendanceService';
import { academicsService } from '../../services/api/academicsService';
import { studentsService } from '../../services/api/studentsService';
import { settingsService } from '../../services/api/settingsService';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/common/Modal';
import './Attendance.css';

type TabType = 'student-attendance' | 'attendance-by-date' | 'approve-leave';

const Attendance = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType;
  const validTabs: TabType[] = ['student-attendance', 'attendance-by-date', 'approve-leave'];
  const defaultTab: TabType = validTabs.includes(tabFromUrl) ? tabFromUrl : 'student-attendance';

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
    <div className="attendance-page">
      <div className="page-header">
        <h1>Attendance</h1>
      </div>

      <div className="attendance-tabs-wrapper">
        <div className="attendance-tabs-container">
          {showLeftArrow && (
            <button
              className="attendance-tabs-arrow attendance-tabs-arrow-left"
              onClick={() => scrollTabs('left')}
              aria-label="Scroll tabs left"
            >
              ‹
            </button>
          )}
          <div className="attendance-tabs" ref={tabsContainerRef}>
            <button
              ref={activeTab === 'student-attendance' ? activeTabRef : null}
              className={activeTab === 'student-attendance' ? 'active' : ''}
              onClick={() => handleTabChange('student-attendance')}
            >
              Student Attendance
            </button>
            <button
              ref={activeTab === 'attendance-by-date' ? activeTabRef : null}
              className={activeTab === 'attendance-by-date' ? 'active' : ''}
              onClick={() => handleTabChange('attendance-by-date')}
            >
              Attendance By Date
            </button>
            <button
              ref={activeTab === 'approve-leave' ? activeTabRef : null}
              className={activeTab === 'approve-leave' ? 'active' : ''}
              onClick={() => handleTabChange('approve-leave')}
            >
              Approve Leave
            </button>
          </div>
          {showRightArrow && (
            <button
              className="attendance-tabs-arrow attendance-tabs-arrow-right"
              onClick={() => scrollTabs('right')}
              aria-label="Scroll tabs right"
            >
              ›
            </button>
          )}
        </div>
      </div>

      <div className="attendance-content">
        {activeTab === 'student-attendance' && <StudentAttendanceTab />}
        {activeTab === 'attendance-by-date' && <AttendanceByDateTab />}
        {activeTab === 'approve-leave' && <ApproveLeaveTab />}
      </div>
    </div>
  );
};

// ========== Tab Components ==========

const StudentAttendanceTab = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, { status: string; note: string }>>({});
  const [markHoliday, setMarkHoliday] = useState(false);

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: classesData } = useQuery('classes', academicsService.getClasses);
  const { data: sectionsData } = useQuery('sections', () => academicsService.getSections());
  const { data: sessionsData } = useQuery('sessions', () => settingsService.getSessions());

  const sessions = sessionsData?.data || [];
  const currentSession = sessions.find((s) => s.is_current) || sessions[0];

  const { data: attendanceData, isLoading, refetch } = useQuery(
    ['student-attendance', selectedClass, selectedSection, attendanceDate, currentSession?.id],
    () =>
      attendanceService.getStudentAttendance({
        class_id: Number(selectedClass),
        section_id: Number(selectedSection),
        attendance_date: attendanceDate,
        session_id: currentSession?.id || 0,
      }),
    { enabled: !!selectedClass && !!selectedSection && !!attendanceDate && !!currentSession }
  );

  // Update attendance records when data is fetched
  useEffect(() => {
    if (attendanceData) {
      const records: Record<number, { status: string; note: string }> = {};
      attendanceData.forEach((record) => {
        if (record.status) {
          records[record.student_id] = {
            status: record.status,
            note: record.note || '',
          };
        }
      });
      setAttendanceRecords(records);
    }
  }, [attendanceData]);

  const submitMutation = useMutation(attendanceService.submitStudentAttendance, {
    onSuccess: () => {
      queryClient.invalidateQueries('student-attendance');
      refetch();
      showToast('Attendance submitted successfully', 'success');
      setMarkHoliday(false);
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to submit attendance', 'error');
    },
  });

  const handleStatusChange = (studentId: number, status: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleNoteChange = (studentId: number, note: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], note },
    }));
  };

  const handleSubmit = () => {
    if (!selectedClass || !selectedSection || !attendanceDate || !currentSession) {
      showToast('Please select class, section, and date', 'error');
      return;
    }

    if (markHoliday) {
      submitMutation.mutate({
        class_id: Number(selectedClass),
        section_id: Number(selectedSection),
        attendance_date: attendanceDate,
        session_id: currentSession.id,
        attendance_records: [],
        mark_holiday: true,
      });
    } else {
      const records = Object.entries(attendanceRecords)
        .filter(([_, value]) => value.status)
        .map(([studentId, value]) => ({
          student_id: Number(studentId),
          status: value.status as any,
          note: value.note || undefined,
        }));

      if (records.length === 0) {
        showToast('Please mark attendance for at least one student', 'error');
        return;
      }

      submitMutation.mutate({
        class_id: Number(selectedClass),
        section_id: Number(selectedSection),
        attendance_date: attendanceDate,
        session_id: currentSession.id,
        attendance_records: records,
        mark_holiday: false,
      });
    }
  };

  const students = attendanceData || [];

  return (
    <div className="attendance-tab-content">
      <div className="tab-header">
        <h2>Student Attendance</h2>
      </div>

      <div className="attendance-filters">
        <div className="form-row">
          <div className="form-group">
            <label>Class</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection('');
              }}
            >
              <option value="">Select Class</option>
              {classesData?.data?.map((cls: any) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedClass}
            >
              <option value="">Select Section</option>
              {(sectionsData as any)?.data?.map((sec: any) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Attendance Date</label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading students...</div>
      ) : students.length > 0 ? (
        <>
          <div className="attendance-actions">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={markHoliday}
                onChange={(e) => setMarkHoliday(e.target.checked)}
              />
              <span>Mark as Holiday</span>
            </label>
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={submitMutation.isLoading}
            >
              {submitMutation.isLoading ? 'Submitting...' : 'Submit Attendance'}
            </button>
          </div>

          <div className="attendance-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Name</th>
                  <th>Present</th>
                  <th>Late</th>
                  <th>Absent</th>
                  <th>Half Day</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const record = attendanceRecords[student.student_id] || { status: '', note: '' };
                  return (
                    <tr key={student.student_id}>
                      <td>{student.admission_no}</td>
                      <td>
                        {student.first_name} {student.last_name}
                      </td>
                      <td>
                        <input
                          type="radio"
                          name={`attendance-${student.student_id}`}
                          checked={record.status === 'present'}
                          onChange={() => handleStatusChange(student.student_id, 'present')}
                          disabled={markHoliday}
                        />
                      </td>
                      <td>
                        <input
                          type="radio"
                          name={`attendance-${student.student_id}`}
                          checked={record.status === 'late'}
                          onChange={() => handleStatusChange(student.student_id, 'late')}
                          disabled={markHoliday}
                        />
                      </td>
                      <td>
                        <input
                          type="radio"
                          name={`attendance-${student.student_id}`}
                          checked={record.status === 'absent'}
                          onChange={() => handleStatusChange(student.student_id, 'absent')}
                          disabled={markHoliday}
                        />
                      </td>
                      <td>
                        <input
                          type="radio"
                          name={`attendance-${student.student_id}`}
                          checked={record.status === 'half_day'}
                          onChange={() => handleStatusChange(student.student_id, 'half_day')}
                          disabled={markHoliday}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="Note (optional)"
                          value={record.note}
                          onChange={(e) => handleNoteChange(student.student_id, e.target.value)}
                          disabled={markHoliday}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : selectedClass && selectedSection ? (
        <div className="empty-state">No students found for selected class and section</div>
      ) : (
        <div className="empty-state">Please select class and section to view students</div>
      )}
    </div>
  );
};

const AttendanceByDateTab = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { showToast } = useToast();

  const { data: classesData } = useQuery('classes', academicsService.getClasses);
  const { data: sectionsData } = useQuery('sections', () => academicsService.getSections());
  const { data: sessionsData } = useQuery('sessions', () => settingsService.getSessions());

  const sessions = sessionsData?.data || [];
  const currentSession = sessions.find((s) => s.is_current) || sessions[0];

  const handleSearch = async () => {
    if (!selectedClass || !selectedSection || !attendanceDate) {
      showToast('Please select class, section, and date', 'error');
      return;
    }

    setIsSearching(true);
    try {
      const records = await attendanceService.getAttendanceByDate({
        class_id: Number(selectedClass),
        section_id: Number(selectedSection),
        attendance_date: attendanceDate,
        session_id: currentSession?.id,
      });
      setAttendanceRecords(records);
      if (records.length === 0) {
        showToast('No attendance records found for this date', 'info');
      }
    } catch (error: any) {
      showToast('Failed to fetch attendance', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="attendance-tab-content">
      <div className="tab-header">
        <h2>Attendance By Date</h2>
      </div>

      <div className="attendance-filters">
        <div className="form-row attendance-by-date-filters">
          <div className="form-group">
            <label>Class</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection('');
              }}
            >
              <option value="">Select Class</option>
              {classesData?.data?.map((cls: any) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedClass}
            >
              <option value="">Select Section</option>
              {(sectionsData as any)?.data?.map((sec: any) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
            />
          </div>
          <div className="form-group attendance-search-button">
            <label>&nbsp;</label>
            <button className="btn-primary" onClick={handleSearch} disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </div>

      {attendanceRecords.length > 0 && (
        <div className="attendance-results">
          <table className="data-table">
            <thead>
              <tr>
                <th>Admission No</th>
                <th>Name</th>
                <th>Class</th>
                <th>Section</th>
                <th>Status</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.map((record) => (
                <tr key={record.id}>
                  <td>{record.admission_no}</td>
                  <td>
                    {record.first_name} {record.last_name}
                  </td>
                  <td>{record.class_name}</td>
                  <td>{record.section_name}</td>
                  <td>
                    <span
                      className={`badge ${
                        record.status === 'present'
                          ? 'badge-success'
                          : record.status === 'late'
                          ? 'badge-warning'
                          : record.status === 'absent'
                          ? 'badge-danger'
                          : 'badge-info'
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td>{record.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ApproveLeaveTab = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<StudentLeaveRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: classesData } = useQuery('classes', academicsService.getClasses);
  const { data: sectionsData } = useQuery('sections', () => academicsService.getSections());

  const { data: leaveRequestsData, isLoading } = useQuery(
    ['student-leave-requests', selectedClass, selectedSection, statusFilter],
    () =>
      attendanceService.getStudentLeaveRequests({
        class_id: selectedClass ? Number(selectedClass) : undefined,
        section_id: selectedSection ? Number(selectedSection) : undefined,
        status: statusFilter || undefined,
        page: 1,
        limit: 100,
      }),
    { enabled: true }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => attendanceService.updateStudentLeaveRequest(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('student-leave-requests');
        showToast('Leave request updated successfully', 'success');
        setShowModal(false);
        setSelectedRequest(null);
        setRejectionReason('');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update leave request', 'error');
      },
    }
  );

  const handleApprove = (request: StudentLeaveRequest) => {
    setSelectedRequest(request);
    setAction('approve');
    setShowModal(true);
  };

  const handleReject = (request: StudentLeaveRequest) => {
    setSelectedRequest(request);
    setAction('reject');
    setShowModal(true);
  };

  const handleSubmitAction = () => {
    if (!selectedRequest) return;

    if (action === 'reject' && !rejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'error');
      return;
    }

    updateMutation.mutate({
      id: selectedRequest.id,
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        rejection_reason: action === 'reject' ? rejectionReason : undefined,
      },
    });
  };

  const leaveRequests = leaveRequestsData?.data || [];

  return (
    <div className="attendance-tab-content">
      <div className="tab-header">
        <h2>Approve Leave</h2>
      </div>

      <div className="leave-requests-filters">
        <div className="form-row">
          <div className="form-group">
            <label>Class</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection('');
              }}
            >
              <option value="">All Classes</option>
              {classesData?.data?.map((cls: any) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedClass}
            >
              <option value="">All Sections</option>
              {(sectionsData as any)?.data?.map((sec: any) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading leave requests...</div>
      ) : leaveRequests.length > 0 ? (
        <div className="leave-requests-list">
          <table className="data-table">
            <thead>
              <tr>
                <th>Admission No</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Leave Date</th>
                <th>Leave Type</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.admission_no}</td>
                  <td>
                    {request.first_name} {request.last_name}
                  </td>
                  <td>
                    {request.class_name} - {request.section_name}
                  </td>
                  <td>{new Date(request.leave_date).toLocaleDateString()}</td>
                  <td>
                    <span className="badge">{request.leave_type}</span>
                  </td>
                  <td>{request.reason}</td>
                  <td>
                    <span
                      className={`badge ${
                        request.status === 'approved'
                          ? 'badge-success'
                          : request.status === 'rejected'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td>
                    {request.status === 'pending' && (
                      <>
                        <button
                          className="btn-sm btn-success"
                          onClick={() => handleApprove(request)}
                        >
                          Approve
                        </button>
                        <button
                          className="btn-sm btn-danger"
                          onClick={() => handleReject(request)}
                          style={{ marginLeft: '8px' }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">No leave requests found</div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedRequest(null);
          setRejectionReason('');
        }}
        title={action === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
      >
        {selectedRequest && (
          <div>
            <div className="leave-request-details">
              <p>
                <strong>Student:</strong> {selectedRequest.first_name} {selectedRequest.last_name} (
                {selectedRequest.admission_no})
              </p>
              <p>
                <strong>Leave Date:</strong> {new Date(selectedRequest.leave_date).toLocaleDateString()}
              </p>
              <p>
                <strong>Leave Type:</strong> {selectedRequest.leave_type}
              </p>
              <p>
                <strong>Reason:</strong> {selectedRequest.reason}
              </p>
            </div>
            {action === 'reject' && (
              <div className="form-group">
                <label>
                  Rejection Reason <span className="required">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  required
                />
              </div>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={action === 'approve' ? 'btn-success' : 'btn-danger'}
                onClick={handleSubmitAction}
                disabled={updateMutation.isLoading}
              >
                {updateMutation.isLoading
                  ? 'Processing...'
                  : action === 'approve'
                  ? 'Approve'
                  : 'Reject'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Attendance;

