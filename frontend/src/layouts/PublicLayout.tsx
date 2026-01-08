import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { publicCmsService, PublicCMSSettings, PublicMenu, PublicMenuItem } from '../services/api/publicCmsService';
import './PublicLayout.css';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Find main navigation menu (by name: "Main navigation" or "Main" or first menu)
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
      staleTime: 5 * 60 * 1000,
      onError: (err) => {
        console.error('Error loading menu items:', err);
      }
    }
  );

  // Debug logging (remove in production)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('CMS Menu Debug:', {
        menusCount: menus.length,
        mainMenu: mainMenu?.name,
        mainMenuId,
        menuItemsCount: menuItems.length,
        menuItems: menuItems
      });
    }
  }, [menus, mainMenu, mainMenuId, menuItems]);

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
    // Handle external URLs
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

    // Handle page links (must have page_id and slug)
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

    // Handle special routes (news, events, gallery, home) - check by menu item name
    const specialRoutes: Record<string, string> = {
      'home': '/',
      'news': '/news',
      'events': '/events',
      'gallery': '/gallery',
    };
    
    const menuItemLower = item.menu_item.toLowerCase().trim();
    if (specialRoutes[menuItemLower]) {
      const route = specialRoutes[menuItemLower];
      const isActive = location.pathname === route || 
                       (route === '/' && location.pathname === '/');
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

    // If no valid link, return null (don't render)
    console.warn(`Menu item "${item.menu_item}" has no valid link (page_id: ${item.page_id}, external_url: ${item.external_url})`);
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

  // Show loading state while fetching settings
  if (settingsLoading) {
    return (
      <div className="public-layout">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  // If settings failed to load or CMS is disabled, show message
  if (settingsError || (settings && !settings.is_enabled)) {
    return (
      <div className="public-layout cms-disabled">
        <div className="cms-disabled-message">
          <h1>Website is currently unavailable</h1>
          <p>The website is temporarily disabled. Please check back later.</p>
        </div>
      </div>
    );
  }

  // Use default settings if not loaded yet (shouldn't happen due to loading check, but just in case)
  const displaySettings = settings || {
    is_enabled: true,
    sidebar_enabled: true,
    rtl_mode: false,
    current_theme: 'School',
  };

  return (
    <div className={`public-layout ${displaySettings.rtl_mode ? 'rtl' : ''}`}>
      {/* Header */}
      <header className="public-header">
        <div className="public-header-container">
          <div className="public-header-top">
            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            {/* Navigation */}
            <nav className={`public-nav ${mobileMenuOpen ? 'open' : ''}`}>
              {/* Render CMS menu items */}
              {!menuItemsLoading && menuTree.length > 0 ? (
                menuTree.map(item => renderMenuItem(item)).filter(item => item !== null)
              ) : !menuItemsLoading && menuTree.length === 0 && mainMenuId ? (
                // No menu items configured in the selected menu
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  No menu items configured
                </span>
              ) : !menuItemsLoading ? (
                // Fallback: Show default links only if no menu is configured
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
            <Link to="/" className="public-logo">
              {displaySettings.logo ? (
                <img src={getImageUrl(displaySettings.logo)} alt={displaySettings.current_theme || 'School Logo'} />
              ) : (
                <h1>{displaySettings.current_theme || 'School'}</h1>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="public-main">
        {children}
      </main>

      {/* Footer */}
      <footer className="public-footer">
        <div className="public-footer-container">
          {displaySettings.footer_text && (
            <div className="public-footer-text" dangerouslySetInnerHTML={{ __html: displaySettings.footer_text }} />
          )}
          
          {/* Social Media Links */}
          {(displaySettings.facebook_url || displaySettings.twitter_url || displaySettings.youtube_url || 
            displaySettings.linkedin_url || displaySettings.instagram_url || displaySettings.whatsapp_url) && (
            <div className="public-footer-social">
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
              {displaySettings.instagram_url && (
                <a href={displaySettings.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <i className="fab fa-instagram"></i>
                </a>
              )}
              {displaySettings.whatsapp_url && (
                <a href={displaySettings.whatsapp_url} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                  <i className="fab fa-whatsapp"></i>
                </a>
              )}
            </div>
          )}

          <div className="public-footer-copyright">
            <p>&copy; {new Date().getFullYear()} {displaySettings.current_theme || 'School'}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;

