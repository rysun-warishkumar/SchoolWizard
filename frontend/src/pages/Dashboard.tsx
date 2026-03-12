import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from 'react-query';
import { dashboardService } from '../services/api/dashboardService';
import { contactMessagesService } from '../services/api/contactMessagesService';
import { admissionManagementService } from '../services/api/admissionManagementService';
import { hrService } from '../services/api/hrService';
import { studentsService } from '../services/api/studentsService';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const THOUGHTS_OF_DAY = [
  'Success is the sum of small efforts repeated every day.',
  'Great things are done by a series of small things brought together.',
  'Discipline is choosing between what you want now and what you want most.',
  'Progress, not perfection, is the path to excellence.',
  'Every day is a new chance to learn, improve, and lead.',
  'Consistency turns ordinary actions into extraordinary results.',
  'A positive mind creates positive outcomes.',
];

const DUMMY_AVATAR =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'><rect width='96' height='96' fill='%23e5e7eb'/><circle cx='48' cy='36' r='18' fill='%239ca3af'/><rect x='20' y='60' width='56' height='26' rx='13' fill='%239ca3af'/></svg>";

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

const getProfileImageUrl = (photo?: string | null) => {
  if (!photo) return null;
  const photoStr = String(photo).trim();
  if (!photoStr || photoStr === 'null' || photoStr === 'undefined') return null;
  if (photoStr.startsWith('data:image/')) return photoStr;
  if (photoStr.startsWith('http://') || photoStr.startsWith('https://')) return photoStr;
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
  return apiBaseUrl.replace('/api/v1', '') + (photoStr.startsWith('/') ? photoStr : `/${photoStr}`);
};

