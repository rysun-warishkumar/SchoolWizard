import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { publicCmsService, PublicGallery } from '../../services/api/publicCmsService';
import './PublicPages.css';

const GalleryDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { data: gallery, isLoading, error } = useQuery<PublicGallery>(
    ['public-gallery-detail', slug],
    () => slug ? publicCmsService.getGalleryBySlug(slug) : Promise.reject('No slug provided'),
    { retry: 1, staleTime: 5 * 60 * 1000 }
  );

  // Update document title - MUST be called before any conditional returns
  useEffect(() => {
    if (gallery) {
      document.title = gallery.meta_title || gallery.gallery_title;
    }
  }, [gallery]);

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
    console.error('Gallery loading error:', error);
    return (
      <div className="public-page-content">
        <div className="public-container">
          <div className="error-message">
            <h2>Gallery Not Found</h2>
            <p>The gallery you are looking for does not exist.</p>
            <Link to="/gallery">← Back to Gallery</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="public-page-content">
        <div className="public-container">
          <div className="error-message">
            <h2>Gallery Not Found</h2>
            <p>The gallery you are looking for does not exist.</p>
            <Link to="/gallery">← Back to Gallery</Link>
          </div>
        </div>
      </div>
    );
  }

  const images = gallery.images || [];

  return (
    <div className="public-page-content">
      <div className="public-container">
        <Link to="/gallery" className="public-back-link">← Back to Gallery</Link>
        <article className="public-gallery-detail">
          <div className="public-page-header">
            <h1 className="public-page-title">{gallery.gallery_title}</h1>
            {gallery.description && (
              <div
                className="public-gallery-description"
                dangerouslySetInnerHTML={{ __html: gallery.description }}
              />
            )}
          </div>

          {images.length > 0 ? (
            <>
              {/* Main Image Viewer */}
              <div className="public-gallery-viewer">
                <div className="public-gallery-main-image">
                  <img
                    src={getImageUrl(images[selectedImageIndex]?.image_path)}
                    alt={images[selectedImageIndex]?.image_title || gallery.gallery_title}
                  />
                  {images[selectedImageIndex]?.image_title && (
                    <p className="public-gallery-image-title">
                      {images[selectedImageIndex].image_title}
                    </p>
                  )}
                </div>

                {/* Navigation */}
                {images.length > 1 && (
                  <>
                    <button
                      className="public-gallery-nav public-gallery-prev"
                      onClick={() =>
                        setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)
                      }
                      aria-label="Previous image"
                    >
                      ‹
                    </button>
                    <button
                      className="public-gallery-nav public-gallery-next"
                      onClick={() => setSelectedImageIndex((prev) => (prev + 1) % images.length)}
                      aria-label="Next image"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Grid */}
              {images.length > 1 && (
                <div className="public-gallery-thumbnails">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      className={`public-gallery-thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <img src={getImageUrl(image.image_path)} alt={image.image_title || `Image ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="no-results">
              <p>No images in this gallery.</p>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};

export default GalleryDetail;

