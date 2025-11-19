import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base content directory
const CONTENT_DIR = path.join(__dirname, '../../content');

/**
 * Load JSON content from file
 * @param {string} language - Language code (en, gr, etc.)
 * @param {string} contentType - Type of content (projects, papers, content)
 * @returns {Promise<Object|Array>} Parsed JSON content
 */
export async function loadJSON(language, contentType) {
  try {
    const filePath = path.join(CONTENT_DIR, language, `${contentType}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Content not found: ${language}/${contentType}`);
    }
    throw error;
  }
}

/**
 * Load markdown blog post with frontmatter
 * @param {string} language - Language code (en, gr, etc.)
 * @param {string} pageName - Blog post page name
 * @returns {Promise<Object>} Parsed blog post with metadata and content
 */
export async function loadBlogPost(language, pageName) {
  try {
    const filePath = path.join(CONTENT_DIR, language, 'blog', `${pageName}.md`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    return {
      ...data,
      content,
      page_name: pageName,
      language
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Blog post not found: ${language}/blog/${pageName}`);
    }
    throw error;
  }
}

/**
 * Load all blog posts for a language
 * @param {string} language - Language code (en, gr, etc.)
 * @returns {Promise<Array>} Array of blog post metadata (without full content)
 */
export async function loadAllBlogPosts(language) {
  try {
    const blogDir = path.join(CONTENT_DIR, language, 'blog');
    const files = await fs.readdir(blogDir);

    const posts = await Promise.all(
      files
        .filter(file => file.endsWith('.md'))
        .map(async (file) => {
          const pageName = file.replace('.md', '');
          const filePath = path.join(blogDir, file);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const { data } = matter(fileContent);

          return {
            id: pageName,
            page_name: pageName,
            ...data,
            language
          };
        })
    );

    return posts.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Load gallery by name
 * @param {string} language - Language code (en, gr, etc.)
 * @param {string} galleryName - Gallery name (kebab-case)
 * @returns {Promise<Object>} Gallery data with photos
 */
export async function loadGallery(language, galleryName) {
  try {
    const filePath = path.join(CONTENT_DIR, language, 'galleries', `${galleryName}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const gallery = JSON.parse(fileContent);

    return {
      ...gallery,
      language
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Gallery not found: ${language}/galleries/${galleryName}`);
    }
    throw error;
  }
}

/**
 * Load all galleries for a language
 * @param {string} language - Language code (en, gr, etc.)
 * @returns {Promise<Array>} Array of gallery metadata
 */
export async function loadAllGalleries(language) {
  try {
    const galleriesDir = path.join(CONTENT_DIR, language, 'galleries');
    const files = await fs.readdir(galleriesDir);

    const galleries = await Promise.all(
      files
        .filter(file => file.endsWith('.json'))
        .map(async (file) => {
          const galleryName = file.replace('.json', '');
          const filePath = path.join(galleriesDir, file);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const gallery = JSON.parse(fileContent);

          return {
            gallery_name: galleryName,
            name: gallery.name,
            category: gallery.category,
            description: gallery.description,
            tags: gallery.tags,
            language
          };
        })
    );

    return galleries;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Find item by ID in a JSON array
 * @param {string} language - Language code (en, gr, etc.)
 * @param {string} contentType - Type of content (projects, papers)
 * @param {string} id - Item ID
 * @returns {Promise<Object|null>} Found item or null
 */
export async function findById(language, contentType, id) {
  const items = await loadJSON(language, contentType);
  return items.find(item => item.id === id) || null;
}

/**
 * Get content value by key
 * @param {string} language - Language code (en, gr, etc.)
 * @param {string} key - Content key
 * @returns {Promise<string>} Content value
 */
export async function getContentValue(language, key) {
  const content = await loadJSON(language, 'content');
  return content[key] || null;
}
