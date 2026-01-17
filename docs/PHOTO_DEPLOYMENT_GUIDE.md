# Photo Storage and Deployment Guide

This guide explains how photos are stored and served in production, and the best methods to upload them to your server.

## Production Architecture

### How Photos Are Served

```
┌─────────────────────────────────────────────────────────────┐
│ K3s Server (k3s-srv)                                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Host Filesystem                                       │  │
│  │   /data/charno-photos/                               │  │
│  │   ├── 2600/                                          │  │
│  │   │   ├── payphone-01.jpg                           │  │
│  │   │   └── payphone-02.jpg                           │  │
│  │   ├── cricket-memories/                              │  │
│  │   └── ...                                            │  │
│  └────────────────┬───────────────────────────────────────┘  │
│                   │                                          │
│                   │ (Mounted as hostPath volume)             │
│                   ▼                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Backend Pod (charno-backend)                         │  │
│  │   Mounts: /data/photos (ReadOnly)                    │  │
│  │   Serves: /api/photos/*                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Host Directory**: `/data/charno-photos` on your K3s server
   - This is where physical photo files are stored
   - Persistent across pod restarts
   - Directly accessible from the server

2. **Persistent Volume (PV)**: Maps to the host directory
   - Type: `hostPath`
   - Access: `ReadOnlyMany` (multiple pods can read)
   - Size: 100Gi (label only, not enforced)

3. **Backend Pod**: Mounts the PV at `/data/photos`
   - Environment variable: `PHOTOS_DIR=/data/photos`
   - Read-only access for security
   - Serves photos via API endpoints

## Photo Directory Structure on Server

```
/data/charno-photos/
├── 2600/                      # Gallery subdirectory
│   ├── payphone-01.jpg
│   ├── payphone-02.jpg
│   └── payphone-03.jpg
├── cricket-memories/
│   ├── cricket-team.jpg
│   ├── cricket-2005.jpg
│   └── trophy.jpg
└── ... (other galleries)
```

**Important**: The directory structure on the server should match the `filename` paths in your gallery JSON files.

## Methods to Upload Photos

### Method 1: SCP/SFTP (Recommended for Small Batches)

Upload photos directly to your server using SCP:

```bash
# Upload a single photo
scp local-photo.jpg user@k3s-srv:/data/charno-photos/2600/

