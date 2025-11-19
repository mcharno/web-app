import { loadAllGalleries, loadGallery } from '../utils/contentLoader.js';

export const getAllGalleries = async (req, res) => {
  try {
    const { language = 'en' } = req.query;
    const galleries = await loadAllGalleries(language);
    res.json(galleries);
  } catch (error) {
    console.error('Error fetching galleries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPhotosByGallery = async (req, res) => {
  try {
    const { name } = req.params;
    const { language = 'en' } = req.query;

    // Convert gallery name to kebab-case for file lookup
    const galleryFileName = name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '');
    const gallery = await loadGallery(language, galleryFileName);

    if (!gallery) {
      return res.status(404).json({ error: 'Gallery not found' });
    }

    // Return photos sorted by display_order
    const sortedPhotos = gallery.photos.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    // Add gallery metadata to each photo for compatibility
    const photosWithMetadata = sortedPhotos.map(photo => ({
      ...photo,
      gallery_name: gallery.name,
      gallery_category: gallery.category,
      gallery_description: gallery.description,
      gallery_tags: gallery.tags,
      language
    }));

    res.json(photosWithMetadata);
  } catch (error) {
    console.error('Error fetching photos:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Gallery not found' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPhotoById = async (req, res) => {
  try {
    const { id } = req.params;
    const { language = 'en' } = req.query;

    // Load all galleries and search for the photo
    const galleries = await loadAllGalleries(language);

    for (const galleryMeta of galleries) {
      const gallery = await loadGallery(language, galleryMeta.gallery_name);
      const photo = gallery.photos.find(p => p.id === id);

      if (photo) {
        return res.json({
          ...photo,
          gallery_name: gallery.name,
          gallery_category: gallery.category,
          gallery_description: gallery.description,
          gallery_tags: gallery.tags,
          language
        });
      }
    }

    res.status(404).json({ error: 'Photo not found' });
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
