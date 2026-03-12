import { useQuery } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { hrService } from '../../services/api/hrService';
import { homeworkService } from '../../services/api/homeworkService';
import './StaffDashboard.css';

const THOUGHTS_OF_DAY = [
  'Success is the sum of small efforts repeated every day.',
  'Great things are done by a series of small things brought together.',
  'Discipline is choosing between what you want now and what you want most.',
  'Progress, not perfection, is the path to excellence.',
  'Every day is a new chance to learn, improve, and lead.',
  'Consistency turns ordinary actions into extraordinary results.',
  'A positive mind creates positive outcomes.',
];

const getTodayThought = () => {
  const now = new Date();
  const daySeed = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const hash = daySeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return THOUGHTS_OF_DAY[hash % THOUGHTS_OF_DAY.length];
};

const isTodayMonthDay = (dateValue?: string | null) => {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
};

const getInitials = (firstName?: string, lastName?: string) => {
  const first = (firstName || '').trim().charAt(0);
  const last = (lastName || '').trim().charAt(0);
  return `${first}${last}`.toUpperCase() || 'NA';
};

const getWorkYears = (dateValue?: string | null) => {
  if (!dateValue) return null;
  const joiningDate = new Date(dateValue);
  if (Number.isNaN(joiningDate.getTime())) return null;
  const today = new Date();
  let years = today.getFullYear() - joiningDate.getFullYear();
  const monthDiff = today.getMonth() - joiningDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < joiningDate.getDate())) {
    years -= 1;
  }
  return years >= 0 ? years : null;
};

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
  const { data: staffList = [] } = useQuery(
    'staff-dashboard-birth-anniversary',
    () =>
      hrService
        .getStaff({ is_active: true, page: 1, limit: 100 })
        .then((res) => res.data || [])
        .catch(() => []),
    { refetchOnWindowFocus: false }
  );

  // Get today's attendance status - using hrService.getStaffAttendance
  const today = new Date();
  const { data: attendanceData } = useQuery(
    ['staff-attendance-today', today.toISOString().split('T')[0]],
    () =>
      hrService.getStaffAttendance({
        attendance_date: today.toISOString().split('T')[0],
      }),
    { refetchOnWindowFocus: false, enabled: false } // Disabled until staff attendance endpoint is available
  );

  const todayAttendance = attendanceData?.data?.[0];
  const todaysBirthdays = staffList.filter((staff: any) => isTodayMonthDay(staff?.date_of_birth)).slice(0, 3);
  const todaysAnniversaries = staffList.filter((staff: any) => isTodayMonthDay(staff?.date_of_joining)).slice(0, 3);
  const todayThought = getTodayThought();

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
          <h2>Daily Highlights</h2>
          <div className="staff-highlight-tiles">
            <div className="staff-highlight-tile thought-tile">
              <div className="highlight-title">Thought of the Day</div>
              <p>{todayThought}</p>
            </div>
            <div className="staff-highlight-tile">
              <div className="highlight-title">Today's Birthdays</div>
              {todaysBirthdays.length > 0 ? (
                <ul className="highlight-list">
                  {todaysBirthdays.map((staffMember: any) => (
                    <li key={staffMember.id} className="highlight-person">
                      <span className="highlight-avatar">{getInitials(staffMember.first_name, staffMember.last_name)}</span>
                      <span className="highlight-name">{staffMember.first_name} {staffMember.last_name || ''}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="highlight-empty">No birthdays today</p>
              )}
            </div>
            <div className="staff-highlight-tile">
              <div className="highlight-title">Work Anniversary</div>
              {todaysAnniversaries.length > 0 ? (
                <ul className="highlight-list">
                  {todaysAnniversaries.map((staffMember: any) => (
                    <li key={staffMember.id} className="highlight-person">
                      <span className="highlight-avatar">{getInitials(staffMember.first_name, staffMember.last_name)}</span>
                      <span className="highlight-name">
                        {staffMember.first_name} {staffMember.last_name || ''}
                        {getWorkYears(staffMember.date_of_joining) !== null ? ` (${getWorkYears(staffMember.date_of_joining)} yr)` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="highlight-empty">No anniversaries today</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;

