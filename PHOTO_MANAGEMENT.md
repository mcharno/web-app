# Photo Gallery Management Guide

This guide explains how to manage photo galleries in the web-app, with a separation between local development (2600 gallery) and server-only galleries.

## Overview

The photo system has two types of galleries:

1. **Local Development Gallery (2600)**: Full metadata and photos stored in the repository for testing
2. **Server-Only Galleries**: Metadata in repository, photos stored only on the production server

## Gallery Structure

### Metadata Location
All gallery metadata files are stored in: `/backend/content/en/galleries/`

Each gallery is a JSON file with this structure:
```json
{
  "name": "Gallery Name",
  "category": "category-name",
  "description": "Gallery description",
  "tags": ["tag1", "tag2", "tag3"],
  "photos": [
    {
      "id": "unique-photo-id",
      "filename": "gallery-name/photo-filename.jpg",
      "caption": "Photo caption",
      "location": "Location name",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "taken_date": "2024-01-15",
      "display_order": 1
    }
  ]
}
```

### Photo Storage

- **Local Development**: Photos stored in `/frontend/public/images/photos/2600/`
- **Production Server**: Photos stored in Kubernetes PersistentVolume mounted at `/app/photos/`

## Available Galleries

### Local Development
- **2600**: Pay phone photography (metadata + photos in repo)

### Server-Only (metadata in repo, photos on server)
- **Sikyon**: Archaeological excavations
- **Stymphalos**: Ancient site and excavations
- **Cricket**: Cricket matches and teams
- **Airplanes**: Aviation photography
- **Cold War**: Cold War era sites
- **Creatures**: Wildlife photography
- **Washington DC**: Nation's capital
- **Nights**: Night photography
- **Jordan**: Travel in Jordan
- **Kyrgyzstan**: Central Asia landscapes
- **Pace Egging**: Traditional folk customs
- **Russia**: Russian architecture and culture
- **Sunsets**: Sunset photography
- **Wedding**: Wedding celebrations

## Adding Photos to Server-Only Galleries

### Step 1: Prepare Your Photos

1. Organize photos by gallery in subdirectories
2. Use descriptive filenames (lowercase, hyphens, no spaces)
3. Recommended formats: JPG, PNG
4. Optimize images for web (recommended max width: 2048px)

Example directory structure:
```
photos/
├── sikyon/
│   ├── excavation-2023-01.jpg
│   ├── excavation-2023-02.jpg
│   └── artifact-ceramic-01.jpg
├── jordan/
│   ├── petra-treasury-01.jpg
│   └── wadi-rum-sunset.jpg
```

### Step 2: Update Gallery Metadata

Edit the gallery JSON file in `/backend/content/en/galleries/{gallery-name}.json`:

```json
{
  "name": "Sikyon",
  "category": "archaeology",
  "description": "Archaeological excavations and findings from ancient Sikyon, Greece",
  "tags": ["archaeology", "greece", "ancient", "excavation", "sikyon"],
  "photos": [
    {
      "id": "sikyon-excavation-2023-01",
      "filename": "sikyon/excavation-2023-01.jpg",
      "caption": "2023 excavation season, Trench A",
      "location": "Ancient Sikyon, Peloponnese, Greece",
      "latitude": 37.9847,
      "longitude": 22.7217,
      "taken_date": "2023-07-15",
      "display_order": 1
    },
    {
      "id": "sikyon-excavation-2023-02",
      "filename": "sikyon/excavation-2023-02.jpg",
      "caption": "Hellenistic wall foundation",
      "location": "Ancient Sikyon, Peloponnese, Greece",
      "latitude": 37.9847,
      "longitude": 22.7217,
      "taken_date": "2023-07-16",
      "display_order": 2
    }
  ]
}
```

**Required fields**:
- `id`: Unique identifier (use gallery-name prefix)
- `filename`: Path relative to photos root (gallery-name/filename.jpg)
- `caption`: Photo description
- `display_order`: Numeric ordering in gallery

**Optional but recommended**:
- `location`: Text location description
- `latitude` / `longitude`: GPS coordinates for map display
- `taken_date`: ISO date (YYYY-MM-DD)

### Step 3: Upload Photos to Server

#### Option A: Using kubectl cp (Direct Upload)

