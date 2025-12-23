# Photo Galleries

This directory contains JSON files that define photo galleries for the web application.

## Quick Start

Each `.json` file in this directory represents a photo gallery. The filename (without `.json`) is used as the gallery identifier in URLs.

## Gallery Structure

```json
{
  "name": "Display Name",
  "category": "category-name",
  "description": "Brief description",
  "tags": ["tag1", "tag2"],
  "photos": [
    {
      "id": "unique-id",
      "filename": "gallery-name/photo.jpg",
      "caption": "Photo description",
      "location": "Location name",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "taken_date": "2024-01-15",
      "display_order": 1,
      "notes": "Optional notes"
    }
  ]
}
```

## Current Galleries

- **2600.json** - Pay phone photography (2600 Magazine tribute)
- **archaeological-sites.json** - Archaeological documentation
- **cricket-memories.json** - Cricket team photos
- **mediterranean-adventures.json** - Mediterranean travel
- **nature-wildlife.json** - Nature and wildlife photography
- **portraits.json** - Portrait photography
- **travel-places.json** - Travel photography
- **urban-explorations.json** - Urban photography

## Adding a New Gallery

1. Create a new `.json` file with your gallery name (use kebab-case)
2. Follow the structure shown above
3. Create a matching directory in `/frontend/public/images/photos/`
4. Add your photos to that directory
5. Validate using: `yarn validate-gallery <gallery-name>`

## Tools & Resources

- **Validation**: `yarn validate-gallery 2600`
- **Full Guide**: See `/docs/LOCAL_PHOTO_GALLERY_GUIDE.md`
- **Quick Reference**: See `2600-QUICKSTART.md` for quick add instructions
- **Template**: See `2600-template.json` for copy-paste photo entries

## Required Fields

### Gallery
- `name`, `category`, `description`, `tags`, `photos`

### Photo
- `id`, `filename`, `caption`, `display_order`

### Optional
- `location`, `latitude`, `longitude`, `taken_date`, `notes`

## Photo Files

Photos are stored in `/frontend/public/images/photos/` organized by gallery subdirectories.

Example:
- Gallery: `2600.json`
- Photos: `/frontend/public/images/photos/2600/*.jpg`
