# Uploading Photos to Your Gallery

This guide walks you through adding photos to your galleries on charno.net.

> **📁 Server Storage Note**: Photos are stored in `/data/charno-photos/` on your server (not inside Kubernetes pods). You can upload photos directly to this directory via SSH/SCP/rsync. See [SERVER_PHOTO_STORAGE.md](SERVER_PHOTO_STORAGE.md) for the simpler server-based workflow. This guide shows both the server-based approach and the pod-based approach.

## Quick Start

Adding photos to a gallery is a 4-step process:
1. **Prepare** your photos locally
2. **Edit** the gallery metadata (JSON file)
3. **Upload** photos to the server
4. **Commit** and deploy the metadata

---

## Step 1: Prepare Your Photos

### Organize Photos

Create a directory for each gallery:

```bash
mkdir -p ~/photos-to-upload/sikyon
cp ~/Pictures/greece-2023/*.jpg ~/photos-to-upload/sikyon/
```

### Optimize Photos

Your photos should be:
- **Format**: JPG or PNG
- **Max dimensions**: 2048px (width or height)
- **File size**: < 2MB per photo
- **Naming**: lowercase, hyphens, descriptive
  - ✅ Good: `sikyon-excavation-2023-trench-a.jpg`
  - ❌ Bad: `IMG_1234.JPG`, `Photo 1.jpg`

### Quick Optimization Script

```bash
# Resize large photos (requires ImageMagick)
cd ~/photos-to-upload/sikyon
for img in *.jpg; do
  convert "$img" -resize 2048x2048\> -quality 85 "optimized-$img"
done
```

---

## Step 2: Edit Gallery Metadata

### Find Your Gallery File

Gallery metadata is stored in:
```
backend/content/en/galleries/{gallery-name}.json
```

Available galleries:
- `sikyon.json` - Archaeological excavations
- `stymphalos.json` - Ancient site excavations
- `cricket.json` - Cricket matches
- `airplanes.json` - Aviation photography
- `cold-war.json` - Cold War sites
- `creatures.json` - Wildlife
- `dc.json` - Washington DC
- `nights.json` - Night photography
- `jordan.json` - Jordan travel
- `kyrgyzstan.json` - Kyrgyzstan landscapes
- `pace-egging.json` - Folk customs
- `russia.json` - Russian architecture
- `sunsets.json` - Sunsets
- `wedding.json` - Wedding photos

### Edit the Metadata

Open your gallery file:

```bash
cd ~/projects/homelab/web-app
vim backend/content/en/galleries/sikyon.json
```

Add your photos to the `photos` array:

```json
{
  "name": "Sikyon",
  "category": "archaeology",
  "description": "Archaeological excavations and findings from ancient Sikyon, Greece",
  "tags": ["archaeology", "greece", "ancient", "excavation", "sikyon"],
  "photos": [
    {
      "id": "sikyon-excavation-2023-01",
      "filename": "sikyon/excavation-2023-trench-a.jpg",
      "caption": "2023 excavation season, Trench A showing Hellenistic foundations",
      "location": "Ancient Sikyon, Peloponnese, Greece",
      "latitude": 37.9847,
      "longitude": 22.7217,
      "taken_date": "2023-07-15",
      "display_order": 1
    },
    {
      "id": "sikyon-artifact-ceramic-01",
      "filename": "sikyon/artifact-ceramic-vessel.jpg",
      "caption": "Hellenistic ceramic vessel found in Trench B",
      "location": "Ancient Sikyon, Peloponnese, Greece",
      "latitude": 37.9847,
      "longitude": 22.7217,
      "taken_date": "2023-07-20",
      "display_order": 2
    }
  ]
}
```

### Metadata Field Guide

**Required Fields:**
- `id` - Unique identifier (use gallery-name as prefix)
- `filename` - Path: `gallery-name/photo-filename.jpg`
- `caption` - Photo description (1-2 sentences)
- `display_order` - Number for sorting (use gaps: 10, 20, 30)

**Optional but Recommended:**
- `location` - Text location description
- `latitude` / `longitude` - GPS coordinates for map display
  - Get from photo EXIF or Google Maps
  - Right-click location → "What's here?"
- `taken_date` - ISO date format: `YYYY-MM-DD`

### Get GPS Coordinates

**From Photo EXIF:**
```bash
exiftool photo.jpg | grep GPS
# or
identify -verbose photo.jpg | grep GPS
```

**From Google Maps:**
1. Go to maps.google.com
2. Right-click the location
3. Click the coordinates at top to copy
4. Example: `37.9847, 22.7217`

---

## Step 3: Upload Photos to Server

### Recommended: Direct Server Upload

The easiest way is to upload directly to `/data/charno-photos/` on your server:

**Upload via rsync:**

