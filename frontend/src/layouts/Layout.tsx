import { ReactNode, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import SchoolAssistantWidget from '../components/common/SchoolAssistantWidget';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const isChatPage = location.pathname === '/chat';
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const trialDaysLeft = useMemo(() => {
    if (!user?.trialEndsAt || user.schoolStatus !== 'trial') return null;
    const end = new Date(user.trialEndsAt);
    const now = new Date();
    if (end <= now) return 0;
    return Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  }, [user?.trialEndsAt, user?.schoolStatus]);

  const showTrialBanner = user?.schoolId != null && user.schoolStatus === 'trial' && trialDaysLeft != null && trialDaysLeft > 0;

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // Handle window resize - close mobile sidebar if window becomes desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${isMobileSidebarOpen ? 'mobile-sidebar-open' : ''}`}>
      <Header 
        onMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isMobileMenuOpen={isMobileSidebarOpen}
      />
      {/* Mobile overlay - closes sidebar when clicked */}
      {isMobileSidebarOpen && (
        <div 
          className="mobile-sidebar-overlay"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}
      <div className="layout-body">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />
        <div className="layout-main">
          {showTrialBanner && (
            <div className="layout-trial-banner" role="status">
              {trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'} left in your free trial. Contact us to upgrade.
            </div>
          )}
          <main className={`layout-content ${isChatPage ? 'chat-layout' : ''}`}>{children}</main>
        </div>
      </div>
      <SchoolAssistantWidget />
    </div>
  );
};

export default Layout;

