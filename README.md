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
│   │   ├── mocks/       # Mock data for local development
│   │   └── server.js    # Main server file
│   ├── Dockerfile       # Backend container image
│   ├── package.json
│   └── .env.example
│
├── frontend/            # React application
│   ├── public/
│   │   └── cricket/     # Cricket league archives (1997-2012)
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── pages/       # Page components (including Cricket)
│   │   ├── layouts/     # Layout components
│   │   ├── contexts/    # React contexts
│   │   ├── services/    # API service layer
│   │   ├── mocks/       # Mock API for local development
│   │   ├── i18n/        # Internationalization configs
│   │   └── App.jsx      # Main App component
│   ├── Dockerfile       # Frontend container image
│   ├── nginx.conf       # Nginx configuration
│   ├── package.json
│   └── .env.example
│
├── infra/               # Infrastructure as Code
│   └── k8s/             # Kubernetes manifests
│       ├── base/        # Base manifests for k3s deployment
│       │   ├── namespace.yaml
│       │   ├── *-deployment.yaml
│       │   ├── *-service.yaml
│       │   ├── ingress.yaml
│       │   └── configmap.yaml
│       └── overlays/    # Environment-specific overlays
│
├── .github/
│   └── workflows/
│       └── ci-cd.yaml   # GitHub Actions CI/CD pipeline
│
├── docker-compose.yml      # Production Docker Compose
├── docker-compose.dev.yml  # Development Docker Compose
├── TESTING.md             # Testing documentation
├── MOCKING.md             # Mock framework documentation
├── DOCKER.md              # Docker usage guide
└── README.md

```

## Getting Started

### Prerequisites

- Node.js 18+ and yarn
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
   yarn install
   ```

4. **Configure the frontend**
   ```bash
   cd ../frontend
   cp .env.example .env
   # Edit .env if needed (API URL)
   yarn install
   ```

### Running the Application

#### Development Mode

1. **Start the backend server**
   ```bash
   cd backend
   yarn dev
   ```
   Backend will run on http://localhost:5000

2. **Start the frontend dev server** (in a new terminal)
   ```bash
   cd frontend
   yarn dev
   ```
   Frontend will run on http://localhost:5173

#### Production Mode

1. **Build the frontend**
   ```bash
   cd frontend
   yarn build
   ```

2. **Start the backend**
   ```bash
   cd backend
   yarn start
   ```

## Features

### Current Features

- **Home Page** - Welcome page with real-time timezone clocks for York, Portland, and Vasiliko
- **About Page** - Personal/academic information
- **Projects** - Portfolio of academic and professional projects
- **Papers** - Academic publications with abstracts and metadata
- **Photos** - Photo galleries organized by category (places, events, things)
- **Blog** - Blog/wiki functionality for content management
- **Cricket Archives** - Complete archive of University of York Inter-Departmental Cricket League (1997-2012)
  - 15 seasons of fixtures, results, and league tables
  - Historical records, rules, and umpiring guides
  - Team photos and match reports
- **CV** - Curriculum vitae
- **Multilingual** - English and Greek language support
- **Responsive Design** - Mobile-friendly layout

### Development Features

- **Comprehensive Testing** - 75% code coverage with Jest (backend) and Vitest (frontend)
- **Mock Framework** - Runtime-toggleable mocks for database and API (see [MOCKING.md](MOCKING.md))
- **Docker Support** - Full Docker Compose setup for local development (see [DOCKER.md](DOCKER.md))
- **CI/CD Pipeline** - Automated testing, building, and deployment via GitHub Actions
- **GitOps Deployment** - ArgoCD-based continuous deployment to k3s

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

## Infrastructure

All infrastructure-as-code is organized in the `infra/` directory for better separation of concerns:

```
infra/
└── k8s/                 # Kubernetes manifests
    ├── base/            # Base configurations
    └── overlays/        # Environment-specific overlays
```

This structure allows for future addition of other infrastructure components (Terraform, Ansible, etc.) in a well-organized manner.

## Deployment

This application includes a comprehensive CI/CD pipeline for k3s deployment using GitHub Actions and ArgoCD.

### CI/CD Pipeline

**GitHub Actions** (in this repo - `.github/workflows/ci-cd.yaml`):
- Runs comprehensive test suite with 75% coverage enforcement
- Builds Docker images on push to main
- Runs linters and code quality checks
- Pushes images to GitHub Container Registry (GHCR)
- Updates image tags in `infra/k8s/base` manifests

**ArgoCD** (configured in k8s-infra repo):
- Monitors this repository for manifest changes in `infra/k8s/`
- Automatically syncs to k3s cluster
- Provides GitOps-based deployment with auto-healing

**Workflow:**
```
Code Push → GitHub Actions → Test (75% coverage) → Build → Push to GHCR
                                                                ↓
                                                    Update infra/k8s/base manifests
                                                                ↓
                                                    ArgoCD Auto-Sync → k3s Cluster
```

### Container Images

Images are built and pushed to GitHub Container Registry:
- `ghcr.io/mcharno/charno-backend:latest`
- `ghcr.io/mcharno/charno-frontend:latest`

### Infrastructure Setup

The `infra/k8s/` directory contains:
- **base/**: Core Kubernetes manifests (deployments, services, ingress, configmaps)
- **overlays/**: Environment-specific configurations (dev, staging, production)

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