# Upload multiple photos
scp photos/*.jpg user@k3s-srv:/data/charno-photos/2600/

# Upload an entire directory
scp -r 2600/ user@k3s-srv:/data/charno-photos/
```

Using SFTP (interactive):
```bash
sftp user@k3s-srv
cd /data/charno-photos/2600
put payphone-*.jpg
exit
```

### Method 2: rsync (Recommended for Large Collections)

Best for syncing large photo collections:

```bash
# Sync a local directory to server
rsync -avz --progress \
  frontend/public/images/photos/2600/ \
  user@k3s-srv:/data/charno-photos/2600/

# Dry run first to see what will be transferred
rsync -avz --progress --dry-run \
  frontend/public/images/photos/2600/ \
  user@k3s-srv:/data/charno-photos/2600/

# Sync all galleries
rsync -avz --progress \
  frontend/public/images/photos/ \
  user@k3s-srv:/data/charno-photos/
```

**rsync advantages:**
- Only transfers new/changed files
- Preserves timestamps
- Shows progress
- Can resume interrupted transfers
- Bandwidth efficient

### Method 3: kubectl cp (For Small Files)

Copy files using kubectl (less efficient, but works if you don't have SSH access):

```bash
# Get the backend pod name
BACKEND_POD=$(kubectl get pod -n web -l app=charno-backend -o jsonpath='{.items[0].metadata.name}')

# This won't work because the volume is read-only in the pod!
# You need to copy to the host instead
```

**Note**: This method won't work directly because the photos volume is mounted read-only in the pod. You must copy to the host filesystem.

### Method 4: Direct Server Access (Best for Bulk Operations)

If you have direct access to the server:

```bash
# SSH into your server
ssh user@k3s-srv

# Create gallery directory if needed
sudo mkdir -p /data/charno-photos/2600

# Set proper permissions
sudo chown -R 1001:1001 /data/charno-photos
sudo chmod -R 755 /data/charno-photos

# Copy from a mounted drive, network share, etc.
sudo cp -r /mnt/my-photos/payphones/* /data/charno-photos/2600/
```

### Method 5: Git LFS (For Version-Controlled Photos)

If you want to version control your photos:

1. Install Git LFS in your web-app repo:
```bash
cd /Users/charno/projects/homelab/web-app
git lfs install
git lfs track "frontend/public/images/photos/**/*.jpg"
git lfs track "frontend/public/images/photos/**/*.png"
git add .gitattributes
git commit -m "Add Git LFS tracking for photos"
```

2. Add photos and push:
```bash
# Add photos to local directory
cp ~/my-photos/*.jpg frontend/public/images/photos/2600/

# Commit and push
git add frontend/public/images/photos/2600/
git commit -m "Add 2600 payphone photos"
git push
```

3. On the server, sync from git:
```bash
ssh user@k3s-srv
cd /tmp
git clone <your-repo>
cd web-app
git lfs pull
sudo rsync -av frontend/public/images/photos/ /data/charno-photos/
```

## Complete Workflow Example: Adding 2600 Photos

### Step 1: Prepare Photos Locally

```bash
cd /Users/charno/projects/homelab/web-app

# Add your photos to the local directory
cp ~/Downloads/payphone-*.jpg frontend/public/images/photos/2600/
```

### Step 2: Update Gallery Metadata

Edit `backend/content/en/galleries/2600.json`:

```json
{
  "name": "2600",
  "category": "tech",
  "description": "Pay phone photography...",
  "tags": ["payphones", "2600", ...],
  "photos": [
    {
      "id": "payphone-times-square",
      "filename": "2600/payphone-times-square.jpg",
      "caption": "Last remaining payphone in Times Square",
      "location": "Times Square, New York, NY",
      "latitude": 40.7580,
      "longitude": -73.9855,
      "taken_date": "2024-06-15",
      "display_order": 1
    }
  ]
}
```

### Step 3: Test Locally

```bash
# Validate the gallery
yarn validate-gallery 2600

# Start dev server
yarn dev

# Visit http://localhost:3000/photos and verify
```

### Step 4: Upload Photos to Server

```bash
# Using rsync (recommended)
rsync -avz --progress \
  frontend/public/images/photos/2600/ \
  user@k3s-srv:/data/charno-photos/2600/
```

### Step 5: Set Proper Permissions

```bash
# SSH to server
ssh user@k3s-srv

# Set ownership (backend pod runs as user 1001)
sudo chown -R 1001:1001 /data/charno-photos/2600

# Set permissions (readable by all, writable by owner)
sudo chmod -R 755 /data/charno-photos/2600
```

### Step 6: Deploy Gallery Metadata

```bash
# Commit the gallery JSON to git
git add backend/content/en/galleries/2600.json
git commit -m "Add 2600 payphone gallery"
git push

# ArgoCD will automatically sync and deploy the changes
# Wait ~3 minutes for sync, or force sync via ArgoCD UI
```

### Step 7: Verify in Production

Visit your production URL: `https://your-domain.com/photos`

The gallery should appear and photos should load.

## Permissions and Security

### Required Permissions

The backend pod runs as user `1001` (non-root), so files must be readable by this user:

```bash
# On the server
sudo chown -R 1001:1001 /data/charno-photos
sudo chmod -R 755 /data/charno-photos
```

### Directory Permissions

```
/data/charno-photos/          755 (drwxr-xr-x)
├── 2600/                     755 (drwxr-xr-x)
│   ├── payphone-01.jpg       644 (-rw-r--r--)
│   └── ...
```

## Troubleshooting

### Photos Not Loading

1. **Check file exists on server:**
```bash
ssh user@k3s-srv
ls -la /data/charno-photos/2600/
```

2. **Check permissions:**
```bash
# Should be readable by user 1001
ls -la /data/charno-photos/2600/payphone-01.jpg
```

3. **Check pod can see the file:**
```bash
BACKEND_POD=$(kubectl get pod -n web -l app=charno-backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n web $BACKEND_POD -- ls -la /data/photos/2600/
```

4. **Check backend logs:**
```bash
kubectl logs -n web -l app=charno-backend --tail=50
```

### Permission Denied Errors

```bash
# Fix permissions on server
ssh user@k3s-srv
sudo chown -R 1001:1001 /data/charno-photos
sudo chmod -R 755 /data/charno-photos
```

### Gallery JSON Not Updating

The gallery metadata is built into the backend container:

1. Commit changes to git
2. Push to GitHub
3. Wait for GitHub Actions to build new image
4. ArgoCD will detect new image and deploy
5. Or manually sync in ArgoCD UI

## Best Practices

### Photo Optimization

Before uploading, optimize photos for web:

```bash
# Install ImageMagick if needed
brew install imagemagick

# Resize and optimize
for img in *.jpg; do
  convert "$img" -resize 2000x2000\> -quality 85 "optimized-$img"
done

# Or use a tool like Squoosh, TinyPNG, etc.
```

### Backup Strategy

Since photos are on the host filesystem:

```bash
# On the server, create a backup
ssh user@k3s-srv
sudo tar -czf /backups/charno-photos-$(date +%Y%m%d).tar.gz /data/charno-photos/

# Or use rsync to backup to another location
sudo rsync -av /data/charno-photos/ /mnt/backup/charno-photos/
```

### Version Control

Consider adding photos to git (with Git LFS) for:
- Version history
- Easy rollback
- Disaster recovery
- Team collaboration

## Quick Reference

### Common Commands

```bash
# Upload photos via rsync
rsync -avz frontend/public/images/photos/2600/ user@k3s-srv:/data/charno-photos/2600/

# Check server directory
ssh user@k3s-srv ls -la /data/charno-photos/2600/

# Fix permissions
ssh user@k3s-srv "sudo chown -R 1001:1001 /data/charno-photos && sudo chmod -R 755 /data/charno-photos"

# Check backend pod
kubectl exec -n web -l app=charno-backend -- ls -la /data/photos/2600/

# Watch backend logs
kubectl logs -n web -l app=charno-backend -f
```

### File Paths Reference

| Location | Path | Purpose |
|----------|------|---------|
| Local development | `/frontend/public/images/photos/` | Development files |
| Gallery metadata | `/backend/content/en/galleries/*.json` | Gallery definitions |
| Server filesystem | `/data/charno-photos/` | Production photo storage |
| Backend pod mount | `/data/photos/` | Backend container view |
| Backend serves as | `/api/photos/...` | API endpoint |

## Summary

**Recommended workflow:**
1. Develop and test locally with photos in `frontend/public/images/photos/`
2. Use `rsync` to upload photos to `/data/charno-photos/` on server
3. Commit gallery JSON files to git
4. Let ArgoCD deploy the metadata automatically
5. Photos are served immediately once on server with correct permissions
