import { mockContent } from './data/contentData.js';
import { mockProjects } from './data/projectsData.js';
import { mockPapers } from './data/papersData.js';
import { mockPhotos } from './data/photosData.js';
import { mockBlogPosts } from './data/blogData.js';

/**
 * Mock Database Adapter
 * Simulates database queries using in-memory mock data
 * Use this for local development without a real database
 */
class MockDatabase {
  constructor() {
    this.data = {
      content: [...mockContent],
      projects: [...mockProjects],
      papers: [...mockPapers],
      photos: [...mockPhotos],
      blog_posts: [...mockBlogPosts],
    };
  }

  /**
   * Simulate a database query
   * @param {string} query - SQL query string (simplified parsing)
   * @param {Array} params - Query parameters
   * @returns {Promise<{rows: Array}>} - Query result
   */
  async query(queryString, params = []) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));

    const query = queryString.toLowerCase();

    // Content queries
    if (query.includes('from content')) {
      return this.queryContent(query, params);
    }

    // Projects queries
    if (query.includes('from projects')) {
      return this.queryProjects(query, params);
    }

    // Papers queries
    if (query.includes('from papers')) {
      return this.queryPapers(query, params);
    }

    // Photos queries
    if (query.includes('from photos')) {
      return this.queryPhotos(query, params);
    }

    // Blog queries
    if (query.includes('from blog_posts')) {
      return this.queryBlogPosts(query, params);
    }

    // Default empty result
    return { rows: [] };
  }

  queryContent(query, params) {
    let results = [...this.data.content];

    // Filter by language
    if (params[0]) {
      results = results.filter(item => item.language === params[0]);
    }

    // Filter by key (specific content item)
    if (params[1]) {
      results = results.filter(item => item.key === params[1]);
    }

    return { rows: results };
  }

  queryProjects(query, params) {
    let results = [...this.data.projects];

    // Filter by language
    if (params[0]) {
      results = results.filter(item => item.language === params[0]);
    }

    // Filter by ID
    if (query.includes('where id =')) {
      const id = parseInt(params[0]);
      results = results.filter(item => item.id === id);
    }

    // Sort by display order
    if (query.includes('order by display_order')) {
      results.sort((a, b) => a.display_order - b.display_order);
    }

    return { rows: results };
  }

  queryPapers(query, params) {
    let results = [...this.data.papers];

    // Filter by language
    if (params[0] && !query.includes('where id =')) {
      results = results.filter(item => item.language === params[0]);
    }

    // Filter by ID
    if (query.includes('where id =')) {
      const id = parseInt(params[0]);
      results = results.filter(item => item.id === id);

      // Apply language filter if provided as second param
      if (params[1]) {
        results = results.filter(item => item.language === params[1]);
      }
    }

    // Sort by year descending
    if (query.includes('order by year desc')) {
      results.sort((a, b) => b.year - a.year);
    }

    return { rows: results };
  }

  queryPhotos(query, params) {
    let results = [...this.data.photos];

    // DISTINCT galleries query
    if (query.includes('distinct gallery_name')) {
      const language = params[0] || 'en';
      results = results.filter(item => item.language === language);

      // Get unique galleries
      const galleries = {};
      results.forEach(photo => {
        if (!galleries[photo.gallery_name]) {
          galleries[photo.gallery_name] = {
            gallery_name: photo.gallery_name,
            gallery_category: photo.gallery_category,
            gallery_description: photo.gallery_description,
          };
        }
      });

      return { rows: Object.values(galleries) };
    }

    // Filter by gallery name
    if (query.includes('where gallery_name =')) {
      results = results.filter(item => item.gallery_name === params[0]);

      // Apply language filter if provided
      if (params[1]) {
        results = results.filter(item => item.language === params[1]);
      }

      // Sort by display order
      results.sort((a, b) => a.display_order - b.display_order);

      return { rows: results };
    }

    // Filter by ID
    if (query.includes('where id =')) {
      const id = parseInt(params[0]);
      results = results.filter(item => item.id === id);
    }

    return { rows: results };
  }

  queryBlogPosts(query, params) {
    let results = [...this.data.blog_posts];

    // List query (without content field)
    if (query.includes('select id, page_name, title')) {
      results = results.map(({ id, page_name, title, created_at, updated_at, language }) => ({
        id,
        page_name,
        title,
        created_at,
        updated_at,
        language
      }));
    }

    // Filter by language
    if (params[0] && !query.includes('where page_name =')) {
      results = results.filter(item => item.language === params[0]);
    }

    // Filter by page name
    if (query.includes('where page_name =')) {
      results = results.filter(item => item.page_name === params[0]);

      // Apply language filter if provided
      if (params[1]) {
        results = results.filter(item => item.language === params[1]);
      }
    }

    // Sort by updated_at descending
    if (query.includes('order by updated_at desc')) {
      results.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }

    return { rows: results };
  }

  /**
   * Close connection (no-op for mock)
   */
  async end() {
    // No-op for mock database
    return Promise.resolve();
  }
}

export default MockDatabase;
