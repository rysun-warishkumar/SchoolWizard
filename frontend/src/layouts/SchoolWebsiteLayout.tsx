import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { publicCmsService, PublicCMSSettings, PublicMenu, PublicMenuItem } from '../services/api/publicCmsService';
import './SchoolWebsiteLayout.css';

interface SchoolWebsiteLayoutProps {
  children: React.ReactNode;
}

const SchoolWebsiteLayout: React.FC<SchoolWebsiteLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('school-website-theme') as 'light' | 'dark' | null;
    if (savedTheme) return savedTheme;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('school-website-theme', theme);
  }, [theme]);

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Fetch CMS settings
  const { data: settings, isLoading: settingsLoading, error: settingsError } = useQuery<PublicCMSSettings>(
    'public-cms-settings',
    () => publicCmsService.getSettings(),
    { retry: 1, staleTime: 5 * 60 * 1000 }
  );

  // Fetch all menus
  const { data: menus = [] } = useQuery<PublicMenu[]>(
    'public-cms-menus',
    () => publicCmsService.getMenus(),
    { retry: 1, staleTime: 5 * 60 * 1000 }
  );

  // Find main navigation menu
  const mainMenu = menus.find(m => 
    m.name.toLowerCase() === 'main navigation' || 
    m.name.toLowerCase() === 'main' ||
    m.name.toLowerCase() === 'main menu'
  ) || menus[0] || null;

  const mainMenuId = mainMenu?.id || null;

  // Get main menu items
  const { data: menuItems = [], isLoading: menuItemsLoading } = useQuery<PublicMenuItem[]>(
    ['public-cms-menu-items', mainMenuId],
    () => mainMenuId ? publicCmsService.getMenuItems(mainMenuId) : Promise.resolve([]),
    { 
      enabled: !!mainMenuId, 
      retry: 1, 
      staleTime: 5 * 60 * 1000
    }
  );

  // Build menu tree
  const buildMenuTree = (items: PublicMenuItem[]): PublicMenuItem[] => {
    const itemMap = new Map<number, PublicMenuItem>();
    const rootItems: PublicMenuItem[] = [];

    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    items.forEach(item => {
      const menuItem = itemMap.get(item.id)!;
      if (item.parent_id && itemMap.has(item.parent_id)) {
        const parent = itemMap.get(item.parent_id)!;
        if (!parent.children) parent.children = [];
        parent.children.push(menuItem);
      } else {
        rootItems.push(menuItem);
      }
    });

    return rootItems.sort((a, b) => a.sort_order - b.sort_order);
  };

  const menuTree = buildMenuTree(menuItems);

  // Get image URL
  const getImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const apiBase = (import.meta as any).env?.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    return `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
  };

  // Render menu item
  const renderMenuItem = (item: PublicMenuItem): React.ReactNode => {
    if (item.external_url) {
      const isActive = location.pathname === item.external_url;
      return (
        <a
          key={item.id}
          href={item.external_url}
          target={item.open_in_new_tab ? '_blank' : '_self'}
          rel={item.open_in_new_tab ? 'noopener noreferrer' : undefined}
          className={isActive ? 'active' : ''}
        >
          {item.menu_item}
        </a>
      );
    }

    if (item.page_id && item.slug) {
      const isActive = location.pathname === `/page/${item.slug}`;
      return (
        <Link
          key={item.id}
          to={`/page/${item.slug}`}
          className={isActive ? 'active' : ''}
        >
          {item.menu_item}
        </Link>
      );
    }

    const specialRoutes: Record<string, string> = {
      'home': '/',
      'news': '/news',
      'events': '/events',
      'gallery': '/gallery',
    };
    
    const menuItemLower = item.menu_item.toLowerCase().trim();
    if (specialRoutes[menuItemLower]) {
      const route = specialRoutes[menuItemLower];
      const isActive = location.pathname === route || (route === '/' && location.pathname === '/');
      return (
        <Link
          key={item.id}
          to={route}
          className={isActive ? 'active' : ''}
        >
          {item.menu_item}
        </Link>
      );
    }

    return null;
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Inject Google Analytics if available
  useEffect(() => {
    if (settings?.google_analytics) {
      const script = document.createElement('script');
      script.innerHTML = settings.google_analytics;
      document.head.appendChild(script);
      return () => {
        const existingScript = document.head.querySelector(`script[data-google-analytics]`);
        if (existingScript) {
          document.head.removeChild(existingScript);
        }
      };
    }
  }, [settings?.google_analytics]);

  // Show loading state
  if (settingsLoading) {
    return (
      <div className="school-website-layout loading-state">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Show error state
  if (settingsError || !settings || !settings.is_enabled) {
    return (
      <div className="school-website-layout error-state">
        <div className="error-message">
          <h2>Website Unavailable</h2>
          <p>The school website is currently unavailable. Please check back later.</p>
        </div>
      </div>
    );
  }

  const displaySettings = settings;

  return (
    <div className={`school-website-layout theme-${theme}`}>
      {/* Header */}
      <header className="school-header">
        <div className="header-container">
          <div className="header-top">
            <Link to="/" className="school-logo">
              {displaySettings.logo ? (
                <img src={getImageUrl(displaySettings.logo)} alt={displaySettings.current_theme || 'School Logo'} />
              ) : (
                <h1>{displaySettings.current_theme || 'School'}</h1>
              )}
            </Link>
            
            <div className="header-actions">
              <button 
                className="theme-toggle" 
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <button
                className="mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className={`school-nav ${mobileMenuOpen ? 'open' : ''}`}>
            {!menuItemsLoading && menuTree.length > 0 ? (
              menuTree.map(item => renderMenuItem(item)).filter(item => item !== null)
            ) : !menuItemsLoading ? (
              <>
                <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                  Home
                </Link>
                <Link to="/news" className={location.pathname === '/news' ? 'active' : ''}>
                  News
                </Link>
                <Link to="/events" className={location.pathname === '/events' ? 'active' : ''}>
                  Events
                </Link>
                <Link to="/gallery" className={location.pathname === '/gallery' ? 'active' : ''}>
                  Gallery
                </Link>
              </>
            ) : null}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="school-main">
        {children}
      </main>

      {/* Footer */}
      <footer className="school-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>{displaySettings.current_theme || 'School'}</h3>
              {displaySettings.address && (
                <p className="footer-address">{displaySettings.address}</p>
              )}
              {displaySettings.footer_text && (
                <p className="footer-text">{displaySettings.footer_text}</p>
              )}
            </div>

            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/news">News</Link></li>
                <li><Link to="/events">Events</Link></li>
                <li><Link to="/gallery">Gallery</Link></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Connect With Us</h4>
              <div className="social-links">
                {displaySettings.facebook_url && (
                  <a href={displaySettings.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                    <i className="fab fa-facebook"></i>
                  </a>
                )}
                {displaySettings.twitter_url && (
                  <a href={displaySettings.twitter_url} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                    <i className="fab fa-twitter"></i>
                  </a>
                )}
                {displaySettings.instagram_url && (
                  <a href={displaySettings.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    <i className="fab fa-instagram"></i>
                  </a>
                )}
                {displaySettings.youtube_url && (
                  <a href={displaySettings.youtube_url} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                    <i className="fab fa-youtube"></i>
                  </a>
                )}
                {displaySettings.linkedin_url && (
                  <a href={displaySettings.linkedin_url} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                    <i className="fab fa-linkedin"></i>
                  </a>
                )}
                {displaySettings.whatsapp_url && (
                  <a href={displaySettings.whatsapp_url} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                    <i className="fab fa-whatsapp"></i>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} {displaySettings.current_theme || 'School'}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SchoolWebsiteLayout;

