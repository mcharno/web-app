import { loadJSON, getContentValue } from '../utils/contentLoader.js';
import { trackContentView } from '../middleware/metrics.js';

export const getContent = async (req, res) => {
  try {
    const { language, key } = req.params;
    const value = await getContentValue(language, key);

    if (!value) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Track content access
    trackContentView('content', key);

    res.json({ language, key, value });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllContent = async (req, res) => {
  try {
    const { language } = req.params;
    const content = await loadJSON(language, 'content');
    res.json(content);
  } catch (error) {
    console.error('Error fetching all content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
