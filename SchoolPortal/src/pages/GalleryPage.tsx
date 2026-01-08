import React, { useState, useEffect } from 'react';
import { websiteService } from '../services/api';
import './GalleryPage.css';

const GalleryPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<number>(-1);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [galleryImages, setGalleryImages] = useState<Array<{ id: number; category_id: number; title: string; image_path: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cats, imgs] = await Promise.all([
          websiteService.getGalleryCategories(),
          websiteService.getGalleryImages(),
        ]);
        
        setCategories([{ id: -1, name: 'All' }, ...cats.map((c: any) => ({ id: c.id, name: c.name }))]);
        setGalleryImages(imgs.map((img: any) => ({
          id: img.id,
          category_id: img.category_id,
          title: img.title,
          image_path: img.image_path,
        })));
      } catch (error) {
        console.error('Error fetching gallery data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getImageUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    return `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const filteredImages = selectedCategory === -1
    ? galleryImages
    : galleryImages.filter(img => img.category_id === selectedCategory);

  const openLightbox = (id: number) => {
    setSelectedImage(id);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImage === null) return;
    const currentIndex = filteredImages.findIndex(img => img.id === selectedImage);
    if (direction === 'next') {
      const nextIndex = (currentIndex + 1) % filteredImages.length;
      setSelectedImage(filteredImages[nextIndex].id);
    } else {
      const prevIndex = (currentIndex - 1 + filteredImages.length) % filteredImages.length;
      setSelectedImage(filteredImages[prevIndex].id);
    }
  };

  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (selectedImage !== null) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') {
          const currentIndex = filteredImages.findIndex(img => img.id === selectedImage);
          const prevIndex = (currentIndex - 1 + filteredImages.length) % filteredImages.length;
          setSelectedImage(filteredImages[prevIndex].id);
        }
        if (e.key === 'ArrowRight') {
          const currentIndex = filteredImages.findIndex(img => img.id === selectedImage);
          const nextIndex = (currentIndex + 1) % filteredImages.length;
          setSelectedImage(filteredImages[nextIndex].id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedImage, filteredImages]);

  return (
    <div className="gallery-page">
      {/* Hero Section */}
      <section className="gallery-hero">
        <div className="container">
          <div className="hero-content">
            <h1>Gallery</h1>
            <p className="hero-subtitle">Capturing Moments, Creating Memories</p>
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

      {/* Gallery Grid */}
      <section className="gallery-section">
        <div className="container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              Loading gallery...
            </div>
          ) : filteredImages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              No images found in this category.
            </div>
          ) : (
            <div className="gallery-grid">
              {filteredImages.map((image, index) => (
                <div
                  key={image.id}
                  className="gallery-item"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => openLightbox(image.id)}
                >
                  <div className="gallery-image-wrapper">
                    <img src={getImageUrl(image.image_path)} alt={image.title} />
                    <div className="gallery-overlay">
                      <div className="gallery-info">
                        <h3>{image.title}</h3>
                        <i className="fas fa-search-plus"></i>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {selectedImage !== null && (
        <div className="lightbox" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox} aria-label="Close">
            <i className="fas fa-times"></i>
          </button>
          <button
            className="lightbox-nav prev"
            onClick={(e) => {
              e.stopPropagation();
              navigateImage('prev');
            }}
            aria-label="Previous image"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <button
            className="lightbox-nav next"
            onClick={(e) => {
              e.stopPropagation();
              navigateImage('next');
            }}
            aria-label="Next image"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={getImageUrl(filteredImages.find(img => img.id === selectedImage)?.image_path || '')}
              alt={filteredImages.find(img => img.id === selectedImage)?.title}
            />
            <div className="lightbox-caption">
              {filteredImages.find(img => img.id === selectedImage)?.title}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
