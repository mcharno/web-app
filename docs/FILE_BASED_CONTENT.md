# File-Based Content System

This document describes the file-based content management system used in charno.net.

## Table of Contents

- [Overview](#overview)
- [Why File-Based Content?](#why-file-based-content)
- [Directory Structure](#directory-structure)
- [Content Types](#content-types)
- [Content Loader Utility](#content-loader-utility)
- [Adding New Content](#adding-new-content)
- [Content Format Examples](#content-format-examples)
- [Migration from Database](#migration-from-database)

## Overview

The application uses a **file-based content management system** where all content is stored as JSON and Markdown files in the `backend/content/` directory. This approach eliminates the need for a database for core content operations while maintaining full version control.

## Why File-Based Content?

### Advantages

✅ **Version Controlled** - All content changes tracked in Git history
✅ **No Database Setup** - Developers can start immediately with `yarn dev`
✅ **Easy Content Editing** - Edit directly on GitHub or any text editor
✅ **Portable** - Content is just files, easy to backup and migrate
✅ **Transparent** - All content visible in repository
✅ **Fast Development** - No migrations, seeds, or database management
✅ **Reviewable** - Content changes go through pull requests
✅ **Rollback Friendly** - Git revert for content mistakes

### When to Use File-Based Content

- ✅ Content updated infrequently (daily/weekly)
- ✅ Small to medium content volume (< 10,000 items)
- ✅ Content doesn't require complex queries
- ✅ Editorial workflow involves review/approval
- ✅ Content versioning is important

### When NOT to Use File-Based Content

- ❌ User-generated content (comments, posts)
- ❌ Real-time updates required
- ❌ Complex querying and filtering
- ❌ Large datasets (> 100MB content)
- ❌ Frequent automated updates

## Directory Structure

```
backend/content/
├── en/                          # English content
│   ├── projects.json            # Project listings
│   ├── papers.json              # Academic papers
│   ├── content.json             # i18n strings/labels
│   ├── blog/                    # Markdown blog posts
│   │   ├── welcome-to-my-blog.md
│   │   └── digital-archaeology-tools.md
│   └── galleries/               # Photo gallery definitions
│       ├── cricket-memories.json
│       ├── travel-places.json
│       ├── archaeological-sites.json
│       └── portraits.json
│
└── gr/                          # Greek content
    ├── projects.json
    ├── papers.json
    ├── content.json
    ├── blog/
    │   └── welcome-to-my-blog.md
    └── galleries/
        └── cricket-memories.json
```

### Language Organization

Each language has its own directory:
- **`en/`** - English content
- **`gr/`** - Greek content
- Add new languages by creating new directories (e.g., `fr/`, `de/`)

### File Naming Conventions

- **JSON files**: `lowercase-with-dashes.json`
- **Markdown files**: `lowercase-with-dashes.md`
- **Gallery files**: Match gallery name in kebab-case

## Content Types

### 1. Projects (`projects.json`)

**Purpose:** Portfolio of academic and professional projects

**Format:** JSON array of project objects

**Fields:**
```json
{
  "id": "unique-project-id",
  "title": "Project Title",
  "description": "Project description...",
  "url": "https://project-url.com",
  "technologies": "React, Node.js, PostgreSQL",
  "display_order": 1,
  "created_at": "2023-01-15",
  "updated_at": "2023-06-20"
}
```

**Sorting:** Projects are sorted by `display_order` (ascending)

### 2. Papers (`papers.json`)

**Purpose:** Academic publications and research papers

**Format:** JSON array of paper objects

**Fields:**
```json
{
  "id": "unique-paper-id",
  "title": "Paper Title",
  "abstract": "Paper abstract or summary...",
  "authors": "Author Name, Co-Author Name",
  "year": 2023,
  "journal": "Journal Name",
  "pdf_url": "https://example.com/paper.pdf",
  "keywords": "keyword1, keyword2, keyword3",
  "link_text": "View PDF →",
  "created_at": "2023-05-10",
  "updated_at": "2023-05-10"
}
```

**Special Fields:**
- **`link_text`** - Customizable button text (optional, falls back to default)

**Sorting:** Papers are sorted by `year` (descending)

### 3. Content/i18n (`content.json`)

**Purpose:** Internationalized strings, labels, and UI text

**Format:** JSON object (key-value pairs)

**Example:**
```json
{
  "welcome": "Welcome to charno.net",
  "about": "About Me",
  "menu.home": "Home",
  "menu.about": "About",
  "menu.projects": "Projects",
  "menu.papers": "Papers",
  "menu.photos": "Photos"
}
```

**Naming Convention:** Use dot notation for nested concepts (e.g., `menu.home`)

### 4. Blog Posts (`blog/*.md`)

**Purpose:** Blog posts, articles, and long-form content

**Format:** Markdown with YAML frontmatter

**Structure:**
```markdown
---
title: Post Title
page_name: url-slug-for-post
created_at: 2024-01-15
updated_at: 2024-01-15
tags: ["tag1", "tag2"]
---

# Post Content

Your markdown content here...

## Sections

- Support for all standard markdown
- Code blocks
- Lists
- Links
- Images
```

**Frontmatter Fields:**
- **`title`** (required) - Post title
- **`page_name`** (required) - URL slug
- **`created_at`** (required) - Creation date
- **`updated_at`** (required) - Last update date
- **`tags`** (optional) - Array of tags
- **`author`** (optional) - Author name

**Sorting:** Posts are sorted by `updated_at` (descending)

### 5. Photo Galleries (`galleries/*.json`)

**Purpose:** Photo gallery collections with metadata

**Format:** JSON object with gallery info and photos array

**Structure:**
```json
{
  "name": "Gallery Display Name",
  "category": "category-name",
  "description": "Gallery description",
  "tags": ["tag1", "tag2", "tag3"],
  "photos": [
    {
      "id": "unique-photo-id",
      "filename": "photo.jpg",
      "caption": "Photo caption",
      "location": "Photo location",
      "taken_date": "2023-08-15",
      "display_order": 1
    }
  ]
}
```

**File Naming:** Gallery filename should be kebab-case version of gallery name
- "Cricket Memories" → `cricket-memories.json`
- "Travel & Places" → `travel-places.json`

**Photo Fields:**
- **`id`** - Unique identifier
- **`filename`** - Image filename (must exist in `public/images/`)
- **`caption`** - Photo description
- **`location`** - Where photo was taken
- **`taken_date`** - When photo was taken
- **`display_order`** - Sort order in gallery

## Content Loader Utility

**Location:** `backend/src/utils/contentLoader.js`

### Available Functions

#### `loadJSON(language, contentType)`

Load any JSON file by language and type.

```javascript
const projects = await loadJSON('en', 'projects');
const papers = await loadJSON('gr', 'papers');
const i18n = await loadJSON('en', 'content');
```

**Parameters:**
- `language` - Language code (e.g., 'en', 'gr')
- `contentType` - Content type (e.g., 'projects', 'papers', 'content')

**Returns:** Parsed JSON object or array

#### `loadBlogPost(language, pageName)`

Load a single blog post with frontmatter.

```javascript
const post = await loadBlogPost('en', 'welcome-to-my-blog');
// Returns: { title, page_name, created_at, content, language, ... }
```

**Parameters:**
- `language` - Language code
- `pageName` - Blog post filename (without .md)

**Returns:** Object with frontmatter data + content

#### `loadAllBlogPosts(language)`

List all blog posts (metadata only, no full content).

```javascript
const posts = await loadAllBlogPosts('en');
// Returns: [{ id, page_name, title, created_at, updated_at, ... }]
```

**Returns:** Array of post metadata, sorted by `updated_at` (descending)

#### `loadGallery(language, galleryName)`

Load a photo gallery with all photos.

```javascript
const gallery = await loadGallery('en', 'cricket-memories');
// Returns: { name, description, tags, photos: [...], language }
```

**Parameters:**
- `language` - Language code
- `galleryName` - Gallery filename (kebab-case, without .json)

#### `loadAllGalleries(language)`

List all galleries (metadata only, no photos).

```javascript
const galleries = await loadAllGalleries('en');
// Returns: [{ gallery_name, name, category, description, tags }]
```

#### `findById(language, contentType, id)`

Find a specific item by ID in a JSON array.

```javascript
const project = await findById('en', 'projects', 'arch-db');
const paper = await findById('en', 'papers', 'digital-methods-2023');
```

**Returns:** Single object or null if not found

#### `getContentValue(language, key)`

Get a specific i18n string by key.

```javascript
const welcome = await getContentValue('en', 'welcome');
// Returns: "Welcome to charno.net"
```

## Adding New Content

### Adding a New Project

1. Open `backend/content/en/projects.json`
2. Add a new object to the array:

```json
{
  "id": "my-new-project",
  "title": "My New Project",
  "description": "Description of the project",
  "url": "https://github.com/user/project",
  "technologies": "React, TypeScript, Node.js",
  "display_order": 4,
  "created_at": "2024-12-01",
  "updated_at": "2024-12-01"
}
```

3. Commit and push to Git
4. Backend automatically picks up changes on next request

### Adding a New Blog Post

1. Create a new file in `backend/content/en/blog/`

```bash
touch backend/content/en/blog/my-new-post.md
```

2. Add frontmatter and content:

```markdown
---
title: My New Blog Post
page_name: my-new-post
created_at: 2024-12-01
updated_at: 2024-12-01
---

# My New Blog Post

Content goes here...
```

3. Commit and push to Git

### Adding a New Photo Gallery

1. Create a new file in `backend/content/en/galleries/`

```bash
touch backend/content/en/galleries/my-gallery.json
```

2. Add gallery structure:

```json
{
  "name": "My Gallery",
  "category": "photography",
  "description": "A collection of photos",
  "tags": ["photos", "gallery"],
  "photos": [
    {
      "id": "photo-1",
      "filename": "image1.jpg",
      "caption": "First photo",
      "location": "Location",
      "taken_date": "2024-12-01",
      "display_order": 1
    }
  ]
}
```

3. Ensure image files exist in `frontend/public/images/`
4. Commit and push to Git

### Adding a New Language

1. Create a new language directory:

```bash
mkdir -p backend/content/fr
mkdir -p backend/content/fr/blog
mkdir -p backend/content/fr/galleries
```

2. Copy English content as a template:

```bash
cp backend/content/en/projects.json backend/content/fr/
cp backend/content/en/papers.json backend/content/fr/
cp backend/content/en/content.json backend/content/fr/
```

3. Translate the content in the new files

4. Update frontend language selector to include 'fr'

No code changes needed - the contentLoader automatically supports any language directory!

## Content Format Examples

### Complete Project Example

```json
{
  "id": "archaeological-database",
  "title": "Archaeological Database System",
  "description": "A comprehensive PostgreSQL-based system for managing archaeological excavation data, featuring geospatial queries, artifact tracking, and multi-season data correlation.",
  "url": "https://github.com/username/arch-db",
  "technologies": "PostgreSQL, PostGIS, Node.js, React, Leaflet",
  "display_order": 1,
  "created_at": "2022-03-15",
  "updated_at": "2024-06-20"
}
```

### Complete Paper Example

```json
{
  "id": "digital-methods-archaeology-2023",
  "title": "Digital Methods in Archaeological Research: A Comprehensive Review",
  "abstract": "This paper explores the application of digital technologies in modern archaeological research, focusing on GIS integration, 3D modeling, and database management systems. We present case studies from multiple excavation sites and demonstrate significant improvements in data accuracy and research efficiency.",
  "authors": "Michael Charno, Jane Doe, John Smith",
  "year": 2023,
  "journal": "Journal of Digital Archaeology",
  "pdf_url": "https://doi.org/10.example/paper123",
  "keywords": "archaeology, digital methods, GIS, 3D modeling, database systems",
  "link_text": "View Full Paper →",
  "created_at": "2023-05-10",
  "updated_at": "2023-05-15"
}
```

### Complete Blog Post Example

```markdown
---
title: Getting Started with Archaeological GIS
page_name: archaeological-gis-intro
created_at: 2024-01-15
updated_at: 2024-01-20
tags: ["archaeology", "GIS", "tutorial", "QGIS"]
author: Michael Charno
excerpt: A beginner's guide to using GIS software for archaeological research
---

# Getting Started with Archaeological GIS

Geographic Information Systems (GIS) have revolutionized archaeological research...

## What You'll Need

Before we begin, you'll need:

- QGIS (free, open-source GIS software)
- Sample archaeological survey data
- Basic understanding of coordinate systems

## Step 1: Setting Up Your Project

First, create a new QGIS project...

```python
# Example Python code for QGIS
from qgis.core import QgsProject

project = QgsProject.instance()
project.write('my_archaeological_site.qgz')
```

## Next Steps

Now that you have the basics...
```

### Complete Gallery Example

```json
{
  "name": "Greek Archaeological Sites",
  "category": "archaeology",
  "description": "Documentation from excavations at various Greek archaeological sites, including Mycenae, Epidaurus, and Olympia.",
  "tags": ["greece", "archaeology", "ancient", "excavation"],
  "photos": [
    {
      "id": "mycenae-lion-gate",
      "filename": "mycenae-lion-gate.jpg",
      "caption": "The famous Lion Gate entrance to Mycenae, circa 1250 BCE",
      "location": "Mycenae, Peloponnese, Greece",
      "taken_date": "2023-06-15",
      "display_order": 1
    },
    {
      "id": "epidaurus-theater",
      "filename": "epidaurus-theater.jpg",
      "caption": "The ancient theater at Epidaurus, known for perfect acoustics",
      "location": "Epidaurus, Peloponnese, Greece",
      "taken_date": "2023-06-16",
      "display_order": 2
    }
  ]
}
```

## Migration from Database

This application was originally designed with PostgreSQL in mind and was migrated to a file-based system. The database infrastructure remains available for future features.

### What Was Migrated

✅ Projects table → `projects.json`
✅ Papers table → `papers.json`
✅ Content table → `content.json`
✅ Blog_posts table → `blog/*.md` files
✅ Photos table → `galleries/*.json` files

### Database Still Available For

The PostgreSQL schema is maintained in `backend/src/config/schema.sql` for:

- 🔜 User authentication and profiles
- 🔜 Comments and discussions
- 🔜 Real-time features (notifications, etc.)
- 🔜 Analytics and usage tracking
- 🔜 Search indexing

### Hybrid Approach

You can use both file-based content AND database:

- **Files**: Static, editorial content (papers, projects, blog)
- **Database**: Dynamic, user-generated content (comments, likes, etc.)

## Best Practices

### ✅ Do

- Keep JSON files properly formatted (use Prettier)
- Use meaningful, descriptive IDs
- Include all required fields
- Test changes locally before committing
- Use consistent date formats (ISO 8601: YYYY-MM-DD)
- Add helpful comments in markdown files
- Keep frontmatter clean and minimal

### ❌ Don't

- Don't use special characters in IDs or filenames
- Don't commit without testing locally
- Don't forget to update both `en/` and `gr/` when applicable
- Don't use absolute file paths in content
- Don't store large binary files in content directory
- Don't manually edit generated fields

## Troubleshooting

### Content Not Showing Up

1. **Check file exists**: `ls backend/content/en/projects.json`
2. **Validate JSON**: Use online JSON validator or `jq` tool
3. **Check server logs**: Look for file loading errors
4. **Restart backend**: `cd backend && yarn dev`

### Invalid JSON Error

```bash
# Validate JSON file
jq . backend/content/en/papers.json

# If error, check for:
# - Missing commas
# - Trailing commas
# - Unmatched brackets
# - Unescaped quotes
```

### Blog Post Not Found

1. Check filename matches page_name in frontmatter
2. Ensure file has `.md` extension
3. Verify frontmatter is valid YAML
4. Check file is in correct language directory

### Gallery Images Not Loading

1. Verify image files exist in `frontend/public/images/`
2. Check filename matches exactly (case-sensitive)
3. Ensure image filenames have no spaces
4. Check image format is supported (jpg, png, gif)

## Performance Considerations

### Current Performance

- **File reads**: < 10ms per file
- **JSON parsing**: < 5ms for typical files
- **Markdown parsing**: < 20ms per post
- **Memory usage**: ~2MB per language

### Caching (Future)

Consider adding caching if:
- Content files > 100
- Request volume > 10,000/day
- Response times > 100ms

Potential caching layers:
- In-memory cache (Redis)
- Filesystem cache
- HTTP cache headers

## Summary

The file-based content system provides:

✅ Simple, transparent content management
✅ Full Git-based version control
✅ No database dependency
✅ Easy content editing and review
✅ Portable and backup-friendly

Perfect for editorial content that doesn't change frequently!