```bash
# Find the backend pod name
kubectl get pods -n web | grep charno-backend

# Create gallery directory
kubectl exec -n web charno-backend-XXXXXX -- mkdir -p /app/photos/sikyon

# Upload photos
kubectl cp local/photos/sikyon/excavation-2023-01.jpg \
  web/charno-backend-XXXXXX:/app/photos/sikyon/excavation-2023-01.jpg

kubectl cp local/photos/sikyon/excavation-2023-02.jpg \
  web/charno-backend-XXXXXX:/app/photos/sikyon/excavation-2023-02.jpg
```

#### Option B: Using a Batch Script

Create a script to upload multiple photos:

```bash
#!/bin/bash
POD=$(kubectl get pod -n web -l app=charno-backend -o jsonpath='{.items[0].metadata.name}')
GALLERY="sikyon"
LOCAL_DIR="./photos/${GALLERY}"

# Create remote directory
kubectl exec -n web $POD -- mkdir -p /app/photos/${GALLERY}

# Upload all photos
for photo in ${LOCAL_DIR}/*; do
  filename=$(basename "$photo")
  echo "Uploading $filename..."
  kubectl cp "$photo" "web/${POD}:/app/photos/${GALLERY}/${filename}"
done

echo "Upload complete!"
```

#### Option C: Using rsync through kubectl port-forward

For large galleries, you can set up rsync access:

```bash
# Port-forward to backend pod
kubectl port-forward -n web svc/charno-backend 3080:3080

# In another terminal, rsync photos
# (requires setting up SSH/rsync access to the container)
```

### Step 4: Verify Upload

Check photos are accessible:

```bash
# List photos in gallery
kubectl exec -n web charno-backend-XXXXXX -- ls -lh /app/photos/sikyon/

# Test photo endpoint
curl https://charno.net/images/photos/sikyon/excavation-2023-01.jpg
```

### Step 5: Commit Metadata Changes

```bash
# Add gallery metadata to git
git add backend/content/en/galleries/sikyon.json

# Commit
git commit -m "Add Sikyon gallery metadata"

# Push to trigger deployment
git push origin main
```

## Validating Gallery Metadata

Use the validation script to check your gallery metadata:

```bash
# Validate specific gallery
node scripts/validate-gallery.js sikyon

# The script checks:
# - JSON syntax
# - Required fields
# - Photo file references (for local galleries)
# - GPS coordinate validity
# - Date format
# - Duplicate IDs and display orders
```

## Photo Persistence

The photo storage uses a Kubernetes PersistentVolumeClaim:

- **Name**: `photos-pvc`
- **Capacity**: 10Gi
- **Access Mode**: ReadWriteOnce
- **Storage Class**: local-path (k3s)

Photos persist across pod restarts and deployments. However:
- Always keep backups of original photos
- The PVC is bound to a single node in your cluster
- Deleting the PVC will delete all photos

## Backup Strategy

### Backing Up Server Photos

```bash
# Create backup directory
mkdir -p backups/photos/$(date +%Y%m%d)

# Copy all photos from server
POD=$(kubectl get pod -n web -l app=charno-backend -o jsonpath='{.items[0].metadata.name}')

kubectl exec -n web $POD -- tar czf - /app/photos | \
  tar xzf - -C backups/photos/$(date +%Y%m%d)
```

### Restoring Photos

```bash
# Upload backup to pod
POD=$(kubectl get pod -n web -l app=charno-backend -o jsonpath='{.items[0].metadata.name}')

tar czf - -C backups/photos/20240115/app photos | \
  kubectl exec -i -n web $POD -- tar xzf - -C /
```

## Troubleshooting

### Photos Not Displaying

1. **Check photo path in metadata**:
   - Ensure `filename` matches actual file path
   - Path should be relative: `gallery-name/photo.jpg`

2. **Verify photo exists on server**:
   ```bash
   kubectl exec -n web charno-backend-XXXXXX -- ls /app/photos/sikyon/
   ```

3. **Check file permissions**:
   ```bash
   kubectl exec -n web charno-backend-XXXXXX -- ls -la /app/photos/sikyon/
   ```
   Files should be readable by the backend user (UID 1001)

4. **Test direct access**:
   ```
   https://charno.net/images/photos/sikyon/photo.jpg
   ```

### Gallery Not Showing

1. **Validate metadata**:
   ```bash
   node scripts/validate-gallery.js gallery-name
   ```

2. **Check JSON syntax**:
   Use a JSON validator to ensure the file is valid JSON

