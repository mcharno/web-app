import { jest } from '@jest/globals';
import { getAllProjects, getProjectById } from '../../controllers/projectController.js';

// Mock the database pool
const mockQuery = jest.fn();
jest.unstable_mockModule('../../config/database.js', () => ({
  default: {
    query: mockQuery
  }
}));

describe('Project Controller', () => {
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

  describe('getAllProjects', () => {
    it('should return all projects for default language (en)', async () => {
      const mockProjects = [
        { id: 1, language: 'en', title: 'Project 1', display_order: 1 },
        { id: 2, language: 'en', title: 'Project 2', display_order: 2 }
      ];

      mockQuery.mockResolvedValue({ rows: mockProjects });

      await getAllProjects(req, res);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM projects WHERE language = $1 ORDER BY display_order',
        ['en']
      );
      expect(res.json).toHaveBeenCalledWith(mockProjects);
    });

    it('should return projects for specified language', async () => {
      req.query = { language: 'gr' };
      const mockProjects = [
        { id: 3, language: 'gr', title: 'Έργο 1', display_order: 1 }
      ];

      mockQuery.mockResolvedValue({ rows: mockProjects });

      await getAllProjects(req, res);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM projects WHERE language = $1 ORDER BY display_order',
        ['gr']
      );
      expect(res.json).toHaveBeenCalledWith(mockProjects);
    });

    it('should return empty array when no projects found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await getAllProjects(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getAllProjects(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getProjectById', () => {
    it('should return project by id for default language', async () => {
      req.params = { id: '1' };
      const mockProject = {
        id: 1,
        language: 'en',
        title: 'Project 1',
        description: 'Description'
      };

      mockQuery.mockResolvedValue({ rows: [mockProject] });

      await getProjectById(req, res);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM projects WHERE id = $1 AND language = $2',
        ['1', 'en']
      );
      expect(res.json).toHaveBeenCalledWith(mockProject);
    });

    it('should return project for specified language', async () => {
      req.params = { id: '1' };
      req.query = { language: 'gr' };
      const mockProject = {
        id: 1,
        language: 'gr',
        title: 'Έργο 1'
      };

      mockQuery.mockResolvedValue({ rows: [mockProject] });

      await getProjectById(req, res);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM projects WHERE id = $1 AND language = $2',
        ['1', 'gr']
      );
      expect(res.json).toHaveBeenCalledWith(mockProject);
    });

    it('should return 404 when project not found', async () => {
      req.params = { id: '999' };
      mockQuery.mockResolvedValue({ rows: [] });

      await getProjectById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Project not found' });
    });

    it('should return 500 on database error', async () => {
      req.params = { id: '1' };
      mockQuery.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getProjectById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
