import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { websiteService, Banner } from '../services/api';
import './HomePage.css';

const HomePage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await websiteService.getBanners();
        setBanners(data);
        // Set default slide if no banners
        if (data.length === 0) {
          setBanners([
            {
              id: 1,
              title: 'A SCHOOL WITH A DIFFERENCE',
              description: 'Like a sapling that grows with careful nurturing and supervision, we have seen the birth and growth of an education system of which the school has been the crux, and it is now our endeavor to educate global citizens.',
              image_path: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200',
              button_text: 'ENROLL TODAY',
              button_url: '/admission',
              sort_order: 0,
              is_active: true,
            },
          ]);
        }
      } catch (error) {
        console.error('Error fetching banners:', error);
        // Use default banner on error
        setBanners([
          {
            id: 1,
            title: 'A SCHOOL WITH A DIFFERENCE',
            description: 'Like a sapling that grows with careful nurturing and supervision, we have seen the birth and growth of an education system of which the school has been the crux, and it is now our endeavor to educate global citizens.',
            image_path: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200',
            button_text: 'ENROLL TODAY',
            button_url: '/admission',
            sort_order: 0,
            is_active: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  const getImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    return `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const services = [
    {
      icon: 'fas fa-flag',
      title: 'NCC',
      color: 'var(--accent-green)',
      link: '/ncc',
    },
    {
      icon: 'fas fa-headset',
      title: 'ONLINE INQUIRY',
      color: 'var(--primary-blue-light)',
      link: '/contact',
    },
    {
      icon: 'fas fa-file-alt',
      title: 'SCHOOL PROSPECTUS',
      color: 'var(--accent-yellow)',
      link: '/admission',
    },
    {
      icon: 'fas fa-graduation-cap',
      title: 'ACADEMIC CIRCULAR',
      color: 'var(--accent-orange)',
      link: '/news',
    },
  ];

  return (
    <div className="homepage">
      {/* Hero Section */}
      {!loading && banners.length > 0 && (
        <section className="hero-section">
          <div className="hero-slider">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                style={{ backgroundImage: `url(${getImageUrl(banner.image_path)})` }}
              >
                <div className="hero-overlay"></div>
                <div className="hero-content">
                  <h1>{banner.title}</h1>
                  {banner.description && <p>{banner.description}</p>}
                  {banner.button_text && banner.button_url && (
                    <Link to={banner.button_url} className="hero-button">
                      {banner.button_text}
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {banners.length > 1 && (
              <>
                <button
                  className="hero-nav prev"
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)}
                  aria-label="Previous slide"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button
                  className="hero-nav next"
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % banners.length)}
                  aria-label="Next slide"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
                <div className="hero-indicators">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      className={index === currentSlide ? 'active' : ''}
                      onClick={() => setCurrentSlide(index)}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Services Section */}
      <section className="services-section">
        <div className="container">
          <div className="services-grid">
            {services.map((service, index) => (
              <Link key={index} to={service.link} className="service-card">
                <div className="service-icon" style={{ backgroundColor: service.color }}>
                  <i className={service.icon}></i>
                </div>
                <h3>{service.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2>Welcome to Our School</h2>
              <p>
                We are committed to providing a holistic education that prepares students for success in an ever-changing world.
                Our dedicated faculty, state-of-the-art facilities, and innovative teaching methods create an environment
                where every student can thrive.
              </p>
              <p>
                With a focus on academic excellence, character development, and extracurricular activities, we nurture
                well-rounded individuals who are ready to make a positive impact on society.
              </p>
              <Link to="/about" className="read-more-btn">
                Learn More About Us
              </Link>
            </div>
            <div className="about-image">
              <img src="https://images.unsplash.com/photo-1594608661623-aa0bd3a69d98?q=80&w=948&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=600" alt="School" />
            </div>
          </div>
        </div>
      </section>

      {/* News & Events Section */}
      <section className="news-events-section">
        <div className="container">
          <div className="section-header">
            <h2>Latest News & Events</h2>
          </div>
          <div className="news-events-grid">
            <div className="news-card">
              <div className="card-header">
                <h3>Latest News</h3>
                <Link to="/news">View All</Link>
              </div>
              <div className="news-list">
                <div className="news-item">
                  <span className="news-date">Dec 15, 2024</span>
                  <h4>Annual Sports Day Celebration</h4>
                  <p>Join us for our annual sports day event featuring exciting competitions and performances.</p>
                </div>
                <div className="news-item">
                  <span className="news-date">Dec 10, 2024</span>
                  <h4>Science Fair 2024</h4>
                  <p>Students showcase innovative projects and experiments at our annual science fair.</p>
                </div>
              </div>
            </div>
            <div className="events-card">
              <div className="card-header">
                <h3>Upcoming Events</h3>
                <Link to="/events">View All</Link>
              </div>
              <div className="events-list">
                <div className="event-item">
                  <div className="event-date">
                    <span className="day">20</span>
                    <span className="month">DEC</span>
                  </div>
                  <div className="event-details">
                    <h4>Winter Concert</h4>
                    <p><i className="fas fa-map-marker-alt"></i> School Auditorium</p>
                  </div>
                </div>
                <div className="event-item">
                  <div className="event-date">
                    <span className="day">25</span>
                    <span className="month">DEC</span>
                  </div>
                  <div className="event-details">
                    <h4>Christmas Celebration</h4>
                    <p><i className="fas fa-map-marker-alt"></i> School Grounds</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