const formatDisplayDate = (dateValue?: string | null) => {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const fetchAllActiveStaff = async () => {
  const limit = 100;
  let page = 1;
  let pages = 1;
  const allStaff: any[] = [];

  while (page <= pages) {
    const response = await hrService.getStaff({ is_active: true, page, limit });
    const chunk = Array.isArray(response?.data) ? response.data : [];
    allStaff.push(...chunk);
    pages = Number(response?.pagination?.pages || 1);
    if (chunk.length === 0) break;
    page += 1;
  }

  return allStaff;
};

const fetchAllStudents = async () => {
  const limit = 100;
  let page = 1;
  let pages = 1;
  const allStudents: any[] = [];

  while (page <= pages) {
    const response = await studentsService.getStudents({ page, limit });
    const chunk = Array.isArray(response?.data) ? response.data : [];
    allStudents.push(...chunk);
    pages = Number(response?.pagination?.pages || 1);
    if (chunk.length === 0) break;
    page += 1;
  }

  return allStudents;
};

const Dashboard = () => {
  const { user } = useAuth();
  const { data: statsData, isLoading } = useQuery('dashboard-stats', () => dashboardService.getStats());
  const { data: staffBirthAndAnniversary = [] } = useQuery(
    'dashboard-staff-birth-anniversary',
    () => fetchAllActiveStaff().catch(() => []),
    { refetchOnWindowFocus: false }
  );
  const { data: studentsForBirthday = [] } = useQuery(
    'dashboard-students-birthday',
    () => fetchAllStudents().catch(() => []),
    { refetchOnWindowFocus: false }
  );
  const { data: contactMessagesData } = useQuery('contact-messages-count', () => contactMessagesService.getMessages(), {
    select: (data) => ({
      total: data.length,
      pending: data.filter((msg: any) => msg.status === 'new').length,
    }),
  });
  const { data: admissionInquiriesData } = useQuery('admission-inquiries-count', () => admissionManagementService.getInquiries(), {
    select: (data) => ({
      total: data.length,
      pending: data.filter((inq: any) => inq.status === 'pending').length,
    }),
  });

  const stats = statsData?.data;
  const [birthdayIndex, setBirthdayIndex] = useState(0);
  const [anniversaryIndex, setAnniversaryIndex] = useState(0);
  const todaysBirthdays = [
    ...studentsForBirthday
      .filter((student: any) => isTodayMonthDay(student?.date_of_birth))
      .map((student: any) => ({ ...student, personType: 'Student' })),
    ...staffBirthAndAnniversary
      .filter((staff: any) => isTodayMonthDay(staff?.date_of_birth))
      .map((staff: any) => ({ ...staff, personType: 'Staff' })),
  ].slice(0, 5);
  const todaysAnniversaries = staffBirthAndAnniversary
    .filter((staff: any) => isTodayMonthDay(staff?.date_of_joining))
    .slice(0, 5);
  const todayThought = getTodayThought();
  const activeBirthday = todaysBirthdays[birthdayIndex] || null;
  const activeAnniversary = todaysAnniversaries[anniversaryIndex] || null;

  useEffect(() => {
    setBirthdayIndex(0);
  }, [todaysBirthdays.length]);

  useEffect(() => {
    setAnniversaryIndex(0);
  }, [todaysAnniversaries.length]);

  useEffect(() => {
    if (todaysBirthdays.length <= 1) return;
    const interval = setInterval(() => {
      setBirthdayIndex((prev) => (prev + 1) % todaysBirthdays.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [todaysBirthdays.length]);

  useEffect(() => {
    if (todaysAnniversaries.length <= 1) return;
    const interval = setInterval(() => {
      setAnniversaryIndex((prev) => (prev + 1) % todaysAnniversaries.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [todaysAnniversaries.length]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}!</h1>
        <p>Dashboard overview and quick actions</p>
      </div>

      {isLoading ? (
        <div className="loading">Loading dashboard statistics...</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>{stats?.totalUsers || 0}</h3>
                <p>Total Users</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎓</div>
              <div className="stat-content">
                <h3>{stats?.totalStudents || 0}</h3>
                <p>Total Students</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👨‍🏫</div>
              <div className="stat-content">
                <h3>{stats?.totalTeachers || 0}</h3>
                <p>Total Teachers</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-content">
                <h3>{stats?.totalClasses || 0}</h3>
                <p>Total Classes</p>
              </div>
            </div>
          </div>

          <div className="dashboard-content dashboard-content-daily">
            <div className="dashboard-card dashboard-card-full">
              <h3>Daily Highlights</h3>
              <div className="dashboard-highlight-tiles">
                <div className="dashboard-highlight-tile thought-tile">
                  <div className="highlight-title">Thought of the Day</div>
                  <p>{todayThought}</p>
                </div>
                <div className="dashboard-highlight-tile">
                  <div className="highlight-title">Today's Birthdays</div>
                  {activeBirthday ? (
                    <div className="celebration-card birthday-card">
                      <div className="celebration-head">
                        <img
                          src={getProfileImageUrl(activeBirthday.photo) || DUMMY_AVATAR}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = DUMMY_AVATAR;
                          }}
                          alt={`${activeBirthday.first_name} profile`}
                          className="celebration-avatar"
                        />
                        <div>
                          <div className="highlight-name">
                            {activeBirthday.first_name} {activeBirthday.last_name || ''}
                            <span className="highlight-meta"> - {activeBirthday.personType}</span>
                          </div>
                          <div className="highlight-meta">Date of Birth: {formatDisplayDate(activeBirthday.date_of_birth)}</div>
                        </div>
                      </div>
                      <p className="celebration-wish">Happy Birthday, {activeBirthday.first_name}! Wishing you a joyful and successful year ahead.</p>
                      {todaysBirthdays.length > 1 && (
                        <div className="carousel-controls">
                          <button
                            type="button"
                            className="carousel-nav-btn"
                            onClick={() =>
                              setBirthdayIndex((prev) => (prev - 1 + todaysBirthdays.length) % todaysBirthdays.length)
                            }
                            aria-label="Previous birthday"
                          >
                            ‹
                          </button>
                          <span className="carousel-count">{birthdayIndex + 1}/{todaysBirthdays.length}</span>
                          <button
                            type="button"
                            className="carousel-nav-btn"
                            onClick={() => setBirthdayIndex((prev) => (prev + 1) % todaysBirthdays.length)}
                            aria-label="Next birthday"
                          >
                            ›
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="highlight-empty">No birthdays today</p>
                  )}
                </div>
                <div className="dashboard-highlight-tile anniversary-tile">
                  <div className="highlight-title">Work Anniversary</div>
                  {activeAnniversary ? (
                    <div className="celebration-card anniversary-card">
                      <div className="celebration-head">
                        <img
                          src={getProfileImageUrl(activeAnniversary.photo) || DUMMY_AVATAR}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = DUMMY_AVATAR;
                          }}
                          alt={`${activeAnniversary.first_name} profile`}
                          className="celebration-avatar"
                        />
                        <div>
                          <div className="highlight-name">
                            {activeAnniversary.first_name} {activeAnniversary.last_name || ''}
                          </div>
                          <div className="highlight-meta">
                            Date of Joining: {formatDisplayDate(activeAnniversary.date_of_joining)}
                          </div>
                        </div>
                      </div>
                      <p className="celebration-wish">
                        Happy Work Anniversary, {activeAnniversary.first_name}! Thank you for your dedication
                        {getWorkYears(activeAnniversary.date_of_joining) !== null
                          ? ` over ${getWorkYears(activeAnniversary.date_of_joining)} year(s).`
                          : '.'}
                      </p>
                      {todaysAnniversaries.length > 1 && (
                        <div className="carousel-controls">
                          <button
                            type="button"
                            className="carousel-nav-btn"
                            onClick={() =>
                              setAnniversaryIndex((prev) => (prev - 1 + todaysAnniversaries.length) % todaysAnniversaries.length)
                            }
                            aria-label="Previous anniversary"
                          >
                            ‹
                          </button>
                          <span className="carousel-count">{anniversaryIndex + 1}/{todaysAnniversaries.length}</span>
                          <button
                            type="button"
                            className="carousel-nav-btn"
                            onClick={() => setAnniversaryIndex((prev) => (prev + 1) % todaysAnniversaries.length)}
                            aria-label="Next anniversary"
                          >
                            ›
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="highlight-empty">No anniversaries today</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-content dashboard-content-secondary">
            <Link to="/admission-inquiries" className="dashboard-card admission-inquiry-card">
              <div className="card-header">
                <h3>Admission Inquiry</h3>
                {admissionInquiriesData?.pending && admissionInquiriesData.pending > 0 && (
                  <span className="badge pending-badge">{admissionInquiriesData.pending} Pending</span>
                )}
              </div>
              <div className="card-content">
                <div className="stat-value">{admissionInquiriesData?.total || 0}</div>
                <p>Total Inquiries</p>
                <p className="card-description">View and manage admission inquiries from the public portal</p>
              </div>
              <div className="card-footer">
                <span className="view-link">View All →</span>
              </div>
            </Link>
            <Link to="/contact-messages" className="dashboard-card admission-inquiry-card">
              <div className="card-header">
                <h3>Contact Message Enquiry</h3>
                {contactMessagesData?.pending && contactMessagesData.pending > 0 && (
                  <span className="badge pending-badge">{contactMessagesData.pending} Pending</span>
                )}
              </div>
              <div className="card-content">
                <div className="stat-value">{contactMessagesData?.total || 0}</div>
                <p>Total Messages</p>
                <p className="card-description">View and manage contact messages from the public portal</p>
              </div>
              <div className="card-footer">
                <span className="view-link">View All →</span>
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;

