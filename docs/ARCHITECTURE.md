# System Architecture

This document describes the overall architecture of the charno.net web application.

## Table of Contents

- [Overview](#overview)
- [Architecture Diagram](#architecture-diagram)
- [Technology Stack](#technology-stack)
- [Key Components](#key-components)
- [Data Flow](#data-flow)
- [Design Decisions](#design-decisions)

## Overview

The charno.net application is a modern full-stack web application built with a React frontend and Node.js/Express backend. The system uses a **file-based content management approach** where all content is stored in JSON and Markdown files, making it fully version-controlled and database-free for core operations.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's Browser                          │
│                     http://localhost:3000                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP Requests
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                     │
│                     Port: 3000 (dev)                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │   Routes    │  │  Components  │  │   Services/API      │   │
│  │             │  │              │  │   - photosAPI       │   │
│  │ - /         │  │ - Navigation │  │   - papersAPI       │   │
│  │ - /photos   │  │ - PhotoGrid  │  │   - projectsAPI     │   │
│  │ - /papers   │  │ - Publishings│  │   - blogAPI         │   │
│  │ - /blog     │  │              │  │   - contentAPI      │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐                             │
│  │  Contexts   │  │    i18n      │                             │
│  │ - Language  │  │  - English   │                             │
│  │             │  │  - Greek     │                             │
│  └─────────────┘  └──────────────┘                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ API Calls
                             │ http://localhost:3080/api
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Backend (Node.js + Express)                    │
│                     Port: 3080                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │   Routes    │  │ Controllers  │  │   Utils             │   │
│  │             │  │              │  │   - contentLoader   │   │
│  │ /api/photos │──│ photoCtrl    │──│                     │   │
│  │ /api/papers │──│ paperCtrl    │  │   Functions:        │   │
│  │ /api/blog   │──│ blogCtrl     │  │   - loadJSON()      │   │
│  │ /api/content│──│ contentCtrl  │  │   - loadBlogPost()  │   │
│  │             │  │              │  │   - loadGallery()   │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
│                                                                  │
│  ┌─────────────┐                                                │
│  │ Middleware  │                                                │
│  │ - CORS      │                                                │
│  │ - Helmet    │                                                │
│  │ - Morgan    │                                                │
│  └─────────────┘                                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ File System Access
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     File-Based Content Storage                  │
│                     backend/content/                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  backend/content/                                               │
│  ├── en/                      # English content                 │
│  │   ├── projects.json        # Project listings               │
│  │   ├── papers.json          # Academic papers                │
│  │   ├── content.json         # i18n strings                   │
│  │   ├── blog/                # Markdown blog posts            │
│  │   │   ├── post1.md         # (with YAML frontmatter)        │
│  │   │   └── post2.md                                          │
│  │   └── galleries/           # Photo gallery definitions      │
│  │       ├── gallery1.json                                     │
│  │       └── gallery2.json                                     │
│  │                                                               │
│  └── gr/                      # Greek content                   │
│      └── [same structure]                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | React | 18+ | UI library |
| **Build Tool** | Vite | Latest | Fast dev server & bundling |
| **Routing** | React Router | 6+ | Client-side routing |
| **HTTP Client** | Axios | Latest | API communication |
| **Internationalization** | react-i18next | Latest | Multi-language support |
| **Photo Gallery** | yet-another-react-lightbox | Latest | Image viewing |
| **Styling** | CSS3 | - | Component-scoped styles |

### Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | 18+ | JavaScript runtime |
| **Framework** | Express.js | 4+ | Web server framework |
| **Markdown Parser** | gray-matter | Latest | Frontmatter extraction |
| **Security** | Helmet | Latest | Security headers |
| **CORS** | cors | Latest | Cross-origin requests |
| **Logging** | morgan | Latest | HTTP request logging |

### Optional (Future)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Database** | PostgreSQL | 12+ | Future features (auth, etc.) |

## Key Components

### Frontend Components

#### 1. **Service Layer** (`frontend/src/services/api.js`)

Centralized API communication layer with support for:
- Real backend API calls
- Mock API for offline development
- Configurable via environment variables

```javascript
// API structure
export const photosAPI = {
  getAllGalleries: (language) => api.get('/photos/galleries', { params: { language } }),
  getByGallery: (name, language) => api.get(`/photos/gallery/${name}`, { params: { language } }),
  getById: (id) => api.get(`/photos/${id}`)
};
```

#### 2. **Language Context** (`frontend/src/contexts/LanguageContext.jsx`)

Manages language switching between English (en) and Greek (gr):
- Provides current language state
- Triggers re-fetching of content when language changes
- Used by all components requiring localized content

#### 3. **Page Components**

- **PhotoGallery.jsx** - Photo gallery viewer with lightbox
- **Publishings.jsx** - Papers and publications listing
- **Projects.jsx** - Project portfolio
- **Blog.jsx** - Blog post listing and detail views

### Backend Components

#### 1. **Content Loader** (`backend/src/utils/contentLoader.js`)

Core utility for file-based content management:

```javascript
// Key functions:
- loadJSON(language, contentType)      // Load JSON files
- loadBlogPost(language, pageName)     // Load markdown with frontmatter
- loadAllBlogPosts(language)           // List all blog posts
- loadGallery(language, galleryName)   // Load gallery with photos
- loadAllGalleries(language)           // List all galleries
- findById(language, contentType, id)  // Find specific item
```

#### 2. **Controllers**

Each controller handles a specific content type:

- **contentController.js** - i18n strings and labels
- **projectController.js** - Project listings
- **paperController.js** - Academic papers
- **blogController.js** - Blog posts (markdown)
- **photoController.js** - Photo galleries

#### 3. **Routes**

RESTful API endpoints following standard conventions:

```
GET /api/photos/galleries?language=en
GET /api/photos/gallery/:name?language=en
GET /api/papers?language=en
GET /api/papers/:id?language=en
GET /api/blog?language=en
GET /api/blog/:page?language=en
GET /api/projects?language=en
GET /api/content/:language
```

## Data Flow

### Example: Loading Photo Gallery

```
1. User navigates to /photos/gallery/Cricket%20Memories
   │
2. PhotoGallery component mounts
   │
3. useEffect triggers fetchGalleryPhotos()
   │
4. photosAPI.getByGallery("Cricket Memories", "en") called
   │
5. Axios makes GET request to backend
   │   → http://localhost:3080/api/photos/gallery/Cricket%20Memories?language=en
   │
6. Backend route handler invokes photoController.getPhotosByGallery()
   │
7. Controller calls contentLoader.loadGallery("en", "cricket-memories")
   │   (Note: gallery name converted to kebab-case for file lookup)
   │
8. contentLoader reads file
   │   → backend/content/en/galleries/cricket-memories.json
   │
9. File parsed and photos array returned
   │
10. Response sent back to frontend with status 200
   │
11. PhotoGallery component receives data
   │
12. State updated: setPhotos(data), setGalleryInfo({...})
   │
13. Component re-renders with photo grid
   │
14. User sees gallery with yellow-outlined thumbnails
```

### Example: Publishing Panel with Configurable Buttons

```
1. User visits /publishings page
   │
2. Publishings component fetches papers from backend
   │   → GET /api/papers?language=en
   │
3. Backend reads backend/content/en/papers.json
   │
4. Each paper object contains:
   │   {
   │     "title": "...",
   │     "pdf_url": "...",
   │     "link_text": "View PDF →"  ← Configurable!
   │   }
   │
5. Frontend renders button with:
   │   {item.link_text || (item.type === 'talk' ? 'View Slides →' : 'View PDF →')}
   │
6. If link_text exists in JSON, it's used
   │ Otherwise, falls back to default based on type
```

## Design Decisions

### 1. File-Based Content System

**Decision:** Use JSON and Markdown files instead of a database for content storage.

**Rationale:**
- ✅ **Version Control** - All content changes tracked in Git
- ✅ **No Database Required** - Eliminates deployment complexity
- ✅ **Easy Editing** - Content editable directly on GitHub
- ✅ **Fast Development** - No database setup for developers
- ✅ **Portable** - Easy to backup, migrate, and share
- ✅ **Transparent** - Content visible in repository

**Trade-offs:**
- ❌ Not suitable for high-frequency updates
- ❌ No built-in search indexing
- ❌ Manual data relationships

**Future Path:** PostgreSQL available for features requiring database (user auth, comments, etc.)

### 2. Separate Frontend and Backend Ports

**Decision:** Frontend on 3000, Backend on 3080

**Rationale:**
- ✅ Clear separation of concerns
- ✅ Independent scaling possible
- ✅ Can deploy separately
- ✅ Standard development pattern

### 3. Multilingual Support via File Structure

**Decision:** Separate directories for each language (`en/`, `gr/`)

**Rationale:**
- ✅ Clear organization
- ✅ Easy to add new languages
- ✅ No mixing of content
- ✅ Simple fallback logic

### 4. Markdown with Frontmatter for Blog

**Decision:** Use Markdown files with YAML frontmatter for blog posts

**Rationale:**
- ✅ Human-readable and writable
- ✅ Standard format (GitHub, Jekyll, Hugo compatible)
- ✅ Metadata in frontmatter, content in Markdown
- ✅ Easy to migrate to/from other platforms

Example:
```markdown
---
title: My Blog Post
created_at: 2024-01-15
tags: ["web", "development"]
---

# Content here

Markdown content...
```

### 5. Gallery-Based Photo Organization

**Decision:** JSON files per gallery instead of flat photo list

**Rationale:**
- ✅ Natural grouping
- ✅ Gallery metadata attached
- ✅ Easy to manage
- ✅ Better performance (only load needed gallery)

Structure:
```json
{
  "name": "Cricket Memories",
  "description": "...",
  "tags": ["cricket", "sports"],
  "photos": [
    {
      "id": "photo-1",
      "filename": "team.jpg",
      "caption": "..."
    }
  ]
}
```

## Configuration Management

### Environment Variables

**Frontend** (`.env`):
```bash
VITE_API_URL=http://localhost:3080/api
VITE_USE_MOCK_API=false
```

**Backend** (`.env`):
```bash
PORT=3080
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Port Configuration Summary

| Service | Port | Environment Variable |
|---------|------|---------------------|
| Frontend Dev | 3000 | `vite.config.js` |
| Backend | 3080 | `PORT` in `.env` |
| Frontend Production | 80/443 | Nginx config |

## Security Considerations

### Implemented

- ✅ **Helmet.js** - Security headers (XSS, clickjacking protection)
- ✅ **CORS** - Configured for specific frontend origin
- ✅ **Input Validation** - Route parameters validated
- ✅ **No Database** - Eliminates SQL injection risk

### Future Recommendations

- 🔜 Rate limiting on API endpoints
- 🔜 Content Security Policy (CSP) headers
- 🔜 Input sanitization for future user-generated content
- 🔜 Authentication/Authorization when adding user features

## Performance Characteristics

### Current Performance

- **Content Loading**: Fast (filesystem reads, no DB queries)
- **Caching**: Browser caching for static assets
- **Bundle Size**: Optimized with Vite tree-shaking
- **Initial Load**: < 2s on modern connections

### Scalability Considerations

**Current Setup:**
- Suitable for: < 10,000 requests/day
- Content updates: Manual (Git push)

**Future Improvements:**
- Add Redis caching for frequently accessed content
- CDN for static assets (photos)
- Consider database when content size > 1000 items

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Production                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User → Ingress → Frontend Service (Nginx)                  │
│                     ↓                                        │
│                   Backend Service (Node.js)                  │
│                     ↓                                        │
│                   File Content (mounted volume)              │
│                                                              │
│  All running in Kubernetes (k3s)                             │
│  Deployed via ArgoCD (GitOps)                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## Next Steps

See [NEXT_STEPS.md](./NEXT_STEPS.md) for recommended improvements and future enhancements.
