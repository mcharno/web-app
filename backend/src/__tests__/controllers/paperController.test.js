import { jest } from '@jest/globals';

// Mock the contentLoader module BEFORE importing the controller
const mockLoadJSON = jest.fn();
const mockFindById = jest.fn();

jest.unstable_mockModule('../../utils/contentLoader.js', () => ({
  loadJSON: mockLoadJSON,
  findById: mockFindById
}));

// Import controller AFTER setting up the mock
const { getAllPapers, getPaperById } = await import('../../controllers/paperController.js');

describe('Paper Controller', () => {
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

  describe('getAllPapers', () => {
    it('should return all papers sorted by year descending', async () => {
      const mockPapers = [
        { id: 'paper1', title: 'Paper 1', year: 2020 },
        { id: 'paper2', title: 'Paper 2', year: 2022 },
        { id: 'paper3', title: 'Paper 3', year: 2021 }
      ];

      mockLoadJSON.mockResolvedValue(mockPapers);

      await getAllPapers(req, res);

      expect(mockLoadJSON).toHaveBeenCalledWith('en', 'papers');
      expect(res.json).toHaveBeenCalledWith([
        { id: 'paper2', title: 'Paper 2', year: 2022 },
        { id: 'paper3', title: 'Paper 3', year: 2021 },
        { id: 'paper1', title: 'Paper 1', year: 2020 }
      ]);
    });

    it('should return papers for specified language', async () => {
      req.query = { language: 'gr' };
      const mockPapers = [
        { id: 'paper1', title: 'Δημοσίευση 1', year: 2022 }
      ];

      mockLoadJSON.mockResolvedValue(mockPapers);

      await getAllPapers(req, res);

      expect(mockLoadJSON).toHaveBeenCalledWith('gr', 'papers');
      expect(res.json).toHaveBeenCalledWith(mockPapers);
    });

    it('should handle papers without year', async () => {
      const mockPapers = [
        { id: 'paper1', title: 'Paper 1' },
        { id: 'paper2', title: 'Paper 2', year: 2022 }
      ];

      mockLoadJSON.mockResolvedValue(mockPapers);

      await getAllPapers(req, res);

      expect(res.json).toHaveBeenCalledWith([
        { id: 'paper2', title: 'Paper 2', year: 2022 },
        { id: 'paper1', title: 'Paper 1' }
      ]);
    });

    it('should return 500 on error', async () => {
      mockLoadJSON.mockRejectedValue(new Error('File system error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getAllPapers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getPaperById', () => {
    it('should return paper by id', async () => {
      req.params = { id: 'my-paper' };
      const mockPaper = {
        id: 'my-paper',
        title: 'My Paper',
        year: 2022
      };

      mockFindById.mockResolvedValue(mockPaper);

      await getPaperById(req, res);

      expect(mockFindById).toHaveBeenCalledWith('en', 'papers', 'my-paper');
      expect(res.json).toHaveBeenCalledWith(mockPaper);
    });

    it('should return paper for specified language', async () => {
      req.params = { id: 'my-paper' };
      req.query = { language: 'gr' };
      const mockPaper = {
        id: 'my-paper',
        title: 'Η δημοσίευσή μου',
        language: 'gr'
      };

      mockFindById.mockResolvedValue(mockPaper);

      await getPaperById(req, res);

      expect(mockFindById).toHaveBeenCalledWith('gr', 'papers', 'my-paper');
      expect(res.json).toHaveBeenCalledWith(mockPaper);
    });

    it('should return 404 when paper not found', async () => {
      req.params = { id: 'nonexistent' };
      mockFindById.mockResolvedValue(null);

      await getPaperById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Paper not found' });
    });

    it('should return 500 on error', async () => {
      req.params = { id: 'my-paper' };
      mockFindById.mockRejectedValue(new Error('File system error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getPaperById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