```bash
# Upload to temp directory first
rsync -avz --progress ~/photos-to-upload/sikyon/ your-server:/tmp/sikyon-upload/

# Then move to photos directory with correct permissions
ssh your-server
sudo mkdir -p /data/charno-photos/sikyon
sudo rsync -a /tmp/sikyon-upload/ /data/charno-photos/sikyon/
sudo chown -R 1001:1001 /data/charno-photos/sikyon
sudo chmod 755 /data/charno-photos/sikyon
sudo chmod 644 /data/charno-photos/sikyon/*.jpg
sudo rm -rf /tmp/sikyon-upload

# Verify
ls -lh /data/charno-photos/sikyon/
```

**Upload via SCP:**

```bash
# Copy to server
scp ~/photos-to-upload/sikyon/*.jpg your-server:/tmp/sikyon/

# Move to photos directory
ssh your-server
sudo mkdir -p /data/charno-photos/sikyon
sudo mv /tmp/sikyon/* /data/charno-photos/sikyon/
sudo chown -R 1001:1001 /data/charno-photos/sikyon
sudo chmod 644 /data/charno-photos/sikyon/*.jpg
sudo rmdir /tmp/sikyon
```

See [SERVER_PHOTO_STORAGE.md](SERVER_PHOTO_STORAGE.md) for more details and helper scripts.

### Alternative: Upload via Kubernetes (kubectl cp)

If you prefer uploading through Kubernetes pods:

**Get Backend Pod Name:**

```bash
POD=$(kubectl get pod -n web -l app=charno-backend -o jsonpath='{.items[0].metadata.name}')
echo "Backend pod: $POD"
```

**Upload One Photo:**

```bash
kubectl cp ~/photos-to-upload/sikyon/excavation-2023-trench-a.jpg \
  web/$POD:/data/photos/sikyon/excavation-2023-trench-a.jpg
```

**Upload All Photos in a Directory:**

Create a script `upload-gallery-kubectl.sh`:

```bash
#!/bin/bash

GALLERY=$1
LOCAL_DIR=~/photos-to-upload/$GALLERY

if [ -z "$GALLERY" ]; then
  echo "Usage: ./upload-gallery.sh GALLERY_NAME"
  echo "Example: ./upload-gallery.sh sikyon"
  exit 1
fi

# Get backend pod
POD=$(kubectl get pod -n web -l app=charno-backend -o jsonpath='{.items[0].metadata.name}')

echo "📦 Uploading $GALLERY gallery photos..."
echo "Pod: $POD"
echo "Local: $LOCAL_DIR"
echo ""

# Create remote directory
kubectl exec -n web $POD -- mkdir -p /app/photos/$GALLERY

# Upload all photos
for photo in $LOCAL_DIR/*; do
  if [[ -f "$photo" ]]; then
    filename=$(basename "$photo")
    echo "  📸 Uploading $filename..."
    kubectl cp "$photo" "web/$POD:/app/photos/$GALLERY/$filename"
  fi
done

echo ""
echo "✅ Upload complete!"
echo "Verify: kubectl exec -n web $POD -- ls -lh /app/photos/$GALLERY/"
```

Make it executable and run:

```bash
chmod +x upload-gallery.sh
./upload-gallery.sh sikyon
```

### Verify Upload

```bash
# List uploaded photos
kubectl exec -n web $POD -- ls -lh /app/photos/sikyon/

# Test photo is accessible
curl -I https://charno.net/images/photos/sikyon/excavation-2023-trench-a.jpg
```

---

## Step 4: Commit and Deploy Metadata

### Validate Your Metadata

```bash
cd ~/projects/homelab/web-app
node scripts/validate-gallery.js sikyon
```

The validator checks:
- ✅ JSON syntax
- ✅ Required fields present
- ✅ GPS coordinates valid
- ✅ Date format correct
- ✅ No duplicate IDs

### Commit Changes

```bash
git add backend/content/en/galleries/sikyon.json
git commit -m "feat: Add Sikyon archaeological gallery with 15 photos

Added photos from 2023 excavation season including:
- Trench A foundations
- Ceramic artifacts
- Wall structures
- Team photos"

git push origin main
```

### Wait for Deployment

The GitHub Actions workflow will:
1. Run tests (~2 minutes)
2. Build new Docker images (~3 minutes)
3. Create manifest update branch

You'll see it at: https://github.com/mcharno/web-app/actions

Once complete, merge the manifest update PR or wait for auto-deployment.

### Verify Live

Visit your gallery:
```
https://charno.net/photos
```

Click on your gallery to see the photos!

---

## Complete Example: Adding Jordan Gallery

Here's a full example adding 5 photos to the Jordan gallery:

### 1. Prepare Photos

