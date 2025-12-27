import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// Create mock axios instance
const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

// Mock axios.create BEFORE importing the API module
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance)
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
      mockAxiosInstance.get.mockResolvedValue(mockData);

      await contentAPI.getAll('en');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/content/en');
    });

    it('should fetch content by key and language', async () => {
      const mockData = { data: { key: 'welcome', value: 'Welcome' } };
      mockAxiosInstance.get.mockResolvedValue(mockData);

      await contentAPI.getByKey('en', 'welcome');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/content/en/welcome');
    });
  });

  describe('projectsAPI', () => {
    it('should fetch all projects with default language', async () => {
      const mockData = { data: [{ id: 1, title: 'Project 1' }] };
      mockAxiosInstance.get.mockResolvedValue(mockData);

      await projectsAPI.getAll();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/projects', { params: { language: 'en' } });
    });

    it('should fetch all projects with specified language', async () => {
      const mockData = { data: [{ id: 1, title: 'Έργο 1' }] };
      mockAxiosInstance.get.mockResolvedValue(mockData);

      await projectsAPI.getAll('gr');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/projects', { params: { language: 'gr' } });
    });

    it('should fetch project by id', async () => {
      const mockData = { data: { id: 1, title: 'Project 1' } };
      mockAxiosInstance.get.mockResolvedValue(mockData);

      await projectsAPI.getById('my-project');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/projects/my-project', { params: { language: 'en' } });
    });
  });

  describe('photosAPI', () => {
    it('should fetch all galleries', async () => {
      const mockData = { data: [{ name: 'Gallery 1' }] };
      mockAxiosInstance.get.mockResolvedValue(mockData);

      await photosAPI.getAllGalleries();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/photos/galleries', { params: { language: 'en' } });
    });

    it('should fetch photos by gallery name', async () => {
      const mockData = { data: [{ id: 1, caption: 'Photo 1' }] };
      mockAxiosInstance.get.mockResolvedValue(mockData);

      await photosAPI.getByGallery('my-gallery');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/photos/gallery/my-gallery', { params: { language: 'en' } });
    });

    it('should fetch photo by id', async () => {
      const mockData = { data: { id: 1, caption: 'Photo 1' } };
      mockAxiosInstance.get.mockResolvedValue(mockData);

      await photosAPI.getById('photo1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/photos/photo1');
    });

    it('should fetch all photos', async () => {
      const mockData = { data: [{ id: 1, caption: 'Photo 1' }] };
      mockAxiosInstance.get.mockResolvedValue(mockData);

      await photosAPI.getAll();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/photos', { params: { language: 'en' } });
    });
  });

  describe('papersAPI', () => {
    it('should fetch all papers', async () => {
      const mockData = { data: [{ id: 1, title: 'Paper 1' }] };
      mockAxiosInstance.get.mockResolvedValue(mockData);

      await papersAPI.getAll();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/papers', { params: { language: 'en' } });
    });

    it('should fetch paper by id', async () => {
      const mockData = { data: { id: 1, title: 'Paper 1' } };
      mockAxiosInstance.get.mockResolvedValue(mockData);

      await papersAPI.getById('my-paper');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/papers/my-paper', { params: { language: 'en' } });
    });
  });

  describe('blogAPI', () => {
    it('should fetch all blog posts', async () => {
      const mockData = { data: [{ id: 1, title: 'Post 1' }] };
      mockAxiosInstance.get.mockResolvedValue(mockData);

      await blogAPI.getAll();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/blog', { params: { language: 'en' } });
    });

    it('should fetch blog post by page name', async () => {
      const mockData = { data: { id: 1, title: 'Post 1' } };
      mockAxiosInstance.get.mockResolvedValue(mockData);

      await blogAPI.getByPage('my-post');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/blog/my-post', { params: { language: 'en' } });
    });
  });
});
