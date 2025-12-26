import { jest } from '@jest/globals';

// Mock the contentLoader module BEFORE importing the controller
const mockLoadAllBlogPosts = jest.fn();
const mockLoadBlogPost = jest.fn();

jest.unstable_mockModule('../../utils/contentLoader.js', () => ({
  loadAllBlogPosts: mockLoadAllBlogPosts,
  loadBlogPost: mockLoadBlogPost
}));

// Import controller AFTER setting up the mock
const { getAllPosts, getPostByPage } = await import('../../controllers/blogController.js');

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
    it('should return all blog posts without content', async () => {
      const mockPosts = [
        {
          id: 'post1',
          page_name: 'post1',
          title: 'Post 1',
          content: 'Full content here',
          created_at: '2024-01-01',
          updated_at: '2024-01-02'
        },
        {
          id: 'post2',
          page_name: 'post2',
          title: 'Post 2',
          content: 'More content',
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ];

      mockLoadAllBlogPosts.mockResolvedValue(mockPosts);

      await getAllPosts(req, res);

      expect(mockLoadAllBlogPosts).toHaveBeenCalledWith('en');
      expect(res.json).toHaveBeenCalledWith([
        { id: 'post1', page_name: 'post1', title: 'Post 1', created_at: '2024-01-01', updated_at: '2024-01-02' },
        { id: 'post2', page_name: 'post2', title: 'Post 2', created_at: '2024-01-01', updated_at: '2024-01-01' }
      ]);
    });

    it('should return posts for specified language', async () => {
      req.query = { language: 'gr' };
      const mockPosts = [
        {
          id: 'post3',
          page_name: 'post3',
          title: 'Δημοσίευση',
          content: 'Content',
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ];

      mockLoadAllBlogPosts.mockResolvedValue(mockPosts);

      await getAllPosts(req, res);

      expect(mockLoadAllBlogPosts).toHaveBeenCalledWith('gr');
      expect(res.json).toHaveBeenCalledWith([
        { id: 'post3', page_name: 'post3', title: 'Δημοσίευση', created_at: '2024-01-01', updated_at: '2024-01-01' }
      ]);
    });

    it('should return empty array when no posts found', async () => {
      mockLoadAllBlogPosts.mockResolvedValue([]);

      await getAllPosts(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should return 500 on error', async () => {
      mockLoadAllBlogPosts.mockRejectedValue(new Error('File system error'));

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
        id: 'my-first-post',
        page_name: 'my-first-post',
        title: 'My First Post',
        content: 'Content here',
        created_at: '2024-01-01',
        updated_at: '2024-01-02'
      };

      mockLoadBlogPost.mockResolvedValue(mockPost);

      await getPostByPage(req, res);

      expect(mockLoadBlogPost).toHaveBeenCalledWith('en', 'my-first-post');
      expect(res.json).toHaveBeenCalledWith(mockPost);
    });

    it('should return post for specified language', async () => {
      req.params = { page: 'my-first-post' };
      req.query = { language: 'gr' };
      const mockPost = {
        id: 'my-first-post',
        page_name: 'my-first-post',
        title: 'Η πρώτη μου ανάρτηση',
        language: 'gr',
        content: 'Content'
      };

      mockLoadBlogPost.mockResolvedValue(mockPost);

      await getPostByPage(req, res);

      expect(mockLoadBlogPost).toHaveBeenCalledWith('gr', 'my-first-post');
      expect(res.json).toHaveBeenCalledWith(mockPost);
    });

    it('should return 404 when post not found', async () => {
      req.params = { page: 'nonexistent' };
      mockLoadBlogPost.mockResolvedValue(null);

      await getPostByPage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Blog post not found' });
    });

    it('should return 404 on not found error', async () => {
      req.params = { page: 'my-first-post' };
      mockLoadBlogPost.mockRejectedValue(new Error('Blog post not found'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getPostByPage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Blog post not found' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should return 500 on other errors', async () => {
      req.params = { page: 'my-first-post' };
      mockLoadBlogPost.mockRejectedValue(new Error('File system error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await getPostByPage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
