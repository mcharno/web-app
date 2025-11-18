import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Content API
export const contentAPI = {
  getAll: (language = 'en') => api.get(`/content/${language}`),
  getByKey: (language, key) => api.get(`/content/${language}/${key}`),
};

// Projects API
export const projectsAPI = {
  getAll: (language = 'en') => api.get('/projects', { params: { language } }),
  getById: (id, language = 'en') => api.get(`/projects/${id}`, { params: { language } }),
};

// Photos API
export const photosAPI = {
  getAllGalleries: (language = 'en') => api.get('/photos/galleries', { params: { language } }),
  getByGallery: (name, language = 'en') => api.get(`/photos/gallery/${name}`, { params: { language } }),
  getById: (id) => api.get(`/photos/${id}`),
};

// Papers API
export const papersAPI = {
  getAll: (language = 'en') => api.get('/papers', { params: { language } }),
  getById: (id, language = 'en') => api.get(`/papers/${id}`, { params: { language } }),
};

// Blog API
export const blogAPI = {
  getAll: (language = 'en') => api.get('/blog', { params: { language } }),
  getByPage: (page, language = 'en') => api.get(`/blog/${page}`, { params: { language } }),
};

export default api;
