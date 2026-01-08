import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { publicCmsService, PublicNews } from '../../services/api/publicCmsService';
import './PublicPages.css';

const NewsList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: news = [], isLoading } = useQuery<PublicNews[]>(
    ['public-news', searchTerm],
    () => publicCmsService.getNews({ search: searchTerm || undefined }),
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
          <h1 className="public-page-title">News & Announcements</h1>
          <div className="public-search-box">
            <input
              type="text"
              placeholder="Search news..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="loading">Loading news...</div>
        ) : news.length === 0 ? (
          <div className="no-results">
            <p>No news found.</p>
          </div>
        ) : (
          <div className="public-news-grid">
            {news.map((item) => (
              <article key={item.id} className="public-news-card">
                {item.featured_image && (
                  <div className="public-news-image">
                    <img src={getImageUrl(item.featured_image)} alt={item.news_title} />
                  </div>
                )}
                <div className="public-news-content">
                  <time className="public-news-date">{formatDate(item.news_date)}</time>
                  <h3>
                    <Link to={`/news/${item.slug}`}>{item.news_title}</Link>
                  </h3>
                  {item.description && (
                    <p className="public-news-excerpt">
                      {item.description.length > 150
                        ? `${item.description.substring(0, 150)}...`
                        : item.description}
                    </p>
                  )}
                  <Link to={`/news/${item.slug}`} className="public-read-more">
                    Read More →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsList;

