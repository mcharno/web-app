# Server Photo Storage Setup

This guide explains how to manage photos stored directly on your server's filesystem (not inside Kubernetes pods).

## Overview

Photos are stored in `/data/charno-photos/` on your server and mounted read-only into the backend pods. This approach:

- ✅ Photos persist independently of Kubernetes
- ✅ Easy file management with standard tools (rsync, scp, cp)
- ✅ Simple backups (just backup the directory)
- ✅ No need for `kubectl cp` commands
- ✅ Can manage photos while pods are running

## Initial Setup

### 1. Create the Photos Directory on Your Server

```bash
# SSH into your server
ssh your-server

# Create the photos directory
sudo mkdir -p /data/charno-photos

# Set permissions (backend runs as UID 1001)
sudo chown -R 1001:1001 /data/charno-photos
sudo chmod 755 /data/charno-photos
```

### 2. Deploy the Updated Kubernetes Configuration

The PersistentVolume configuration in [`infra/k8s/base/photos-pvc.yaml`](../infra/k8s/base/photos-pvc.yaml) uses a `hostPath` volume pointing to `/data/charno-photos`.

```bash
# From your local machine
cd ~/projects/homelab/web-app

# Commit the updated configuration
git add infra/k8s/base/photos-pvc.yaml
git commit -m "feat: Use hostPath for photo storage"
git push origin main

# The CI/CD pipeline will deploy it automatically
```

### 3. Verify the Mount

```bash
# Check that the PV and PVC are bound
kubectl get pv,pvc -n web

# Should show:
# NAME                        CAPACITY   ACCESS MODES   STATUS   CLAIM
# persistentvolume/photos-pv  100Gi      ROX            Bound    web/photos-pvc

# Verify the backend pod can access the directory
POD=$(kubectl get pod -n web -l app=charno-backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n web $POD -- ls -la /data/photos/
```

## Managing Photos

### Directory Structure

Organize photos by gallery name:

```
/data/charno-photos/
├── 2600/
│   ├── photo1.jpg
│   └── photo2.jpg
├── sikyon/
│   ├── excavation-2023-01.jpg
│   └── artifact-ceramic-01.jpg
├── jordan/
│   ├── petra-treasury-01.jpg
│   └── wadi-rum-sunset.jpg
└── ... (other galleries)
```

### Adding Photos

You can add photos directly on the server or upload from your local machine.

#### Option A: Direct Access (if you have SSH access)

```bash
# SSH into your server
ssh your-server

# Create gallery directory
sudo mkdir -p /data/charno-photos/sikyon

# Copy photos from elsewhere on the server
sudo cp /path/to/photos/*.jpg /data/charno-photos/sikyon/

# Fix permissions
sudo chown -R 1001:1001 /data/charno-photos/sikyon
sudo chmod 644 /data/charno-photos/sikyon/*.jpg
```

#### Option B: Upload via SCP

```bash
# From your local machine
scp ~/photos/sikyon/*.jpg your-server:/tmp/sikyon-photos/

# Then on the server
ssh your-server
sudo mv /tmp/sikyon-photos/* /data/charno-photos/sikyon/
sudo chown -R 1001:1001 /data/charno-photos/sikyon
sudo chmod 644 /data/charno-photos/sikyon/*.jpg
```

#### Option C: Upload via rsync (Best for Large Uploads)

```bash
# From your local machine
rsync -avz --progress ~/photos/sikyon/ your-server:/tmp/sikyon-upload/

# Then on the server
ssh your-server
sudo mkdir -p /data/charno-photos/sikyon
sudo rsync -a /tmp/sikyon-upload/ /data/charno-photos/sikyon/
sudo chown -R 1001:1001 /data/charno-photos/sikyon
sudo rm -rf /tmp/sikyon-upload
```

### Updating Gallery Metadata

After uploading photos, update the gallery JSON file:

```bash
# On your local machine
cd ~/projects/homelab/web-app
vim backend/content/en/galleries/sikyon.json

# Add photo entries (see UPLOADING_PHOTOS.md for format)

# Validate
node scripts/validate-gallery.js sikyon

# Commit and push
git add backend/content/en/galleries/sikyon.json
git commit -m "feat: Add Sikyon gallery photos metadata"
git push origin main
```

## Complete Example: Adding Jordan Gallery

### 1. Prepare Photos Locally

