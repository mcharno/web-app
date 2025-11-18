import pool from '../config/database.js';

export const getAllPosts = async (req, res) => {
  try {
    const { language = 'en' } = req.query;
    const result = await pool.query(
      'SELECT id, page_name, title, created_at, updated_at FROM blog_posts WHERE language = $1 ORDER BY updated_at DESC',
      [language]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPostByPage = async (req, res) => {
  try {
    const { page } = req.params;
    const { language = 'en' } = req.query;
    const result = await pool.query(
      'SELECT * FROM blog_posts WHERE page_name = $1 AND language = $2',
      [page, language]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
