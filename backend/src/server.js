import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import contentRoutes from './routes/contentRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import photoRoutes from './routes/photoRoutes.js';
import paperRoutes from './routes/paperRoutes.js';
import blogRoutes from './routes/blogRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3080;

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure photos directory from environment variable
// Defaults to frontend public directory for local development
const PHOTOS_DIR = process.env.PHOTOS_DIR || path.join(__dirname, '../../frontend/public/images/photos');
console.log(`Photos directory: ${PHOTOS_DIR}`);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static photos from configurable directory
app.use('/images/photos', express.static(PHOTOS_DIR));

// Routes
app.use('/api/content', contentRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/blog', blogRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
