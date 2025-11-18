import pool from '../config/database.js';

export const getAllPapers = async (req, res) => {
  try {
    const { language = 'en' } = req.query;
    const result = await pool.query(
      'SELECT * FROM papers WHERE language = $1 ORDER BY year DESC',
      [language]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching papers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPaperById = async (req, res) => {
  try {
    const { id } = req.params;
    const { language = 'en' } = req.query;
    const result = await pool.query(
      'SELECT * FROM papers WHERE id = $1 AND language = $2',
      [id, language]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching paper:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
