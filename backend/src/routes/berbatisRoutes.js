import { Router } from 'express';
import { getAllShows, getShowById } from '../controllers/berbatisController.js';

const router = Router();

router.get('/', getAllShows);
router.get('/:id', getShowById);

export default router;
