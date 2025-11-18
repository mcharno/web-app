import { jest } from '@jest/globals';
import { getAllGalleries, getPhotosByGallery, getPhotoById } from '../../controllers/photoController.js';

// Mock the database pool
const mockQuery = jest.fn();
jest.unstable_mockModule('../../config/database.js', () => ({
  default: {
    query: mockQuery
  }
}));

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
    it('should return all distinct galleries', async () => {
      const mockGalleries = [
        { gallery_name: 'Vacation', gallery_category: 'places', gallery_description: 'Holiday photos' },
        { gallery_name: 'Events', gallery_category: 'events', gallery_description: 'Event photos' }
      ];

      mockQuery.mockResolvedValue({ rows: mockGalleries });

      await getAllGalleries(req, res);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT DISTINCT gallery_name, gallery_category, gallery_description FROM photos WHERE language = $1 ORDER BY gallery_name',
        ['en']
      );
      expect(res.json).toHaveBeenCalledWith(mockGalleries);
    });

    it('should return galleries for specified language', async () => {
      req.query = { language: 'gr' };
      const mockGalleries = [
        { gallery_name: 'Διακοπές', gallery_category: 'places', gallery_description: 'Φωτογραφίες' }
      ];

      mockQuery.mockResolvedValue({ rows: mockGalleries });

      await getAllGalleries(req, res);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT DISTINCT gallery_name, gallery_category, gallery_description FROM photos WHERE language = $1 ORDER BY gallery_name',
        ['gr']
      );
      expect(res.json).toHaveBeenCalledWith(mockGalleries);
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getAllGalleries(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getPhotosByGallery', () => {
    it('should return photos for specified gallery', async () => {
      req.params = { name: 'Vacation' };
      const mockPhotos = [
        { id: 1, gallery_name: 'Vacation', filename: 'photo1.jpg', display_order: 1 },
        { id: 2, gallery_name: 'Vacation', filename: 'photo2.jpg', display_order: 2 }
      ];

      mockQuery.mockResolvedValue({ rows: mockPhotos });

      await getPhotosByGallery(req, res);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM photos WHERE gallery_name = $1 AND language = $2 ORDER BY display_order',
        ['Vacation', 'en']
      );
      expect(res.json).toHaveBeenCalledWith(mockPhotos);
    });

    it('should return photos for specified language', async () => {
      req.params = { name: 'Vacation' };
      req.query = { language: 'gr' };
      const mockPhotos = [
        { id: 3, gallery_name: 'Vacation', filename: 'photo3.jpg' }
      ];

      mockQuery.mockResolvedValue({ rows: mockPhotos });

      await getPhotosByGallery(req, res);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM photos WHERE gallery_name = $1 AND language = $2 ORDER BY display_order',
        ['Vacation', 'gr']
      );
      expect(res.json).toHaveBeenCalledWith(mockPhotos);
    });

    it('should return empty array when no photos found', async () => {
      req.params = { name: 'NonExistent' };
      mockQuery.mockResolvedValue({ rows: [] });

      await getPhotosByGallery(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should return 500 on database error', async () => {
      req.params = { name: 'Vacation' };
      mockQuery.mockRejectedValue(new Error('Database error'));

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
      req.params = { id: '1' };
      const mockPhoto = {
        id: 1,
        gallery_name: 'Vacation',
        filename: 'photo1.jpg',
        caption: 'Beautiful sunset'
      };

      mockQuery.mockResolvedValue({ rows: [mockPhoto] });

      await getPhotoById(req, res);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM photos WHERE id = $1',
        ['1']
      );
      expect(res.json).toHaveBeenCalledWith(mockPhoto);
    });

    it('should return 404 when photo not found', async () => {
      req.params = { id: '999' };
      mockQuery.mockResolvedValue({ rows: [] });

      await getPhotoById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Photo not found' });
    });

    it('should return 500 on database error', async () => {
      req.params = { id: '1' };
      mockQuery.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getPhotoById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
