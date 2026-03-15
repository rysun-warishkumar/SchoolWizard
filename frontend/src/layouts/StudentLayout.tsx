import React, { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from 'react-query';
import { chatService } from '../services/api/chatService';
import './StudentLayout.css';

interface StudentLayoutProps {
  children: ReactNode;
}

const StudentLayout: React.FC<StudentLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const displaySchoolName = user?.schoolName?.trim() || 'SchoolWizard';
  const isChatPage = location.pathname === '/student/chat';

  const { data: conversations = [] } = useQuery(
    ['chat-conversations'],
    () => chatService.getConversations(),
    {
      enabled: !isChatPage,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      staleTime: 2 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );

  const unreadCount = conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Student Panel Menu Items - Only modules students should access
  const menuItems = [
    { path: '/student/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/student/profile', label: 'My Profile', icon: '👤' },
    { path: '/student/fees', label: 'Fees', icon: '💰' },
    { path: '/student/timetable', label: 'Class Timetable', icon: '📅' },
    { path: '/student/homework', label: 'Homework', icon: '📝' },
    { path: '/student/exams', label: 'Online Exam', icon: '📋' },
    { path: '/student/leave', label: 'Apply Leave', icon: '🏖️' },
    { path: '/student/downloads', label: 'Download Center', icon: '📥' },
    { path: '/student/attendance', label: 'Attendance', icon: '✅' },
    { path: '/student/notices', label: 'Notice Board', icon: '📢' },
    { path: '/student/teachers', label: 'Teachers Review', icon: '⭐' },
    { path: '/student/subjects', label: 'Subjects', icon: '📚' },
    { path: '/student/teachers-list', label: 'Teachers', icon: '👨‍🏫' },
    { path: '/student/library', label: 'Library Books', icon: '📖' },
    { path: '/student/library-issued', label: 'Book Issued', icon: '📗' },
    { path: '/student/transport', label: 'Transport Routes', icon: '🚌' },
    { path: '/student/hostel', label: 'Hostel Rooms', icon: '🏠' },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="student-layout">
      <header className="student-header">
        <div className="student-header-content">
          <div className="student-header-left">
            <button className="mobile-menu-toggle" onClick={toggleSidebar} aria-label="Toggle menu">
              <span className="hamburger-icon">☰</span>
            </button>
            <Link to="/student/dashboard" className="student-logo-link">
              <div className="student-logo">
                <h1>{displaySchoolName}</h1>
                <span className="student-badge">Student Panel</span>
              </div>
            </Link>
          </div>
          <div className="student-header-right">
            <button
              type="button"
              className="student-chat-icon-container"
              onClick={() => navigate('/student/chat')}
              title="Chat"
              aria-label="Open chat"
            >
              <img
                src="/chat-icon.svg"
                alt="Chat"
                className="student-chat-icon"
              />
              {unreadCount > 0 && (
                <span className="student-chat-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>
            <div className="student-user-info">
              <span className="student-name">{user?.name || 'Student'}</span>
              <span className="student-email">{user?.email}</span>
            </div>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="student-main">
        {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
        <aside className={`student-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <nav className="student-nav">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`student-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="student-content">{children}</main>
      </div>
    </div>
  );
};

export default StudentLayout;

