import { jest } from '@jest/globals';
import { getAllPosts, getPostByPage } from '../../controllers/blogController.js';

// Mock the database pool
const mockQuery = jest.fn();
jest.unstable_mockModule('../../config/database.js', () => ({
  default: {
    query: mockQuery
  }
}));

describe('Blog Controller', () => {
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

  describe('getAllPosts', () => {
    it('should return all blog posts ordered by updated_at', async () => {
      const mockPosts = [
        { id: 1, page_name: 'post1', title: 'Post 1', created_at: '2024-01-01', updated_at: '2024-01-02' },
        { id: 2, page_name: 'post2', title: 'Post 2', created_at: '2024-01-01', updated_at: '2024-01-01' }
      ];

      mockQuery.mockResolvedValue({ rows: mockPosts });

      await getAllPosts(req, res);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT id, page_name, title, created_at, updated_at FROM blog_posts WHERE language = $1 ORDER BY updated_at DESC',
        ['en']
      );
      expect(res.json).toHaveBeenCalledWith(mockPosts);
    });

    it('should return posts for specified language', async () => {
      req.query = { language: 'gr' };
      const mockPosts = [
        { id: 3, page_name: 'post3', title: 'Δημοσίευση', created_at: '2024-01-01', updated_at: '2024-01-01' }
      ];

      mockQuery.mockResolvedValue({ rows: mockPosts });

      await getAllPosts(req, res);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT id, page_name, title, created_at, updated_at FROM blog_posts WHERE language = $1 ORDER BY updated_at DESC',
        ['gr']
      );
      expect(res.json).toHaveBeenCalledWith(mockPosts);
    });

    it('should return empty array when no posts found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await getAllPosts(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should return 500 on database error', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getAllPosts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getPostByPage', () => {
    it('should return blog post by page name', async () => {
      req.params = { page: 'my-first-post' };
      const mockPost = {
        id: 1,
        page_name: 'my-first-post',
        title: 'My First Post',
        content: 'Content here',
        created_at: '2024-01-01',
        updated_at: '2024-01-02'
      };

      mockQuery.mockResolvedValue({ rows: [mockPost] });

      await getPostByPage(req, res);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM blog_posts WHERE page_name = $1 AND language = $2',
        ['my-first-post', 'en']
      );
      expect(res.json).toHaveBeenCalledWith(mockPost);
    });

    it('should return post for specified language', async () => {
      req.params = { page: 'my-first-post' };
      req.query = { language: 'gr' };
      const mockPost = {
        id: 1,
        page_name: 'my-first-post',
        title: 'Η πρώτη μου ανάρτηση',
        language: 'gr'
      };

      mockQuery.mockResolvedValue({ rows: [mockPost] });

      await getPostByPage(req, res);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM blog_posts WHERE page_name = $1 AND language = $2',
        ['my-first-post', 'gr']
      );
      expect(res.json).toHaveBeenCalledWith(mockPost);
    });

    it('should return 404 when post not found', async () => {
      req.params = { page: 'nonexistent' };
      mockQuery.mockResolvedValue({ rows: [] });

      await getPostByPage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Blog post not found' });
    });

    it('should return 500 on database error', async () => {
      req.params = { page: 'my-first-post' };
      mockQuery.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getPostByPage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
