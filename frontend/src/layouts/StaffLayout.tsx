import React, { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './StaffLayout.css';

interface StaffLayoutProps {
  children: ReactNode;
}

const StaffLayout: React.FC<StaffLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const displaySchoolName = user?.schoolName?.trim() || 'SchoolWizard';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Staff Panel Menu Items
  const menuItems = [
    { path: '/staff/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/staff/profile', label: 'My Profile', icon: '👤' },
    { path: '/staff/classes', label: 'My Classes', icon: '📚' },
    { path: '/staff/students', label: 'My Students', icon: '👥' },
    { path: '/staff/timetable', label: 'Timetable', icon: '📅' },
    { path: '/staff/attendance', label: 'Mark Attendance', icon: '✅' },
    { path: '/staff/homework', label: 'Homework', icon: '📝' },
    { path: '/staff/leave', label: 'Apply Leave', icon: '🏖️' },
    { path: '/staff/payroll', label: 'Payroll', icon: '💰' },
    { path: '/staff/downloads', label: 'Download Center', icon: '📥' },
    { path: '/staff/notices', label: 'Notice Board', icon: '📢' },
    { path: '/staff/chat', label: 'Chat', icon: '/chat-icon.svg' },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="staff-layout">
      <header className="staff-header">
        <div className="staff-header-content">
          <div className="staff-header-left">
            <button className="mobile-menu-toggle" onClick={toggleSidebar} aria-label="Toggle menu">
              <span className="hamburger-icon">☰</span>
            </button>
            <Link to="/dashboard" className="staff-logo-link">
              <div className="staff-logo">
                <h1>{displaySchoolName}</h1>
                <span className="staff-badge">Staff Panel</span>
              </div>
            </Link>
          </div>
          <div className="staff-header-right">
            <div className="staff-user-info">
              <span className="staff-name">{user?.name || 'Staff'}</span>
              <span className="staff-email">{user?.email}</span>
            </div>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="staff-main">
        {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
        <aside className={`staff-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <nav className="staff-nav">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`staff-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                {item.icon.startsWith('/') || item.icon.startsWith('http') ? (
                  <img 
                    src={item.icon} 
                    alt={item.label} 
                    className="nav-icon nav-icon-image"
                  />
                ) : (
                  <span className="nav-icon">{item.icon}</span>
                )}
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="staff-content">{children}</main>
      </div>
    </div>
  );
};

export default StaffLayout;

