import { Router } from 'express';
import {
  getAllComics,
  getComicById,
  getPublishers,
  createComic,
  replaceComic,
  updateComic,
  deleteComic,
} from '../controllers/comicsController.js';

const router = Router();

// Read
router.get('/publishers', getPublishers);
router.get('/', getAllComics);
router.get('/:id', getComicById);

// Write (all require Bearer API key via requireApiKey middleware in server.js)
router.post('/', createComic);       // Create new comic
router.put('/:id', replaceComic);    // Full replace
router.patch('/:id', updateComic);   // Partial update
router.delete('/:id', deleteComic);  // Delete

export default router;