```bash
# Create local directory
mkdir -p ~/photos-to-upload/jordan

# Copy and rename photos
cp ~/Pictures/jordan-2024/petra1.jpg ~/photos-to-upload/jordan/petra-treasury-01.jpg
cp ~/Pictures/jordan-2024/wadi-rum.jpg ~/photos-to-upload/jordan/wadi-rum-sunset.jpg
cp ~/Pictures/jordan-2024/jerash.jpg ~/photos-to-upload/jordan/jerash-columns.jpg
cp ~/Pictures/jordan-2024/dead-sea.jpg ~/photos-to-upload/jordan/dead-sea-view.jpg
cp ~/Pictures/jordan-2024/amman.jpg ~/photos-to-upload/jordan/amman-citadel.jpg

# Optimize if needed
cd ~/photos-to-upload/jordan
for img in *.jpg; do
  convert "$img" -resize 2048x2048\> -quality 85 "../jordan-opt/$img"
done
```

### 2. Edit Metadata

Edit `backend/content/en/galleries/jordan.json`:

```json
{
  "name": "Jordan",
  "category": "travel",
  "description": "Ancient ruins, desert landscapes, and culture from the Hashemite Kingdom of Jordan",
  "tags": ["jordan", "travel", "petra", "desert", "middle-east", "archaeology"],
  "photos": [
    {
      "id": "jordan-petra-treasury-01",
      "filename": "jordan/petra-treasury-01.jpg",
      "caption": "Al-Khazneh (The Treasury) at Petra, carved into rose-red sandstone",
      "location": "Petra, Jordan",
      "latitude": 30.3285,
      "longitude": 35.4444,
      "taken_date": "2024-03-15",
      "display_order": 10
    },
    {
      "id": "jordan-wadi-rum-sunset",
      "filename": "jordan/wadi-rum-sunset.jpg",
      "caption": "Desert sunset over the dramatic rock formations of Wadi Rum",
      "location": "Wadi Rum, Jordan",
      "latitude": 29.5759,
      "longitude": 35.4184,
      "taken_date": "2024-03-17",
      "display_order": 20
    },
    {
      "id": "jordan-jerash-columns",
      "filename": "jordan/jerash-columns.jpg",
      "caption": "Colonnaded street in the ancient Roman city of Jerash",
      "location": "Jerash, Jordan",
      "latitude": 32.2811,
      "longitude": 35.8908,
      "taken_date": "2024-03-14",
      "display_order": 30
    },
    {
      "id": "jordan-dead-sea-view",
      "filename": "jordan/dead-sea-view.jpg",
      "caption": "View across the Dead Sea from the Jordanian shore",
      "location": "Dead Sea, Jordan",
      "latitude": 31.5590,
      "longitude": 35.4732,
      "taken_date": "2024-03-16",
      "display_order": 40
    },
    {
      "id": "jordan-amman-citadel",
      "filename": "jordan/amman-citadel.jpg",
      "caption": "Ruins of the Temple of Hercules at Amman Citadel",
      "location": "Amman Citadel, Jordan",
      "latitude": 31.9539,
      "longitude": 35.9346,
      "taken_date": "2024-03-13",
      "display_order": 50
    }
  ]
}
```

### 3. Upload Photos

```bash
# Get pod name
POD=$(kubectl get pod -n web -l app=charno-backend -o jsonpath='{.items[0].metadata.name}')

# Create directory
kubectl exec -n web $POD -- mkdir -p /app/photos/jordan

# Upload all photos
cd ~/photos-to-upload/jordan-opt
for photo in *.jpg; do
  echo "Uploading $photo..."
  kubectl cp "$photo" "web/$POD:/app/photos/jordan/$photo"
done

# Verify
kubectl exec -n web $POD -- ls -lh /app/photos/jordan/
```

### 4. Validate and Deploy

```bash
cd ~/projects/homelab/web-app

# Validate
node scripts/validate-gallery.js jordan

# Commit
git add backend/content/en/galleries/jordan.json
git commit -m "feat: Add Jordan travel gallery with 5 photos from 2024 trip"
git push origin main

# Wait for GitHub Actions, then merge the manifest PR
```

### 5. Test

```bash
# Test API
curl https://charno.net/api/photos/gallery/jordan | jq '.[].caption'

# Visit in browser
open https://charno.net/photos
```

---

## Tips and Best Practices

### Photo Naming Convention

Use this pattern: `{gallery}-{subject}-{number}.jpg`

Examples:
- `sikyon-excavation-01.jpg`
- `cricket-team-2023.jpg`
- `jordan-petra-treasury-01.jpg`
- `kyrgyzstan-mountains-landscape-01.jpg`

### Caption Writing

Good captions:
- ✅ "Hellenistic wall foundation excavated in Trench A, 2023 season"
- ✅ "The Treasury (Al-Khazneh) at Petra, carved in 1st century CE"

