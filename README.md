# charno.net - Personal Website

A modern personal website built with Node.js Express backend and React frontend, migrated from JSF/JSP.

## Overview

This is a personal website showcasing academic work, projects, publications, photography, and blog content. The site features multilingual support (English/Greek) and is designed to be a portfolio for archaeological information systems and web development work.

## Tech Stack

### Backend
- **Node.js** with **Express.js** - RESTful API server
- **PostgreSQL** - Database for content storage
- **Modern ES6 modules** - Clean, modern JavaScript

### Frontend
- **React 18** - UI framework
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **react-i18next** - Internationalization (English/Greek)
- **Axios** - HTTP client for API calls
- **date-fns** - Date/time manipulation

## Project Structure

```
web-app/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── config/      # Database config and schemas
│   │   ├── controllers/ # Request handlers
│   │   ├── routes/      # API route definitions
│   │   ├── middleware/  # Custom middleware
│   │   └── server.js    # Main server file
│   ├── Dockerfile       # Backend container image
│   ├── package.json
│   └── .env.example
│
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── pages/       # Page components
│   │   ├── layouts/     # Layout components
│   │   ├── contexts/    # React contexts
│   │   ├── services/    # API service layer
│   │   ├── i18n/        # Internationalization configs
│   │   └── App.jsx      # Main App component
│   ├── Dockerfile       # Frontend container image
│   ├── nginx.conf       # Nginx configuration
│   ├── package.json
│   └── .env.example
│
├── k8s/                 # Kubernetes manifests
│   └── base/            # Base manifests for k3s deployment
│       ├── namespace.yaml
│       ├── *-deployment.yaml
│       ├── *-service.yaml
│       ├── ingress.yaml
│       └── configmap.yaml
│
└── .github/
    └── workflows/
        └── ci-cd.yaml   # GitHub Actions CI/CD pipeline

```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd web-app
   ```

2. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb charno_web

   # Run schema
   psql charno_web < backend/src/config/schema.sql

   # (Optional) Seed initial data
   psql charno_web < backend/src/config/seed.sql
   ```

3. **Configure the backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   npm install
   ```

4. **Configure the frontend**
   ```bash
   cd ../frontend
   cp .env.example .env
   # Edit .env if needed (API URL)
   npm install
   ```

### Running the Application

#### Development Mode

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   Backend will run on http://localhost:5000

2. **Start the frontend dev server** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run on http://localhost:5173

#### Production Mode

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start the backend**
   ```bash
   cd backend
   npm start
   ```

## Features

### Current Features

- **Home Page** - Welcome page with real-time timezone clocks for York, Portland, and Vasiliko
- **About Page** - Personal/academic information
- **Projects** - Portfolio of academic and professional projects
- **Papers** - Academic publications with abstracts and metadata
- **Photos** - Photo galleries organized by category (places, events, things)
- **Blog** - Blog/wiki functionality for content management
- **CV** - Curriculum vitae
- **Multilingual** - English and Greek language support
- **Responsive Design** - Mobile-friendly layout

### Planned Features

- User authentication and login
- Photo gallery with map integration (Leaflet)
- Enhanced blog editing with markdown support
- Image upload functionality
- Search functionality
- Comments system

## API Endpoints

### Content
- `GET /api/content/:language` - Get all content for a language
- `GET /api/content/:language/:key` - Get specific content item

### Projects
- `GET /api/projects?language=en` - Get all projects
- `GET /api/projects/:id?language=en` - Get project by ID

### Papers
- `GET /api/papers?language=en` - Get all papers
- `GET /api/papers/:id?language=en` - Get paper by ID

### Photos
- `GET /api/photos/galleries?language=en` - Get all galleries
- `GET /api/photos/gallery/:name?language=en` - Get photos by gallery
- `GET /api/photos/:id` - Get photo by ID

### Blog
- `GET /api/blog?language=en` - Get all blog posts
- `GET /api/blog/:page?language=en` - Get blog post by page name

## Database Schema

The application uses PostgreSQL with the following main tables:

- `content` - Internationalized content strings
- `projects` - Project information
- `papers` - Academic publications
- `photos` - Photo gallery data
- `blog_posts` - Blog/wiki content
- `cv_sections` - CV information

See `backend/src/config/schema.sql` for the complete schema.

## Deployment

This application includes a CI/CD pipeline for k3s deployment using GitHub Actions and ArgoCD.

### CI/CD Pipeline

**GitHub Actions** (in this repo):
- Builds Docker images on push to main
- Runs tests and linters
- Pushes images to GitHub Container Registry (GHCR)
- Updates image tags in k8s manifests

**ArgoCD** (configured in k8s-infra repo):
- Monitors this repository for manifest changes
- Automatically syncs to k3s cluster
- Provides GitOps-based deployment

**Workflow:**
```
Code Push → GitHub Actions → Build & Test → Push to GHCR → Update k8s Manifests
                                                                      ↓
                                                          ArgoCD Auto-Sync → k3s Cluster
```

### Container Images

Images are built and pushed to GitHub Container Registry:
- `ghcr.io/YOUR_USERNAME/charno-backend:latest`
- `ghcr.io/YOUR_USERNAME/charno-frontend:latest`

### Infrastructure Setup

For ArgoCD installation, secrets configuration, and cluster setup, see the **k8s-infra** repository.

## Development

### Backend Development

The backend follows a standard MVC pattern:
- Routes define API endpoints
- Controllers handle business logic
- Models (via direct SQL queries) interact with PostgreSQL

### Frontend Development

The frontend uses modern React patterns:
- Functional components with hooks
- Context API for state management (language switching)
- Service layer for API calls
- Component-based CSS for styling

## Migration Notes

This project was migrated from a JSF/JSP application to a modern stack:

### What was migrated:
- ✅ All XHTML pages converted to React components
- ✅ JSF backing beans converted to Express controllers
- ✅ Properties files converted to JSON for i18n
- ✅ Database structure designed for PostgreSQL
- ✅ All page functionality preserved

### What's different:
- Modern React instead of JSF Facelets
- RESTful API instead of Java servlets
- PostgreSQL instead of flat file storage (for wiki)
- Vite build system instead of Maven/WAR deployment

## License

ISC License

## Author

Michael Charno
