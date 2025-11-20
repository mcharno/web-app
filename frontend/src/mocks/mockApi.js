/**
 * Mock API Responses
 * Returns mock data instead of making real API calls
 * Use for local development/testing without backend
 */

// Simulate network delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Mock content data
const mockContentData = {
  en: {
    welcome: 'Welcome to charno.net',
    'menu.home': 'Home',
    'menu.about': 'About',
    'menu.projects': 'Projects',
    'menu.papers': 'Papers',
    'menu.photos': 'Photos',
    'menu.blog': 'Blog',
    'menu.cv': 'CV',
    'about.main': 'I am an archaeologist and web developer...',
  },
  gr: {
    welcome: 'Καλώς ήρθατε στο charno.net',
    'menu.home': 'Αρχική',
    'menu.about': 'Σχετικά',
    'menu.projects': 'Έργα',
    'menu.papers': 'Δημοσιεύσεις',
    'menu.photos': 'Φωτογραφίες',
    'menu.blog': 'Ιστολόγιο',
    'menu.cv': 'Βιογραφικό',
  },
};

// Mock projects data
const mockProjectsData = [
  {
    id: 1,
    language: 'en',
    title: 'Archaeological Database System',
    description: 'A comprehensive database system for managing archaeological excavation data',
    url: 'https://example.com/arch-db',
    technologies: 'PostgreSQL, Node.js, React',
    display_order: 1,
  },
  {
    id: 2,
    language: 'en',
    title: 'GIS Mapping Tool',
    description: 'Interactive mapping tool for archaeological sites',
    url: 'https://example.com/gis-tool',
    technologies: 'Leaflet, PostGIS, Express',
    display_order: 2,
  },
  {
    id: 3,
    language: 'en',
    title: 'Digital Archive Platform',
    description: 'Platform for digitizing and archiving historical documents',
    url: 'https://example.com/archive',
    technologies: 'React, MongoDB, Express',
    display_order: 3,
  },
];

// Mock papers data
const mockPapersData = [
  {
    id: 1,
    language: 'en',
    title: 'Digital Methods in Archaeological Research',
    abstract: 'This paper explores the application of digital technologies in modern archaeological research...',
    authors: 'Michael Charno, Jane Doe',
    year: 2023,
    journal: 'Journal of Digital Archaeology',
    url: 'https://example.com/paper1',
    keywords: 'archaeology, digital methods, GIS',
  },
  {
    id: 2,
    language: 'en',
    title: 'Web-based Archaeological Data Management Systems',
    abstract: 'An analysis of web-based systems for managing archaeological excavation data...',
    authors: 'Michael Charno',
    year: 2022,
    journal: 'International Journal of Heritage Studies',
    url: 'https://example.com/paper2',
    keywords: 'web development, databases, archaeology',
  },
];

// Mock galleries data
const mockGalleriesData = [
  {
    gallery_name: 'Summer Vacation 2023',
    gallery_category: 'places',
    gallery_description: 'Photos from summer vacation in Greece',
  },
  {
    gallery_name: 'Digital Archaeology Conference 2023',
    gallery_category: 'events',
    gallery_description: 'Annual conference on digital archaeology',
  },
];

// Mock photos data
const mockPhotosData = {
  'Summer Vacation 2023': [
    {
      id: 1,
      gallery_name: 'Summer Vacation 2023',
      filename: 'beach-sunset.jpg',
      caption: 'Beautiful sunset at the beach',
      location: 'Santorini, Greece',
      latitude: 36.3932,
      longitude: 25.4615,
      display_order: 1,
    },
    {
      id: 2,
      gallery_name: 'Summer Vacation 2023',
      filename: 'ancient-ruins.jpg',
      caption: 'Ancient ruins exploration',
      location: 'Athens, Greece',
      latitude: 37.9838,
      longitude: 23.7275,
      display_order: 2,
    },
  ],
  'Digital Archaeology Conference 2023': [
    {
      id: 3,
      gallery_name: 'Digital Archaeology Conference 2023',
      filename: 'conference-hall.jpg',
      caption: 'Main conference hall',
      location: 'London, UK',
      latitude: 51.5074,
      longitude: -0.1278,
      display_order: 1,
    },
  ],
};

