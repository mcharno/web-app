# Photo Galleries Setup Summary

## Overview

The photo gallery system is now configured with 15 galleries:
- **1 local development gallery** (2600) with metadata and placeholder photos in the repository
- **14 server-only galleries** with metadata in the repository, but photos stored only on the production server

## Gallery List

### Local Development
- ✅ **2600** (tech) - Pay phone photography

### Server-Only (Awaiting Photos)
- 🔲 **Sikyon** (archaeology) - Archaeological excavations
- 🔲 **Stymphalos** (archaeology) - Ancient site excavations
- 🔲 **Cricket** (sports) - Cricket matches and teams
- 🔲 **Airplanes** (aviation) - Aircraft photography
- 🔲 **Cold War** (history) - Cold War era sites
- 🔲 **Creatures** (nature) - Wildlife photography
- 🔲 **Washington DC** (travel) - Nation's capital
- 🔲 **Nights** (urban) - Night photography
- 🔲 **Jordan** (travel) - Travel in Jordan
- 🔲 **Kyrgyzstan** (travel) - Central Asia landscapes
- 🔲 **Pace Egging** (culture) - Traditional folk customs
- 🔲 **Russia** (travel) - Russian architecture and culture
- 🔲 **Sunsets** (nature) - Sunset photography
- 🔲 **Wedding** (personal) - Wedding celebrations

## What's Been Set Up

1. **Gallery Metadata Files** - All 15 galleries have JSON metadata files in [backend/content/en/galleries/](backend/content/en/galleries/)

2. **Photo Directory Structure**
   - Local: [frontend/public/images/photos/2600/](frontend/public/images/photos/2600/)
   - Server: `/app/photos/` (Kubernetes PersistentVolume)

3. **Git Configuration** - [.gitignore](.gitignore) updated to:
   - Exclude all photos by default
   - Include only the 2600 gallery photos for local development

4. **Documentation** - [PHOTO_MANAGEMENT.md](PHOTO_MANAGEMENT.md) provides:
   - Complete photo upload workflow
   - Metadata guidelines
   - Server upload scripts
   - Troubleshooting guide

## Next Steps

To populate the server-only galleries:

1. **Prepare Photos**
   - Organize by gallery in subdirectories
   - Optimize for web (max 2048px, < 2MB)
   - Use descriptive filenames

2. **Update Metadata**
   - Edit the gallery JSON files
   - Add photo entries with metadata
   - Include GPS coordinates for map display

3. **Upload to Server**
   ```bash
   # Get backend pod
   POD=$(kubectl get pod -n web -l app=charno-backend -o jsonpath='{.items[0].metadata.name}')

   # Create directory
   kubectl exec -n web $POD -- mkdir -p /app/photos/gallery-name

   # Upload photos
   kubectl cp local-photo.jpg web/$POD:/app/photos/gallery-name/photo.jpg
   ```

4. **Commit Metadata**
   ```bash
   git add backend/content/en/galleries/gallery-name.json
   git commit -m "Add gallery-name photos metadata"
   git push origin main
   ```

## Testing

All galleries are now visible in the Photos page, including:
- Gallery grid view at `/photos`
- Individual gallery views at `/photos/:galleryName`
- Map view showing all geotagged photos

The 2600 gallery is fully functional for local testing with 3 placeholder photos.

## Technical Details

- **API Endpoint**: `GET /api/photos/galleries`
- **Photo Serving**: `GET /images/photos/{gallery}/{filename}`
- **Validation**: `node scripts/validate-gallery.js {gallery-name}`
- **Storage**: 10Gi PersistentVolumeClaim in Kubernetes

## Files Changed

- Created: 15 gallery metadata JSON files
- Updated: [.gitignore](.gitignore)
- Created: [PHOTO_MANAGEMENT.md](PHOTO_MANAGEMENT.md)
- Existing: [backend/content/en/galleries/2600.json](backend/content/en/galleries/2600.json)

## Maintenance

See [PHOTO_MANAGEMENT.md](PHOTO_MANAGEMENT.md) for:
- Photo upload procedures
- Backup and restore processes
- Troubleshooting common issues
- Storage monitoring
