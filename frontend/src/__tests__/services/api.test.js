import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { contentAPI, projectsAPI, photosAPI, papersAPI, blogAPI } from '../../services/api';

// Mock axios
vi.mock('axios');

describe('API Services', () => {
  let mockAxiosInstance;

  beforeEach(() => {
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    axios.create.mockReturnValue(mockAxiosInstance);
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

      await projectsAPI.getById(1, 'en');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/projects/1', { params: { language: 'en' } });
    });
  });

  describe('photosAPI', () => {
    it('should fetch all galleries', async () => {
      const mockData = { data: [{ gallery_name: 'Vacation', category: 'places' }] };
      mockAxiosInstance.get.mockResolvedValue(mockData);

      await photosAPI.getAllGalleries('en');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/photos/galleries', { params: { language: 'en' } });
    });

    it('should fetch photos by gallery name', async () => {
      const mockData = { data: [{ id: 1, filename: 'photo1.jpg' }] };
      mockAxiosInstance.get.mockResolvedValue(mockData);

      await photosAPI.getByGallery('Vacation', 'en');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/photos/gallery/Vacation', { params: { language: 'en' } });
    });

    it('should fetch photo by id', async () => {
      const mockData = { data: { id: 1, filename: 'photo1.jpg' } };
      mockAxiosInstance.get.mockResolvedValue(mockData);

      await photosAPI.getById(1);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/photos/1');
    });
  });

  describe('papersAPI', () => {
    it('should fetch all papers', async () => {
      const mockData = { data: [{ id: 1, title: 'Paper 1', year: 2023 }] };
      mockAxiosInstance.get.mockResolvedValue(mockData);

      await papersAPI.getAll('en');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/papers', { params: { language: 'en' } });
    });

    it('should fetch paper by id', async () => {
      const mockData = { data: { id: 1, title: 'Paper 1' } };
      mockAxiosInstance.get.mockResolvedValue(mockData);

      await papersAPI.getById(1, 'en');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/papers/1', { params: { language: 'en' } });
    });
  });

  describe('blogAPI', () => {
    it('should fetch all blog posts', async () => {
      const mockData = { data: [{ id: 1, title: 'Post 1' }] };
      mockAxiosInstance.get.mockResolvedValue(mockData);

      await blogAPI.getAll('en');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/blog', { params: { language: 'en' } });
    });

    it('should fetch blog post by page name', async () => {
      const mockData = { data: { id: 1, page_name: 'my-post', title: 'My Post' } };
      mockAxiosInstance.get.mockResolvedValue(mockData);

      await blogAPI.getByPage('my-post', 'en');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/blog/my-post', { params: { language: 'en' } });
    });
  });
});
