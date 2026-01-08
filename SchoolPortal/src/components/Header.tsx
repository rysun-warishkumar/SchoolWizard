import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { websiteService } from '../services/api';
import './Header.css';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await websiteService.getSettings();
        setSettings(data);
      } catch (error) {
        console.error('Error fetching website settings:', error);
        // Use default settings on error
        setSettings({
          school_name: 'School Name',
          tag_line: 'A School with a Difference',
          tag_line_visible: true,
          contact_email: null,
          contact_phone: null,
          website_logo: null,
          facebook_enabled: false,
          twitter_enabled: false,
          youtube_enabled: false,
          instagram_enabled: false,
          linkedin_enabled: false,
          whatsapp_enabled: false,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const getImageUrl = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    return `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  const displaySettings = settings || {
    school_name: 'School Name',
    tag_line: 'A School with a Difference',
    tag_line_visible: true,
    contact_email: null,
    contact_phone: null,
    website_logo: null,
  };

  return (
    <>
      {/* Top Bar - Social Media & Quick Links */}
      <div className="top-bar">
        <div className="container">
          <div className="top-bar-content">
            <div className="social-links">
              {displaySettings.twitter_enabled && displaySettings.twitter_url && (
                <a href={displaySettings.twitter_url} aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-twitter"></i>
                </a>
              )}
              {displaySettings.facebook_enabled && displaySettings.facebook_url && (
                <a href={displaySettings.facebook_url} aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-facebook-f"></i>
                </a>
              )}
              {displaySettings.youtube_enabled && displaySettings.youtube_url && (
                <a href={displaySettings.youtube_url} aria-label="YouTube" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-youtube"></i>
                </a>
              )}
              {displaySettings.instagram_enabled && displaySettings.instagram_url && (
                <a href={displaySettings.instagram_url} aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-instagram"></i>
                </a>
              )}
              {displaySettings.linkedin_enabled && displaySettings.linkedin_url && (
                <a href={displaySettings.linkedin_url} aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              )}
              {displaySettings.whatsapp_enabled && displaySettings.whatsapp_url && (
                <a href={displaySettings.whatsapp_url} aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-whatsapp"></i>
                </a>
              )}
            </div>
            <div className="top-bar-links">
              <Link to="/admission">Register</Link>
              <span>|</span>
              <Link to="/admission">Apply Online</Link>
              <span>|</span>
              <Link to="/news">Blog</Link>
              <span>|</span>
              <Link to="/contact">FAQ</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className={`main-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="header-content">
            <Link to="/" className="logo-section">
              {displaySettings.website_logo ? (
                <img src={getImageUrl(displaySettings.website_logo)} alt={displaySettings.school_name} className="website-logo" />
              ) : (
                <div className="logo-icon">
                  <i className="fas fa-graduation-cap"></i>
                </div>
              )}
              <div className="logo-text">
                <h1>{displaySettings.school_name || 'SCHOOL NAME'}</h1>
                {displaySettings.tag_line_visible === true && displaySettings.tag_line && (
                  <p>{displaySettings.tag_line}</p>
                )}
              </div>
            </Link>

            <div className="header-contact">
              {displaySettings.contact_email && (
                <div className="contact-item">
                  <i className="fas fa-envelope"></i>
                  <div>
                    <span className="contact-label">EMAIL</span>
                    <span className="contact-value">{displaySettings.contact_email}</span>
                  </div>
                </div>
              )}
              {displaySettings.contact_phone && (
                <div className="contact-item">
                  <i className="fas fa-phone"></i>
                  <div>
                    <span className="contact-label">CONTACT NO</span>
                    <span className="contact-value">{displaySettings.contact_phone}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className={`main-nav ${scrolled ? 'scrolled' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="container">
          <div className="nav-content">
            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>

            <ul className="nav-menu">
              <li><Link to="/" className={isActive('/') ? 'active' : ''}>HOME</Link></li>
              <li><Link to="/about" className={isActive('/about') ? 'active' : ''}>ABOUT US</Link></li>
              <li><Link to="/curriculum" className={isActive('/curriculum') ? 'active' : ''}>CURRICULUM</Link></li>
              <li><Link to="/admission" className={isActive('/admission') ? 'active' : ''}>ADMISSION</Link></li>
              <li><Link to="/gallery" className={isActive('/gallery') ? 'active' : ''}>GALLERY</Link></li>
              <li><Link to="/news" className={isActive('/news') ? 'active' : ''}>NEWS</Link></li>
              <li><Link to="/events" className={isActive('/events') ? 'active' : ''}>EVENTS</Link></li>
              <li><Link to="/contact" className={isActive('/contact') ? 'active' : ''}>CONTACT US</Link></li>
            </ul>

            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <i className="fas fa-moon"></i> : <i className="fas fa-sun"></i>}
            </button>
          </div>
        </div>
      </nav>

      {/* Vertical Quick Links */}
      <div className="vertical-quick-links">
        <Link to="/gallery" className="quick-link tour" title="Virtual Tour">
          <i className="fas fa-camera"></i>
          <span>TOUR</span>
        </Link>
        <Link to="/careers" className="quick-link career" title="Careers">
          <i className="fas fa-briefcase"></i>
          <span>CAREER</span>
        </Link>
        <Link to="/alumni" className="quick-link alumni" title="Alumni">
          <i className="fas fa-graduation-cap"></i>
          <span>ALUMNI</span>
        </Link>
      </div>
    </>
  );
};

export default Header;