3. **Restart backend**:
   ```bash
   kubectl rollout restart deployment/charno-backend -n web
   ```

### Map Not Showing Photos

1. Ensure photos have `latitude` and `longitude` fields
2. Coordinates must be valid:
   - Latitude: -90 to 90
   - Longitude: -180 to 180
3. Check browser console for errors

## Development vs Production

### Local Development (2600 Gallery)

- Photos stored in: `/frontend/public/images/photos/2600/`
- Committed to git repository
- Available for testing without server access
- Served by Vite dev server or nginx in Docker

### Production (All Galleries)

- Photos stored in: Kubernetes PersistentVolume `/app/photos/`
- **NOT** committed to git (except 2600)
- Served by backend Express server
- Persists across deployments

## Example: Complete Workflow

Let's add photos to the "Jordan" gallery:

```bash
# 1. Prepare photos locally
mkdir -p photos/jordan
cp ~/Pictures/jordan-2024/*.jpg photos/jordan/
cd photos/jordan
# Rename and optimize photos as needed

# 2. Edit metadata
vim backend/content/en/galleries/jordan.json
# Add photo entries with metadata

# 3. Validate
node scripts/validate-gallery.js jordan

# 4. Get backend pod
POD=$(kubectl get pod -n web -l app=charno-backend -o jsonpath='{.items[0].metadata.name}')

# 5. Create directory on server
kubectl exec -n web $POD -- mkdir -p /app/photos/jordan

# 6. Upload photos
for photo in photos/jordan/*.jpg; do
  filename=$(basename "$photo")
  echo "Uploading $filename..."
  kubectl cp "$photo" "web/${POD}:/app/photos/jordan/${filename}"
done

# 7. Verify
kubectl exec -n web $POD -- ls -lh /app/photos/jordan/

# 8. Commit metadata
git add backend/content/en/galleries/jordan.json
git commit -m "feat: Add Jordan travel gallery with 15 photos"
git push origin main

# 9. Test
curl -I https://charno.net/images/photos/jordan/petra-treasury-01.jpg
open https://charno.net/photos
```

## Photo Guidelines

### Image Requirements

- **Format**: JPG or PNG
- **Max dimensions**: 2048px (width or height)
- **File size**: < 2MB per photo recommended
- **Naming**: lowercase, hyphens, descriptive
  - Good: `sikyon-excavation-2023-trench-a.jpg`
  - Bad: `IMG_1234.jpg`, `Photo 1.JPG`

### Metadata Best Practices

1. **IDs**: Use prefix with gallery name
   - Good: `sikyon-excavation-2023-01`
   - Bad: `photo1`, `img001`

2. **Captions**: Be descriptive but concise
   - Good: "Hellenistic wall foundation, Trench A"
   - Bad: "wall", "IMG_1234"

3. **Locations**: Include city/country for context
   - Good: "Ancient Sikyon, Peloponnese, Greece"
   - Bad: "Greece"

4. **GPS coordinates**: Use actual location, not approximate
   - Get coordinates from photo EXIF data or Google Maps
   - Precision: 4-6 decimal places

5. **Dates**: Use ISO format YYYY-MM-DD
   - Good: "2023-07-15"
   - Bad: "July 15, 2023", "15/07/23"

6. **Display order**: Number sequentially
   - Use gaps (10, 20, 30) to allow insertion later

## Security Considerations

- Photos are publicly accessible at `/images/photos/*`
- Do not upload sensitive or private images
- Ensure you have rights to all photos
- Consider privacy for photos with people
- GPS coordinates reveal exact photo locations

## Maintenance

### Cleaning Up Unused Photos

```bash
# List all photos on server
kubectl exec -n web $POD -- find /app/photos -type f -name "*.jpg"

# Compare with metadata to find orphaned files
# Remove unused photos to save space
kubectl exec -n web $POD -- rm /app/photos/gallery-name/unused-photo.jpg
```

### Monitoring Storage Usage

```bash
# Check PVC usage
kubectl exec -n web $POD -- df -h /app/photos

# Check individual gallery sizes
kubectl exec -n web $POD -- du -sh /app/photos/*
```

### Updating the PVC Size

If you need more storage:

```bash
# Edit PVC (if storage class supports expansion)
kubectl edit pvc photos-pvc -n web

# Update the storage size
# Then restart the pod
kubectl delete pod -n web $POD
```
