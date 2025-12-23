# 2600 Gallery - Pay Phone Photography

This directory contains photos for the 2600 gallery, inspired by 2600 Magazine.

## Adding Photos

1. Add your payphone photos to this directory with descriptive names (e.g., `payphone-01.jpg`, `payphone-02.jpg`, etc.)
2. Update the gallery metadata in `/backend/content/en/galleries/2600.json` with:
   - `id`: Unique identifier for the photo
   - `filename`: Path relative to `/images/photos/` (e.g., `2600/payphone-01.jpg`)
   - `caption`: Brief description of the photo
   - `location`: Where the photo was taken
   - `latitude` & `longitude`: GPS coordinates (optional, for map view)
   - `taken_date`: When the photo was taken (YYYY-MM-DD format)
   - `display_order`: Order in which photos appear in the gallery
   - `notes`: Any additional metadata (optional)

## Photo Requirements

- Format: JPG, PNG, or GIF
- Recommended size: Max 2000px on longest side
- Keep file sizes reasonable for web viewing (< 2MB per image)

## Example Photo Entry

```json
{
  "id": "payphone-times-square",
  "filename": "2600/payphone-times-square.jpg",
  "caption": "Last remaining payphone in Times Square",
  "location": "Times Square, New York, NY",
  "latitude": 40.7580,
  "longitude": -73.9855,
  "taken_date": "2024-06-15",
  "display_order": 1,
  "notes": "One of the few surviving payphones in this area"
}
```

## 2600 Magazine Context

2600 Magazine has been the voice of the hacker community since 1984, named after the 2600 Hz tone
used in phone phreaking. This gallery documents the physical remnants of the telephone infrastructure
that played such a significant role in early hacking and phreaking culture.
