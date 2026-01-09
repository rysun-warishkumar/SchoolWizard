import { useQuery } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { hrService } from '../../services/api/hrService';
import { homeworkService } from '../../services/api/homeworkService';
import './StaffDashboard.css';

const StaffDashboard = () => {
  const { user } = useAuth();

  // Get staff profile
  const { data: staffData } = useQuery(
    'my-staff-profile',
    () => hrService.getMyStaffProfile(),
    { enabled: !!user?.id, refetchOnWindowFocus: false }
  );

  const staff = staffData?.data;

  // Get assigned classes count (placeholder - will need backend endpoint)
  const assignedClassesCount = 0;

  // Get total students count (placeholder - will need backend endpoint)
  const totalStudentsCount = 0;

  // Get pending homework count
  const { data: homeworkData } = useQuery(
    'staff-pending-homework',
    () => homeworkService.getHomework({}),
    { refetchOnWindowFocus: false }
  );

  const pendingHomeworkCount = (homeworkData || []).filter(
    (h: any) => h.status === 'pending'
  )?.length || 0;

  // Get today's attendance status - using hrService.getStaffAttendance
  const today = new Date();
  const { data: attendanceData } = useQuery(
    ['staff-attendance-today', today.toISOString().split('T')[0]],
    () =>
      hrService.getStaffAttendance({
        date: today.toISOString().split('T')[0],
      }),
    { refetchOnWindowFocus: false, enabled: false } // Disabled until staff attendance endpoint is available
  );

  const todayAttendance = attendanceData?.data?.[0];

  const stats = [
    {
      title: 'Assigned Classes',
      value: assignedClassesCount,
      icon: '📚',
      color: '#3b82f6',
    },
    {
      title: 'Total Students',
      value: totalStudentsCount,
      icon: '👥',
      color: '#10b981',
    },
    {
      title: 'Pending Homework',
      value: pendingHomeworkCount,
      icon: '📝',
      color: '#f59e0b',
    },
    {
      title: "Today's Attendance",
      value: todayAttendance?.status === 'present' ? 'Present' : 'Not Marked',
      icon: '✅',
      color: todayAttendance?.status === 'present' ? '#10b981' : '#6b7280',
    },
  ];

  return (
    <div className="staff-dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {staff?.first_name || user?.name || 'Staff'}!</h1>
        <p className="dashboard-subtitle">Here's an overview of your activities</p>
      </div>

      <div className="dashboard-stats">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <h3>{stat.value}</h3>
              <p>{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <a href="/staff/attendance" className="action-card">
              <span className="action-icon">✅</span>
              <span className="action-label">Mark Attendance</span>
            </a>
            <a href="/staff/homework" className="action-card">
              <span className="action-icon">📝</span>
              <span className="action-label">Assign Homework</span>
            </a>
            <a href="/staff/students" className="action-card">
              <span className="action-icon">👥</span>
              <span className="action-label">View Students</span>
            </a>
            <a href="/staff/leave" className="action-card">
              <span className="action-icon">🏖️</span>
              <span className="action-label">Apply Leave</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;