Bad captions:
- ❌ "wall"
- ❌ "IMG_1234"
- ❌ "A photo I took"

### Display Order

Use gaps of 10 to allow easy insertion later:
- 10, 20, 30, 40... (can insert 15, 25 later)
- NOT: 1, 2, 3, 4... (hard to reorder)

### GPS Coordinates

- **Do include** for: landmarks, cities, scenic locations
- **Don't include** for: private locations, home addresses
- Precision: 4-6 decimal places is sufficient
  - 4 decimals: ~11 meters
  - 6 decimals: ~11 centimeters

---

## Troubleshooting

### Photos Not Showing

**Check 1: Photo uploaded correctly?**
```bash
POD=$(kubectl get pod -n web -l app=charno-backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n web $POD -- ls -lh /app/photos/sikyon/
```

**Check 2: Filename matches metadata?**
- Metadata: `"filename": "sikyon/excavation-01.jpg"`
- Server path: `/app/photos/sikyon/excavation-01.jpg`

**Check 3: Photo accessible via web?**
```bash
curl -I https://charno.net/images/photos/sikyon/excavation-01.jpg
```

Should return `HTTP/2 200`

### Gallery Not Updating

**Option 1: Clear browser cache**
- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

**Option 2: Check if new images deployed**
```bash
kubectl get pods -n web -o jsonpath='{.items[*].spec.containers[0].image}' | tr ' ' '\n'
```

Should show recent image tag (e.g., `main-abc1234`)

**Option 3: Force restart backend**
```bash
kubectl rollout restart deployment/charno-backend -n web
```

### Validation Errors

**Error: "GPS coordinates invalid"**
- Latitude must be -90 to 90
- Longitude must be -180 to 180
- Use decimal format: `37.9847`, not `37° 59' 05"`

**Error: "Date format invalid"**
- Use ISO format: `YYYY-MM-DD`
- Good: `2023-07-15`
- Bad: `July 15, 2023`, `15/07/23`

**Error: "Duplicate photo ID"**
- Each photo needs a unique ID
- Use gallery prefix: `sikyon-photo-01`, `jordan-petra-01`

---

## Batch Operations

### Upload Multiple Galleries

Create `upload-all.sh`:

```bash
#!/bin/bash

GALLERIES=("sikyon" "jordan" "kyrgyzstan" "sunsets")

POD=$(kubectl get pod -n web -l app=charno-backend -o jsonpath='{.items[0].metadata.name}')

for gallery in "${GALLERIES[@]}"; do
  echo "📦 Uploading $gallery..."
  kubectl exec -n web $POD -- mkdir -p /app/photos/$gallery

  for photo in ~/photos-to-upload/$gallery/*; do
    if [[ -f "$photo" ]]; then
      filename=$(basename "$photo")
      kubectl cp "$photo" "web/$POD:/app/photos/$gallery/$filename"
    fi
  done
done

echo "✅ All galleries uploaded!"
```

### Backup All Photos

```bash
#!/bin/bash

POD=$(kubectl get pod -n web -l app=charno-backend -o jsonpath='{.items[0].metadata.name}')
BACKUP_DIR=~/photo-backups/$(date +%Y%m%d)

mkdir -p $BACKUP_DIR

kubectl exec -n web $POD -- tar czf - /app/photos | tar xzf - -C $BACKUP_DIR

echo "✅ Backup saved to: $BACKUP_DIR"
```

---

## Quick Reference

### Common Commands

```bash
# Get backend pod
POD=$(kubectl get pod -n web -l app=charno-backend -o jsonpath='{.items[0].metadata.name}')

# List all galleries on server
kubectl exec -n web $POD -- ls /app/photos/

# List photos in a gallery
kubectl exec -n web $POD -- ls -lh /app/photos/sikyon/

# Check storage usage
kubectl exec -n web $POD -- df -h /app/photos

# Test API endpoint
curl https://charno.net/api/photos/galleries | jq -r '.[].name'

# Validate gallery metadata
node scripts/validate-gallery.js sikyon

# Restart backend
kubectl rollout restart deployment/charno-backend -n web
```

### File Paths

- **Local metadata**: `backend/content/en/galleries/{gallery}.json`
- **Local photos (2600 only)**: `frontend/public/images/photos/2600/`
- **Server photos**: `/app/photos/` (in backend pod)
- **Public URL**: `https://charno.net/images/photos/{gallery}/{photo}.jpg`
- **API**: `https://charno.net/api/photos/gallery/{gallery}`

---

## Next Steps

1. **Pick a gallery** to start with
2. **Prepare 5-10 photos** as a test
3. **Follow the 4 steps** above
4. **Verify** it works on charno.net
5. **Repeat** for other galleries!

For more details, see [PHOTO_MANAGEMENT.md](../PHOTO_MANAGEMENT.md)

Happy photo uploading! 📸
