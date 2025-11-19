# Troubleshooting Guide

Comprehensive troubleshooting guide for common issues in the charno.net application.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Backend Issues](#backend-issues)
- [Frontend Issues](#frontend-issues)
- [API Communication Issues](#api-communication-issues)
- [Content Issues](#content-issues)
- [Photo Gallery Issues](#photo-gallery-issues)
- [Build and Deployment Issues](#build-and-deployment-issues)
- [Database Issues](#database-issues-optional)
- [Performance Issues](#performance-issues)

## Quick Diagnostics

Run these commands first to quickly identify issues:

```bash
# Check if servers are running
lsof -i :3000  # Frontend
lsof -i :3080  # Backend

# Test backend health
curl http://localhost:3080/api/health

# Test API endpoint
curl http://localhost:3080/api/projects?language=en

# Check frontend can reach backend
curl http://localhost:3000

# Verify content files exist
ls -la backend/content/en/
```

## Backend Issues

### Issue: Backend Won't Start

**Symptoms:**
- Server crashes immediately after `yarn dev`
- Error: `Error: listen EADDRINUSE: address already in use`

**Solutions:**

```bash
# 1. Check if port 3080 is in use
lsof -i :3080

# 2. Kill the process using the port
kill -9 <PID>

# 3. Or use a different port in backend/.env
PORT=8080

# 4. Restart backend
cd backend
yarn dev
```

### Issue: Module Not Found Errors

**Symptoms:**
- `Error: Cannot find module 'express'`
- `Error: Cannot find module './utils/contentLoader.js'`

**Solutions:**

```bash
# 1. Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
yarn install

# 2. Check if file exists
ls backend/src/utils/contentLoader.js

# 3. Verify import paths use .js extension
# Correct: import { loadJSON } from './utils/contentLoader.js'
# Wrong:   import { loadJSON } from './utils/contentLoader'
```

### Issue: Server Starts But API Returns Errors

**Symptoms:**
- Server runs but all requests return 500 errors
- Console shows: `Error fetching content`

**Diagnostic Steps:**

```bash
# 1. Check server logs
cd backend
yarn dev
# Look for error messages

# 2. Test specific endpoint
curl -v http://localhost:3080/api/projects?language=en

# 3. Check content files exist and are valid
ls backend/content/en/
jq . backend/content/en/projects.json

# 4. Verify contentLoader.js exists
ls backend/src/utils/contentLoader.js
```

**Common Causes:**
- Missing content files
- Invalid JSON in content files
- Wrong file paths in contentLoader
- Missing gray-matter dependency

**Solutions:**

```bash
# Ensure gray-matter is installed
cd backend
yarn add gray-matter

# Validate all JSON files
for file in backend/content/en/*.json; do
  echo "Checking $file"
  jq . "$file" > /dev/null || echo "Invalid JSON in $file"
done
```

## Frontend Issues

### Issue: Frontend Won't Start

**Symptoms:**
- `yarn dev` fails
- Build errors in console
- Port 3000 already in use

**Solutions:**

```bash
# 1. Check port availability
lsof -i :3000

# 2. Kill process on port 3000
kill -9 <PID>

# 3. Clear Vite cache
cd frontend
rm -rf node_modules/.vite
rm -rf dist

# 4. Reinstall dependencies
rm -rf node_modules
yarn install

# 5. Start development server
yarn dev
```

### Issue: White Screen / App Won't Load

**Symptoms:**
- Browser shows blank white screen
- No errors in browser console
- React app doesn't render

**Diagnostic Steps:**

```bash
# 1. Check browser console for JavaScript errors
# Open DevTools (F12) → Console tab

# 2. Check Network tab
# Look for failed resource loads (red entries)

# 3. Verify .env file exists
ls frontend/.env

# 4. Check API URL is correct
cat frontend/.env | grep VITE_API_URL
# Should show: VITE_API_URL=http://localhost:3080/api
```

**Solutions:**

```bash
# 1. Ensure backend is running
curl http://localhost:3080/api/health

# 2. Clear browser cache
# Chrome: Ctrl+Shift+Del → Clear cache

# 3. Restart frontend dev server
cd frontend
# Press Ctrl+C to stop
yarn dev

# 4. Try incognito/private mode
# This rules out browser extensions or cached errors
```

### Issue: Environment Variables Not Loading

**Symptoms:**
- Console shows: `Using REAL API at: http://localhost:5000/api` (wrong port)
- API calls go to wrong URL

**Solution:**

```bash
# 1. Vite requires restart for .env changes
cd frontend
# Stop server (Ctrl+C)

# 2. Verify .env contents
cat .env
# Must start with VITE_ prefix!

# 3. Start fresh
yarn dev

# 4. Verify in browser console
# Should see: "🌐 Using REAL API at: http://localhost:3080/api"
```

**Important:** Vite only loads environment variables that start with `VITE_`

## API Communication Issues

### Issue: CORS Errors

**Symptoms:**
```
Access to XMLHttpRequest at 'http://localhost:3080/api/projects' from origin
'http://localhost:3000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin'
header is present on the requested resource.
```

**Solutions:**

```bash
# 1. Check backend CORS configuration
cat backend/.env | grep FRONTEND_URL
# Should show: FRONTEND_URL=http://localhost:3000

# 2. Verify frontend is running on port 3000
lsof -i :3000

# 3. If frontend uses different port, update backend/.env
FRONTEND_URL=http://localhost:4000

# 4. Restart backend
cd backend
# Ctrl+C to stop
yarn dev

# 5. Clear browser cache and reload
```

### Issue: API Returns 404 Not Found

**Symptoms:**
- API calls return 404
- Browser console: `GET http://localhost:3080/api/projects 404`

**Diagnostic Steps:**

```bash
# 1. Verify backend is running
curl http://localhost:3080/api/health

# 2. Test endpoint directly
curl -v http://localhost:3080/api/projects?language=en

# 3. Check route exists
grep -r "'/projects'" backend/src/routes/

# 4. Verify controller is exported
cat backend/src/controllers/projectController.js | grep export
```

**Common Causes:**
- Route not registered in server.js
- Wrong API URL in frontend
- Controller not imported properly

### Issue: API Method Not a Function

**Symptoms:**
```
TypeError: photosAPI.getGalleryPhotos is not a function
```

**Solution:**

```bash
# 1. Check API service definition
cat frontend/src/services/api.js | grep photosAPI

# 2. Verify method name matches
# Service defines: getByGallery
# Component uses: getByGallery (must match!)

# 3. Check for typos in method names

# 4. Ensure service is imported correctly
# import { photosAPI } from '../services/api';
```

**Fix:** Update component to use correct method name:
```javascript
// Wrong:
const response = await photosAPI.getGalleryPhotos(name, language);

// Correct:
const response = await photosAPI.getByGallery(name, language);
```

## Content Issues

### Issue: Content Not Displaying

**Symptoms:**
- Pages load but show no content
- Empty lists/arrays returned from API
- Console: `No data available`

**Diagnostic Steps:**

```bash
# 1. Verify content files exist
ls -la backend/content/en/
# Should see: projects.json, papers.json, content.json, blog/, galleries/

# 2. Check file is not empty
cat backend/content/en/projects.json

# 3. Validate JSON
jq . backend/content/en/projects.json

# 4. Test API directly
curl http://localhost:3080/api/projects?language=en | jq .

# 5. Check backend logs for errors
```

**Solutions:**

```bash
# If file doesn't exist, create from example
cp backend/content/en/projects.json.example backend/content/en/projects.json

# If JSON is invalid, validate and fix
jq . backend/content/en/projects.json
# Fix any syntax errors shown

# Restart backend to reload files
cd backend
yarn dev
```

### Issue: Blog Posts Not Found

**Symptoms:**
- Blog list empty
- Individual post shows 404
- Error: `Blog post not found`

**Diagnostic Steps:**

```bash
# 1. Check blog directory exists
ls -la backend/content/en/blog/

# 2. Verify .md files exist
ls backend/content/en/blog/*.md

# 3. Check frontmatter format
head -n 10 backend/content/en/blog/welcome-to-my-blog.md

# 4. Test API
curl http://localhost:3080/api/blog?language=en
curl "http://localhost:3080/api/blog/welcome-to-my-blog?language=en"
```

**Common Issues:**
- File missing `.md` extension
- Invalid YAML frontmatter
- page_name doesn't match filename
- Missing required fields in frontmatter

**Example Valid Frontmatter:**
```markdown
---
title: My Post Title
page_name: my-post-title
created_at: 2024-01-15
updated_at: 2024-01-15
---

Content here...
```

### Issue: Invalid JSON Error

**Symptoms:**
- Server error: `Unexpected token in JSON`
- API returns 500 error
- Backend logs show parsing error

**How to Fix:**

```bash
# 1. Identify the problematic file
# Check backend logs for filename

# 2. Validate JSON
jq . backend/content/en/projects.json

# 3. Common JSON errors:
# - Missing comma between items
# - Trailing comma after last item
# - Unescaped quotes in strings
# - Missing closing bracket/brace

# 4. Use online JSON validator
# https://jsonlint.com/

# 5. Auto-format with jq
jq . backend/content/en/projects.json > temp.json
mv temp.json backend/content/en/projects.json
```

## Photo Gallery Issues

### Issue: Yellow Outlines Not Showing

**Symptoms:**
- Photos display but don't have yellow borders
- Outline color is wrong

**Check:**

```bash
# 1. Verify PhotoGallery.css has yellow outline
grep "border.*accent-primary" frontend/src/pages/PhotoGallery.css

# Should show:
# border: 3px solid var(--accent-primary);

# 2. Check CSS variables
grep "accent-primary" frontend/src/index.css
# Should show: --accent-primary: #e4ec18; (yellow)

# 3. Clear browser cache
# Hard reload: Ctrl+Shift+R
```

### Issue: Gallery Not Found

**Symptoms:**
- Error: `Gallery not found`
- 404 when accessing `/photos/gallery/Cricket%20Memories`

**Solutions:**

```bash
# 1. Check gallery file exists
ls backend/content/en/galleries/

# 2. Verify filename matches (kebab-case)
# "Cricket Memories" → cricket-memories.json

# 3. Check backend conversion logic
# Gallery name converted to lowercase with dashes
echo "Cricket Memories" | tr '[:upper:]' '[:lower:]' | tr ' ' '-'
# Output: cricket-memories

# 4. Test API directly
curl "http://localhost:3080/api/photos/gallery/Cricket%20Memories?language=en"
```

### Issue: Photos Not Displaying in Gallery

**Symptoms:**
- Gallery loads but images show broken icon
- 404 errors for image files in Network tab

**Solutions:**

```bash
# 1. Verify images exist
ls frontend/public/images/

# 2. Check filename matches exactly (case-sensitive!)
# gallery JSON: "filename": "cricket-team.jpg"
# File must be: frontend/public/images/cricket-team.jpg

# 3. Check image path in gallery JSON
cat backend/content/en/galleries/cricket-memories.json | jq '.photos[].filename'

# 4. Ensure images are in public directory
# Images should be in: frontend/public/images/
# NOT in: frontend/src/assets/
```

### Issue: Lightbox Arrows Jumping on Hover

**Symptoms:**
- Navigation arrows move significantly when hovering
- Hard to click arrows

**Already Fixed:** This was addressed in PhotoGallery.css

**Verify Fix:**
```bash
grep -A 5 "yarl__navigation" frontend/src/pages/PhotoGallery.css

# Should show:
# transform: scale(1.05) !important;
# Not: transform: translateX(...)
```

## Build and Deployment Issues

### Issue: Build Fails

**Symptoms:**
- `yarn build` fails with errors
- TypeScript errors
- Missing dependencies

**Solutions:**

```bash
# Frontend build
cd frontend

# 1. Clear cache and rebuild
rm -rf node_modules dist .vite
yarn install
yarn build

# 2. Check for syntax errors
yarn lint

# 3. Verify all imports have file extensions
# Correct: import X from './file.js'
# Wrong: import X from './file'

# Backend (if applicable)
cd backend

# Check for import errors
yarn build  # If you have a build script
```

### Issue: Production Build Works Locally but Not on Server

**Symptoms:**
- `yarn preview` works fine
- Deployed version shows errors
- Environment variables not working

**Solutions:**

```bash
# 1. Check environment variables are set
# In production, .env files are not used
# Set variables in hosting platform

# 2. Verify API URL
# Don't use localhost in production!
# Use full domain: https://api.charno.net

# 3. Check build output
cd frontend/dist
ls -la
# Verify index.html and assets exist

# 4. Test production build locally
cd frontend
yarn build
yarn preview
# Open http://localhost:4173
```

## Database Issues (Optional)

*Note: Database is optional and not required for file-based content.*

### Issue: Cannot Connect to Database

**Symptoms:**
- Error: `ECONNREFUSED` or `Connection refused`
- Backend crashes on startup

**Solutions:**

```bash
# 1. Check if PostgreSQL is running
pg_isready

# 2. If not using database, comment out DB variables
cd backend
cat > .env << EOF
PORT=3080
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database not needed for file-based content
# DB_HOST=localhost
# DB_PORT=5432
EOF

# 3. If using database, verify connection
psql -h localhost -U postgres -d charno_web

# 4. Check credentials in .env
cat .env | grep DB_
```

### Issue: Database Schema Errors

**Symptoms:**
- Error: `relation "projects" does not exist`
- SQL errors in logs

**Solutions:**

```bash
# 1. Run schema file
psql -h localhost -U postgres -d charno_web -f backend/src/config/schema.sql

# 2. Verify tables created
psql -h localhost -U postgres -d charno_web -c "\dt"

# 3. Run seeds if needed
psql -h localhost -U postgres -d charno_web -f backend/src/config/seed.sql
```

## Performance Issues

### Issue: Slow API Responses

**Symptoms:**
- API takes > 1 second to respond
- Frontend feels sluggish
- High CPU usage

**Diagnostic:**

```bash
# 1. Time API requests
time curl http://localhost:3080/api/projects?language=en

# 2. Check file sizes
du -h backend/content/en/*.json

# 3. Monitor server resources
top  # Check CPU and memory

# 4. Profile with logging
# Add timing logs to contentLoader.js
```

**Solutions:**

```bash
# 1. Add caching (future enhancement)
# 2. Optimize JSON file sizes
# 3. Use pagination for large datasets
# 4. Enable compression (gzip)
```

### Issue: Frontend Loading Slowly

**Symptoms:**
- Initial page load > 5 seconds
- Large bundle size
- Slow network requests

**Solutions:**

```bash
# 1. Analyze bundle size
cd frontend
yarn build
# Check dist/ folder size

# 2. Optimize images
# Use WebP format
# Lazy load images

# 3. Code splitting
# Use React.lazy() for routes

# 4. Enable production mode
# Ensure NODE_ENV=production
```

## Logging and Debugging

### Enable Debug Logging

```bash
# Backend
cd backend
DEBUG=* yarn dev

# Frontend
# Open browser DevTools → Console
# Enable verbose logging in Network tab
```

### Useful Debug Commands

```bash
# Check all environment variables
cd backend
node -e "console.log(process.env)"

# Test file reads
cd backend
node -e "const fs = require('fs'); console.log(fs.readFileSync('content/en/projects.json', 'utf-8'))"

# Verify imports
cd backend
node --experimental-modules src/utils/contentLoader.js
```

## Getting Help

If issues persist:

1. **Check logs** - Backend console and browser DevTools
2. **Search issues** - GitHub repository issues
3. **Create issue** - Include:
   - Error message
   - Steps to reproduce
   - Environment (OS, Node version)
   - Relevant logs

## Quick Reference: Common Fixes

| Problem | Quick Fix |
|---------|-----------|
| Port already in use | `lsof -i :3080` then `kill -9 <PID>` |
| CORS error | Check `FRONTEND_URL` in backend/.env |
| 404 on API | Restart backend server |
| Content not loading | Validate JSON with `jq .` |
| White screen | Check browser console, restart frontend |
| Images not showing | Verify files in `frontend/public/images/` |
| Build fails | `rm -rf node_modules && yarn install` |
| env not loading | Restart dev server (Vite requirement) |
| Gallery not found | Check kebab-case filename |
| Method not a function | Verify method name in api.js |

---

**Pro Tip:** Always restart dev servers after changing `.env` files!
