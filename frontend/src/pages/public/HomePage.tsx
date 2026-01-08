import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { publicCmsService, PublicBannerImage, PublicNews, PublicEvent } from '../../services/api/publicCmsService';
import './PublicPages.css';

const HomePage: React.FC = () => {
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
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="public-homepage">
      {/* Banner Slider */}
      {activeBanners.length > 0 && (
        <section className="public-banner-section">
          <div className="public-banner-slider">
            {activeBanners.map((banner, index) => (
              <div
                key={banner.id}
                className={`public-banner-slide ${index === currentBannerIndex ? 'active' : ''}`}
                style={{
                  backgroundImage: `url(${getImageUrl(banner.image_path)})`,
                }}
              >
                {banner.image_title && (
                  <div className="public-banner-content">
                    <h2>{banner.image_title}</h2>
                    {banner.image_link && (
                      <Link to={banner.image_link} className="public-banner-button">
                        Learn More
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Banner Indicators */}
          {activeBanners.length > 1 && (
            <div className="public-banner-indicators">
              {activeBanners.map((_, index) => (
                <button
                  key={index}
                  className={index === currentBannerIndex ? 'active' : ''}
                  onClick={() => setCurrentBannerIndex(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Banner Navigation */}
          {activeBanners.length > 1 && (
            <>
              <button
                className="public-banner-nav public-banner-prev"
                onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length)}
                aria-label="Previous slide"
              >
                ‹
              </button>
              <button
                className="public-banner-nav public-banner-next"
                onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length)}
                aria-label="Next slide"
              >
                ›
              </button>
            </>
          )}
        </section>
      )}

      {/* Latest News Section */}
      {latestNews.length > 0 && (
        <section className="public-section">
          <div className="public-container">
            <div className="public-section-header">
              <h2>Latest News</h2>
              <Link to="/news" className="public-view-all">
                View All News →
              </Link>
            </div>
            <div className="public-news-grid">
              {latestNews.slice(0, 6).map((news) => (
                <article key={news.id} className="public-news-card">
                  {news.featured_image && (
                    <div className="public-news-image">
                      <img src={getImageUrl(news.featured_image)} alt={news.news_title} />
                    </div>
                  )}
                  <div className="public-news-content">
                    <time className="public-news-date">{formatDate(news.news_date)}</time>
                    <h3>
                      <Link to={`/news/${news.slug}`}>{news.news_title}</Link>
                    </h3>
                    {news.description && (
                      <p className="public-news-excerpt">
                        {news.description.length > 150
                          ? `${news.description.substring(0, 150)}...`
                          : news.description}
                      </p>
                    )}
                    <Link to={`/news/${news.slug}`} className="public-read-more">
                      Read More →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events Section */}
      {upcomingEvents.length > 0 && (
        <section className="public-section public-section-alt">
          <div className="public-container">
            <div className="public-section-header">
              <h2>Upcoming Events</h2>
              <Link to="/events" className="public-view-all">
                View All Events →
              </Link>
            </div>
            <div className="public-events-grid">
              {upcomingEvents.slice(0, 6).map((event) => (
                <article key={event.id} className="public-event-card">
                  {event.featured_image && (
                    <div className="public-event-image">
                      <img src={getImageUrl(event.featured_image)} alt={event.event_title} />
                    </div>
                  )}
                  <div className="public-event-content">
                    <div className="public-event-date">
                      <span className="public-event-day">
                        {new Date(event.event_start_date).getDate()}
                      </span>
                      <span className="public-event-month">
                        {new Date(event.event_start_date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </div>
                    <div className="public-event-details">
                      <h3>
                        <Link to={`/events/${event.slug}`}>{event.event_title}</Link>
                      </h3>
                      {event.event_venue && (
                        <p className="public-event-venue">
                          <i className="fas fa-map-marker-alt"></i> {event.event_venue}
                        </p>
                      )}
                      {event.description && (
                        <p className="public-event-excerpt">
                          {event.description.length > 100
                            ? `${event.description.substring(0, 100)}...`
                            : event.description}
                        </p>
                      )}
                      <Link to={`/events/${event.slug}`} className="public-read-more">
                        Learn More →
                      </Link>
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

export default HomePage;

