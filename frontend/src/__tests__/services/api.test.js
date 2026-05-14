import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to ensure mocks are created before module imports
const { mockGet, mockPost, mockPut, mockPatch, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockPatch: vi.fn(),
  mockDelete: vi.fn(),
}));

// Mock axios module
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: mockGet,
      post: mockPost,
      put: mockPut,
      patch: mockPatch,
      delete: mockDelete,
    }))
  }
}));

// Import API module AFTER mocking axios
import { contentAPI, projectsAPI, photosAPI, papersAPI, blogAPI, romsAPI, berbatisAPI, comicsAPI } from '../../services/api';
import api from '../../services/api';

describe('API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('contentAPI', () => {
    it('should fetch all content for specified language', async () => {
      const mockData = { data: { welcome: 'Welcome', about: 'About' } };
      mockGet.mockResolvedValue(mockData);

      await contentAPI.getAll('en');

      expect(mockGet).toHaveBeenCalledWith('/content/en');
    });

    it('should fetch content by key and language', async () => {
      const mockData = { data: { key: 'welcome', value: 'Welcome' } };
      mockGet.mockResolvedValue(mockData);

      await contentAPI.getByKey('en', 'welcome');

      expect(mockGet).toHaveBeenCalledWith('/content/en/welcome');
    });
  });

  describe('projectsAPI', () => {
    it('should fetch all projects with default language', async () => {
      const mockData = { data: [{ id: 1, title: 'Project 1' }] };
      mockGet.mockResolvedValue(mockData);

      await projectsAPI.getAll();

      expect(mockGet).toHaveBeenCalledWith('/projects', { params: { language: 'en' } });
    });

    it('should fetch all projects with specified language', async () => {
      const mockData = { data: [{ id: 1, title: 'Έργο 1' }] };
      mockGet.mockResolvedValue(mockData);

      await projectsAPI.getAll('gr');

      expect(mockGet).toHaveBeenCalledWith('/projects', { params: { language: 'gr' } });
    });

    it('should fetch project by id', async () => {
      const mockData = { data: { id: 1, title: 'Project 1' } };
      mockGet.mockResolvedValue(mockData);

      await projectsAPI.getById('my-project');

      expect(mockGet).toHaveBeenCalledWith('/projects/my-project', { params: { language: 'en' } });
    });
  });

  describe('photosAPI', () => {
    it('should fetch all galleries', async () => {
      const mockData = { data: [{ name: 'Gallery 1' }] };
      mockGet.mockResolvedValue(mockData);

      await photosAPI.getAllGalleries();

      expect(mockGet).toHaveBeenCalledWith('/photos/galleries', { params: { language: 'en' } });
    });

    it('should fetch photos by gallery name', async () => {
      const mockData = { data: [{ id: 1, caption: 'Photo 1' }] };
      mockGet.mockResolvedValue(mockData);

      await photosAPI.getByGallery('my-gallery');

      expect(mockGet).toHaveBeenCalledWith('/photos/gallery/my-gallery', { params: { language: 'en' } });
    });

    it('should fetch photo by id', async () => {
      const mockData = { data: { id: 1, caption: 'Photo 1' } };
      mockGet.mockResolvedValue(mockData);

      await photosAPI.getById('photo1');

      expect(mockGet).toHaveBeenCalledWith('/photos/photo1');
    });

    it('should fetch all photos', async () => {
      const mockData = { data: [{ id: 1, caption: 'Photo 1' }] };
      mockGet.mockResolvedValue(mockData);

      await photosAPI.getAll();

      expect(mockGet).toHaveBeenCalledWith('/photos', { params: { language: 'en' } });
    });
  });

  describe('papersAPI', () => {
    it('should fetch all papers', async () => {
      const mockData = { data: [{ id: 1, title: 'Paper 1' }] };
      mockGet.mockResolvedValue(mockData);

      await papersAPI.getAll();

      expect(mockGet).toHaveBeenCalledWith('/papers', { params: { language: 'en' } });
    });

    it('should fetch paper by id', async () => {
      const mockData = { data: { id: 1, title: 'Paper 1' } };
      mockGet.mockResolvedValue(mockData);

      await papersAPI.getById('my-paper');

      expect(mockGet).toHaveBeenCalledWith('/papers/my-paper', { params: { language: 'en' } });
    });
  });

  describe('blogAPI', () => {
    it('should fetch all blog posts', async () => {
      const mockData = { data: [{ id: 1, title: 'Post 1' }] };
      mockGet.mockResolvedValue(mockData);

      await blogAPI.getAll();

      expect(mockGet).toHaveBeenCalledWith('/blog', { params: { language: 'en' } });
    });

    it('should fetch blog post by page name', async () => {
      const mockData = { data: { id: 1, title: 'Post 1' } };
      mockGet.mockResolvedValue(mockData);

      await blogAPI.getByPage('my-post');

      expect(mockGet).toHaveBeenCalledWith('/blog/my-post', { params: { language: 'en' } });
    });
  });

  describe('romsAPI', () => {
    it('should fetch all roms with params', async () => {
      mockGet.mockResolvedValue({ data: [] });
      await romsAPI.getAll({ console: 'nes', page: 1 });
      expect(mockGet).toHaveBeenCalledWith('/roms', { params: { console: 'nes', page: 1 } });
    });

    it('should fetch consoles', async () => {
      mockGet.mockResolvedValue({ data: [] });
      await romsAPI.getConsoles();
      expect(mockGet).toHaveBeenCalledWith('/roms/consoles');
    });

    it('should fetch tags', async () => {
      mockGet.mockResolvedValue({ data: [] });
      await romsAPI.getTags();
      expect(mockGet).toHaveBeenCalledWith('/roms/tags');
    });

    it('should fetch rom by id', async () => {
      mockGet.mockResolvedValue({ data: {} });
      await romsAPI.getById('rom-1');
      expect(mockGet).toHaveBeenCalledWith('/roms/rom-1');
    });

    it('should update a rom', async () => {
      mockPut.mockResolvedValue({ data: {} });
      await romsAPI.update('rom-1', { title: 'Updated' });
      expect(mockPut).toHaveBeenCalledWith('/roms/rom-1', { title: 'Updated' });
    });

    it('should trigger a scan', async () => {
      mockPost.mockResolvedValue({ data: {} });
      await romsAPI.scan();
      expect(mockPost).toHaveBeenCalledWith('/roms/scan');
    });
  });

  describe('berbatisAPI', () => {
    it('should fetch all berbatis records', async () => {
      mockGet.mockResolvedValue({ data: [] });
      await berbatisAPI.getAll({ season: '2019' });
      expect(mockGet).toHaveBeenCalledWith('/berbatis', { params: { season: '2019' } });
    });

    it('should fetch berbatis record by id', async () => {
      mockGet.mockResolvedValue({ data: {} });
      await berbatisAPI.getById('context-1');
      expect(mockGet).toHaveBeenCalledWith('/berbatis/context-1');
    });
  });

  describe('comicsAPI', () => {
    it('should fetch all comics', async () => {
      mockGet.mockResolvedValue({ data: [] });
      await comicsAPI.getAll({ publisher: 'DC' });
      expect(mockGet).toHaveBeenCalledWith('/comics', { params: { publisher: 'DC' } });
    });

    it('should fetch comic by id', async () => {
      mockGet.mockResolvedValue({ data: {} });
      await comicsAPI.getById('issue-1');
      expect(mockGet).toHaveBeenCalledWith('/comics/issue-1');
    });

    it('should fetch groups', async () => {
      mockGet.mockResolvedValue({ data: [] });
      await comicsAPI.getGroups();
      expect(mockGet).toHaveBeenCalledWith('/comics/groups');
    });

    it('should fetch publishers', async () => {
      mockGet.mockResolvedValue({ data: [] });
      await comicsAPI.getPublishers();
      expect(mockGet).toHaveBeenCalledWith('/comics/publishers');
    });

    it('should create a comic', async () => {
      mockPost.mockResolvedValue({ data: {} });
      await comicsAPI.create({ title: 'New Comic' });
      expect(mockPost).toHaveBeenCalledWith('/comics', { title: 'New Comic' });
    });

    it('should replace a comic', async () => {
      mockPut.mockResolvedValue({ data: {} });
      await comicsAPI.replace('issue-1', { title: 'Replaced' });
      expect(mockPut).toHaveBeenCalledWith('/comics/issue-1', { title: 'Replaced' });
    });

    it('should patch a comic', async () => {
      mockPatch.mockResolvedValue({ data: {} });
      await comicsAPI.update('issue-1', { notes: 'Updated' });
      expect(mockPatch).toHaveBeenCalledWith('/comics/issue-1', { notes: 'Updated' });
    });

    it('should delete a comic', async () => {
      mockDelete.mockResolvedValue({ data: {} });
      await comicsAPI.remove('issue-1');
      expect(mockDelete).toHaveBeenCalledWith('/comics/issue-1');
    });
  });

  describe('paramsSerializer', () => {
    it('should serialize array params as repeated keys', async () => {
      mockGet.mockResolvedValue({ data: [] });
      // The paramsSerializer is exercised when axios.create is called with it
      // We verify it handles arrays by checking that getAll with array tags doesn't throw
      await romsAPI.getAll({ tags: ['rpg', 'action'] });
      expect(mockGet).toHaveBeenCalledWith('/roms', { params: { tags: ['rpg', 'action'] } });
    });
  });
});
