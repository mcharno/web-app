import { useParams } from 'react-router-dom';
import './PhotoGallery.css';

const PhotoGallery = () => {
  const { galleryName } = useParams();

  return (
    <div className="photo-gallery-page">
      <h2>{galleryName || 'Photo Gallery'}</h2>
      <p className="placeholder-message">
        This is a placeholder for the {galleryName} gallery. Photos will be displayed here.
      </p>
      <div className="placeholder-content">
        <h3>Coming Soon</h3>
        <p>
          Gallery photos and descriptions will be added in a future update.
        </p>
      </div>
    </div>
  );
};

export default PhotoGallery;
