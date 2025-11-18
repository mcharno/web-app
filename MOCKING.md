# Mock Framework Documentation

This document describes how to use the mock framework for local development without database or backend dependencies.

## Overview

The mock framework allows you to run the application locally using in-memory mock data instead of real database or API connections. This is perfect for:

- **Frontend development** without running the backend
- **Backend development** without setting up PostgreSQL
- **Quick prototyping** and UI development
- **Demo purposes** without infrastructure setup
- **Testing changes** without affecting real data

## Architecture

```
┌─────────────────┐
│    Frontend     │
│  (React/Vite)   │
└────────┬────────┘
         │
         │ VITE_USE_MOCK_API=true → Mock API (in-memory)
         │ VITE_USE_MOCK_API=false → Real API (HTTP calls)
         │
         ▼
┌─────────────────┐
│     Backend     │
│  (Node/Express) │
└────────┬────────┘
         │
         │ USE_MOCK_DB=true → Mock Database (in-memory)
         │ USE_MOCK_DB=false → PostgreSQL (real DB)
         │
         ▼
   ┌──────────┐
   │   Data   │
   └──────────┘
```

## Quick Start

### Frontend Only (No Backend)

Perfect for UI development:

```bash
cd frontend

# Create .env file
cat > .env << EOF
VITE_API_URL=http://localhost:5000/api
VITE_USE_MOCK_API=true
EOF

# Start frontend
npm run dev
```

✅ Frontend will use mock API responses - **no backend needed!**

### Backend with Mock Database

Perfect for backend development without PostgreSQL:

```bash
cd backend

# Create .env file
cat > .env << EOF
PORT=5000
NODE_ENV=development
USE_MOCK_DB=true
EOF

# Start backend
npm run dev
```

✅ Backend will use mock database - **no PostgreSQL needed!**

### Full Stack with Mocks

Both frontend and backend using mocks:

```bash
# Terminal 1 - Backend with mock database
cd backend
echo "USE_MOCK_DB=true" > .env
npm run dev

# Terminal 2 - Frontend with real backend
cd frontend
echo "VITE_USE_MOCK_API=false" > .env
npm run dev
```

✅ Full stack running - **no PostgreSQL needed!**

### Full Stack with Real Data

Production-like setup:

```bash
# Terminal 1 - Backend with PostgreSQL
cd backend
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=charno_web
DB_USER=postgres
DB_PASSWORD=postgres
USE_MOCK_DB=false
EOF
npm run dev

# Terminal 2 - Frontend with real backend
cd frontend
echo "VITE_USE_MOCK_API=false" > .env
npm run dev
```

✅ Full stack with real database

## Configuration

### Backend Environment Variables

**File:** `backend/.env`

```bash
# Use mock database instead of PostgreSQL
USE_MOCK_DB=true   # or false for real database

# PostgreSQL config (only needed if USE_MOCK_DB=false)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=charno_web
DB_USER=postgres
DB_PASSWORD=postgres
```

### Frontend Environment Variables

**File:** `frontend/.env`

```bash
# Use mock API instead of real backend
VITE_USE_MOCK_API=true   # or false for real API

# Backend API URL (only needed if VITE_USE_MOCK_API=false)
VITE_API_URL=http://localhost:5000/api
```

## Mock Data

### Backend Mock Data

**Location:** `backend/src/mocks/data/`

- `contentData.js` - Internationalized content strings
- `projectsData.js` - Project portfolio items
- `papersData.js` - Academic papers/publications
- `photosData.js` - Photo galleries
- `blogData.js` - Blog posts

### Frontend Mock API

**Location:** `frontend/src/mocks/mockApi.js`

Contains mock API responses matching the backend structure.

### Modifying Mock Data

To add or change mock data:

**Backend:**
```javascript
// backend/src/mocks/data/projectsData.js
export const mockProjects = [
  {
    id: 4,  // Add new project
    language: 'en',
    title: 'My New Project',
    description: 'Project description...',
    // ...
  },
  // existing projects...
];
```

**Frontend:**
```javascript
// frontend/src/mocks/mockApi.js
const mockProjectsData = [
  {
    id: 4,  // Add new project (should match backend)
    title: 'My New Project',
    // ...
  },
];
```

## How It Works

### Backend Mock Database

The mock database adapter (`backend/src/mocks/mockDatabase.js`) implements the same interface as PostgreSQL's `pg.Pool`:

```javascript
// Real database
const pool = new Pool({ host, port, database, ... });
await pool.query('SELECT * FROM projects WHERE language = $1', ['en']);

// Mock database (same interface!)
const pool = new MockDatabase();
await pool.query('SELECT * FROM projects WHERE language = $1', ['en']);
```

The mock database:
- Parses SQL queries (simplified)
- Filters in-memory data based on query parameters
- Returns results in the same format as PostgreSQL
- Simulates network delay for realistic behavior

### Frontend Mock API

The mock API (`frontend/src/mocks/mockApi.js`) implements the same interface as axios:

```javascript
// Real API
const response = await api.get('/projects', { params: { language: 'en' } });

// Mock API (same interface!)
const response = await mockApi.projects.getAll('en');
```

The mock API:
- Returns Promises (async)
- Simulates network delay
- Throws errors for 404/500 cases
- Returns data in same structure as real API

## Development Scenarios

### Scenario 1: Frontend-Only Development

You're working on UI/UX and don't want to run the backend.

```bash
cd frontend
echo "VITE_USE_MOCK_API=true" > .env
npm run dev
```

**Benefits:**
- No backend setup required
- No database setup required
- Fast iteration on UI
- Consistent mock data

### Scenario 2: Backend API Development

You're working on backend logic and don't want to set up PostgreSQL.

