# Docker Setup Guide

Quick guide for running the application with Docker and Docker Compose.

## Quick Start

### Full Stack (Real Database)

```bash
# Start everything (PostgreSQL + Backend + Frontend)
docker-compose up

# Access:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:5000/api
# - PostgreSQL: localhost:5432
```

### Development Mode (Hot Reload)

```bash
# Start in development mode with hot-reload
docker-compose -f docker-compose.dev.yml up

# Access:
# - Frontend: http://localhost:5173 (Vite dev server)
# - Backend API: http://localhost:5000/api
```

### Mock Mode (No Database)

```bash
# Frontend only with mock API
docker-compose -f docker-compose.dev.yml --profile mock up frontend-mock

# Backend with mock database
docker-compose -f docker-compose.dev.yml --profile mock up backend-mock

# Both with mocks
docker-compose -f docker-compose.dev.yml --profile mock up backend-mock frontend-mock
```

## Available Configurations

### 1. Production Build (`docker-compose.yml`)

Builds optimized production images.

**Services:**
- `postgres` - PostgreSQL database
- `backend` - Backend API with real database
- `backend-mock` - Backend with mock database (profile: mock)
- `frontend` - Frontend with nginx
- `frontend-mock` - Frontend with mock API (profile: mock)

**Usage:**
```bash
# Full stack
docker-compose up

# Only database
docker-compose up postgres

# Backend with mock
docker-compose --profile mock up backend-mock
```

### 2. Development Mode (`docker-compose.dev.yml`)

Uses node images with volume mounts for hot-reload.

**Services:**
- `postgres` - PostgreSQL database
- `backend` - Backend with nodemon (hot-reload)
- `backend-mock` - Backend with mock database
- `frontend` - Frontend with Vite dev server
- `frontend-mock` - Frontend with mock API

**Usage:**
```bash
# Full stack with hot-reload
docker-compose -f docker-compose.dev.yml up

# Frontend only (mock mode)
docker-compose -f docker-compose.dev.yml --profile mock up frontend-mock
```

## Common Commands

### Starting Services

```bash
# Start all services
docker-compose up

# Start in detached mode (background)
docker-compose up -d

# Start specific service
docker-compose up postgres

# Start with rebuild
docker-compose up --build
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (DELETES DATA!)
docker-compose down -v

# Stop specific service
docker-compose stop backend
```

### Viewing Logs

```bash
# All services
docker-compose logs

# Follow logs
docker-compose logs -f

# Specific service
docker-compose logs backend

# Last 100 lines
docker-compose logs --tail=100 frontend
```

### Accessing Containers

```bash
# Execute command in container
docker-compose exec backend sh

# Access PostgreSQL
docker-compose exec postgres psql -U charno_user -d charno_web

# Run npm commands
docker-compose exec backend npm test
docker-compose exec frontend npm run build
```

## Database Management

### Initialize/Reset Database

```bash
# Stop and remove database volume
docker-compose down -v

# Start fresh (will run init scripts)
docker-compose up postgres
```

### Manual Database Commands

```bash
# Access psql
docker-compose exec postgres psql -U charno_user -d charno_web

# Run SQL file
docker-compose exec -T postgres psql -U charno_user -d charno_web < backup.sql

# Dump database
docker-compose exec postgres pg_dump -U charno_user charno_web > backup.sql
```

## Development Workflows

### Workflow 1: Full Stack Development

```bash
# Terminal 1 - Start all services
docker-compose -f docker-compose.dev.yml up

# Services will hot-reload on file changes
# Edit files in ./backend or ./frontend
```

### Workflow 2: Frontend Only

```bash
# Start frontend with mock API (no backend needed)
docker-compose -f docker-compose.dev.yml --profile mock up frontend-mock

# Access: http://localhost:5174
```

### Workflow 3: Backend Only

```bash
# Start backend with mock database (no PostgreSQL needed)
docker-compose -f docker-compose.dev.yml --profile mock up backend-mock

# Access: http://localhost:5001/api
```

### Workflow 4: Database Testing

```bash
# Start only PostgreSQL
docker-compose up -d postgres

# Run backend locally (not in Docker)
cd backend
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=charno_web
DB_USER=charno_user
DB_PASSWORD=charno_password
USE_MOCK_DB=false
EOF
npm run dev
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :5000
lsof -i :5173

# Kill process
kill -9 <PID>

# Or use different ports in docker-compose.yml
ports:
  - "5001:5000"  # Host:Container
```

### Database Connection Error

```bash
# Check if postgres is running
docker-compose ps

# Check postgres logs
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres

# Or use mock database
# Set USE_MOCK_DB=true in environment
```

### Container Won't Start

```bash
# View logs
docker-compose logs <service-name>

# Rebuild image
docker-compose up --build <service-name>

# Remove and recreate
docker-compose rm -f <service-name>
docker-compose up <service-name>
```

### Hot Reload Not Working

```bash
# Ensure using docker-compose.dev.yml
docker-compose -f docker-compose.dev.yml up

# Check volume mounts
docker-compose -f docker-compose.dev.yml config

# Restart service
docker-compose -f docker-compose.dev.yml restart backend
```

### Database Data Persists After `down`

```bash
# This is intentional (using named volumes)
# To delete data, use:
docker-compose down -v

# To just restart without losing data:
docker-compose restart
```

## Environment Variables

Override environment variables:

```bash
# Method 1: Command line
docker-compose up -e NODE_ENV=production

# Method 2: .env file (create in root)
cat > .env << EOF
DB_PASSWORD=super_secret
VITE_API_URL=http://api.example.com
EOF

# Method 3: Modify docker-compose.yml
services:
  backend:
    environment:
      - DB_PASSWORD=${DB_PASSWORD}
```

## Production Deployment

For production, use `docker-compose.yml`:

```bash
# Build production images
docker-compose build

# Start in production mode
docker-compose up -d

# View status
docker-compose ps

# Scale backend
docker-compose up -d --scale backend=3
```

## Health Checks

```bash
# Check service health
docker-compose ps

# Manual health check
curl http://localhost:5000/api/health
curl http://localhost:3000/health
```

## Cleanup

```bash
# Remove all containers, networks, volumes
docker-compose down -v

# Remove images too
docker-compose down --rmi all

# Remove orphaned containers
docker-compose down --remove-orphans

# Prune everything (careful!)
docker system prune -a --volumes
```

## Tips

1. **Use development mode** for hot-reload during development
2. **Use mock profiles** when you don't need full infrastructure
3. **Name your containers** for easier management
4. **Use volumes** for data persistence
5. **Check logs** when things go wrong
6. **Keep docker-compose files simple** and well-documented

## Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [MOCKING.md](./MOCKING.md) - Mock framework documentation
