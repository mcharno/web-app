import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '../../content');
const BERBATIS_IMAGE_BASE = '/images/berbatis';

async function loadShows() {
  const filePath = path.join(CONTENT_DIR, 'en', 'berbatis', 'shows.json');
  const raw = await fs.readFile(filePath, 'utf-8');
  const data = JSON.parse(raw);
  const shows = Array.isArray(data.shows) ? data.shows : [];

  return shows.map(show => ({
    ...show,
    poster_url: show.poster_filename
      ? `${BERBATIS_IMAGE_BASE}/${show.poster_filename}`
      : null,
  }));
}

export async function getAllShows(req, res) {
  try {
    const { search } = req.query;
    let shows = await loadShows();

    if (search) {
      const term = search.toLowerCase();
      shows = shows.filter(show => {
        const inHeadliner = show.headliner?.toLowerCase().includes(term);
        const inSupport = (show.support_acts || []).some(act =>
          act.toLowerCase().includes(term)
        );
        const inDate = show.date_display?.toLowerCase().includes(term);
        const inKeywords = (show.keywords || []).some(kw =>
          kw.toLowerCase().includes(term)
        );
        return inHeadliner || inSupport || inDate || inKeywords;
      });
    }

    // Sort: shows with a year descending, then undated shows last
    shows.sort((a, b) => {
      if (a.date_year && b.date_year) return b.date_year - a.date_year;
      if (a.date_year) return -1;
      if (b.date_year) return 1;
      return 0;
    });

    res.json({ shows, total: shows.length });
  } catch (err) {
    console.error('Error loading Berbatis shows:', err);
    res.status(500).json({ error: 'Failed to load shows' });
  }
}

export async function getShowById(req, res) {
  try {
    const shows = await loadShows();
    const show = shows.find(s => s.id === req.params.id);
    if (!show) return res.status(404).json({ error: 'Show not found' });
    res.json(show);
  } catch (err) {
    console.error('Error loading Berbatis show:', err);
    res.status(500).json({ error: 'Failed to load show' });
  }
}
