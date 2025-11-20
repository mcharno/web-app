import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './PhotoInfoPanel.css';

const PhotoInfoPanel = ({ photo, isOpen }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (!isOpen || !photo || !photo.latitude || !photo.longitude || !mapContainer.current) {
      return;
    }

    // Clean up previous map if it exists
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [photo.longitude, photo.latitude],
      zoom: 12,
    });

    // Add marker
    new maplibregl.Marker({ color: '#E4EC18' })
      .setLngLat([photo.longitude, photo.latitude])
      .addTo(map.current);

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isOpen, photo]);

  if (!isOpen) return null;

  return (
    <div className="photo-info-panel">
      <div className="info-panel-content">
        <h3 className="info-panel-title">Photo Information</h3>

        <div className="info-section">
          <h4>Caption</h4>
          <p>{photo.title || 'Untitled'}</p>
        </div>

        {photo.location && (
          <div className="info-section">
            <h4>📍 Location</h4>
            <p>{photo.location}</p>
          </div>
        )}

        {photo.taken_date && (
          <div className="info-section">
            <h4>📅 Date Taken</h4>
            <p>{new Date(photo.taken_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>
        )}

        {photo.latitude && photo.longitude && (
          <>
            <div className="info-section">
              <h4>🌍 Coordinates</h4>
              <p>
                Latitude: {photo.latitude.toFixed(6)}°<br />
                Longitude: {photo.longitude.toFixed(6)}°
              </p>
            </div>

            <div className="info-section map-section">
              <h4>Map</h4>
              <div ref={mapContainer} className="info-map-container" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PhotoInfoPanel;
