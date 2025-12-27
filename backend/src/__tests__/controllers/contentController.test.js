import { jest } from '@jest/globals';

// Mock the contentLoader module BEFORE importing the controller
const mockLoadJSON = jest.fn();
const mockGetContentValue = jest.fn();

jest.unstable_mockModule('../../utils/contentLoader.js', () => ({
  loadJSON: mockLoadJSON,
  getContentValue: mockGetContentValue
}));

// Import controller AFTER setting up the mock
const { getAllContent, getContent } = await import('../../controllers/contentController.js');

describe('Content Controller', () => {
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

  describe('getAllContent', () => {
    it('should return all content for language', async () => {
      req.params = { language: 'en' };
      const mockContent = {
        welcome: 'Welcome',
        about: 'About us'
      };

      mockLoadJSON.mockResolvedValue(mockContent);

      await getAllContent(req, res);

      expect(mockLoadJSON).toHaveBeenCalledWith('en', 'content');
      expect(res.json).toHaveBeenCalledWith(mockContent);
    });

    it('should return content for Greek language', async () => {
      req.params = { language: 'gr' };
      const mockContent = {
        welcome: 'Καλώς ήρθατε',
        about: 'Σχετικά με εμάς'
      };

      mockLoadJSON.mockResolvedValue(mockContent);

      await getAllContent(req, res);

      expect(mockLoadJSON).toHaveBeenCalledWith('gr', 'content');
      expect(res.json).toHaveBeenCalledWith(mockContent);
    });

    it('should return 500 on error', async () => {
      req.params = { language: 'en' };
      mockLoadJSON.mockRejectedValue(new Error('File system error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getAllContent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getContent', () => {
    it('should return content by key', async () => {
      req.params = { language: 'en', key: 'welcome' };
      const mockValue = 'Welcome to our site';

      mockGetContentValue.mockResolvedValue(mockValue);

      await getContent(req, res);

      expect(mockGetContentValue).toHaveBeenCalledWith('en', 'welcome');
      expect(res.json).toHaveBeenCalledWith({
        language: 'en',
        key: 'welcome',
        value: mockValue
      });
    });

    it('should return content for Greek language', async () => {
      req.params = { language: 'gr', key: 'about' };
      const mockValue = 'Σχετικά με εμάς';

      mockGetContentValue.mockResolvedValue(mockValue);

      await getContent(req, res);

      expect(mockGetContentValue).toHaveBeenCalledWith('gr', 'about');
      expect(res.json).toHaveBeenCalledWith({
        language: 'gr',
        key: 'about',
        value: mockValue
      });
    });

    it('should return 404 when content key not found', async () => {
      req.params = { language: 'en', key: 'nonexistent' };
      mockGetContentValue.mockResolvedValue(null);

      await getContent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Content not found' });
    });

    it('should return 500 on error', async () => {
      req.params = { language: 'en', key: 'welcome' };
      mockGetContentValue.mockRejectedValue(new Error('File system error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getContent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
