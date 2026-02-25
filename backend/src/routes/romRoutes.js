import express from 'express';
import * as romController from '../controllers/romController.js';

const router = express.Router();

// List unique consoles
router.get('/consoles', romController.getConsoles);

// Trigger filesystem scan
router.post('/scan', romController.scanRoms);

// List all games (query: console, search, tags)
router.get('/', romController.listGames);

// Get single game by id
router.get('/:id', romController.getGameById);

// Update game metadata
router.put('/:id', romController.updateGame);

export default router;
