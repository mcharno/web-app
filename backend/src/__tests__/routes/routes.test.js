import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock contentLoader before importing routes
const mockLoadJSON = jest.fn();
const mockFindById = jest.fn();
const mockGetContentValue = jest.fn();
const mockLoadAllGalleries = jest.fn();
const mockLoadGallery = jest.fn();
const mockLoadAllBlogPosts = jest.fn();
const mockLoadBlogPost = jest.fn();

jest.unstable_mockModule('../../utils/contentLoader.js', () => ({
  loadJSON: mockLoadJSON,
  findById: mockFindById,
  getContentValue: mockGetContentValue,
  loadAllGalleries: mockLoadAllGalleries,
  loadGallery: mockLoadGallery,
  loadAllBlogPosts: mockLoadAllBlogPosts,
  loadBlogPost: mockLoadBlogPost
}));

const { default: contentRoutes } = await import('../../routes/contentRoutes.js');
const { default: projectRoutes } = await import('../../routes/projectRoutes.js');
const { default: paperRoutes } = await import('../../routes/paperRoutes.js');
const { default: photoRoutes } = await import('../../routes/photoRoutes.js');
const { default: blogRoutes } = await import('../../routes/blogRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/content', contentRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/blog', blogRoutes);

describe('API Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Content Routes', () => {
    it('GET /api/content/:language should return all content', async () => {
      const mockContent = { welcome: 'Welcome', about: 'About' };
      mockLoadJSON.mockResolvedValue(mockContent);

      const response = await request(app)
        .get('/api/content/en')
        .expect(200);

      expect(mockLoadJSON).toHaveBeenCalledWith('en', 'content');
      expect(response.body).toEqual(mockContent);
    });

    it('GET /api/content/:language/:key should return specific content', async () => {
      mockGetContentValue.mockResolvedValue('Welcome to our site');

      const response = await request(app)
        .get('/api/content/en/welcome')
        .expect(200);

      expect(mockGetContentValue).toHaveBeenCalledWith('en', 'welcome');
      expect(response.body).toEqual({ language: 'en', key: 'welcome', value: 'Welcome to our site' });
    });

    it('GET /api/content/:language/:key should return 404 when not found', async () => {
      mockGetContentValue.mockResolvedValue(null);

      await request(app)
        .get('/api/content/en/nonexistent')
        .expect(404);
    });
  });

  describe('Project Routes', () => {
    it('GET /api/projects should return all projects sorted by display_order', async () => {
      const mockProjects = [
        { id: 'p2', title: 'Project 2', display_order: 2 },
        { id: 'p1', title: 'Project 1', display_order: 1 }
      ];
      mockLoadJSON.mockResolvedValue(mockProjects);

      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(mockLoadJSON).toHaveBeenCalledWith('en', 'projects');
      expect(response.body[0].id).toBe('p1');
    });

    it('GET /api/projects should pass language query parameter to content loader', async () => {
      mockLoadJSON.mockResolvedValue([{ id: 'p1', title: 'Έργο', display_order: 1 }]);

      await request(app)
        .get('/api/projects?language=gr')
        .expect(200);

      expect(mockLoadJSON).toHaveBeenCalledWith('gr', 'projects');
    });

    it('GET /api/projects/:id should return specific project', async () => {
      const mockProject = { id: 'my-project', title: 'My Project' };
      mockFindById.mockResolvedValue(mockProject);

      const response = await request(app)
        .get('/api/projects/my-project')
        .expect(200);

      expect(mockFindById).toHaveBeenCalledWith('en', 'projects', 'my-project');
      expect(response.body).toEqual(mockProject);
    });

    it('GET /api/projects/:id should return 404 when not found', async () => {
      mockFindById.mockResolvedValue(null);

      await request(app)
        .get('/api/projects/nonexistent')
        .expect(404);
    });
  });

  describe('Paper Routes', () => {
    it('GET /api/papers should return all papers sorted by year descending', async () => {
      const mockPapers = [
        { id: 'p1', title: 'Paper 1', year: 2022 },
        { id: 'p2', title: 'Paper 2', year: 2023 }
      ];
      mockLoadJSON.mockResolvedValue(mockPapers);

      const response = await request(app)
        .get('/api/papers')
        .expect(200);

      expect(mockLoadJSON).toHaveBeenCalledWith('en', 'papers');
      expect(response.body[0].year).toBe(2023);
    });

    it('GET /api/papers/:id should return specific paper', async () => {
      const mockPaper = { id: 'paper-1', title: 'Paper 1', year: 2023 };
      mockFindById.mockResolvedValue(mockPaper);

      const response = await request(app)
        .get('/api/papers/paper-1')
        .expect(200);

      expect(mockFindById).toHaveBeenCalledWith('en', 'papers', 'paper-1');
      expect(response.body).toEqual(mockPaper);
    });

    it('GET /api/papers/:id should return 404 when not found', async () => {
      mockFindById.mockResolvedValue(null);

      await request(app)
        .get('/api/papers/nonexistent')
        .expect(404);
    });
  });

  describe('Photo Routes', () => {
    it('GET /api/photos/galleries should return all galleries', async () => {
      const mockGalleries = [
        { gallery_name: 'vacation', name: 'Vacation', category: 'places' }
      ];
      mockLoadAllGalleries.mockResolvedValue(mockGalleries);

      const response = await request(app)
        .get('/api/photos/galleries')
        .expect(200);

      expect(mockLoadAllGalleries).toHaveBeenCalledWith('en');
      expect(response.body).toEqual(mockGalleries);
    });

    it('GET /api/photos/gallery/:name should return photos for that gallery', async () => {
      const mockGallery = {
        name: 'Vacation',
        category: 'places',
        description: 'Holiday photos',
        tags: ['beach'],
        photos: [{ id: 'photo-1', filename: 'photo1.jpg', display_order: 1 }]
      };
      mockLoadGallery.mockResolvedValue(mockGallery);

      const response = await request(app)
        .get('/api/photos/gallery/vacation')
        .expect(200);

      expect(mockLoadGallery).toHaveBeenCalledWith('en', 'vacation');
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({ id: 'photo-1', gallery_name: 'Vacation' });
    });

    it('GET /api/photos/gallery/:name should return 404 when gallery not found', async () => {
      mockLoadGallery.mockRejectedValue(new Error('Gallery not found: en/galleries/nonexistent'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await request(app)
        .get('/api/photos/gallery/nonexistent')
        .expect(404);

      consoleSpy.mockRestore();
    });

    it('GET /api/photos/:id should return 404 when photo not found', async () => {
      mockLoadAllGalleries.mockResolvedValue([]);

      await request(app)
        .get('/api/photos/nonexistent-id')
        .expect(404);
    });
  });

  describe('Blog Routes', () => {
    it('GET /api/blog should return all blog post metadata', async () => {
      const mockPosts = [
        { id: 'post-1', page_name: 'post-1', title: 'Post 1', content: 'Full content' }
      ];
      mockLoadAllBlogPosts.mockResolvedValue(mockPosts);

      const response = await request(app)
        .get('/api/blog')
        .expect(200);

      expect(mockLoadAllBlogPosts).toHaveBeenCalledWith('en');
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).not.toHaveProperty('content');
    });

    it('GET /api/blog/:page should return specific blog post', async () => {
      const mockPost = { id: 'my-post', page_name: 'my-post', title: 'My Post', content: 'Content' };
      mockLoadBlogPost.mockResolvedValue(mockPost);

      const response = await request(app)
        .get('/api/blog/my-post')
        .expect(200);

      expect(mockLoadBlogPost).toHaveBeenCalledWith('en', 'my-post');
      expect(response.body).toEqual(mockPost);
    });

    it('GET /api/blog/:page should return 404 when post not found', async () => {
      mockLoadBlogPost.mockRejectedValue(new Error('Blog post not found: en/blog/nonexistent'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await request(app)
        .get('/api/blog/nonexistent')
        .expect(404);

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on unexpected errors', async () => {
      mockLoadJSON.mockRejectedValue(new Error('Unexpected filesystem error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await request(app)
        .get('/api/content/en')
        .expect(500);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
