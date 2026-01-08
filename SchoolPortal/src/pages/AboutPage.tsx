import React, { useState, useEffect } from 'react';
import { websiteService } from '../services/api';
import './AboutPage.css';

const AboutPage: React.FC = () => {
  const [missionVision, setMissionVision] = useState<{ mission_content: string; vision_content: string } | null>(null);
  const [counters, setCounters] = useState<any[]>([]);
  const [history, setHistory] = useState<{ history_content: string; history_image?: string | null } | null>(null);
  const [values, setValues] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [leadership, setLeadership] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [mvData, countersData, historyData, valuesData, achievementsData, leadershipData] = await Promise.all([
          websiteService.getMissionVision(),
          websiteService.getCounters(),
          websiteService.getHistory(),
          websiteService.getValues(),
          websiteService.getAchievements(),
          websiteService.getLeadership(),
        ]);
        setMissionVision(mvData);
        setCounters(countersData);
        setHistory(historyData);
        setValues(valuesData);
        setAchievements(achievementsData);
        setLeadership(leadershipData);
      } catch (error) {
        console.error('Error fetching About Us data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getImageUrl = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    return `${apiBase.replace('/api/v1', '')}${path.startsWith('/') ? path : `/${path}`}`;
  };

  if (loading) {
    return <div className="loading-full-page">Loading About Us content...</div>;
  }

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="container">
          <div className="hero-content">
            <h1>About Our School</h1>
            <p className="hero-subtitle">A School with a Difference - Excellence in Education, Character, and Community</p>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="mission-vision-section">
        <div className="container">
          <div className="mission-vision-grid">
            <div className="mission-card">
              <div className="card-icon">
                <i className="fas fa-bullseye"></i>
              </div>
              <h2>Our Mission</h2>
              <p>{missionVision?.mission_content || 'Mission content will be displayed here.'}</p>
            </div>
            <div className="vision-card">
              <div className="card-icon">
                <i className="fas fa-eye"></i>
              </div>
              <h2>Our Vision</h2>
              <p>{missionVision?.vision_content || 'Vision content will be displayed here.'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {counters.length > 0 ? (
              counters.map((counter, index) => (
                <div key={counter.id} className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="stat-number">{counter.counter_number}</div>
                  <div className="stat-label">{counter.counter_label}</div>
                </div>
              ))
            ) : (
              <div className="empty-state">No counters configured yet.</div>
            )}
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="history-section">
        <div className="container">
          <div className="section-header">
            <h2>Our History</h2>
            <p className="section-subtitle">A Journey of Excellence and Growth</p>
          </div>
          <div className="history-content">
            {history?.history_image && (
              <div className="history-image">
                <img src={getImageUrl(history.history_image)} alt="School History" />
              </div>
            )}
            <div className="history-text">
              {history?.history_content ? (
                <div dangerouslySetInnerHTML={{ __html: history.history_content.replace(/\n/g, '<br />') }} />
              ) : (
                <p>History content will be displayed here.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="values-section">
        <div className="container">
          <div className="section-header">
            <h2>Our Core Values</h2>
            <p className="section-subtitle">The Principles That Guide Us</p>
          </div>
          <div className="values-grid">
            {values.length > 0 ? (
              values.map((value, index) => (
                <div key={value.id} className="value-card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="value-icon">
                    <i className={value.icon_class}></i>
                  </div>
                  <h3>{value.title}</h3>
                  <p>{value.description}</p>
                </div>
              ))
            ) : (
              <div className="empty-state">No core values configured yet.</div>
            )}
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="achievements-section">
        <div className="container">
          <div className="section-header">
            <h2>Our Achievements</h2>
            <p className="section-subtitle">Milestones in Our Journey</p>
          </div>
          <div className="achievements-timeline">
            {achievements.length > 0 ? (
              achievements.map((achievement, index) => (
                <div key={achievement.id} className="timeline-item" style={{ animationDelay: `${index * 0.15}s` }}>
                  <div className="timeline-year">{achievement.achievement_year}</div>
                  <div className="timeline-content">
                    <h3>{achievement.achievement_title}</h3>
                    <p>{achievement.achievement_description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No achievements configured yet.</div>
            )}
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="leadership-section">
        <div className="container">
          <div className="section-header">
            <h2>Our Leadership</h2>
            <p className="section-subtitle">Dedicated to Excellence</p>
          </div>
          <div className="leadership-grid">
            {leadership.length > 0 ? (
              leadership.map((leader) => (
                <div key={leader.id} className="leader-card">
                  {leader.leader_image && (
                    <div className="leader-image">
                      <img src={getImageUrl(leader.leader_image)} alt={leader.leader_name} />
                    </div>
                  )}
                  <h3>{leader.leader_name}</h3>
                  <p className="leader-role">{leader.leader_role}</p>
                  <p className="leader-bio">{leader.leader_bio}</p>
                </div>
              ))
            ) : (
              <div className="empty-state">No leadership information configured yet.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
