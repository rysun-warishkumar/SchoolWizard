import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { publicCmsService, PublicNews } from '../../services/api/publicCmsService';
import './PublicPages.css';

const NewsDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: news, isLoading, error } = useQuery<PublicNews>(
    ['public-news-detail', slug],
    () => slug ? publicCmsService.getNewsBySlug(slug) : Promise.reject('No slug provided'),
    { retry: 1, staleTime: 5 * 60 * 1000 }
  );

  // Update document title - MUST be called before any conditional returns
  useEffect(() => {
    if (news) {
      document.title = news.meta_title || news.news_title;
    }
  }, [news]);

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
    console.error('News loading error:', error);
    return (
      <div className="public-page-content">
        <div className="public-container">
          <div className="error-message">
            <h2>News Not Found</h2>
            <p>The news article you are looking for does not exist.</p>
            <Link to="/news">← Back to News</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="public-page-content">
        <div className="public-container">
          <div className="error-message">
            <h2>News Not Found</h2>
            <p>The news article you are looking for does not exist.</p>
            <Link to="/news">← Back to News</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-page-content">
      <div className="public-container">
        <Link to="/news" className="public-back-link">← Back to News</Link>
        <article className="public-news-detail">
          <div className="public-page-header">
            {news.featured_image && (
              <div className="public-page-featured-image">
                <img src={getImageUrl(news.featured_image)} alt={news.news_title} />
              </div>
            )}
            <time className="public-news-date">{formatDate(news.news_date)}</time>
            <h1 className="public-page-title">{news.news_title}</h1>
          </div>
          <div
            className="public-page-body"
            dangerouslySetInnerHTML={{ __html: news.description || '' }}
          />
        </article>
      </div>
    </div>
  );
};

export default NewsDetail;

