import pool from '../config/database.js';

export const getAllGalleries = async (req, res) => {
  try {
    const { language = 'en' } = req.query;
    const result = await pool.query(
      'SELECT DISTINCT gallery_name, gallery_category, gallery_description FROM photos WHERE language = $1 ORDER BY gallery_name',
      [language]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching galleries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPhotosByGallery = async (req, res) => {
  try {
    const { name } = req.params;
    const { language = 'en' } = req.query;
    const result = await pool.query(
      'SELECT * FROM photos WHERE gallery_name = $1 AND language = $2 ORDER BY display_order',
      [name, language]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPhotoById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM photos WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
