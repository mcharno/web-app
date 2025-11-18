import express from 'express';
import * as paperController from '../controllers/paperController.js';

const router = express.Router();

// Get all papers
router.get('/', paperController.getAllPapers);

// Get paper by ID
router.get('/:id', paperController.getPaperById);

export default router;
