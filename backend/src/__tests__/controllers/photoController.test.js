import { jest } from '@jest/globals';

// Mock the contentLoader module BEFORE importing the controller
const mockLoadAllGalleries = jest.fn();
const mockLoadGallery = jest.fn();

jest.unstable_mockModule('../../utils/contentLoader.js', () => ({
  loadAllGalleries: mockLoadAllGalleries,
  loadGallery: mockLoadGallery
}));

// Import controller AFTER setting up the mock
const { getAllGalleries, getAllPhotos, getPhotosByGallery, getPhotoById } = await import('../../controllers/photoController.js');

describe('Photo Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      query: {}
    };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getAllGalleries', () => {
    it('should return all galleries', async () => {
      const mockGalleries = [
        { gallery_name: 'gallery1', name: 'Gallery 1' },
        { gallery_name: 'gallery2', name: 'Gallery 2' }
      ];

      mockLoadAllGalleries.mockResolvedValue(mockGalleries);

      await getAllGalleries(req, res);

      expect(mockLoadAllGalleries).toHaveBeenCalledWith('en');
      expect(res.json).toHaveBeenCalledWith(mockGalleries);
    });

    it('should return galleries for specified language', async () => {
      req.query = { language: 'gr' };
      const mockGalleries = [
        { gallery_name: 'gallery1', name: 'Συλλογή 1' }
      ];

      mockLoadAllGalleries.mockResolvedValue(mockGalleries);

      await getAllGalleries(req, res);

      expect(mockLoadAllGalleries).toHaveBeenCalledWith('gr');
      expect(res.json).toHaveBeenCalledWith(mockGalleries);
    });

    it('should return 500 on error', async () => {
      mockLoadAllGalleries.mockRejectedValue(new Error('File system error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getAllGalleries(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getAllPhotos', () => {
    it('should return all photos with coordinates from all galleries', async () => {
      const mockGalleries = [
        { gallery_name: 'gallery1' },
        { gallery_name: 'gallery2' }
      ];

      const mockGallery1 = {
        name: 'Gallery 1',
        category: 'Travel',
        description: 'Travel photos',
        tags: ['travel'],
        photos: [
          { id: 'photo1', latitude: 40.7, longitude: -74.0 },
          { id: 'photo2' } // No coordinates
        ]
      };

      const mockGallery2 = {
        name: 'Gallery 2',
        category: 'Nature',
        description: 'Nature photos',
        tags: ['nature'],
        photos: [
          { id: 'photo3', latitude: 51.5, longitude: -0.1 }
        ]
      };

      mockLoadAllGalleries.mockResolvedValue(mockGalleries);
      mockLoadGallery
        .mockResolvedValueOnce(mockGallery1)
        .mockResolvedValueOnce(mockGallery2);

      await getAllPhotos(req, res);

      expect(mockLoadAllGalleries).toHaveBeenCalledWith('en');
      expect(res.json).toHaveBeenCalledWith([
        {
          id: 'photo1',
          latitude: 40.7,
          longitude: -74.0,
          gallery_name: 'Gallery 1',
          gallery_category: 'Travel',
          gallery_description: 'Travel photos',
          gallery_tags: ['travel'],
          language: 'en'
        },
        {
          id: 'photo3',
          latitude: 51.5,
          longitude: -0.1,
          gallery_name: 'Gallery 2',
          gallery_category: 'Nature',
          gallery_description: 'Nature photos',
          gallery_tags: ['nature'],
          language: 'en'
        }
      ]);
    });

    it('should handle galleries without photos array', async () => {
      const mockGalleries = [
        { gallery_name: 'gallery1' }
      ];

      const mockGallery1 = {
        name: 'Gallery 1',
        // No photos array
      };

      mockLoadAllGalleries.mockResolvedValue(mockGalleries);
      mockLoadGallery.mockResolvedValue(mockGallery1);

      await getAllPhotos(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should return 500 on error', async () => {
      mockLoadAllGalleries.mockRejectedValue(new Error('File system error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getAllPhotos(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getPhotosByGallery', () => {
    it('should return photos from specific gallery', async () => {
      req.params = { name: 'My Gallery' };
      const mockGallery = {
        name: 'My Gallery',
        category: 'Travel',
        description: 'Photos',
        tags: ['travel'],
        photos: [
          { id: 'photo2', display_order: 2 },
          { id: 'photo1', display_order: 1 }
        ]
      };

      mockLoadGallery.mockResolvedValue(mockGallery);

      await getPhotosByGallery(req, res);

      expect(mockLoadGallery).toHaveBeenCalledWith('en', 'my-gallery');
      expect(res.json).toHaveBeenCalledWith([
        {
          id: 'photo1',
          display_order: 1,
          gallery_name: 'My Gallery',
          gallery_category: 'Travel',
          gallery_description: 'Photos',
          gallery_tags: ['travel'],
          language: 'en'
        },
        {
          id: 'photo2',
          display_order: 2,
          gallery_name: 'My Gallery',
          gallery_category: 'Travel',
          gallery_description: 'Photos',
          gallery_tags: ['travel'],
          language: 'en'
        }
      ]);
    });

    it('should return 404 when gallery not found', async () => {
      req.params = { name: 'nonexistent' };
      mockLoadGallery.mockResolvedValue(null);

      await getPhotosByGallery(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Gallery not found' });
    });

    it('should return 404 on not found error', async () => {
      req.params = { name: 'my-gallery' };
      mockLoadGallery.mockRejectedValue(new Error('Gallery not found'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getPhotosByGallery(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Gallery not found' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should return 500 on other errors', async () => {
      req.params = { name: 'my-gallery' };
      mockLoadGallery.mockRejectedValue(new Error('File system error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getPhotosByGallery(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getPhotoById', () => {
    it('should return photo by id', async () => {
      req.params = { id: 'photo1' };
      const mockGalleries = [
        { gallery_name: 'gallery1' }
      ];

      const mockGallery = {
        name: 'Gallery 1',
        category: 'Travel',
        description: 'Photos',
        tags: ['travel'],
        photos: [
          { id: 'photo1', title: 'Photo 1' }
        ]
      };

      mockLoadAllGalleries.mockResolvedValue(mockGalleries);
      mockLoadGallery.mockResolvedValue(mockGallery);

      await getPhotoById(req, res);

      expect(res.json).toHaveBeenCalledWith({
        id: 'photo1',
        title: 'Photo 1',
        gallery_name: 'Gallery 1',
        gallery_category: 'Travel',
        gallery_description: 'Photos',
        gallery_tags: ['travel'],
        language: 'en'
      });
    });

    it('should return 404 when photo not found', async () => {
      req.params = { id: 'nonexistent' };
      const mockGalleries = [
        { gallery_name: 'gallery1' }
      ];

      const mockGallery = {
        name: 'Gallery 1',
        photos: []
      };

      mockLoadAllGalleries.mockResolvedValue(mockGalleries);
      mockLoadGallery.mockResolvedValue(mockGallery);

      await getPhotoById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Photo not found' });
    });

    it('should return 500 on error', async () => {
      req.params = { id: 'photo1' };
      mockLoadAllGalleries.mockRejectedValue(new Error('File system error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getPhotoById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
