import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './PhotoMap.css';

const PhotoMap = ({ photos, onPhotoClick }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', // Light monotone style
      center: [0, 20], // Center of the world
      zoom: 1.5,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl({
      showCompass: false
    }), 'top-right');

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !map.current || !photos || photos.length === 0) return;

    // Convert photos to GeoJSON features
    const features = photos
      .filter(photo => photo.latitude && photo.longitude)
      .map(photo => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [photo.longitude, photo.latitude],
        },
        properties: {
          id: photo.id,
          caption: photo.caption || 'Untitled',
          location: photo.location || '',
          gallery_name: photo.gallery_name || '',
          filename: photo.filename || '',
        },
      }));

    if (features.length === 0) return;

    // Add source
    if (map.current.getSource('photos')) {
      map.current.getSource('photos').setData({
        type: 'FeatureCollection',
        features: features,
      });
    } else {
      map.current.addSource('photos', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: features,
        },
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50, // Radius of each cluster when clustering points
      });

      // Add cluster circles layer
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'photos',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#E4EC18', // Yellow for small clusters
            10,
            '#f1f075', // Lighter yellow for medium clusters
            30,
            '#f28cb1', // Pink for large clusters
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20, // Small clusters
            10,
            30, // Medium clusters
            30,
            40, // Large clusters
          ],
        },
      });

      // Add cluster count labels
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'photos',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#000000',
        },
      });

      // Add unclustered point layer
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'photos',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#E4EC18',
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      // Click handler for clusters
      map.current.on('click', 'clusters', (e) => {
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ['clusters'],
        });
        const clusterId = features[0].properties.cluster_id;
        map.current.getSource('photos').getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;

          map.current.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom,
          });
        });
      });

      // Click handler for individual photos
      map.current.on('click', 'unclustered-point', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const { caption, location, gallery_name } = e.features[0].properties;

        // Create popup
        new maplibregl.Popup()
          .setLngLat(coordinates)
          .setHTML(
            `<div class="photo-popup">
              <h4>${caption}</h4>
              <p class="popup-location">${location}</p>
              <p class="popup-gallery">${gallery_name}</p>
            </div>`
          )
          .addTo(map.current);

        // Call onPhotoClick if provided
        if (onPhotoClick) {
          onPhotoClick(e.features[0].properties.id);
        }
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'clusters', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'clusters', () => {
        map.current.getCanvas().style.cursor = '';
      });
      map.current.on('mouseenter', 'unclustered-point', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'unclustered-point', () => {
        map.current.getCanvas().style.cursor = '';
      });
    }

    // Fit map to show all photos
    if (features.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      features.forEach(feature => {
        bounds.extend(feature.geometry.coordinates);
      });
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12,
      });
    }
  }, [mapLoaded, photos, onPhotoClick]);

  return (
    <div className="photo-map-container">
      <div ref={mapContainer} className="map-container" />
    </div>
  );
};

export default PhotoMap;
