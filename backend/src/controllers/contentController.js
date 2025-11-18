import pool from '../config/database.js';

export const getContent = async (req, res) => {
  try {
    const { language, key } = req.params;
    const result = await pool.query(
      'SELECT * FROM content WHERE language = $1 AND key = $2',
      [language, key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllContent = async (req, res) => {
  try {
    const { language } = req.params;
    const result = await pool.query(
      'SELECT * FROM content WHERE language = $1',
      [language]
    );

    // Convert to key-value object
    const content = result.rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    res.json(content);
  } catch (error) {
    console.error('Error fetching all content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
