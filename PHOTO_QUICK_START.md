# Photo Gallery Quick Start

The fastest way to add photos to your galleries on charno.net.

## One-Time Server Setup

SSH to your server and run the setup script:

```bash
# Download and run the setup script
sudo ./scripts/setup-photo-storage.sh
```

This creates `/data/charno-photos` with the correct permissions.

## Adding Photos to a Gallery

### 1. Prepare Photos Locally

```bash
# Create directory for your photos
mkdir -p ~/photo-originals/sikyon

# Copy your photos
cp ~/Pictures/excavation/*.jpg ~/photo-originals/sikyon/
cd ~/photo-originals/sikyon

# Rename with descriptive names (lowercase, hyphens)
mv IMG_1234.jpg excavation-2023-trench-a.jpg
mv IMG_1235.jpg artifact-ceramic-vessel.jpg

# Extract GPS coordinates (before optimization strips them)
for img in *.jpg; do
  echo "$img:"
  exiftool "$img" | grep GPS
done > ../sikyon-gps.txt

# Optimize for web (resize to 2048px, quality 85, strip EXIF)
cd ~/photo-originals
../projects/homelab/web-app/scripts/optimize-photos.sh sikyon
# Creates: sikyon-optimized/

# Move to upload directory
mv sikyon-optimized ~/photos-to-upload/sikyon
```

### 2. Upload to Server

```bash
# Edit the server hostname in scripts/upload-gallery.sh first
vim scripts/upload-gallery.sh
# Change: SERVER=${2:-"your-server"}
# To:     SERVER=${2:-"192.168.1.100"}  # or your hostname

# Upload the gallery
./scripts/upload-gallery.sh sikyon

# Or specify server directly
./scripts/upload-gallery.sh sikyon 192.168.1.100
```

The script will:
- Upload photos via rsync
- Set correct permissions automatically
- Verify the upload
- Show you next steps

### 3. Update Metadata

```bash
# Edit the gallery JSON file
vim backend/content/en/galleries/sikyon.json
```

Add your photos:

```json
{
  "name": "Sikyon",
  "category": "archaeology",
  "description": "Archaeological excavations and findings from ancient Sikyon, Greece",
  "tags": ["archaeology", "greece", "ancient", "excavation", "sikyon"],
  "photos": [
    {
      "id": "sikyon-excavation-2023-trench-a",
      "filename": "sikyon/excavation-2023-trench-a.jpg",
      "caption": "2023 excavation season, Trench A showing Hellenistic foundations",
      "location": "Ancient Sikyon, Peloponnese, Greece",
      "latitude": 37.9847,
      "longitude": 22.7217,
      "taken_date": "2023-07-15",
      "display_order": 10
    },
    {
      "id": "sikyon-artifact-ceramic-vessel",
      "filename": "sikyon/artifact-ceramic-vessel.jpg",
      "caption": "Hellenistic ceramic vessel found in Trench B",
      "location": "Ancient Sikyon, Peloponnese, Greece",
      "latitude": 37.9847,
      "longitude": 22.7217,
      "taken_date": "2023-07-20",
      "display_order": 20
    }
  ]
}
```

**Required fields:**
- `id` - Unique identifier (prefix with gallery name)
- `filename` - Path: `gallery-name/photo-filename.jpg`
- `caption` - Description (1-2 sentences)
- `display_order` - Number for sorting (use gaps: 10, 20, 30)

**Optional:**
- `location` - Location description
- `latitude` / `longitude` - GPS coordinates for map
- `taken_date` - ISO date: `YYYY-MM-DD`

### 4. Validate and Deploy

```bash
# Validate metadata
node scripts/validate-gallery.js sikyon

# Commit
git add backend/content/en/galleries/sikyon.json
git commit -m "feat: Add Sikyon archaeological gallery photos"
git push origin main

# Wait for CI/CD (~5 minutes), then check
open https://charno.net/photos
```

## Available Galleries

- **2600** - Pay phone photography
- **Airplanes** - Aviation photography
- **Cold War** - Cold War era sites
- **Creatures** - Wildlife photography
- **Cricket** - Cricket matches
- **DC** - Washington DC
- **Jordan** - Jordan travel
- **Kyrgyzstan** - Central Asia landscapes
- **Nights** - Night photography
- **Pace Egging** - Folk customs
- **Russia** - Russian architecture
- **Sikyon** - Archaeological excavations
- **Stymphalos** - Ancient site excavations
- **Sunsets** - Sunset photography
- **Wedding** - Wedding photos

## Quick Commands

```bash
# Setup server (one-time)
sudo ./scripts/setup-photo-storage.sh

# Upload gallery
./scripts/upload-gallery.sh gallery-name

# Validate metadata
node scripts/validate-gallery.js gallery-name

# Check what's on server
ssh your-server "ls -lh /data/charno-photos/gallery-name/"

# Check storage usage
ssh your-server "df -h /data && du -sh /data/charno-photos/*"
```

## Getting GPS Coordinates

### From Photo EXIF

```bash
exiftool photo.jpg | grep GPS
```

### From Google Maps

1. Go to [maps.google.com](https://maps.google.com)
2. Right-click the location
3. Click the coordinates to copy
4. Example: `37.9847, 22.7217`

## Tips

### Photo Naming

Good: `sikyon-excavation-2023-trench-a.jpg`
Bad: `IMG_1234.jpg`, `Photo 1.JPG`

### Captions

Good: "Hellenistic wall foundation excavated in Trench A, 2023 season"
Bad: "wall", "IMG_1234"

### Display Order

Use gaps of 10: `10, 20, 30, 40...`
This allows inserting photos later: `15, 25, 35...`

## Troubleshooting

### Photos Not Showing

```bash
# 1. Check on server
ssh your-server "ls -la /data/charno-photos/sikyon/"

# 2. Check from pod
POD=$(kubectl get pod -n web -l app=charno-backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n web $POD -- ls -la /data/photos/sikyon/

# 3. Check web access
curl -I https://charno.net/images/photos/sikyon/photo.jpg

# 4. Check permissions
ssh your-server "sudo chown -R 1001:1001 /data/charno-photos"
```

### Need Help?

See detailed documentation:
- [SERVER_PHOTO_STORAGE.md](docs/SERVER_PHOTO_STORAGE.md) - Complete server setup
- [UPLOADING_PHOTOS.md](docs/UPLOADING_PHOTOS.md) - Detailed workflow
- [PHOTO_MANAGEMENT.md](PHOTO_MANAGEMENT.md) - System overview

## Example: Complete Workflow

```bash
# 1. Prepare
mkdir -p ~/photos-to-upload/jordan
cp ~/Pictures/jordan-2024/*.jpg ~/photos-to-upload/jordan/
cd ~/photos-to-upload/jordan
# Rename files with descriptive names

# 2. Upload
cd ~/projects/homelab/web-app
./scripts/upload-gallery.sh jordan

# 3. Update metadata
vim backend/content/en/galleries/jordan.json
# Add photo entries

# 4. Deploy
node scripts/validate-gallery.js jordan
git add backend/content/en/galleries/jordan.json
git commit -m "feat: Add Jordan travel gallery"
git push origin main

# 5. Verify
open https://charno.net/photos
```

That's it! 🎉
