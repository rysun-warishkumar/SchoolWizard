import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { websiteService } from '../services/api';
import './NewsPage.css';

const NewsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newsArticles, setNewsArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'all', name: 'All News' },
    { id: 'academic', name: 'Academic' },
    { id: 'sports', name: 'Sports' },
    { id: 'events', name: 'Events' },
    { id: 'achievements', name: 'Achievements' },
  ];

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const articles = await websiteService.getNewsArticles();
        setNewsArticles(articles);
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const getImageUrl = (path?: string | null) => {
    if (!path) return 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600';
    if (path.startsWith('http')) return path;
    const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    return `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const dummyNewsArticles = [
    {
      id: 1,
      category: 'academic',
      title: 'Annual Science Fair 2024 - A Grand Success',
      excerpt: 'Students showcased innovative projects and experiments at our annual science fair, demonstrating creativity and scientific thinking.',
      image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600',
      date: 'December 15, 2024',
      author: 'School Admin',
    },
    {
      id: 2,
      category: 'sports',
      title: 'Basketball Team Wins Regional Championship',
      excerpt: 'Our school basketball team emerged victorious in the regional championship, bringing home the trophy and pride to our institution.',
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600',
      date: 'December 10, 2024',
      author: 'Sports Department',
    },
    {
      id: 3,
      category: 'events',
      title: 'Annual Day Celebration - A Night to Remember',
      excerpt: 'The annual day celebration featured spectacular performances by students, showcasing their talents in music, dance, and drama.',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600',
      date: 'December 5, 2024',
      author: 'Event Committee',
    },
    {
      id: 4,
      category: 'achievements',
      title: 'Students Excel in National Math Olympiad',
      excerpt: 'Five of our students secured top positions in the National Math Olympiad, bringing recognition to our school.',
      image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600',
      date: 'November 28, 2024',
      author: 'Academic Department',
    },
    {
      id: 5,
      category: 'academic',
      title: 'New Computer Lab Inaugurated',
      excerpt: 'State-of-the-art computer lab with latest technology inaugurated to enhance digital learning experience for students.',
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600',
      date: 'November 20, 2024',
      author: 'School Admin',
    },
    {
      id: 6,
      category: 'sports',
      title: 'Inter-School Cricket Tournament Results',
      excerpt: 'Our cricket team performed exceptionally well in the inter-school tournament, reaching the semi-finals.',
      image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600',
      date: 'November 15, 2024',
      author: 'Sports Department',
    },
  ];

  const filteredNews = selectedCategory === 'all'
    ? newsArticles
    : newsArticles.filter(article => article.category === selectedCategory);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="news-page">
      {/* Hero Section */}
      <section className="news-hero">
        <div className="container">
          <div className="hero-content">
            <h1>News & Updates</h1>
            <p className="hero-subtitle">Stay informed about the latest happenings at our school</p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="filter-section">
        <div className="container">
          <div className="category-filters">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`filter-btn ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* News Grid */}
      <section className="news-section">
        <div className="container">
          {loading ? (
            <div className="no-results">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading news articles...</p>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="no-results">
              <i className="fas fa-newspaper"></i>
              <p>No news articles found in this category.</p>
            </div>
          ) : (
            <div className="news-grid">
              {filteredNews.map((article, index) => (
                <article
                  key={article.id}
                  className="news-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="news-image">
                    <img src={getImageUrl(article.featured_image)} alt={article.title} />
                    <div className="news-category-badge">{article.category}</div>
                  </div>
                  <div className="news-content">
                    <div className="news-meta">
                      <span className="news-date">
                        <i className="fas fa-calendar"></i>
                        {formatDate(article.published_date)}
                      </span>
                      {article.author && (
                        <span className="news-author">
                          <i className="fas fa-user"></i>
                          {article.author}
                        </span>
                      )}
                    </div>
                    <h2 className="news-title">{article.title}</h2>
                    <p className="news-excerpt">{article.excerpt || article.content?.substring(0, 150) + '...'}</p>
                    <Link to={`/news/${article.slug || article.id}`} className="read-more-link">
                      Read More <i className="fas fa-arrow-right"></i>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default NewsPage;
