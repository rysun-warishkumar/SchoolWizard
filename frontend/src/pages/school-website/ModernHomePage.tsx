import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { publicCmsService, PublicBannerImage, PublicNews, PublicEvent } from '../../services/api/publicCmsService';
import './SchoolWebsitePages.css';

const ModernHomePage: React.FC = () => {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Fetch banner images
  const { data: banners = [] } = useQuery<PublicBannerImage[]>(
    'public-banner-images',
    () => publicCmsService.getBannerImages(),
    { retry: 1, staleTime: 5 * 60 * 1000 }
  );

  // Filter active banners
  const activeBanners = banners.filter(b => b.is_active).sort((a, b) => a.sort_order - b.sort_order);

  // Fetch latest news (limit to 6)
  const { data: latestNews = [] } = useQuery<PublicNews[]>(
    'public-latest-news',
    () => publicCmsService.getNews({}),
    { retry: 1, staleTime: 5 * 60 * 1000 }
  );

  // Fetch upcoming events (limit to 6)
  const { data: upcomingEvents = [] } = useQuery<PublicEvent[]>(
    'public-upcoming-events',
    () => publicCmsService.getEvents({}),
    { retry: 1, staleTime: 5 * 60 * 1000 }
  );

  // Auto-rotate banners
  useEffect(() => {
    if (activeBanners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const getImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const apiBase = (import.meta as any).env?.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    return `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const displayedNews = latestNews.slice(0, 6);
  const displayedEvents = upcomingEvents.slice(0, 6);

  return (
    <div className="modern-homepage">
      {/* Hero Banner Section */}
      {activeBanners.length > 0 && (
        <section className="hero-banner">
          <div className="banner-slider">
            {activeBanners.map((banner, index) => (
              <div
                key={banner.id}
                className={`banner-slide ${index === currentBannerIndex ? 'active' : ''}`}
                style={{
                  backgroundImage: `url(${getImageUrl(banner.image_path)})`,
                }}
              >
                {(banner as any).title && (
                  <div className="banner-content">
                    <h1>{(banner as any).title}</h1>
                    {(banner as any).description && <p>{(banner as any).description}</p>}
                  </div>
                )}
              </div>
            ))}
            {activeBanners.length > 1 && (
              <>
                <button
                  className="banner-nav prev"
                  onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length)}
                  aria-label="Previous banner"
                >
                  ‹
                </button>
                <button
                  className="banner-nav next"
                  onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length)}
                  aria-label="Next banner"
                >
                  ›
                </button>
                <div className="banner-indicators">
                  {activeBanners.map((_, index) => (
                    <button
                      key={index}
                      className={index === currentBannerIndex ? 'active' : ''}
                      onClick={() => setCurrentBannerIndex(index)}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Welcome Section */}
      <section className="welcome-section">
        <div className="container">
          <div className="section-header">
            <h2>Welcome to Our School</h2>
            <p>Excellence in Education, Character, and Community</p>
          </div>
        </div>
      </section>

      {/* News Section */}
      {displayedNews.length > 0 && (
        <section className="news-section">
          <div className="container">
            <div className="section-header">
              <h2>Latest News</h2>
              <Link to="/news" className="view-all-link">View All News →</Link>
            </div>
            <div className="news-grid">
              {displayedNews.map((news) => (
                <article key={news.id} className="news-card">
                  {news.featured_image && (
                    <div className="news-image">
                      <Link to={`/news/${news.slug}`}>
                        <img src={getImageUrl(news.featured_image)} alt={news.news_title} />
                      </Link>
                    </div>
                  )}
                  <div className="news-content">
                    <time className="news-date">{formatDate(news.news_date)}</time>
                    <h3>
                      <Link to={`/news/${news.slug}`}>{news.news_title}</Link>
                    </h3>
                    {news.description && (
                      <p className="news-excerpt" dangerouslySetInnerHTML={{ 
                        __html: news.description.substring(0, 150) + (news.description.length > 150 ? '...' : '')
                      }} />
                    )}
                    <Link to={`/news/${news.slug}`} className="read-more">Read More →</Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Events Section */}
      {displayedEvents.length > 0 && (
        <section className="events-section">
          <div className="container">
            <div className="section-header">
              <h2>Upcoming Events</h2>
              <Link to="/events" className="view-all-link">View All Events →</Link>
            </div>
            <div className="events-grid">
              {displayedEvents.map((event) => (
                <article key={event.id} className="event-card">
                  {event.featured_image && (
                    <div className="event-image">
                      <Link to={`/events/${event.slug}`}>
                        <img src={getImageUrl(event.featured_image)} alt={event.event_title} />
                      </Link>
                    </div>
                  )}
                  <div className="event-content">
                    <div className="event-date">
                      <span className="event-day">{new Date(event.event_start_date).getDate()}</span>
                      <span className="event-month">{new Date(event.event_start_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                    </div>
                    <div className="event-details">
                      <h3>
                        <Link to={`/events/${event.slug}`}>{event.event_title}</Link>
                      </h3>
                      {event.event_venue && (
                        <p className="event-venue">
                          <i className="fas fa-map-marker-alt"></i> {event.event_venue}
                        </p>
                      )}
                      <Link to={`/events/${event.slug}`} className="read-more">Learn More →</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ModernHomePage;

