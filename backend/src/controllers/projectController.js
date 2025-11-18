import pool from '../config/database.js';

export const getAllProjects = async (req, res) => {
  try {
    const { language = 'en' } = req.query;
    const result = await pool.query(
      'SELECT * FROM projects WHERE language = $1 ORDER BY display_order',
      [language]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const { language = 'en' } = req.query;
    const result = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND language = $2',
      [id, language]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
