import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { photosAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import Lightbox from 'yet-another-react-lightbox';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import './PhotoGallery.css';

const PhotoGallery = () => {
  const { galleryName } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [photos, setPhotos] = useState([]);
  const [galleryInfo, setGalleryInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchGalleryPhotos = async () => {
      try {
        const response = await photosAPI.getGalleryPhotos(
          decodeURIComponent(galleryName),
          language
        );
        const photoData = response.data;

        if (photoData.length > 0) {
          setGalleryInfo({
            name: photoData[0].gallery_name,
            description: photoData[0].gallery_description,
            tags: photoData[0].gallery_tags
          });
          setPhotos(photoData);
        }
      } catch (error) {
        console.error('Error fetching gallery photos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryPhotos();
  }, [galleryName, language]);

  if (loading) return <div className="loading-state">Loading gallery...</div>;

  if (!photos.length) {
    return (
      <div className="photo-gallery-page">
        <button className="back-to-galleries" onClick={() => navigate('/photos')}>
          ← Back to Galleries
        </button>
        <h2>{decodeURIComponent(galleryName)}</h2>
        <p className="no-photos">No photos found in this gallery.</p>
      </div>
    );
  }

  // Prepare slides for lightbox
  const slides = photos.map((photo) => ({
    src: `/images/photos/${photo.filename}`,
    alt: photo.caption || photo.filename,
    title: photo.caption,
    description: photo.location ? `${photo.location}` : ''
  }));

  return (
    <div className="photo-gallery-page">
      <button className="back-to-galleries" onClick={() => navigate('/photos')}>
        ← Back to Galleries
      </button>

      <div className="gallery-header">
        <h2>{galleryInfo.name}</h2>
        {galleryInfo.description && (
          <p className="gallery-intro">{galleryInfo.description}</p>
        )}
        {galleryInfo.tags && galleryInfo.tags.length > 0 && (
          <div className="gallery-header-tags">
            {galleryInfo.tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="photo-grid">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="photo-thumbnail"
            onClick={() => {
              setCurrentIndex(index);
              setLightboxOpen(true);
            }}
          >
            <img
              src={`/images/photos/${photo.filename}`}
              alt={photo.caption || photo.filename}
              loading="lazy"
            />
            <div className="photo-overlay">
              <p className="photo-caption">{photo.caption}</p>
              {photo.location && (
                <p className="photo-location">{photo.location}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={slides}
        index={currentIndex}
        plugins={[Thumbnails, Zoom]}
        thumbnails={{
          position: 'bottom',
          width: 120,
          height: 80,
          border: 1,
          borderRadius: 0,
          padding: 0,
          gap: 16,
          showToggle: true
        }}
        zoom={{
          maxZoomPixelRatio: 3,
          scrollToZoom: true
        }}
        animation={{ fade: 250 }}
        controller={{ closeOnBackdropClick: true }}
      />
    </div>
  );
};

export default PhotoGallery;
