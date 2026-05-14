import { Router } from 'express';
import {
  getGroups, createGroup, updateGroup, deleteGroup,
  getAllComics, getComicById, createComic, updateComic, deleteComic,
  getPublishers, searchIssues, updateIssue, deleteIssue,
  searchComicVine,
} from '../controllers/comicsController.js';
import { scrapeComic, scrapeUnscraped } from '../controllers/comicsScrapeController.js';

const router = Router();

// ── Groups ────────────────────────────────────────────────────────────────────
router.get('/groups',        getGroups);
router.post('/groups',       createGroup);
router.patch('/groups/:id',  updateGroup);
router.delete('/groups/:id', deleteGroup);

// ── Issues (before /:id to avoid route conflict) ──────────────────────────────
router.get('/issues',          searchIssues);
router.patch('/issues/:id',    updateIssue);
router.delete('/issues/:id',   deleteIssue);

// ── Comic Vine search ─────────────────────────────────────────────────────────
router.get('/search-cv',       searchComicVine);

// ── Misc reads ────────────────────────────────────────────────────────────────
router.get('/publishers',      getPublishers);

// ── Scraping ──────────────────────────────────────────────────────────────────
router.post('/scrape-unscraped',  scrapeUnscraped);   // bulk queue — called by n8n / manual
router.post('/:id/scrape',        scrapeComic);        // single series

// ── Series CRUD ───────────────────────────────────────────────────────────────
router.get('/',       getAllComics);
router.get('/:id',    getComicById);
router.post('/',      createComic);
router.patch('/:id',  updateComic);
router.delete('/:id', deleteComic);

export default router;
