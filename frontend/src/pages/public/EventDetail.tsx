import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { publicCmsService, PublicEvent } from '../../services/api/publicCmsService';
import './PublicPages.css';

const EventDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: event, isLoading, error } = useQuery<PublicEvent>(
    ['public-event-detail', slug],
    () => slug ? publicCmsService.getEventBySlug(slug) : Promise.reject('No slug provided'),
    { retry: 1, staleTime: 5 * 60 * 1000 }
  );

  // Update document title - MUST be called before any conditional returns
  useEffect(() => {
    if (event) {
      document.title = event.meta_title || event.event_title;
    }
  }, [event]);

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

  if (isLoading) {
    return (
      <div className="public-page-content">
        <div className="public-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Event loading error:', error);
    return (
      <div className="public-page-content">
        <div className="public-container">
          <div className="error-message">
            <h2>Event Not Found</h2>
            <p>The event you are looking for does not exist.</p>
            <Link to="/events">← Back to Events</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="public-page-content">
        <div className="public-container">
          <div className="error-message">
            <h2>Event Not Found</h2>
            <p>The event you are looking for does not exist.</p>
            <Link to="/events">← Back to Events</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-page-content">
      <div className="public-container">
        <Link to="/events" className="public-back-link">← Back to Events</Link>
        <article className="public-event-detail">
          <div className="public-page-header">
            {event.featured_image && (
              <div className="public-page-featured-image">
                <img src={getImageUrl(event.featured_image)} alt={event.event_title} />
              </div>
            )}
            <h1 className="public-page-title">{event.event_title}</h1>
            <div className="public-event-meta">
              <p>
                <i className="fas fa-calendar"></i> {formatDate(event.event_start_date)}
                {event.event_end_date && ` - ${formatDate(event.event_end_date)}`}
              </p>
              {event.event_venue && (
                <p>
                  <i className="fas fa-map-marker-alt"></i> {event.event_venue}
                </p>
              )}
            </div>
          </div>
          <div
            className="public-page-body"
            dangerouslySetInnerHTML={{ __html: event.description || '' }}
          />
        </article>
      </div>
    </div>
  );
};

export default EventDetail;

