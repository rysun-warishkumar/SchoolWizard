import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { publicCmsService, PublicPage } from '../../services/api/publicCmsService';
import './PublicPages.css';

const PageViewer: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading, error } = useQuery<PublicPage>(
    ['public-page', slug],
    () => slug ? publicCmsService.getPageBySlug(slug) : Promise.reject('No slug provided'),
    { 
      retry: 1, 
      staleTime: 5 * 60 * 1000,
      onError: (err) => {
        console.error('Error loading page:', err);
      }
    }
  );

  // Update document title - MUST be called before any conditional returns
  useEffect(() => {
    if (page) {
      document.title = page.meta_title || page.page_title;
    }
  }, [page]);

  const getImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const apiBase = (import.meta as any).env?.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    return `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
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
    console.error('Page loading error:', error);
    return (
      <div className="public-page-content">
        <div className="public-container">
          <div className="error-message">
            <h2>Page Not Found</h2>
            <p>The page you are looking for does not exist.</p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
              Error: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="public-page-content">
        <div className="public-container">
          <div className="error-message">
            <h2>Page Not Found</h2>
            <p>The page you are looking for does not exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-page-content">
      <div className="public-container">
        <div className="public-page-header">
          {page.featured_image && (
            <div className="public-page-featured-image">
              <img src={getImageUrl(page.featured_image)} alt={page.page_title} />
            </div>
          )}
          <h1 className="public-page-title">{page.page_title}</h1>
        </div>
        <div
          className="public-page-body"
          dangerouslySetInnerHTML={{ __html: page.description || '' }}
        />
      </div>
    </div>
  );
};

export default PageViewer;

