import express from 'express';
import * as romController from '../controllers/romController.js';

const router = express.Router();

// List unique consoles
router.get('/consoles', romController.getConsoles);

// List all distinct tags (for autocomplete)
router.get('/tags', romController.getTags);

// Trigger filesystem scan
router.post('/scan', romController.scanRoms);

// Scrape all games missing box art using IGDB (reads creds from IGDB_CLIENT_ID/SECRET env vars)
// Optional query param: ?limit=N (default 50, max 100)
router.post('/scrape-unscraped', romController.scrapeUnscraped);

// Manually merge specific game IDs into one entry.
// Body: { ids: [1, 2, 3], keep_id: 1 (optional) }
router.post('/merge', romController.mergeGames);

// Merge rows sharing the same (console, title) after scraping.
// Useful for arcade/MAME where filenames are opaque short IDs.
// Optional query param: ?console=arcade
router.post('/merge-by-title', romController.mergeByTitle);

// Bulk-split all rows incorrectly merged by merge-by-title (filenames with different title_keys).
// Rows correctly merged at scan time (all filenames share the same title_key) are left intact.
// Optional query param: ?console=genesis
router.post('/split-mismerged', romController.splitMismerged);

// List all games (query: console, search, tags)
router.get('/', romController.listGames);

// Get single game by id
router.get('/:id', romController.getGameById);

// Update game metadata
router.put('/:id', romController.updateGame);

// Scrape metadata + images from ScreenScraper URLs
router.post('/:id/scrape', romController.scrapeGame);

// Auto-scrape: backend calls ScreenScraper directly (has internet access)
router.post('/:id/auto-scrape', romController.autoScrapeGame);

// Split a merged game row back into one row per filename (clears metadata for re-scraping)
router.post('/:id/split', romController.splitGame);

// Debug: dry-run both scrapers and return raw API responses without saving to DB
router.post('/:id/debug-scrape', romController.debugScrapeGame);

// Auto-scrape via IGDB (Twitch OAuth, instant access)
router.post('/:id/auto-scrape-igdb', romController.igdbScrapeGame);

// Partial update (any combination of: title, description, year, box_art_url, screenshots, tags, display_order, hidden)
router.patch('/:id', romController.patchGame);

export default router;
