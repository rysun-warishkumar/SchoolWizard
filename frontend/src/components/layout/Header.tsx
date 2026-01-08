import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useEffect } from 'react';
import { chatService } from '../../services/api/chatService';
import { settingsService } from '../../services/api/settingsService';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';

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

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
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
              <h2>{schoolName}</h2>
            </div>
          ) : (
            <h2>{schoolName}</h2>
          )}
        </div>
        <div className="header-right">
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
      </div>
    </header>
  );
};

export default Header;

