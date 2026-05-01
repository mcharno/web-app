import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '../../content');

async function loadComics() {
  const filePath = path.join(CONTENT_DIR, 'en', 'comics', 'comics.json');
  const raw = await fs.readFile(filePath, 'utf-8');
  const data = JSON.parse(raw);
  return Array.isArray(data.comics) ? data.comics : [];
}

export async function getAllComics(req, res) {
  try {
    const { search, publisher } = req.query;
    let comics = await loadComics();

    if (publisher && publisher !== 'all') {
      comics = comics.filter(c => c.publisher === publisher);
    }

    if (search) {
      const term = search.toLowerCase();
      comics = comics.filter(c =>
        c.title.toLowerCase().includes(term) ||
        c.publisher.toLowerCase().includes(term)
      );
    }

    comics.sort((a, b) => a.title.localeCompare(b.title));

    res.json({ comics, total: comics.length });
  } catch (err) {
    console.error('Error loading comics:', err);
    res.status(500).json({ error: 'Failed to load comics' });
  }
}

export async function getComicById(req, res) {
  try {
    const comics = await loadComics();
    const comic = comics.find(c => c.id === req.params.id);
    if (!comic) return res.status(404).json({ error: 'Comic not found' });
    res.json(comic);
  } catch (err) {
    console.error('Error loading comic:', err);
    res.status(500).json({ error: 'Failed to load comic' });
  }
}

export async function getPublishers(req, res) {
  try {
    const comics = await loadComics();
    const publishers = [...new Set(comics.map(c => c.publisher).filter(Boolean))].sort();
    res.json({ publishers });
  } catch (err) {
    console.error('Error loading publishers:', err);
    res.status(500).json({ error: 'Failed to load publishers' });
  }
}
