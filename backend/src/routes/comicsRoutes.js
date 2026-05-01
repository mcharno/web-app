import { Router } from 'express';
import { getAllComics, getComicById, getPublishers } from '../controllers/comicsController.js';

const router = Router();

router.get('/publishers', getPublishers);
router.get('/', getAllComics);
router.get('/:id', getComicById);

export default router;