```bash
cd backend
echo "USE_MOCK_DB=true" > .env
npm run dev
```

**Benefits:**
- No PostgreSQL setup required
- Consistent test data
- Fast backend startup
- Focus on API logic

### Scenario 3: Full Stack Integration

You're testing full stack integration.

```bash
# Terminal 1
cd backend
echo "USE_MOCK_DB=true" > .env
npm run dev

# Terminal 2
cd frontend
echo "VITE_USE_MOCK_API=false" > .env
echo "VITE_API_URL=http://localhost:5000/api" >> .env
npm run dev
```

**Benefits:**
- Test real HTTP requests
- No PostgreSQL needed
- Realistic integration testing

### Scenario 4: Database Schema Changes

You're modifying the database schema and need to test with real PostgreSQL.

```bash
cd backend
echo "USE_MOCK_DB=false" > .env
# Set DB credentials...
npm run dev
```

**Benefits:**
- Test against real database
- Validate schema changes
- Run migrations

## Visual Indicators

Both frontend and backend log which mode they're using:

**Backend:**
```
🎭 Using MOCK database - no real database connection required
```
or
```
🗄️  Using REAL PostgreSQL database
```

**Frontend:**
```
🎭 Using MOCK API - no backend connection required
```
or
```
🌐 Using REAL API at: http://localhost:5000/api
```

Check your console to verify which mode you're in!

## Docker Compose Setup

For the easiest local development setup, use Docker Compose:

```bash
# Start everything with real database
docker-compose up

# Start only frontend (with mock API)
docker-compose up frontend

# Start backend with mock database
docker-compose up backend-mock
```

See `docker-compose.yml` for configuration.

## Limitations

### Mock Database Limitations

- Simplified SQL parsing (doesn't support complex queries)
- No transactions
- No database constraints
- No joins between tables
- Limited to SELECT queries

**Solution:** For complex database testing, use real PostgreSQL.

### Mock API Limitations

- Static data (doesn't persist changes)
- No real HTTP errors/network issues
- Limited error scenarios

**Solution:** For API integration testing, use real backend.

## Best Practices

### 1. Keep Mock Data Synchronized

When you update the real schema, update mock data too:

```javascript
// Real schema adds a field
ALTER TABLE projects ADD COLUMN status VARCHAR(50);

// Update mock data
export const mockProjects = [
  {
    id: 1,
    status: 'active',  // ← Add new field
    // ...
  },
];
```

### 2. Use Mock Mode for Rapid Iteration

```bash
# Start with mocks for fast development
USE_MOCK_DB=true npm run dev

# Switch to real DB when ready to test integration
USE_MOCK_DB=false npm run dev
```

### 3. Document Your Mock Data

Add comments to mock data files:

```javascript
// Mock data for testing photo gallery feature
// Includes galleries for places, events, and things
export const mockPhotos = [
  // ...
];
```

### 4. Use Environment-Specific .env Files

```bash
# Development with mocks
.env.development
USE_MOCK_DB=true

# Testing with real DB
.env.test
USE_MOCK_DB=false
DB_NAME=charno_web_test

# Production
.env.production
USE_MOCK_DB=false
DB_NAME=charno_web
```

### 5. Add Mock Data for Edge Cases

```javascript
// Test empty state
export const mockProjects = [];

// Test error handling
export const mockProjects = null; // Will trigger error

// Test large datasets
export const mockProjects = Array(1000).fill({...});
```

## Troubleshooting

### Frontend Shows "Network Error"

**Problem:** Frontend can't connect to backend

**Solution:**
```bash
# Option 1: Use mock API (no backend needed)
cd frontend
echo "VITE_USE_MOCK_API=true" > .env

# Option 2: Start backend
cd backend
echo "USE_MOCK_DB=true" > .env
npm run dev
```

### Backend Shows "Database Connection Error"

**Problem:** Can't connect to PostgreSQL

**Solution:**
```bash
# Use mock database
cd backend
echo "USE_MOCK_DB=true" > .env
npm run dev
```

### Mock Data Not Updating

**Problem:** Changed mock data but not seeing updates

**Solution:**
```bash
# Restart the server
# Backend: Ctrl+C then npm run dev
# Frontend: Ctrl+C then npm run dev

# Or use watch mode (nodemon/vite auto-restart)
```

### Wrong Mode Being Used

**Problem:** Using mock when you want real (or vice versa)

**Solution:**
```bash
# Check .env file
cat backend/.env
cat frontend/.env

# Verify console output shows correct mode
# Backend: "🎭 MOCK" or "🗄️ REAL"
# Frontend: "🎭 MOCK" or "🌐 REAL"
```

## Testing with Mocks

The mock framework is separate from the test mocks used by Jest/Vitest:

```
Runtime Mocks (this framework):
- Used during development
- Controlled by USE_MOCK_DB / VITE_USE_MOCK_API
- In backend/src/mocks/ and frontend/src/mocks/

Test Mocks (for unit tests):
- Used during testing
- Controlled by Jest/Vitest
- In __tests__/ directories
```

You can use both together:

```bash
# Run unit tests (uses test mocks)
npm test

# Run app in development (uses runtime mocks)
USE_MOCK_DB=true npm run dev
```

## Summary

The mock framework provides three modes:

1. **Full Mock**: Frontend + Backend use mocks (no infrastructure needed)
2. **Partial Mock**: Frontend uses mocks OR backend uses mocks
3. **No Mock**: Full stack with real database (production-like)

Toggle between modes using environment variables:
- Backend: `USE_MOCK_DB=true/false`
- Frontend: `VITE_USE_MOCK_API=true/false`

This flexibility allows you to develop and test at any level without external dependencies!