// Mock blog posts data
const mockBlogPostsData = [
  {
    id: 1,
    page_name: 'welcome-to-my-blog',
    title: 'Welcome to My Blog',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 2,
    page_name: 'digital-archaeology-tools',
    title: 'Essential Digital Tools for Archaeologists',
    created_at: '2024-02-10T00:00:00Z',
    updated_at: '2024-02-12T00:00:00Z',
  },
];

const mockBlogPostContent = {
  'welcome-to-my-blog': {
    id: 1,
    page_name: 'welcome-to-my-blog',
    title: 'Welcome to My Blog',
    content: `# Welcome to My Blog\n\nThis is my first blog post...`,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  'digital-archaeology-tools': {
    id: 2,
    page_name: 'digital-archaeology-tools',
    title: 'Essential Digital Tools for Archaeologists',
    content: `# Essential Digital Tools for Archaeologists\n\nIn modern archaeological research...`,
    created_at: '2024-02-10T00:00:00Z',
    updated_at: '2024-02-12T00:00:00Z',
  },
};

/**
 * Mock API Object
 * Simulates the real API with mock data
 */
export const mockApi = {
  // Content API
  content: {
    getAll: async (language = 'en') => {
      await delay();
      return { data: mockContentData[language] || mockContentData.en };
    },
    getByKey: async (language, key) => {
      await delay();
      const value = mockContentData[language]?.[key];
      if (!value) {
        throw { response: { status: 404, data: { error: 'Content not found' } } };
      }
      return { data: { language, key, value } };
    },
  },

  // Projects API
  projects: {
    getAll: async (language = 'en') => {
      await delay();
      return {
        data: mockProjectsData.filter(p => p.language === language),
      };
    },
    getById: async (id, language = 'en') => {
      await delay();
      const project = mockProjectsData.find(
        p => p.id === parseInt(id) && p.language === language
      );
      if (!project) {
        throw { response: { status: 404, data: { error: 'Project not found' } } };
      }
      return { data: project };
    },
  },

  // Papers API
  papers: {
    getAll: async (language = 'en') => {
      await delay();
      return {
        data: mockPapersData.filter(p => p.language === language),
      };
    },
    getById: async (id, language = 'en') => {
      await delay();
      const paper = mockPapersData.find(
        p => p.id === parseInt(id) && p.language === language
      );
      if (!paper) {
        throw { response: { status: 404, data: { error: 'Paper not found' } } };
      }
      return { data: paper };
    },
  },

  // Photos API
  photos: {
    getAllGalleries: async (language = 'en') => {
      await delay();
      return { data: mockGalleriesData };
    },
    getByGallery: async (name, language = 'en') => {
      await delay();
      return { data: mockPhotosData[name] || [] };
    },
    getById: async (id) => {
      await delay();
      const allPhotos = Object.values(mockPhotosData).flat();
      const photo = allPhotos.find(p => p.id === parseInt(id));
      if (!photo) {
        throw { response: { status: 404, data: { error: 'Photo not found' } } };
      }
      return { data: photo };
    },
    getAll: async (language = 'en') => {
      await delay();
      // Return all photos from all galleries with coordinates
      const allPhotos = Object.values(mockPhotosData).flat();
      // Filter out photos without coordinates
      return { data: allPhotos.filter(p => p.latitude && p.longitude) };
    },
  },

  // Blog API
  blog: {
    getAll: async (language = 'en') => {
      await delay();
      return { data: mockBlogPostsData };
    },
    getByPage: async (page, language = 'en') => {
      await delay();
      const post = mockBlogPostContent[page];
      if (!post) {
        throw { response: { status: 404, data: { error: 'Blog post not found' } } };
      }
      return { data: post };
    },
  },
};

export default mockApi;