```bash
# Organize photos
mkdir -p ~/photos-to-upload/jordan
cp ~/Pictures/jordan-trip/*.jpg ~/photos-to-upload/jordan/

# Rename with descriptive names
cd ~/photos-to-upload/jordan
mv IMG_1234.jpg petra-treasury-01.jpg
mv IMG_1235.jpg wadi-rum-sunset.jpg
# ... etc

# Optimize for web (optional)
for img in *.jpg; do
  convert "$img" -resize 2048x2048\> -quality 85 "optimized-$img"
done
```

### 2. Upload to Server

```bash
# Upload via rsync
rsync -avz --progress ~/photos-to-upload/jordan/ your-server:/tmp/jordan-upload/

# SSH to server and move to photos directory
ssh your-server
sudo mkdir -p /data/charno-photos/jordan
sudo rsync -a /tmp/jordan-upload/ /data/charno-photos/jordan/
sudo chown -R 1001:1001 /data/charno-photos/jordan
sudo chmod 755 /data/charno-photos/jordan
sudo chmod 644 /data/charno-photos/jordan/*.jpg
sudo rm -rf /tmp/jordan-upload

# Verify
ls -lh /data/charno-photos/jordan/
```

### 3. Update Metadata

```bash
# Back on your local machine
cd ~/projects/homelab/web-app
vim backend/content/en/galleries/jordan.json
```

Add photos:

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
    }
  ]
}
```

### 4. Deploy

```bash
# Validate
node scripts/validate-gallery.js jordan

# Commit
git add backend/content/en/galleries/jordan.json
git commit -m "feat: Add Jordan travel gallery with 5 photos"
git push origin main

# Wait for CI/CD, then verify
curl https://charno.net/api/photos/gallery/jordan | jq
open https://charno.net/photos
```

## Batch Upload Script

Create a helper script for uploading entire galleries:

```bash
#!/bin/bash
# upload-gallery-to-server.sh

GALLERY=$1
SERVER="your-server"  # Update with your server hostname
LOCAL_DIR=~/photos-to-upload/$GALLERY

if [ -z "$GALLERY" ]; then
  echo "Usage: ./upload-gallery-to-server.sh GALLERY_NAME"
  echo "Example: ./upload-gallery-to-server.sh sikyon"
  exit 1
fi

if [ ! -d "$LOCAL_DIR" ]; then
  echo "Error: Directory $LOCAL_DIR does not exist"
  exit 1
fi

echo "📦 Uploading $GALLERY gallery photos to server..."
echo "Local: $LOCAL_DIR"
echo "Server: $SERVER:/data/charno-photos/$GALLERY"
echo ""

# Upload to temp directory
echo "1. Uploading files..."
rsync -avz --progress "$LOCAL_DIR/" "$SERVER:/tmp/$GALLERY-upload/"

# Move to photos directory and fix permissions
echo ""
echo "2. Moving to photos directory and fixing permissions..."
ssh "$SERVER" << EOF
  sudo mkdir -p /data/charno-photos/$GALLERY
  sudo rsync -a /tmp/$GALLERY-upload/ /data/charno-photos/$GALLERY/
  sudo chown -R 1001:1001 /data/charno-photos/$GALLERY
  sudo chmod 755 /data/charno-photos/$GALLERY
  sudo chmod 644 /data/charno-photos/$GALLERY/*
  sudo rm -rf /tmp/$GALLERY-upload
  echo ""
  echo "Files on server:"
  ls -lh /data/charno-photos/$GALLERY/
EOF

echo ""
echo "✅ Upload complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/content/en/galleries/$GALLERY.json"
echo "2. Run: node scripts/validate-gallery.js $GALLERY"
echo "3. Commit and push the metadata"
```

Make it executable:

```bash
chmod +x upload-gallery-to-server.sh
```

Use it:

```bash
./upload-gallery-to-server.sh sikyon
```

## File Permissions

The backend runs as user ID 1001, so photos must be readable by this user:

```bash
# Correct permissions
sudo chown -R 1001:1001 /data/charno-photos
sudo find /data/charno-photos -type d -exec chmod 755 {} \;
sudo find /data/charno-photos -type f -exec chmod 644 {} \;
```

## Backup Strategy

### Full Backup

```bash
# On your server or from your backup system
sudo tar czf charno-photos-backup-$(date +%Y%m%d).tar.gz /data/charno-photos

# Or use rsync to a backup location
sudo rsync -av /data/charno-photos/ /backup/charno-photos/
```

### Automated Backup with Cron

```bash
# On your server
sudo crontab -e

# Add daily backup at 2 AM
0 2 * * * tar czf /backup/charno-photos-$(date +\%Y\%m\%d).tar.gz /data/charno-photos && find /backup -name "charno-photos-*.tar.gz" -mtime +30 -delete
```

### Restore from Backup

```bash
# Extract backup
sudo tar xzf charno-photos-backup-20240115.tar.gz -C /

# Or restore with rsync
sudo rsync -av /backup/charno-photos/ /data/charno-photos/

# Fix permissions
sudo chown -R 1001:1001 /data/charno-photos
```

## Monitoring Storage

```bash
# Check disk usage
ssh your-server
df -h /data/charno-photos

# Check individual gallery sizes
sudo du -sh /data/charno-photos/*

# Count photos per gallery
for dir in /data/charno-photos/*/; do
  echo "$(basename $dir): $(ls -1 $dir | wc -l) photos"
