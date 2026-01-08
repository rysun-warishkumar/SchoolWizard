import React, { useState, useEffect } from 'react';
import { websiteService } from '../services/api';
import './EventsPage.css';

const EventsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const allEvents = await websiteService.getEvents();
        setEvents(allEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const getImageUrl = (path?: string | null) => {
    if (!path) return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600';
    if (path.startsWith('http')) return path;
    const apiBase = (import.meta as any).env?.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    return `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      year: date.getFullYear(),
      full: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    };
  };

  const formatTime = (timeString?: string | null) => {
    if (!timeString) return '';
    // Handle both "HH:MM:SS" and "HH:MM" formats
    const timeParts = timeString.split(':');
    if (timeParts.length >= 2) {
      const hours = parseInt(timeParts[0]);
      const minutes = timeParts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes} ${ampm}`;
    }
    return timeString;
  };

  // Filter events - use event_date from API response
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
  
  const upcomingEvents = events.filter(event => {
    if (!event.event_date) return false;
    const eventDate = new Date(event.event_date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= today;
  });
  
  const pastEvents = events.filter(event => {
    if (!event.event_date) return false;
    const eventDate = new Date(event.event_date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate < today;
  });

  return (
    <div className="events-page">
      {/* Hero Section */}
      <section className="events-hero">
        <div className="container">
          <div className="hero-content">
            <h1>Events</h1>
            <p className="hero-subtitle">Join us for exciting events and celebrations throughout the year</p>
          </div>
        </div>
      </section>

      {/* View Toggle */}
      <section className="view-toggle-section">
        <div className="container">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <i className="fas fa-th"></i> Grid
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <i className="fas fa-list"></i> List
            </button>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="events-section">
        <div className="container">
          <div className="section-header">
            <h2>Upcoming Events</h2>
            <p className="section-subtitle">Mark your calendar for these exciting events</p>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
              <p>Loading events...</p>
            </div>
          ) : (
            <div className={`events-container ${viewMode}`}>
              {upcomingEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                  <i className="fas fa-calendar-times" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
                  <p>No upcoming events scheduled.</p>
                </div>
              ) : (
                upcomingEvents.map((event, index) => {
                  const dateInfo = formatDate(event.event_date);
                  return (
                    <div
                      key={event.id}
                      className="event-card"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="event-image">
                        <img src={getImageUrl(event.featured_image)} alt={event.title} />
                        <div className="event-date-badge">
                          <span className="date-day">{dateInfo.day}</span>
                          <span className="date-month">{dateInfo.month}</span>
                        </div>
                      </div>
                      <div className="event-content">
                        <div className="event-category">{event.category}</div>
                        <h3 className="event-title">{event.title}</h3>
                        <div className="event-details">
                          <div className="event-detail-item">
                            <i className="fas fa-calendar"></i>
                            <span>{dateInfo.full}</span>
                          </div>
                          {event.event_time && (
                            <div className="event-detail-item">
                              <i className="fas fa-clock"></i>
                              <span>{formatTime(event.event_time)}</span>
                            </div>
                          )}
                          {event.venue && (
                            <div className="event-detail-item">
                              <i className="fas fa-map-marker-alt"></i>
                              <span>{event.venue}</span>
                            </div>
                          )}
                        </div>
                        <p className="event-description">{event.description}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </section>

      {/* Past Events */}
      {!loading && pastEvents.length > 0 && (
        <section className="events-section past-events">
          <div className="container">
            <div className="section-header">
              <h2>Past Events</h2>
              <p className="section-subtitle">A look back at our recent celebrations</p>
            </div>
            <div className={`events-container ${viewMode}`}>
              {pastEvents.map((event, index) => {
                const dateInfo = formatDate(event.event_date);
                return (
                  <div
                    key={event.id}
                    className="event-card past"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="event-image">
                      <img src={getImageUrl(event.featured_image)} alt={event.title} />
                      <div className="event-date-badge">
                        <span className="date-day">{dateInfo.day}</span>
                        <span className="date-month">{dateInfo.month}</span>
                      </div>
                    </div>
                    <div className="event-content">
                      <div className="event-category">{event.category}</div>
                      <h3 className="event-title">{event.title}</h3>
                      <div className="event-details">
                        <div className="event-detail-item">
                          <i className="fas fa-calendar"></i>
                          <span>{dateInfo.full}</span>
                        </div>
                        {event.event_time && (
                          <div className="event-detail-item">
                            <i className="fas fa-clock"></i>
                            <span>{formatTime(event.event_time)}</span>
                          </div>
                        )}
                        {event.venue && (
                          <div className="event-detail-item">
                            <i className="fas fa-map-marker-alt"></i>
                            <span>{event.venue}</span>
                          </div>
                        )}
                      </div>
                      <p className="event-description">{event.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default EventsPage;
