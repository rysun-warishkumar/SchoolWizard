import { useAuth } from '../contexts/AuthContext';
import { useQuery } from 'react-query';
import { dashboardService } from '../services/api/dashboardService';
import { contactMessagesService } from '../services/api/contactMessagesService';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { data: statsData, isLoading } = useQuery('dashboard-stats', () => dashboardService.getStats());
  const { data: contactMessagesData } = useQuery('contact-messages-count', () => contactMessagesService.getMessages(), {
    select: (data) => ({
      total: data.length,
      pending: data.filter((msg: any) => msg.status === 'new').length,
    }),
  });

  const stats = statsData?.data;

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

          <div className="dashboard-content">
            <div className="dashboard-card">
              <h3>Quick Actions</h3>
              <div className="quick-actions">
                <a href="/users" className="action-link">
                  <span className="action-icon">➕</span>
                  <span>Add New User</span>
                </a>
                <a href="/roles" className="action-link">
                  <span className="action-icon">🔐</span>
                  <span>Manage Roles</span>
                </a>
              </div>
            </div>
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

