# 2600 Gallery Quick Start Guide

## Quick Add Photo Steps

1. **Add your photo** to `/frontend/public/images/photos/2600/`
   - Name it something descriptive (e.g., `payphone-times-square.jpg`)

2. **Edit** `/backend/content/en/galleries/2600.json`

3. **Add an entry** to the `photos` array:

```json
{
  "id": "payphone-your-location",
  "filename": "2600/your-photo-name.jpg",
  "caption": "Brief description",
  "location": "City, State",
  "latitude": 0.0,
  "longitude": 0.0,
  "taken_date": "2024-MM-DD",
  "display_order": X,
  "notes": "Optional notes"
}
```

4. **Save** and refresh your browser at `http://localhost:5173/photos`

## Finding GPS Coordinates

- Google Maps: Right-click location → Click coordinates
- iPhone: Photos app → Swipe up on photo → See location
- Online: https://www.latlong.net/

## Sample Entry (Copy & Modify)

```json
{
  "id": "payphone-001",
  "filename": "2600/payphone-001.jpg",
  "caption": "Classic red phone booth",
  "location": "London, UK",
  "latitude": 51.5074,
  "longitude": -0.1278,
  "taken_date": "2024-06-15",
  "display_order": 1,
  "notes": "Iconic British Telecom booth near Piccadilly"
}
```

## Current Gallery Status

- Gallery name: **2600**
- Category: **tech**
- Current photos: **3 sample entries** (ready to be replaced)
- Location: `/backend/content/en/galleries/2600.json`

## Tips

- Keep `display_order` sequential (1, 2, 3, ...)
- Make `id` unique and descriptive
- Use kebab-case for filenames
- Optional fields: `latitude`, `longitude`, `notes`, `location`
- Required fields: `id`, `filename`, `caption`, `taken_date`, `display_order`
