# Photo Gallery Scripts

Helper scripts for managing photo galleries in the web-app.

## Available Scripts

### 1. validate-gallery.js
Validates gallery JSON structure and checks for issues.

```bash
# Validate a specific gallery
yarn validate-gallery 2600

# Or use directly
node scripts/validate-gallery.js 2600
```

**Checks:**
- JSON syntax is valid
- All required fields are present
- Photo files exist
- GPS coordinates are valid
- Date format is correct
- No duplicate IDs or display_order values
- File sizes and warnings

### 2. upload-photos.sh
Uploads photos from local development to production server.

```bash
# Upload photos for a gallery
yarn upload-photos 2600

# Or specify server
./scripts/upload-photos.sh 2600 user@k3s-srv
```

**Features:**
- Shows dry-run preview before uploading
- Uses rsync for efficient transfer
- Only uploads image files (.jpg, .jpeg, .png, .gif)
- Automatically sets correct permissions
- Shows next steps after upload

### 3. check-photos.sh
Checks photos on production server.

```bash
# Check a specific gallery
./scripts/check-photos.sh 2600

# List all galleries
./scripts/check-photos.sh

# Check on different server
./scripts/check-photos.sh 2600 user@k3s-srv
```

**Checks:**
- Directory exists on server
- File permissions and ownership
- Number of files and total size
- Backend pod can access files
- Lists all photos with sizes

## Typical Workflow

### Adding a New Gallery

1. **Create gallery locally:**
   ```bash
   # Create directory and JSON file
   mkdir -p frontend/public/images/photos/my-gallery
   cp backend/content/en/galleries/2600-template.json \
      backend/content/en/galleries/my-gallery.json
   ```

2. **Add photos and metadata:**
   ```bash
   # Copy photos to local directory
   cp ~/photos/*.jpg frontend/public/images/photos/my-gallery/

   # Edit gallery JSON with metadata
   vim backend/content/en/galleries/my-gallery.json
   ```

3. **Validate:**
   ```bash
   yarn validate-gallery my-gallery
   ```

4. **Test locally:**
   ```bash
   yarn dev
   # Visit http://localhost:3000/photos
   ```

5. **Upload to production:**
   ```bash
   yarn upload-photos my-gallery
   ```

6. **Deploy metadata:**
   ```bash
   git add backend/content/en/galleries/my-gallery.json
   git commit -m "Add my-gallery"
   git push
   # Wait for ArgoCD to sync
   ```

7. **Verify:**
   ```bash
   ./scripts/check-photos.sh my-gallery
   # Visit https://your-domain.com/photos
   ```

### Updating Existing Gallery

1. **Add new photos locally:**
   ```bash
   cp ~/new-photos/*.jpg frontend/public/images/photos/2600/
   ```

2. **Update metadata:**
   ```bash
   vim backend/content/en/galleries/2600.json
   # Add new photo entries
   ```

3. **Validate:**
   ```bash
   yarn validate-gallery 2600
   ```

4. **Upload new photos:**
   ```bash
   yarn upload-photos 2600
   ```

5. **Deploy metadata:**
   ```bash
   git add backend/content/en/galleries/2600.json
   git commit -m "Add new photos to 2600 gallery"
   git push
   ```

## Quick Reference

```bash
# Validate gallery
yarn validate-gallery <gallery-name>

# Upload photos
yarn upload-photos <gallery-name>

# Check photos on server
./scripts/check-photos.sh <gallery-name>

# List all galleries on server
./scripts/check-photos.sh

# Manual upload via rsync
rsync -avz frontend/public/images/photos/2600/ user@k3s-srv:/mnt/k3s-storage/media/photos/web/2600/

# Fix permissions on server
ssh user@k3s-srv "sudo chown -R 1001:1001 /mnt/k3s-storage/media/photos/web && sudo chmod -R 755 /mnt/k3s-storage/media/photos/web"

# Check backend pod
kubectl exec -n web -l app=charno-backend -- ls -la /data/photos/

# Watch backend logs
kubectl logs -n web -l app=charno-backend -f
```

## Environment Setup

### Requirements

**Local:**
- Node.js 20+
- Yarn 4.11.0
- rsync (usually pre-installed on macOS/Linux)

**Server Access:**
- SSH access to K3s server
- kubectl configured for cluster access
- sudo permissions on server (for setting file ownership)

### Server Configuration

The scripts assume:
- Server hostname: `k3s-srv` (or specify different with `user@hostname`)
- Photo directory: `/mnt/k3s-storage/media/photos/web/`
- Kubernetes namespace: `web`
- Backend app label: `app=charno-backend`
- Backend user ID: `1001`

To use a different server, pass it as an argument:
```bash
./scripts/upload-photos.sh 2600 myuser@myserver.com
./scripts/check-photos.sh 2600 myuser@myserver.com
```

## Troubleshooting

### Photos not uploading

1. Check SSH access:
   ```bash
   ssh user@k3s-srv ls -la /data/
   ```

2. Check rsync is installed:
   ```bash
   which rsync
   ```

3. Try manual upload:
   ```bash
   scp frontend/public/images/photos/2600/test.jpg user@k3s-srv:/mnt/k3s-storage/media/photos/web/2600/
   ```

### Photos uploaded but not showing

1. Check permissions:
   ```bash
   ./scripts/check-photos.sh 2600
   ```

2. Fix ownership:
   ```bash
   ssh user@k3s-srv "sudo chown -R 1001:1001 /mnt/k3s-storage/media/photos/web"
   ```

3. Check pod can see files:
   ```bash
   kubectl exec -n web -l app=charno-backend -- ls /data/photos/2600/
   ```

### Gallery metadata not updating

1. Commit and push changes:
   ```bash
   git status
   git add backend/content/en/galleries/
   git commit -m "Update gallery"
   git push
   ```

2. Wait for CI/CD build (check GitHub Actions)

3. Force ArgoCD sync:
   ```bash
   # Via CLI
   argocd app sync charno-web

   # Or via UI
   # Visit ArgoCD dashboard and click "Sync"
   ```

## Additional Resources

- [Local Photo Gallery Guide](../docs/LOCAL_PHOTO_GALLERY_GUIDE.md) - Complete guide to gallery system
- [Photo Deployment Guide](../docs/PHOTO_DEPLOYMENT_GUIDE.md) - Production deployment details
- [2600 Quick Start](../backend/content/en/galleries/2600-QUICKSTART.md) - Quick reference for adding photos
