import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to ensure mocks are created before module imports
const { mockGet, mockPost, mockPut, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
}));

// Mock axios module
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: mockGet,
      post: mockPost,
      put: mockPut,
      delete: mockDelete,
    }))
  }
}));

// Import API module AFTER mocking axios
import { contentAPI, projectsAPI, photosAPI, papersAPI, blogAPI } from '../../services/api';

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
});
