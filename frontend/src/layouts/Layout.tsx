import { ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
          <main className={`layout-content ${isChatPage ? 'chat-layout' : ''}`}>{children}</main>
        </div>
      </div>
    </div>
  );
};

export default Layout;

