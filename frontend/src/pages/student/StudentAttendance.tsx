import { useState } from 'react';
import { useQuery } from 'react-query';
import { attendanceService } from '../../services/api/attendanceService';
import { studentsService } from '../../services/api/studentsService';
import './StudentAttendance.css';

const StudentAttendance = () => {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  useQuery('my-student-profile', () => studentsService.getMyProfile(), {
    refetchOnWindowFocus: false,
  });

  const { data: attendance = [], isLoading } = useQuery(
    ['my-attendance', month, year],
    () =>
      attendanceService.getMyAttendance({
        month,
        year,
      }),
    { refetchOnWindowFocus: false }
  );

  const attendanceData = attendance[0];
  const totalDays = attendanceData?.total_days || 0;
  const presentDays = attendanceData?.present_count || 0;
  const absentDays = attendanceData?.absent_count || 0;
  const lateDays = attendanceData?.late_count || 0;
  const halfDayDays = attendanceData?.half_day_count || 0;
  const attendancePercentage =
    totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : '0';

  if (isLoading) {
    return <div className="loading">Loading attendance...</div>;
  }

  return (
    <div className="student-attendance-page">
      <div className="attendance-header">
        <h1>Attendance</h1>
        <div className="attendance-filters">
          <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            min="2000"
            max="2100"
          />
        </div>
      </div>

      <div className="attendance-content">
        <div className="attendance-summary">
          <div className="summary-card">
            <div className="summary-icon">📊</div>
            <div className="summary-content">
              <h3>Attendance Percentage</h3>
              <p className="percentage">{attendancePercentage}%</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">✅</div>
            <div className="summary-content">
              <h3>Present</h3>
              <p className="count">{presentDays}</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">❌</div>
            <div className="summary-content">
              <h3>Absent</h3>
              <p className="count">{absentDays}</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">⏰</div>
            <div className="summary-content">
              <h3>Late</h3>
              <p className="count">{lateDays}</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">⏸️</div>
            <div className="summary-content">
              <h3>Half Day</h3>
              <p className="count">{halfDayDays}</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">📅</div>
            <div className="summary-content">
              <h3>Total Days</h3>
              <p className="count">{totalDays}</p>
            </div>
          </div>
        </div>

        {totalDays === 0 && (
          <div className="empty-state">
            No attendance records found for the selected month
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendance;

