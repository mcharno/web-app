import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock the database pool before importing routes
const mockQuery = jest.fn();
jest.unstable_mockModule('../../config/database.js', () => ({
  default: {
    query: mockQuery
  }
}));

// Import routes after mocking
const { default: contentRoutes } = await import('../../routes/contentRoutes.js');
const { default: projectRoutes } = await import('../../routes/projectRoutes.js');
const { default: paperRoutes } = await import('../../routes/paperRoutes.js');
const { default: photoRoutes } = await import('../../routes/photoRoutes.js');
const { default: blogRoutes } = await import('../../routes/blogRoutes.js');

// Create test app
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
      mockQuery.mockResolvedValue({
        rows: [
          { key: 'welcome', value: 'Welcome' },
          { key: 'about', value: 'About' }
        ]
      });

      const response = await request(app)
        .get('/api/content/en')
        .expect(200);

      expect(response.body).toEqual({
        welcome: 'Welcome',
        about: 'About'
      });
    });

    it('GET /api/content/:language/:key should return specific content', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ id: 1, language: 'en', key: 'welcome', value: 'Welcome' }]
      });

      const response = await request(app)
        .get('/api/content/en/welcome')
        .expect(200);

      expect(response.body).toEqual({
        id: 1,
        language: 'en',
        key: 'welcome',
        value: 'Welcome'
      });
    });

    it('GET /api/content/:language/:key should return 404 when not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await request(app)
        .get('/api/content/en/nonexistent')
        .expect(404);
    });
  });

  describe('Project Routes', () => {
    it('GET /api/projects should return all projects', async () => {
      const mockProjects = [
        { id: 1, title: 'Project 1', language: 'en' },
        { id: 2, title: 'Project 2', language: 'en' }
      ];

      mockQuery.mockResolvedValue({ rows: mockProjects });

      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(response.body).toEqual(mockProjects);
    });

    it('GET /api/projects should accept language query parameter', async () => {
      const mockProjects = [{ id: 1, title: 'Έργο', language: 'gr' }];
      mockQuery.mockResolvedValue({ rows: mockProjects });

      const response = await request(app)
        .get('/api/projects?language=gr')
        .expect(200);

      expect(response.body).toEqual(mockProjects);
    });

    it('GET /api/projects/:id should return specific project', async () => {
      const mockProject = { id: 1, title: 'Project 1', language: 'en' };
      mockQuery.mockResolvedValue({ rows: [mockProject] });

      const response = await request(app)
        .get('/api/projects/1')
        .expect(200);

      expect(response.body).toEqual(mockProject);
    });

    it('GET /api/projects/:id should return 404 when not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await request(app)
        .get('/api/projects/999')
        .expect(404);
    });
  });

  describe('Paper Routes', () => {
    it('GET /api/papers should return all papers', async () => {
      const mockPapers = [
        { id: 1, title: 'Paper 1', year: 2023 },
        { id: 2, title: 'Paper 2', year: 2022 }
      ];

      mockQuery.mockResolvedValue({ rows: mockPapers });

      const response = await request(app)
        .get('/api/papers')
        .expect(200);

      expect(response.body).toEqual(mockPapers);
    });

    it('GET /api/papers/:id should return specific paper', async () => {
      const mockPaper = { id: 1, title: 'Paper 1', year: 2023 };
      mockQuery.mockResolvedValue({ rows: [mockPaper] });

      const response = await request(app)
        .get('/api/papers/1')
        .expect(200);

      expect(response.body).toEqual(mockPaper);
    });

    it('GET /api/papers/:id should return 404 when not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await request(app)
        .get('/api/papers/999')
        .expect(404);
    });
  });

  describe('Photo Routes', () => {
    it('GET /api/photos/galleries should return all galleries', async () => {
      const mockGalleries = [
        { gallery_name: 'Vacation', gallery_category: 'places' },
        { gallery_name: 'Events', gallery_category: 'events' }
      ];

      mockQuery.mockResolvedValue({ rows: mockGalleries });

      const response = await request(app)
        .get('/api/photos/galleries')
        .expect(200);

      expect(response.body).toEqual(mockGalleries);
    });

    it('GET /api/photos/gallery/:name should return photos by gallery', async () => {
      const mockPhotos = [
        { id: 1, gallery_name: 'Vacation', filename: 'photo1.jpg' },
        { id: 2, gallery_name: 'Vacation', filename: 'photo2.jpg' }
      ];

      mockQuery.mockResolvedValue({ rows: mockPhotos });

      const response = await request(app)
        .get('/api/photos/gallery/Vacation')
        .expect(200);

      expect(response.body).toEqual(mockPhotos);
    });

    it('GET /api/photos/:id should return specific photo', async () => {
      const mockPhoto = { id: 1, gallery_name: 'Vacation', filename: 'photo1.jpg' };
      mockQuery.mockResolvedValue({ rows: [mockPhoto] });

      const response = await request(app)
        .get('/api/photos/1')
        .expect(200);

      expect(response.body).toEqual(mockPhoto);
    });

    it('GET /api/photos/:id should return 404 when not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await request(app)
        .get('/api/photos/999')
        .expect(404);
    });
  });

  describe('Blog Routes', () => {
    it('GET /api/blog should return all blog posts', async () => {
      const mockPosts = [
        { id: 1, page_name: 'post1', title: 'Post 1' },
        { id: 2, page_name: 'post2', title: 'Post 2' }
      ];

      mockQuery.mockResolvedValue({ rows: mockPosts });

      const response = await request(app)
        .get('/api/blog')
        .expect(200);

      expect(response.body).toEqual(mockPosts);
    });

    it('GET /api/blog/:page should return specific blog post', async () => {
      const mockPost = { id: 1, page_name: 'my-post', title: 'My Post', content: 'Content' };
      mockQuery.mockResolvedValue({ rows: [mockPost] });

      const response = await request(app)
        .get('/api/blog/my-post')
        .expect(200);

      expect(response.body).toEqual(mockPost);
    });

    it('GET /api/blog/:page should return 404 when not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await request(app)
        .get('/api/blog/nonexistent')
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database errors', async () => {
      mockQuery.mockRejectedValue(new Error('Database connection failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await request(app)
        .get('/api/content/en')
        .expect(500);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
