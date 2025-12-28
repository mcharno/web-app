import { loadAllBlogPosts, loadBlogPost } from '../utils/contentLoader.js';
import { trackContentView } from '../middleware/metrics.js';

export const getAllPosts = async (req, res) => {
  try {
    const { language = 'en' } = req.query;
    const posts = await loadAllBlogPosts(language);

    // Return posts without full content (just metadata)
    const postsMetadata = posts.map(({ content, ...metadata }) => metadata);

    res.json(postsMetadata);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPostByPage = async (req, res) => {
  try {
    const { page } = req.params;
    const { language = 'en' } = req.query;
    const post = await loadBlogPost(language, page);

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Track blog post view
    trackContentView('blog', page);

    res.json(post);
  } catch (error) {
    console.error('Error fetching blog post:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};
