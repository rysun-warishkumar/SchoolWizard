import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { hrService } from '../../services/api/hrService';
import { attendanceService } from '../../services/api/attendanceService';
import { settingsService } from '../../services/api/settingsService';
import { useToast } from '../../contexts/ToastContext';
import './StaffAttendance.css';

const StaffAttendance = () => {
  const [selectedClass, setSelectedClass] = useState<{ class_id: number; section_id: number } | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, { status: string; note: string }>>({});
  const [markHoliday, setMarkHoliday] = useState(false);

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: classesData } = useQuery('my-classes', () => hrService.getMyClasses(), {
    refetchOnWindowFocus: false,
  });

  const { data: sessionsData } = useQuery('sessions', () => settingsService.getSessions());
  const sessions = sessionsData?.data || [];
  const currentSession = sessions.find((s) => s.is_current) || sessions[0];

  const { data: studentsData } = useQuery(
    ['my-students', selectedClass],
    () => hrService.getMyStudents(selectedClass || undefined),
    {
      enabled: !!selectedClass,
      refetchOnWindowFocus: false,
    }
  );

  const { data: attendanceData, isLoading, refetch } = useQuery(
    ['student-attendance', selectedClass, attendanceDate, currentSession?.id],
    () =>
      attendanceService.getStudentAttendance({
        class_id: selectedClass?.class_id || 0,
        section_id: selectedClass?.section_id || 0,
        attendance_date: attendanceDate,
        session_id: currentSession?.id || 0,
      }),
    { enabled: !!selectedClass && !!attendanceDate && !!currentSession }
  );

  const classes = classesData?.data || [];
  const students = studentsData?.data || [];

  // Auto-select first class if none selected
  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass({
        class_id: classes[0].class_id,
        section_id: classes[0].section_id,
      });
    }
  }, [classes, selectedClass]);

  // Update attendance records when data is fetched
  useEffect(() => {
    if (attendanceData && students.length > 0) {
      const records: Record<number, { status: string; note: string }> = {};
      students.forEach((student: any) => {
        const existingRecord = attendanceData.find((r: any) => r.student_id === student.id);
        records[student.id] = {
          status: existingRecord?.status || '',
          note: existingRecord?.note || '',
        };
      });
      setAttendanceRecords(records);
    }
  }, [attendanceData, students]);

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
    if (!selectedClass || !attendanceDate || !currentSession) {
      showToast('Please select class and date', 'error');
      return;
    }

    if (markHoliday) {
      submitMutation.mutate({
        class_id: selectedClass.class_id,
        section_id: selectedClass.section_id,
        attendance_date: attendanceDate,
        session_id: currentSession.id,
        attendance_records: [],
        mark_holiday: true,
      });
      return;
    }

    const records = students.map((student: any) => ({
      student_id: student.id,
      status: attendanceRecords[student.id]?.status || 'absent',
      note: attendanceRecords[student.id]?.note || '',
    }));

    submitMutation.mutate({
      class_id: selectedClass.class_id,
      section_id: selectedClass.section_id,
      attendance_date: attendanceDate,
      session_id: currentSession.id,
      attendance_records: records,
      mark_holiday: false,
    });
  };

  const handleSelectAll = (status: string) => {
    const records: Record<number, { status: string; note: string }> = {};
    students.forEach((student: any) => {
      records[student.id] = {
        status,
        note: attendanceRecords[student.id]?.note || '',
      };
    });
    setAttendanceRecords(records);
  };

  if (classes.length === 0) {
    return (
      <div className="staff-attendance-page">
        <div className="empty-state">
          <p>No classes assigned to you yet.</p>
          <p className="empty-state-subtitle">Please contact the administrator to get assigned to classes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-attendance-page">
      <div className="page-header">
        <h1>Mark Student Attendance</h1>
      </div>

      <div className="attendance-filters">
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

        <div className="filter-group">
          <label>Date:</label>
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              checked={markHoliday}
              onChange={(e) => setMarkHoliday(e.target.checked)}
            />
            Mark as Holiday
          </label>
        </div>
      </div>

      {selectedClass && !markHoliday && (
        <>
          <div className="bulk-actions">
            <button onClick={() => handleSelectAll('present')} className="btn-bulk present">
              Mark All Present
            </button>
            <button onClick={() => handleSelectAll('absent')} className="btn-bulk absent">
              Mark All Absent
            </button>
            <button onClick={() => handleSelectAll('late')} className="btn-bulk late">
              Mark All Late
            </button>
          </div>

          {isLoading ? (
            <div className="loading">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="empty-state">No students found for the selected class</div>
          ) : (
            <div className="attendance-table-container">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Admission No</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student: any) => (
                    <tr key={student.id}>
                      <td>{student.admission_no}</td>
                      <td>
                        {student.first_name} {student.last_name || ''}
                      </td>
                      <td>
                        <select
                          value={attendanceRecords[student.id]?.status || ''}
                          onChange={(e) => handleStatusChange(student.id, e.target.value)}
                          className="status-select"
                        >
                          <option value="">Select</option>
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                          <option value="excused">Excused</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={attendanceRecords[student.id]?.note || ''}
                          onChange={(e) => handleNoteChange(student.id, e.target.value)}
                          placeholder="Optional note"
                          className="note-input"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <div className="attendance-actions">
        <button
          onClick={handleSubmit}
          className="btn-submit"
          disabled={submitMutation.isLoading || !selectedClass}
        >
          {submitMutation.isLoading ? 'Submitting...' : 'Submit Attendance'}
        </button>
      </div>
    </div>
  );
};

export default StaffAttendance;

