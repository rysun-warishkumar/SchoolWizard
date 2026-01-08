import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { publicCmsService, PublicGallery } from '../../services/api/publicCmsService';
import './PublicPages.css';

const GalleryList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: galleries = [], isLoading } = useQuery<PublicGallery[]>(
    ['public-galleries', searchTerm],
    () => publicCmsService.getGalleries({ search: searchTerm || undefined }),
    { retry: 1, staleTime: 5 * 60 * 1000 }
  );

  const getImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const apiBase = (import.meta as any).env?.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    return `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
  };

  return (
    <div className="public-page-content">
      <div className="public-container">
        <div className="public-page-header">
          <h1 className="public-page-title">Gallery</h1>
          <div className="public-search-box">
            <input
              type="text"
              placeholder="Search galleries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="loading">Loading galleries...</div>
        ) : galleries.length === 0 ? (
          <div className="no-results">
            <p>No galleries found.</p>
          </div>
        ) : (
          <div className="public-gallery-grid">
            {galleries.map((gallery) => (
              <Link key={gallery.id} to={`/gallery/${gallery.slug}`} className="public-gallery-card">
                {gallery.featured_image ? (
                  <div className="public-gallery-image">
                    <img src={getImageUrl(gallery.featured_image)} alt={gallery.gallery_title} />
                  </div>
                ) : gallery.images && gallery.images.length > 0 ? (
                  <div className="public-gallery-image">
                    <img src={getImageUrl(gallery.images[0].image_path)} alt={gallery.gallery_title} />
                  </div>
                ) : null}
                <div className="public-gallery-content">
                  <h3>{gallery.gallery_title}</h3>
                  {gallery.description && (
                    <p className="public-gallery-excerpt">
                      {gallery.description.length > 100
                        ? `${gallery.description.substring(0, 100)}...`
                        : gallery.description}
                    </p>
                  )}
                  {gallery.images && gallery.images.length > 0 && (
                    <p className="public-gallery-count">
                      {gallery.images.length} {gallery.images.length === 1 ? 'photo' : 'photos'}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryList;

