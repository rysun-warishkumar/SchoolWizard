import React, { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './ParentLayout.css';

interface ParentLayoutProps {
  children: ReactNode;
}

const ParentLayout: React.FC<ParentLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Parent Panel Menu Items - Similar to Student Panel
  const menuItems = [
    { path: '/parent/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/parent/profile', label: 'Child Profile', icon: '👤' },
    { path: '/parent/fees', label: 'Fees', icon: '💰' },
    { path: '/parent/timetable', label: 'Class Timetable', icon: '📅' },
    { path: '/parent/homework', label: 'Homework', icon: '📝' },
    { path: '/parent/exams', label: 'Online Exam', icon: '📋' },
    { path: '/parent/leave', label: 'Leave Requests', icon: '🏖️' },
    { path: '/parent/downloads', label: 'Download Center', icon: '📥' },
    { path: '/parent/attendance', label: 'Attendance', icon: '✅' },
    { path: '/parent/notices', label: 'Notice Board', icon: '📢' },
    { path: '/parent/teachers', label: 'Teachers Review', icon: '⭐' },
    { path: '/parent/subjects', label: 'Subjects', icon: '📚' },
    { path: '/parent/teachers-list', label: 'Teachers', icon: '👨‍🏫' },
    { path: '/parent/library', label: 'Library Books', icon: '📖' },
    { path: '/parent/library-issued', label: 'Book Issued', icon: '📗' },
    { path: '/parent/transport', label: 'Transport Routes', icon: '🚌' },
    { path: '/parent/hostel', label: 'Hostel Rooms', icon: '🏠' },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="parent-layout">
      <header className="parent-header">
        <div className="parent-header-content">
          <div className="parent-header-left">
            <button className="mobile-menu-toggle" onClick={toggleSidebar} aria-label="Toggle menu">
              <span className="hamburger-icon">☰</span>
            </button>
            <div className="parent-logo">
              <h1>SchoolWizard</h1>
              <span className="parent-badge">Parent Panel</span>
            </div>
          </div>
          <div className="parent-header-right">
            <div className="parent-user-info">
              <span className="parent-name">{user?.name || 'Parent'}</span>
              <span className="parent-email">{user?.email}</span>
            </div>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="parent-main">
        {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
        <aside className={`parent-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <nav className="parent-nav">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`parent-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="parent-content">{children}</main>
      </div>
    </div>
  );
};

export default ParentLayout;

