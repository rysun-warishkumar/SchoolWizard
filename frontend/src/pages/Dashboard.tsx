import { useAuth } from '../contexts/AuthContext';
import { useQuery } from 'react-query';
import { dashboardService } from '../services/api/dashboardService';
import { admissionManagementService } from '../services/api/admissionManagementService';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { data: statsData, isLoading } = useQuery('dashboard-stats', () => dashboardService.getStats());
  const { data: inquiriesData } = useQuery('admission-inquiries-count', () => admissionManagementService.getInquiries(), {
    select: (data) => ({
      total: data.length,
      pending: data.filter((inq: any) => inq.status === 'pending').length,
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
            <Link to="/admission-inquiries" className="dashboard-card admission-inquiry-card">
              <div className="card-header">
                <h3>Admission Inquiries</h3>
                {inquiriesData?.pending > 0 && (
                  <span className="badge pending-badge">{inquiriesData.pending} Pending</span>
                )}
              </div>
              <div className="card-content">
                <div className="stat-value">{inquiriesData?.total || 0}</div>
                <p>Total Inquiries</p>
                <p className="card-description">View and manage admission inquiries from prospective students</p>
              </div>
              <div className="card-footer">
                <span className="view-link">View All →</span>
              </div>
            </Link>
            <div className="dashboard-card">
              <h3>Recent Activity</h3>
              <div className="recent-activity">
                {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                  <ul>
                    {stats.recentActivities.map((activity, index) => (
                      <li key={index}>{activity}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">No recent activities</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;

