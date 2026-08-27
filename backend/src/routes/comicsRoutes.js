import { Router } from 'express';
import {
  getGroups, getGroupById, createGroup, updateGroup, deleteGroup,
  getAllComics, getComicById, createComic, updateComic, deleteComic,
  getPublishers, getUnresolvedSeries, getStats, searchIssues, updateIssue, deleteIssue,
  universalSearch, searchComicVine,
} from '../controllers/comicsController.js';
import {
  scrapeComic, scrapeUnscraped, scrapeGroupHeader, scrapeGroupHeaders, scrapeGroupHero,
} from '../controllers/comicsScrapeController.js';

const router = Router();

// ── Groups ────────────────────────────────────────────────────────────────────
router.get('/groups',        getGroups);
router.get('/groups/:id',    getGroupById);
router.post('/groups',       createGroup);
router.patch('/groups/:id',  updateGroup);
router.delete('/groups/:id', deleteGroup);

// ── Issues (before /:id to avoid route conflict) ──────────────────────────────
router.get('/issues',          searchIssues);
router.patch('/issues/:id',    updateIssue);
router.delete('/issues/:id',   deleteIssue);

// ── Search ────────────────────────────────────────────────────────────────────
router.get('/search',          universalSearch);   // groups + series + issues
router.get('/search-cv',       searchComicVine);   // Comic Vine volume lookup

// ── Misc reads ────────────────────────────────────────────────────────────────
router.get('/publishers',      getPublishers);
router.get('/unresolved',      getUnresolvedSeries);
router.get('/stats',           getStats);

// ── Scraping ──────────────────────────────────────────────────────────────────
router.post('/scrape-unscraped',        scrapeUnscraped);    // bulk queue — called by n8n / manual
router.post('/scrape-headers',          scrapeGroupHeaders); // bulk group header images
router.post('/groups/:id/scrape-header', scrapeGroupHeader); // one group (auto or {image_url} override)
router.post('/groups/:id/scrape-hero',   scrapeGroupHero);   // one group's wide banner art ({image_url}, manual only)
router.post('/:id/scrape',              scrapeComic);        // single series

// ── Series CRUD ───────────────────────────────────────────────────────────────
router.get('/',       getAllComics);
router.get('/:id',    getComicById);
router.post('/',      createComic);
router.patch('/:id',  updateComic);
router.delete('/:id', deleteComic);

export default router;
