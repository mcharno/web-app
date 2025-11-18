import { jest } from '@jest/globals';
import { getContent, getAllContent } from '../../controllers/contentController.js';

// Mock the database pool
const mockQuery = jest.fn();
jest.unstable_mockModule('../../config/database.js', () => ({
  default: {
    query: mockQuery
  }
}));

describe('Content Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {}
    };
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getContent', () => {
    it('should return content for valid language and key', async () => {
      req.params = { language: 'en', key: 'welcome' };
      const mockContent = {
        id: 1,
        language: 'en',
        key: 'welcome',
        value: 'Welcome to the site'
      };

      mockQuery.mockResolvedValue({ rows: [mockContent] });

      await getContent(req, res);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM content WHERE language = $1 AND key = $2',
        ['en', 'welcome']
      );
      expect(res.json).toHaveBeenCalledWith(mockContent);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 404 when content not found', async () => {
      req.params = { language: 'en', key: 'nonexistent' };
      mockQuery.mockResolvedValue({ rows: [] });

      await getContent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Content not found' });
    });

    it('should return 500 on database error', async () => {
      req.params = { language: 'en', key: 'welcome' };
      mockQuery.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getContent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getAllContent', () => {
    it('should return all content as key-value object', async () => {
      req.params = { language: 'en' };
      const mockRows = [
        { id: 1, language: 'en', key: 'welcome', value: 'Welcome' },
        { id: 2, language: 'en', key: 'about', value: 'About Us' },
        { id: 3, language: 'en', key: 'contact', value: 'Contact' }
      ];

      mockQuery.mockResolvedValue({ rows: mockRows });

      await getAllContent(req, res);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM content WHERE language = $1',
        ['en']
      );
      expect(res.json).toHaveBeenCalledWith({
        welcome: 'Welcome',
        about: 'About Us',
        contact: 'Contact'
      });
    });

    it('should return empty object when no content found', async () => {
      req.params = { language: 'es' };
      mockQuery.mockResolvedValue({ rows: [] });

      await getAllContent(req, res);

      expect(res.json).toHaveBeenCalledWith({});
    });

    it('should return 500 on database error', async () => {
      req.params = { language: 'en' };
      mockQuery.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getAllContent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
