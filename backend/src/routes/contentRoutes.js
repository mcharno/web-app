import express from 'express';
import * as contentController from '../controllers/contentController.js';

const router = express.Router();

// Get content by key and language
router.get('/:language/:key', contentController.getContent);

// Get all content for a language
router.get('/:language', contentController.getAllContent);

export default router;
