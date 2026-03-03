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

// Auto-scrape via IGDB (Twitch OAuth, instant access)
router.post('/:id/auto-scrape-igdb', romController.igdbScrapeGame);

// Partial update (any combination of: title, description, year, box_art_url, screenshots, tags, display_order, hidden)
router.patch('/:id', romController.patchGame);

export default router;
