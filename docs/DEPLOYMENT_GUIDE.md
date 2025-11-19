# Deployment Guide

Complete guide for deploying the charno.net application in development and production environments.

## Table of Contents

- [Quick Start (Development)](#quick-start-development)
- [Environment Configuration](#environment-configuration)
- [Port Configuration](#port-configuration)
- [Development Deployment](#development-deployment)
- [Production Deployment](#production-deployment)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Useful Commands](#useful-commands)
- [Troubleshooting](#troubleshooting)

## Quick Start (Development)

Get the application running in under 2 minutes!

### Prerequisites

- **Node.js** 18+ (`node --version`)
- **Yarn** or npm (`yarn --version`)
- **Git** (`git --version`)

**No database required!** The application uses file-based content.

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd web-app

# 2. Install backend dependencies
cd backend
cp .env.example .env
yarn install

# 3. Install frontend dependencies (in new terminal)
cd ../frontend
cp .env.example .env
yarn install
```

### Running the Application

```bash
# Terminal 1 - Backend
cd backend
yarn dev
# ✓ Server running on http://localhost:3080

# Terminal 2 - Frontend
cd frontend
yarn dev
# ✓ Frontend running on http://localhost:3000
```

**That's it!** Open http://localhost:3000 in your browser.

## Environment Configuration

### Backend Environment Variables

**File:** `backend/.env`

```bash
# Server Configuration
PORT=3080                              # Backend server port
NODE_ENV=development                   # Environment: development | production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000     # Frontend origin for CORS

# Database Configuration (OPTIONAL - not needed for file-based content)
# Only uncomment if developing database-dependent features
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=charno_web
# DB_USER=postgres
# DB_PASSWORD=postgres
```

### Frontend Environment Variables

**File:** `frontend/.env`

```bash
# API Configuration
VITE_API_URL=http://localhost:3080/api  # Backend API URL

# Mock Mode (for frontend-only development)
VITE_USE_MOCK_API=false                 # true = use mocks, false = use real backend
```

### Environment Variable Reference

| Variable | Default | Purpose | Required? |
|----------|---------|---------|-----------|
| **Backend** | | | |
| `PORT` | 3080 | Backend server port | Yes |
| `NODE_ENV` | development | Environment mode | Yes |
| `FRONTEND_URL` | http://localhost:3000 | CORS origin | Yes |
| `DB_*` | - | Database connection | No (future use) |
| **Frontend** | | | |
| `VITE_API_URL` | http://localhost:3080/api | Backend endpoint | Yes |
| `VITE_USE_MOCK_API` | false | Use mock API | No |

## Port Configuration

### Port Summary

| Service | Port | Configurable Via |
|---------|------|------------------|
| **Development** | | |
| Frontend Dev Server | 3000 | `vite.config.js` (line ~11) |
| Backend API | 3080 | `backend/.env` (PORT variable) |
| **Production** | | |
| Frontend (Nginx) | 80 | `frontend/nginx.conf` |
| Backend API | 3080 | Environment or ConfigMap |

### Changing Ports

#### Backend Port

1. Edit `backend/.env`:
   ```bash
   PORT=8080  # Change to desired port
   ```

2. Update frontend API URL in `frontend/.env`:
   ```bash
   VITE_API_URL=http://localhost:8080/api
   ```

3. Restart both servers

#### Frontend Port

1. Edit `frontend/vite.config.js`:
   ```javascript
   server: {
     port: 4000,  // Change to desired port
   }
   ```

2. Update CORS in `backend/.env`:
   ```bash
   FRONTEND_URL=http://localhost:4000
   ```

3. Restart both servers

## Development Deployment

### Local Development (Recommended)

**Scenario:** Daily development work with hot-reload

```bash
# Terminal 1 - Backend with auto-reload
cd backend
yarn dev

# Terminal 2 - Frontend with HMR (Hot Module Replacement)
cd frontend
yarn dev
```

**Features:**
- ✅ Auto-reload on code changes
- ✅ Hot module replacement (instant UI updates)
- ✅ Source maps for debugging
- ✅ No build step required

### Frontend-Only Development

**Scenario:** Working only on UI without backend

```bash
# 1. Enable mock mode
cd frontend
cat > .env << EOF
VITE_API_URL=http://localhost:3080/api
VITE_USE_MOCK_API=true
EOF

# 2. Start frontend only
yarn dev
```

Frontend will use mock data from `frontend/src/mocks/`.

### Backend-Only Development

**Scenario:** Working on API endpoints, testing with curl/Postman

```bash
# Start backend
cd backend
yarn dev

# Test endpoints
curl http://localhost:3080/api/health
curl http://localhost:3080/api/projects?language=en
```

## Production Deployment

### Build for Production

#### Frontend Build

```bash
cd frontend
yarn build

# Output: frontend/dist/
# Contains optimized static files ready for deployment
```

**Build Output:**
- Minified JavaScript bundles
- Optimized CSS
- Compressed assets
- Source maps (optional)

#### Backend Production Mode

```bash
cd backend

# Set production environment
export NODE_ENV=production
export PORT=3080
export FRONTEND_URL=https://your-domain.com

# Start server
yarn start
```

### Production Environment Setup

```bash
# backend/.env.production
PORT=3080
NODE_ENV=production
FRONTEND_URL=https://charno.net

# Optional database connection
DB_HOST=your-db-host.com
DB_PORT=5432
DB_NAME=charno_production
DB_USER=prod_user
DB_PASSWORD=secure_password
```

### Serving Frontend in Production

Option 1: **Nginx** (Recommended)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/charno-frontend/dist;
    index index.html;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Option 2: **Serve with Express**

```javascript
// backend/src/server.js
import express from 'express';
import path from 'path';

const app = express();

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// API routes
app.use('/api', apiRoutes);

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});
```

## Docker Deployment

### Docker Compose (Easiest)

**File:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3080:3080"
    environment:
      - NODE_ENV=production
      - PORT=3080
      - FRONTEND_URL=http://localhost:3000
    volumes:
      - ./backend/content:/app/content:ro  # Mount content as read-only
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
```

**Deploy:**

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Individual Docker Images

#### Build Backend Image

```bash
cd backend
docker build -t charno-backend:latest .

# Run
docker run -d \
  -p 3080:3080 \
  -e NODE_ENV=production \
  -e FRONTEND_URL=http://localhost:3000 \
  -v $(pwd)/content:/app/content:ro \
  --name charno-backend \
  charno-backend:latest
```

#### Build Frontend Image

```bash
cd frontend
docker build -t charno-frontend:latest .

# Run
docker run -d \
  -p 3000:80 \
  --name charno-frontend \
  charno-frontend:latest
```

## Kubernetes Deployment

The application is designed for Kubernetes deployment using GitOps with ArgoCD.

### Kubernetes Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Ingress                           │
│  (Routes traffic to frontend/backend services)      │
└──────────────┬──────────────────┬───────────────────┘
               │                  │
               ▼                  ▼
    ┌──────────────────┐   ┌──────────────────┐
    │  Frontend Service │   │  Backend Service │
    │  (ClusterIP)      │   │  (ClusterIP)     │
    └────────┬─────────┘   └────────┬─────────┘
             │                      │
             ▼                      ▼
    ┌──────────────────┐   ┌──────────────────┐
    │ Frontend         │   │ Backend          │
    │ Deployment       │   │ Deployment       │
    │ (Nginx pods)     │   │ (Node.js pods)   │
    └──────────────────┘   └────────┬─────────┘
                                    │
                                    │ Mount
                                    ▼
                           ┌──────────────────┐
                           │  Content Volume  │
                           │  (File storage)  │
                           └──────────────────┘
```

### Kubernetes Manifests

Located in: `infra/k8s/base/`

**Key files:**
- `namespace.yaml` - Namespace definition
- `backend-deployment.yaml` - Backend pods
- `backend-service.yaml` - Backend service
- `frontend-deployment.yaml` - Frontend pods
- `frontend-service.yaml` - Frontend service
- `ingress.yaml` - Ingress routing
- `configmap.yaml` - Configuration

### Deployment Steps

1. **Manual Apply:**

```bash
# Create namespace
kubectl apply -f infra/k8s/base/namespace.yaml

# Deploy backend
kubectl apply -f infra/k8s/base/backend-deployment.yaml
kubectl apply -f infra/k8s/base/backend-service.yaml

# Deploy frontend
kubectl apply -f infra/k8s/base/frontend-deployment.yaml
kubectl apply -f infra/k8s/base/frontend-service.yaml

# Create ingress
kubectl apply -f infra/k8s/base/ingress.yaml
```

2. **ArgoCD (GitOps - Recommended):**

```yaml
# ArgoCD Application manifest
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: charno-web
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/mcharno/web-app
    targetRevision: main
    path: infra/k8s/base
  destination:
    server: https://kubernetes.default.svc
    namespace: charno-web
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

Apply to cluster:
```bash
kubectl apply -f argocd-app.yaml
```

### Verify Deployment

```bash
# Check pods
kubectl get pods -n charno-web

# Check services
kubectl get svc -n charno-web

# Check ingress
kubectl get ingress -n charno-web

# View logs
kubectl logs -f deployment/charno-backend -n charno-web
kubectl logs -f deployment/charno-frontend -n charno-web
```

## Useful Commands

### Development

```bash
# Backend
cd backend
yarn dev          # Start dev server
yarn start        # Start production server
yarn test         # Run tests
yarn lint         # Lint code

# Frontend
cd frontend
yarn dev          # Start dev server with HMR
yarn build        # Build for production
yarn preview      # Preview production build
yarn test         # Run tests
yarn lint         # Lint code
```

### Health Checks

```bash
# Backend health
curl http://localhost:3080/api/health

# Test API endpoints
curl http://localhost:3080/api/projects?language=en
curl http://localhost:3080/api/papers?language=en
curl http://localhost:3080/api/photos/galleries?language=en
curl http://localhost:3080/api/blog?language=en

# Frontend (when running)
curl http://localhost:3000
```

### Database (Optional - Future Use)

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d charno_web

# Run schema
psql -h localhost -U postgres -d charno_web -f backend/src/config/schema.sql

# Run seeds
psql -h localhost -U postgres -d charno_web -f backend/src/config/seed.sql
```

### Docker Commands

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Remove volumes
docker-compose down -v

# Rebuild and restart
docker-compose up -d --build
```

### Kubernetes Commands

```bash
# Get all resources
kubectl get all -n charno-web

# Describe pod
kubectl describe pod <pod-name> -n charno-web

# Port forward backend
kubectl port-forward -n charno-web svc/charno-backend 3080:3080

# Port forward frontend
kubectl port-forward -n charno-web svc/charno-frontend 3000:80

# Scale deployment
kubectl scale deployment charno-backend --replicas=3 -n charno-web

# Update config
kubectl edit configmap charno-config -n charno-web

# Restart deployment
kubectl rollout restart deployment charno-backend -n charno-web
```

## Troubleshooting

### Backend Won't Start

**Symptom:** Backend server crashes on startup

```bash
# Check error logs
cd backend
yarn dev

# Common issues:
# 1. Port already in use
lsof -i :3080
# Kill process: kill -9 <PID>

# 2. Missing dependencies
yarn install

# 3. Invalid .env file
cp .env.example .env

# 4. Content files missing
ls backend/content/en/
# Should see: projects.json, papers.json, content.json, blog/, galleries/
```

### Frontend Won't Start

**Symptom:** Frontend build fails or won't connect to backend

```bash
# Check error logs
cd frontend
yarn dev

# Common issues:
# 1. Missing .env file
cp .env.example .env

# 2. Wrong API URL
cat .env
# Should show: VITE_API_URL=http://localhost:3080/api

# 3. Node modules corrupted
rm -rf node_modules
yarn install

# 4. Build cache issues
rm -rf dist
yarn build
```

### CORS Errors

**Symptom:** Browser console shows CORS policy errors

```
Access to XMLHttpRequest at 'http://localhost:3080/api/...' from origin
'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**

1. Check backend CORS configuration in `.env`:
   ```bash
   FRONTEND_URL=http://localhost:3000
   ```

2. Verify frontend is running on port 3000

3. Restart backend server to pick up changes

4. Clear browser cache

### Content Not Loading

**Symptom:** API returns 404 or empty responses

```bash
# 1. Verify content files exist
ls -la backend/content/en/

# 2. Test API directly
curl http://localhost:3080/api/projects?language=en

# 3. Check backend logs for file read errors

# 4. Validate JSON files
jq . backend/content/en/projects.json
jq . backend/content/en/papers.json
```

### Database Connection Errors (If Using Database)

**Symptom:** Backend crashes with database connection errors

```bash
# 1. Verify PostgreSQL is running
pg_isready

# 2. Check connection details in .env
cat backend/.env | grep DB_

# 3. Test connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# 4. For file-based content, database is optional
# Comment out DB_ variables in .env if not using database
```

### Docker Build Failures

```bash
# 1. Clear Docker cache
docker system prune -a

# 2. Rebuild without cache
docker-compose build --no-cache

# 3. Check Dockerfile syntax
docker build -t test ./backend

# 4. Verify .dockerignore is correct
cat backend/.dockerignore
```

### Kubernetes Pod Crashes

```bash
# 1. Check pod status
kubectl get pods -n charno-web

# 2. View pod logs
kubectl logs <pod-name> -n charno-web

# 3. Describe pod for events
kubectl describe pod <pod-name> -n charno-web

# 4. Check resource limits
kubectl top pods -n charno-web

# 5. Verify config maps and secrets
kubectl get configmap -n charno-web
kubectl get secret -n charno-web
```

## Performance Optimization

### Production Checklist

- ✅ Enable Gzip compression (Nginx or Express)
- ✅ Set proper cache headers for static assets
- ✅ Minify and bundle JavaScript/CSS
- ✅ Optimize images (use WebP, lazy loading)
- ✅ Enable HTTP/2
- ✅ Use CDN for static assets
- ✅ Implement rate limiting on API
- ✅ Monitor with logging (PM2, Winston)

### Nginx Optimization Example

```nginx
# Enable Gzip
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript;

# Cache static assets
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Security headers
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
```

## Next Steps

After successful deployment:

1. ✅ Monitor application logs
2. ✅ Set up automated backups (content files)
3. ✅ Configure SSL certificates (Let's Encrypt)
4. ✅ Set up monitoring (Prometheus, Grafana)
5. ✅ Configure alerts (uptime, errors)
6. ✅ Test disaster recovery procedures

See [NEXT_STEPS.md](./NEXT_STEPS.md) for future enhancements.
