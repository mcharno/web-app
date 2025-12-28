import { loadJSON, findById } from '../utils/contentLoader.js';
import { trackContentView } from '../middleware/metrics.js';

export const getAllPapers = async (req, res) => {
  try {
    const { language = 'en' } = req.query;
    const papers = await loadJSON(language, 'papers');

    // Sort by year descending
    const sorted = papers.sort((a, b) => (b.year || 0) - (a.year || 0));

    res.json(sorted);
  } catch (error) {
    console.error('Error fetching papers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPaperById = async (req, res) => {
  try {
    const { id } = req.params;
    const { language = 'en' } = req.query;
    const paper = await findById(language, 'papers', id);

    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    // Track paper view
    trackContentView('paper', id);

    res.json(paper);
  } catch (error) {
    console.error('Error fetching paper:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
