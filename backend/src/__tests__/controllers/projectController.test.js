import { jest } from '@jest/globals';

// Mock the contentLoader module BEFORE importing the controller
const mockLoadJSON = jest.fn();
const mockFindById = jest.fn();

jest.unstable_mockModule('../../utils/contentLoader.js', () => ({
  loadJSON: mockLoadJSON,
  findById: mockFindById
}));

// Import controller AFTER setting up the mock
const { getAllProjects, getProjectById } = await import('../../controllers/projectController.js');

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
    it('should return all projects sorted by display_order', async () => {
      const mockProjects = [
        { id: 'project2', title: 'Project 2', display_order: 2 },
        { id: 'project1', title: 'Project 1', display_order: 1 },
        { id: 'project3', title: 'Project 3', display_order: 3 }
      ];

      mockLoadJSON.mockResolvedValue(mockProjects);

      await getAllProjects(req, res);

      expect(mockLoadJSON).toHaveBeenCalledWith('en', 'projects');
      expect(res.json).toHaveBeenCalledWith([
        { id: 'project1', title: 'Project 1', display_order: 1 },
        { id: 'project2', title: 'Project 2', display_order: 2 },
        { id: 'project3', title: 'Project 3', display_order: 3 }
      ]);
    });

    it('should return projects for specified language', async () => {
      req.query = { language: 'gr' };
      const mockProjects = [
        { id: 'project1', title: 'Έργο 1', display_order: 1 }
      ];

      mockLoadJSON.mockResolvedValue(mockProjects);

      await getAllProjects(req, res);

      expect(mockLoadJSON).toHaveBeenCalledWith('gr', 'projects');
      expect(res.json).toHaveBeenCalledWith(mockProjects);
    });

    it('should handle projects without display_order', async () => {
      const mockProjects = [
        { id: 'project1', title: 'Project 1' },
        { id: 'project2', title: 'Project 2', display_order: 1 }
      ];

      mockLoadJSON.mockResolvedValue(mockProjects);

      await getAllProjects(req, res);

      expect(res.json).toHaveBeenCalledWith([
        { id: 'project1', title: 'Project 1' },
        { id: 'project2', title: 'Project 2', display_order: 1 }
      ]);
    });

    it('should return 500 on error', async () => {
      mockLoadJSON.mockRejectedValue(new Error('File system error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getAllProjects(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getProjectById', () => {
    it('should return project by id', async () => {
      req.params = { id: 'my-project' };
      const mockProject = {
        id: 'my-project',
        title: 'My Project',
        description: 'Description'
      };

      mockFindById.mockResolvedValue(mockProject);

      await getProjectById(req, res);

      expect(mockFindById).toHaveBeenCalledWith('en', 'projects', 'my-project');
      expect(res.json).toHaveBeenCalledWith(mockProject);
    });

    it('should return project for specified language', async () => {
      req.params = { id: 'my-project' };
      req.query = { language: 'gr' };
      const mockProject = {
        id: 'my-project',
        title: 'Το έργο μου',
        language: 'gr'
      };

      mockFindById.mockResolvedValue(mockProject);

      await getProjectById(req, res);

      expect(mockFindById).toHaveBeenCalledWith('gr', 'projects', 'my-project');
      expect(res.json).toHaveBeenCalledWith(mockProject);
    });

    it('should return 404 when project not found', async () => {
      req.params = { id: 'nonexistent' };
      mockFindById.mockResolvedValue(null);

      await getProjectById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Project not found' });
    });

    it('should return 500 on error', async () => {
      req.params = { id: 'my-project' };
      mockFindById.mockRejectedValue(new Error('File system error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getProjectById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
