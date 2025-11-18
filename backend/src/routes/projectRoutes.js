import express from 'express';
import * as projectController from '../controllers/projectController.js';

const router = express.Router();

// Get all projects
router.get('/', projectController.getAllProjects);

// Get project by ID
router.get('/:id', projectController.getProjectById);

export default router;
