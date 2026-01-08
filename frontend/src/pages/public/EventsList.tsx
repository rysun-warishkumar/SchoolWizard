import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { publicCmsService, PublicEvent } from '../../services/api/publicCmsService';
import './PublicPages.css';

const EventsList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: events = [], isLoading } = useQuery<PublicEvent[]>(
    ['public-events', searchTerm],
    () => publicCmsService.getEvents({ search: searchTerm || undefined }),
    { retry: 1, staleTime: 5 * 60 * 1000 }
  );

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
    <div className="public-page-content">
      <div className="public-container">
        <div className="public-page-header">
          <h1 className="public-page-title">Events</h1>
          <div className="public-search-box">
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="loading">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="no-results">
            <p>No events found.</p>
          </div>
        ) : (
          <div className="public-events-grid">
            {events.map((event) => (
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
                    <p className="public-event-time">
                      <i className="fas fa-clock"></i> {formatDate(event.event_start_date)}
                      {event.event_end_date && ` - ${formatDate(event.event_end_date)}`}
                    </p>
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
        )}
      </div>
    </div>
  );
};

export default EventsList;

