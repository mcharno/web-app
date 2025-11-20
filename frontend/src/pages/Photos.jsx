import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { photosAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import PhotoMap from '../components/PhotoMap';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import './Photos.css';

const Photos = () => {
  const { t } = useTranslation();
  const [galleries, setGalleries] = useState([]);
  const [allPhotos, setAllPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('galleries');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState(null);
  const { language } = useLanguage();

  const handlePhotoClick = (photoId) => {
    setSelectedPhotoId(photoId);
    setLightboxOpen(true);
  };

  const selectedPhoto = allPhotos.find(p => p.id === selectedPhotoId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [galleriesResponse, photosResponse] = await Promise.all([
          photosAPI.getAllGalleries(language),
          photosAPI.getAll(language),
        ]);
        setGalleries(galleriesResponse.data);
        setAllPhotos(photosResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [language]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="photos-page">
      <h2>Photos</h2>
      <p className="photos-intro">{t('photos.main')}</p>

      <div className="photos-tabs">
        <button
          className={`tab-button ${activeTab === 'galleries' ? 'active' : ''}`}
          onClick={() => setActiveTab('galleries')}
        >
          Galleries
        </button>
        <button
          className={`tab-button ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          Map
        </button>
      </div>

      {activeTab === 'galleries' && (
        <div className="galleries-grid">
          {galleries.map((gallery) => (
            <Link
              key={gallery.gallery_name}
              to={`/photos/${encodeURIComponent(gallery.gallery_name)}`}
              className="gallery-card"
            >
              <h4>{gallery.gallery_name}</h4>
              {gallery.gallery_description && (
                <p className="gallery-description">{gallery.gallery_description}</p>
              )}
              {gallery.gallery_tags && gallery.gallery_tags.length > 0 && (
                <div className="gallery-tags">
                  {gallery.gallery_tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {activeTab === 'map' && (
        <div className="map-view">
          <PhotoMap photos={allPhotos} onPhotoClick={handlePhotoClick} />
        </div>
      )}

      {selectedPhoto && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={[{
            src: `/images/photos/${selectedPhoto.filename}`,
            alt: selectedPhoto.caption || selectedPhoto.filename,
          }]}
          plugins={[Zoom]}
          zoom={{
            maxZoomPixelRatio: 3,
            scrollToZoom: true
          }}
          animation={{ fade: 250 }}
          controller={{ closeOnBackdropClick: true }}
          carousel={{ finite: true }}
          render={{
            buttonPrev: () => null,
            buttonNext: () => null,
          }}
        />
      )}
    </div>
  );
};

export default Photos;
