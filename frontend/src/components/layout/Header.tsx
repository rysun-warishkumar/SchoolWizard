import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useEffect, useState, useRef } from 'react';
import { chatService } from '../../services/api/chatService';
import { settingsService } from '../../services/api/settingsService';
import './Header.css';

interface HeaderProps {
  onMenuClick?: () => void;
  isMobileMenuOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, isMobileMenuOpen = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Get unread chat count - use same query key as Chat component to share cache
  // Only refetch if not on chat page (chat page handles its own refetching)
  const { data: conversations = [] } = useQuery(
    ['chat-conversations'],
    () => chatService.getConversations(),
    {
      enabled: !isChatPage, // Disable when on chat page to avoid duplicate calls
      refetchInterval: false, // Disabled automatic refetching
      refetchOnWindowFocus: false, // Disabled to prevent excessive calls
      refetchOnMount: true, // Only refetch on component mount
      staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
      cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    }
  );

  // Get general settings for school name, logo, and favicon
  // Handle errors gracefully - teachers may not have access to settings
  const { data: generalSettings } = useQuery(
    'general-settings',
    () => settingsService.getGeneralSettings(),
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      retry: false, // Don't retry on 403 errors
      onError: (error: any) => {
        // Silently handle 403 errors - teachers don't need settings access
        if (error?.response?.status !== 403) {
          console.error('Failed to load general settings:', error);
        }
      },
    }
  );

  const unreadCount = conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0);
  const schoolName = generalSettings?.data?.schoolName || 'SchoolWizard';
  const logoPath = generalSettings?.data?.adminLogo;
  const faviconPath = generalSettings?.data?.favicon;
  const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';
  const baseUrl = apiBaseUrl.replace('/api/v1', '');
  // Build URLs - browser will handle caching with proper headers
  const logoUrl = logoPath && logoPath.trim() !== '' ? `${baseUrl}${logoPath}` : null;
  const faviconUrl = faviconPath && faviconPath.trim() !== '' ? `${baseUrl}${faviconPath}` : null;

  // Update document title and favicon
  useEffect(() => {
    // Update document title
    document.title = `${schoolName} - School Management System`;
    
    // Update favicon
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    if (faviconUrl) {
      link.href = faviconUrl;
    } else {
      link.href = '/vite.svg'; // Default favicon
    }
  }, [schoolName, faviconUrl]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Close user menu when route changes
  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  const handleProfileClick = () => {
    setIsUserMenuOpen(false);
    navigate('/profile');
  };

  const handleChatClick = () => {
    setIsUserMenuOpen(false);
    navigate('/chat');
  };

  const handleLogoutClick = () => {
    setIsUserMenuOpen(false);
    logout();
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          {/* Mobile menu button */}
          <button 
            className="mobile-menu-button"
            onClick={onMenuClick}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
          {/* Logo and School Name - Centered on mobile */}
          {logoUrl ? (
            <div className="header-logo-container">
              <img 
                src={logoUrl} 
                alt={schoolName} 
                className="header-logo"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <h2 className="header-school-name">{schoolName}</h2>
            </div>
          ) : (
            <h2 className="header-school-name">{schoolName}</h2>
          )}
        </div>
        <div className="header-right">
          {/* Desktop: Show chat, user info, and logout */}
          <div className="header-right-desktop">
            <div 
              className="chat-icon-container" 
              onClick={() => navigate('/chat')} 
              title="Chat"
            >
              <img 
                src="/chat-icon.png" 
                alt="Chat" 
                className="chat-icon"
              />
              {unreadCount > 0 && (
                <span className="chat-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </div>
            <div className="user-info" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
              <span>{user?.name}</span>
              <span className="user-role">{user?.role}</span>
            </div>
            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </div>

          {/* Mobile: Show user icon with dropdown menu */}
          <div className="header-right-mobile" ref={userMenuRef}>
            <button 
              className="user-icon-button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              aria-label="User menu"
              aria-expanded={isUserMenuOpen}
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="user-icon"
              >
                <path 
                  d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            
            {/* User Menu Dropdown */}
            {isUserMenuOpen && (
              <div className="user-menu-dropdown">
                <div className="user-menu-header">
                  <div className="user-menu-name">{user?.name}</div>
                  <div className="user-menu-role">{user?.role}</div>
                </div>
                <div className="user-menu-divider"></div>
                <button 
                  className="user-menu-item"
                  onClick={handleProfileClick}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Profile</span>
                </button>
                <button 
                  className="user-menu-item"
                  onClick={handleChatClick}
                >
                  <div className="user-menu-item-icon-wrapper">
                    <img 
                      src="/chat-icon.png" 
                      alt="Chat" 
                      className="user-menu-chat-icon"
                    />
                    {unreadCount > 0 && (
                      <span className="user-menu-chat-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                    )}
                  </div>
                  <span>Chat</span>
                </button>
                <div className="user-menu-divider"></div>
                <button 
                  className="user-menu-item user-menu-item-logout"
                  onClick={handleLogoutClick}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

