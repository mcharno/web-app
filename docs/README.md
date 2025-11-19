# Documentation

Comprehensive documentation for the charno.net web application.

## Quick Navigation

### Getting Started

- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - How to run the application locally and deploy to production
- **Start here if you're new!** Follow the Quick Start section

### Architecture & Design

- **[Architecture](./ARCHITECTURE.md)** - System architecture, components, and design decisions
- **[File-Based Content System](./FILE_BASED_CONTENT.md)** - How the file-based content system works

### Operations

- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and how to fix them
- **[Next Steps](./NEXT_STEPS.md)** - Future enhancements and recommended improvements

## Document Overview

### ARCHITECTURE.md

**Purpose:** Understand the system design and structure

**Contains:**
- System architecture diagrams
- Technology stack details
- Component descriptions
- Data flow explanations
- Design decisions and rationale
- Performance characteristics
- Security considerations

**Read this when:**
- You're new to the project
- You need to understand how components interact
- You're making architectural changes
- You need to explain the system to others

---

### FILE_BASED_CONTENT.md

**Purpose:** Learn about the file-based content management system

**Contains:**
- Directory structure
- Content types and formats
- Content loader utility documentation
- Adding new content instructions
- Format examples
- Best practices
- Migration from database

**Read this when:**
- Adding or editing content
- Understanding how content is stored
- Creating new content types
- Troubleshooting content issues

---

### DEPLOYMENT_GUIDE.md

**Purpose:** Deploy and run the application

**Contains:**
- Quick start for local development
- Environment configuration
- Port configuration
- Development deployment
- Production deployment
- Docker deployment
- Kubernetes deployment
- Useful commands
- Troubleshooting deployment issues

**Read this when:**
- Setting up for the first time
- Deploying to production
- Configuring environments
- Running in Docker or Kubernetes

---

### TROUBLESHOOTING.md

**Purpose:** Fix common problems

**Contains:**
- Quick diagnostics
- Backend issues
- Frontend issues
- API communication issues
- Content issues
- Photo gallery issues
- Build and deployment issues
- Performance issues
- Debugging tips

**Read this when:**
- Something isn't working
- You encounter errors
- Performance is slow
- Content won't load

---

### NEXT_STEPS.md

**Purpose:** Plan future development

**Contains:**
- High priority improvements
- Content management enhancements
- User experience upgrades
- Performance optimizations
- New features
- Infrastructure improvements
- Security enhancements
- Priority matrix and roadmap

**Read this when:**
- Planning next sprint
- Looking for improvement ideas
- Prioritizing development work
- Understanding future direction

---

## Quick Reference

### Common Tasks

| Task | Documentation |
|------|---------------|
| **Start development** | [Deployment Guide - Quick Start](./DEPLOYMENT_GUIDE.md#quick-start-development) |
| **Add new blog post** | [File-Based Content - Adding Blog Post](./FILE_BASED_CONTENT.md#adding-a-new-blog-post) |
| **Add new project** | [File-Based Content - Adding Project](./FILE_BASED_CONTENT.md#adding-a-new-project) |
| **Add photo gallery** | [File-Based Content - Adding Gallery](./FILE_BASED_CONTENT.md#adding-a-new-photo-gallery) |
| **Fix CORS error** | [Troubleshooting - CORS Errors](./TROUBLESHOOTING.md#issue-cors-errors) |
| **Content not showing** | [Troubleshooting - Content Issues](./TROUBLESHOOTING.md#content-issues) |
| **Deploy to production** | [Deployment Guide - Production](./DEPLOYMENT_GUIDE.md#production-deployment) |
| **Understanding architecture** | [Architecture - Overview](./ARCHITECTURE.md#overview) |

### Quick Commands

```bash
# Start development
cd backend && yarn dev     # Terminal 1
cd frontend && yarn dev    # Terminal 2

# Health check
curl http://localhost:3080/api/health

# Test API
curl http://localhost:3080/api/projects?language=en

# Validate JSON
jq . backend/content/en/projects.json

# Build for production
cd frontend && yarn build

# Docker deployment
docker-compose up -d
```

### Port Configuration

| Service | Port | Configuration |
|---------|------|---------------|
| Frontend (dev) | 3000 | `vite.config.js` |
| Backend | 3080 | `backend/.env` PORT variable |
| Frontend (prod) | 80 | Nginx or Docker config |

### Environment Variables

**Backend** (`backend/.env`):
```bash
PORT=3080
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`frontend/.env`):
```bash
VITE_API_URL=http://localhost:3080/api
VITE_USE_MOCK_API=false
```

## Documentation Standards

### When to Update Documentation

✅ **Always update docs when you:**
- Add new features
- Change architecture
- Modify configuration
- Fix common bugs
- Learn something useful

### Documentation Style Guide

- **Use headings** for organization
- **Include code examples** where helpful
- **Add diagrams** for complex concepts
- **Keep it concise** but complete
- **Use tables** for reference data
- **Include commands** that work

### Contributing to Documentation

1. Edit relevant markdown file(s)
2. Follow existing format and style
3. Test all code examples
4. Submit pull request
5. Tag with `documentation` label

## Getting Help

If documentation doesn't answer your question:

1. **Check troubleshooting guide** - Most issues covered there
2. **Search GitHub issues** - Someone may have asked already
3. **Create new issue** - Include:
   - What you're trying to do
   - What documentation you checked
   - What error you encountered
   - Your environment details

## Additional Resources

### External Documentation

- **React:** https://react.dev/
- **Vite:** https://vitejs.dev/
- **Express:** https://expressjs.com/
- **React Router:** https://reactrouter.com/
- **Axios:** https://axios-http.com/

### Related Files in Repository

- **Main README:** `../README.md` - Project overview
- **Testing Guide:** `../TESTING.md` - Testing documentation
- **Mocking Guide:** `../MOCKING.md` - Mock framework usage
- **Docker Guide:** `../DOCKER.md` - Docker deployment

## Document Version History

| Date | Changes | Author |
|------|---------|--------|
| 2024-11-19 | Initial comprehensive documentation created | Claude Code Session |

---

**Note:** This documentation reflects the state of the application after implementing the file-based content system and related improvements.

**Last Updated:** 2024-11-19
