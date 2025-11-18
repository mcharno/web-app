import express from 'express';
import * as blogController from '../controllers/blogController.js';

const router = express.Router();

// Get all blog posts
router.get('/', blogController.getAllPosts);

// Get blog post by page name
router.get('/:page', blogController.getPostByPage);

// Create/update blog post (for later when auth is added)
// router.post('/', blogController.createPost);
// router.put('/:id', blogController.updatePost);

export default router;
