import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { photosAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import './Photos.css';

const Photos = () => {
  const { t } = useTranslation();
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

  useEffect(() => {
    const fetchGalleries = async () => {
      try {
        const response = await photosAPI.getAllGalleries(language);
        setGalleries(response.data);
      } catch (error) {
        console.error('Error fetching galleries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleries();
  }, [language]);

  if (loading) return <div>Loading...</div>;

  const categorizedGalleries = galleries.reduce((acc, gallery) => {
    const category = gallery.gallery_category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(gallery);
    return acc;
  }, {});

  return (
    <div className="photos-page">
      <h2>Photos</h2>
      <p className="photos-intro">{t('photos.main')}</p>

      {Object.entries(categorizedGalleries).map(([category, items]) => (
        <div key={category} className="photo-category">
          <h3>{category}</h3>
          <div className="galleries-grid">
            {items.map((gallery) => (
              <Link
                key={gallery.gallery_name}
                to={`/photos/${encodeURIComponent(gallery.gallery_name)}`}
                className="gallery-card"
              >
                <h4>{gallery.gallery_name}</h4>
                {gallery.gallery_description && (
                  <p>{gallery.gallery_description}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Photos;
