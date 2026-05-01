import path from 'path';
import { fileURLToPath } from 'url';
import { JsonStore, NotFoundError, ConflictError, ValidationError } from '../utils/JsonStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMICS_FILE = path.join(__dirname, '../../content/en/comics/comics.json');

const store = new JsonStore(COMICS_FILE, 'comics');

/** Derive a URL-safe slug from a title. */
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Validate and normalise a comic payload. Returns clean fields or throws. */
function parsePayload(body, requireTitle = true) {
  const { title, publisher, volume, issues, cover_image } = body;

  if (requireTitle && !title?.trim()) {
    throw new ValidationError('title is required');
  }

  return {
    ...(title !== undefined && { title: title.trim() }),
    publisher: (publisher ?? '').trim(),
    volume: volume ? String(volume).trim() : null,
    issues: Array.isArray(issues) ? issues.map(String) : [],
    cover_image: cover_image ?? null,
  };
}

function handleError(err, res) {
  const status = err.status ?? 500;
  const message = status < 500 ? err.message : 'Internal server error';
  if (status >= 500) console.error(err);
  res.status(status).json({ error: message });
}

// ── Read ─────────────────────────────────────────────────────────────────────

export async function getAllComics(req, res) {
  try {
    const { search, publisher } = req.query;
    let comics = await store.readAll();

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
    handleError(err, res);
  }
}

export async function getComicById(req, res) {
  try {
    const comic = await store.findById(req.params.id);
    if (!comic) return res.status(404).json({ error: `Comic "${req.params.id}" not found` });
    res.json(comic);
  } catch (err) {
    handleError(err, res);
  }
}

export async function getPublishers(req, res) {
  try {
    const comics = await store.readAll();
    const publishers = [...new Set(comics.map(c => c.publisher).filter(Boolean))].sort();
    res.json({ publishers });
  } catch (err) {
    handleError(err, res);
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function createComic(req, res) {
  try {
    const fields = parsePayload(req.body, true);
    const id = req.body.id?.trim() || slugify(fields.title);
    const comic = await store.insert({ id, ...fields });
    res.status(201).json(comic);
  } catch (err) {
    handleError(err, res);
  }
}

export async function replaceComic(req, res) {
  try {
    const fields = parsePayload(req.body, true);
    const comic = await store.replace(req.params.id, fields);
    res.json(comic);
  } catch (err) {
    handleError(err, res);
  }
}

export async function updateComic(req, res) {
  try {
    const fields = parsePayload(req.body, false);
    // Strip undefined keys so patch() only merges what was sent
    const clean = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined)
    );
    const comic = await store.patch(req.params.id, clean);
    res.json(comic);
  } catch (err) {
    handleError(err, res);
  }
}

export async function deleteComic(req, res) {
  try {
    const removed = await store.remove(req.params.id);
    res.json({ message: 'Deleted', comic: removed });
  } catch (err) {
    handleError(err, res);
  }
}