done
```

## Troubleshooting

### Photos Not Showing

**Check 1: Directory exists on server**
```bash
ssh your-server
ls -la /data/charno-photos/sikyon/
```

**Check 2: Permissions are correct**
```bash
# Should be owned by UID 1001 and readable
ls -la /data/charno-photos/sikyon/
```

**Check 3: Pod can access the directory**
```bash
POD=$(kubectl get pod -n web -l app=charno-backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n web $POD -- ls -la /data/photos/sikyon/
```

**Check 4: PV/PVC are bound**
```bash
kubectl get pv,pvc -n web
# Both should show "Bound"
```

**Check 5: Photo is accessible**
```bash
curl -I https://charno.net/images/photos/sikyon/photo.jpg
# Should return HTTP/2 200
```

### Permission Denied Errors

```bash
# Fix all permissions
ssh your-server
sudo chown -R 1001:1001 /data/charno-photos
sudo find /data/charno-photos -type d -exec chmod 755 {} \;
sudo find /data/charno-photos -type f -exec chmod 644 {} \;

# Restart backend pod
kubectl rollout restart deployment/charno-backend -n web
```

### PV/PVC Not Binding

```bash
# Check PV status
kubectl get pv photos-pv

# Check PVC status
kubectl describe pvc photos-pvc -n web

# If needed, delete and recreate
kubectl delete pvc photos-pvc -n web
kubectl delete pv photos-pv
# Then redeploy the configuration
```

## Migration from Old PVC

If you have photos in the old `local-path` PVC:

```bash
# 1. Find the old PVC path on your server
kubectl describe pvc photos-pvc -n web | grep Volume

# The actual path will be something like:
# /var/lib/rancher/k3s/storage/pvc-xxxxxxxxx

# 2. Copy photos to new location
ssh your-server
sudo mkdir -p /data/charno-photos
sudo cp -a /var/lib/rancher/k3s/storage/pvc-xxxxxxxxx/* /data/charno-photos/
sudo chown -R 1001:1001 /data/charno-photos

# 3. Deploy the new configuration (this will delete the old PVC)
# Make sure you've copied all photos first!

# 4. Clean up old PVC data (optional)
sudo rm -rf /var/lib/rancher/k3s/storage/pvc-xxxxxxxxx
```

## Quick Reference

```bash
# Create gallery directory
ssh your-server
sudo mkdir -p /data/charno-photos/gallery-name
sudo chown 1001:1001 /data/charno-photos/gallery-name

# Upload photos
rsync -avz ~/photos/gallery-name/ your-server:/tmp/upload/
ssh your-server "sudo rsync -a /tmp/upload/ /data/charno-photos/gallery-name/ && sudo chown -R 1001:1001 /data/charno-photos/gallery-name && sudo rm -rf /tmp/upload"

# Check storage
ssh your-server "df -h /data && du -sh /data/charno-photos/*"

# Verify from pod
POD=$(kubectl get pod -n web -l app=charno-backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n web $POD -- ls -lh /data/photos/

# Backup
ssh your-server "sudo tar czf ~/charno-photos-backup.tar.gz /data/charno-photos"
```

## Benefits of This Approach

1. **Simple Management**: Use standard Linux file tools (cp, mv, rsync, scp)
2. **Independent Storage**: Photos exist outside Kubernetes lifecycle
3. **Easy Backups**: Just backup `/data/charno-photos` with your normal backup system
4. **Better Performance**: No overhead of persistent volume provisioner
5. **Scalable**: Can handle many gigabytes of photos easily
6. **Direct Access**: Can browse/manage photos directly on the server

## See Also

- [UPLOADING_PHOTOS.md](UPLOADING_PHOTOS.md) - Metadata format and workflow
- [PHOTO_MANAGEMENT.md](../PHOTO_MANAGEMENT.md) - Gallery system overview
- [PHOTO_GALLERIES_SETUP.md](../PHOTO_GALLERIES_SETUP.md) - Initial setup summary
