import axios from 'axios';
import { mockApi } from '../mocks/mockApi.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

// Log which mode we're using
if (USE_MOCK_API) {
  console.log('🎭 Using MOCK API - no backend connection required');
} else {
  console.log('🌐 Using REAL API at:', API_BASE_URL);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Content API
export const contentAPI = USE_MOCK_API ? mockApi.content : {
  getAll: (language = 'en') => api.get(`/content/${language}`),
  getByKey: (language, key) => api.get(`/content/${language}/${key}`),
};

// Projects API
export const projectsAPI = USE_MOCK_API ? mockApi.projects : {
  getAll: (language = 'en') => api.get('/projects', { params: { language } }),
  getById: (id, language = 'en') => api.get(`/projects/${id}`, { params: { language } }),
};

// Photos API
export const photosAPI = USE_MOCK_API ? mockApi.photos : {
  getAllGalleries: (language = 'en') => api.get('/photos/galleries', { params: { language } }),
  getByGallery: (name, language = 'en') => api.get(`/photos/gallery/${name}`, { params: { language } }),
  getById: (id) => api.get(`/photos/${id}`),
};

// Papers API
export const papersAPI = USE_MOCK_API ? mockApi.papers : {
  getAll: (language = 'en') => api.get('/papers', { params: { language } }),
  getById: (id, language = 'en') => api.get(`/papers/${id}`, { params: { language } }),
};

// Blog API
export const blogAPI = USE_MOCK_API ? mockApi.blog : {
  getAll: (language = 'en') => api.get('/blog', { params: { language } }),
  getByPage: (page, language = 'en') => api.get(`/blog/${page}`, { params: { language } }),
};

export default api;
