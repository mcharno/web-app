import { jest } from '@jest/globals';
import { getAllPapers, getPaperById } from '../../controllers/paperController.js';

// Mock the database pool
const mockQuery = jest.fn();
jest.unstable_mockModule('../../config/database.js', () => ({
  default: {
    query: mockQuery
  }
}));

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
    it('should return all papers ordered by year descending', async () => {
      const mockPapers = [
        { id: 1, language: 'en', title: 'Paper 2023', year: 2023 },
        { id: 2, language: 'en', title: 'Paper 2022', year: 2022 }
      ];

      mockQuery.mockResolvedValue({ rows: mockPapers });

      await getAllPapers(req, res);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM papers WHERE language = $1 ORDER BY year DESC',
        ['en']
      );
      expect(res.json).toHaveBeenCalledWith(mockPapers);
    });

    it('should return papers for specified language', async () => {
      req.query = { language: 'gr' };
      const mockPapers = [
        { id: 3, language: 'gr', title: 'Έγγραφο', year: 2023 }
      ];

      mockQuery.mockResolvedValue({ rows: mockPapers });

      await getAllPapers(req, res);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM papers WHERE language = $1 ORDER BY year DESC',
        ['gr']
      );
      expect(res.json).toHaveBeenCalledWith(mockPapers);
    });

    it('should return empty array when no papers found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await getAllPapers(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getAllPapers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getPaperById', () => {
    it('should return paper by id for default language', async () => {
      req.params = { id: '1' };
      const mockPaper = {
        id: 1,
        language: 'en',
        title: 'Research Paper',
        abstract: 'Abstract text',
        year: 2023
      };

      mockQuery.mockResolvedValue({ rows: [mockPaper] });

      await getPaperById(req, res);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM papers WHERE id = $1 AND language = $2',
        ['1', 'en']
      );
      expect(res.json).toHaveBeenCalledWith(mockPaper);
    });

    it('should return paper for specified language', async () => {
      req.params = { id: '1' };
      req.query = { language: 'gr' };
      const mockPaper = {
        id: 1,
        language: 'gr',
        title: 'Έρευνα'
      };

      mockQuery.mockResolvedValue({ rows: [mockPaper] });

      await getPaperById(req, res);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM papers WHERE id = $1 AND language = $2',
        ['1', 'gr']
      );
      expect(res.json).toHaveBeenCalledWith(mockPaper);
    });

    it('should return 404 when paper not found', async () => {
      req.params = { id: '999' };
      mockQuery.mockResolvedValue({ rows: [] });

      await getPaperById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Paper not found' });
    });

    it('should return 500 on database error', async () => {
      req.params = { id: '1' };
      mockQuery.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getPaperById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
