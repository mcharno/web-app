import express from 'express';
import * as photoController from '../controllers/photoController.js';

const router = express.Router();

// Get all photo galleries
router.get('/galleries', photoController.getAllGalleries);

// Get photos by gallery
router.get('/gallery/:name', photoController.getPhotosByGallery);

// Get photo by ID
router.get('/:id', photoController.getPhotoById);

export default router;
