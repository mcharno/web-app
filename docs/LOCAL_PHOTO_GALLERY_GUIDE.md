# Local Photo Gallery Development Guide

This guide explains how to add and manage photo galleries for local development and testing.

## Overview

The photo gallery system is file-based and stores gallery data in JSON files with associated images in the public directory. This allows you to version control your gallery structure and easily test galleries locally without requiring a database.

## Directory Structure

```
web-app/
├── backend/
│   └── content/
│       └── en/                    # Language-specific content
│           └── galleries/          # Gallery definitions
│               ├── 2600.json       # Example: 2600 payphone gallery
│               ├── cricket-memories.json
│               └── ...
└── frontend/
    └── public/
        └── images/
            └── photos/             # Photo files
                ├── 2600/           # Gallery-specific subdirectory
                │   ├── README.md
                │   └── *.jpg       # Your photos go here
                └── ...
```

## Creating a New Gallery

### Step 1: Create Gallery JSON File

Create a JSON file in `/backend/content/en/galleries/` with your gallery name (use kebab-case).

Example: `/backend/content/en/galleries/my-gallery.json`

```json
{
  "name": "My Gallery Name",
  "category": "category-name",
  "description": "Brief description of this gallery",
  "tags": ["tag1", "tag2", "tag3"],
  "photos": [
    {
      "id": "unique-photo-id",
      "filename": "my-gallery/photo-01.jpg",
      "caption": "Photo description",
      "location": "Location name",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "taken_date": "2024-01-15",
      "display_order": 1,
      "notes": "Optional additional notes"
    }
  ]
}
```

### Step 2: Create Photo Directory

Create a directory for your gallery photos:

```bash
mkdir -p frontend/public/images/photos/my-gallery
```

### Step 3: Add Photos

Add your photo files to the directory you created. Make sure the filenames match what you specified in the JSON file.

### Step 4: Update Gallery Metadata

For each photo, update the JSON file with:
- **id**: Unique identifier (e.g., `my-gallery-photo-01`)
- **filename**: Relative path from `/images/photos/` (e.g., `my-gallery/photo-01.jpg`)
- **caption**: Brief description
- **location**: Where the photo was taken
- **latitude/longitude**: GPS coordinates (optional, enables map view)
- **taken_date**: Date in YYYY-MM-DD format
- **display_order**: Order for gallery display
- **notes**: Any additional context (optional)

## Gallery JSON Schema

### Gallery Metadata
- `name` (string, required): Display name of the gallery
- `category` (string, required): Category for grouping (e.g., "sports", "travel", "tech")
- `description` (string, required): Brief description shown on gallery card
- `tags` (array, required): Searchable tags for the gallery

### Photo Metadata
- `id` (string, required): Unique identifier for the photo
- `filename` (string, required): Path relative to `/images/photos/`
- `caption` (string, required): Description of the photo
- `location` (string, optional): Where photo was taken
- `latitude` (number, optional): GPS latitude for map view
- `longitude` (number, optional): GPS longitude for map view
- `taken_date` (string, optional): Date in YYYY-MM-DD format
- `display_order` (number, required): Order in gallery (1, 2, 3, ...)
- `notes` (string, optional): Additional metadata or context

## Photo File Guidelines

- **Formats**: JPG, PNG, GIF
- **Size**: Recommended max 2000px on longest side
- **File size**: Keep under 2MB for web performance
- **Naming**: Use descriptive, kebab-case names (e.g., `payphone-times-square.jpg`)

## Example: 2600 Gallery

A sample gallery has been created at:
- Gallery definition: `/backend/content/en/galleries/2600.json`
- Photos directory: `/frontend/public/images/photos/2600/`
- Template: `/backend/content/en/galleries/2600-template.json`

This gallery demonstrates a payphone photography collection inspired by 2600 Magazine.

## Testing Your Gallery

1. Start the development server:
   ```bash
   yarn dev
   ```

2. Navigate to `/photos` in your browser

3. Your new gallery should appear in the galleries grid

4. Click on the gallery to view photos

5. Use the Map tab to see photos with GPS coordinates

## Multi-language Support

To add translations for other languages (e.g., Greek):

1. Create `/backend/content/gr/galleries/my-gallery.json`
2. Translate the gallery name, description, captions, and tags
3. Use the same photo files (filenames stay the same)
4. The system automatically loads the correct language based on user preference

## API Endpoints

The gallery system uses these endpoints:

- `GET /api/photos/galleries` - List all galleries
- `GET /api/photos/galleries/:name` - Get photos for a specific gallery
- `GET /api/photos` - Get all photos (for map view)
- `GET /api/photos/:id` - Get specific photo by ID

## Troubleshooting

**Gallery not appearing:**
- Check that JSON file is in `/backend/content/en/galleries/`
- Verify JSON syntax is valid
- Ensure file name uses kebab-case

**Photos not loading:**
- Verify photo files exist in `/frontend/public/images/photos/`
- Check that `filename` in JSON matches actual file path
- Ensure photos are web-compatible formats (JPG/PNG/GIF)

**Map not showing photos:**
- Add `latitude` and `longitude` to photo entries
- Coordinates should be decimal degrees (e.g., 40.7128, -74.0060)

## Version Control

The gallery system is designed to be version controlled:
- Gallery JSON files should be committed to git
- Photo files can be committed (if reasonable size) or git-ignored
- Use `.gitignore` to exclude large photo directories if needed
- The `.gitkeep` file ensures empty directories are tracked
