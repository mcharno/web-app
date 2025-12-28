# Photo Storage Configuration Update

## What Changed

The photo storage system has been updated to use **hostPath** volumes instead of dynamic PVCs. This means photos are now stored directly in `/data/charno-photos/` on your server instead of inside Kubernetes-managed storage.

## Benefits

1. **Direct File Access** - Manage photos with standard tools (rsync, scp, cp) without `kubectl cp`
2. **Independent Storage** - Photos persist outside Kubernetes; won't be affected by pod/PVC lifecycle
3. **Simple Backups** - Just backup `/data/charno-photos` with your normal backup system
4. **Better Performance** - No PVC provisioner overhead
5. **Easier Management** - Browse and manage photos directly on the server

## Setup Steps

### 1. Create the Directory on Your Server

```bash
ssh your-server
sudo mkdir -p /data/charno-photos
sudo chown -R 1001:1001 /data/charno-photos
sudo chmod 755 /data/charno-photos
```

### 2. Migrate Existing Photos (if any)

If you already have photos in the old PVC:

```bash
# Find the old PVC volume path
kubectl get pvc photos-pvc -n web -o yaml | grep volumeName

# SSH to server and copy data
ssh your-server
# The path will be something like /var/lib/rancher/k3s/storage/pvc-xxxxx
OLD_PVC_PATH="/var/lib/rancher/k3s/storage/pvc-xxxxx"
sudo cp -a "$OLD_PVC_PATH"/* /data/charno-photos/
sudo chown -R 1001:1001 /data/charno-photos
```

### 3. Deploy Updated Configuration

```bash
# Commit the changes
git add infra/k8s/base/photos-pvc.yaml
git commit -m "feat: Use hostPath for photo storage

- Replace dynamic PVC with hostPath volume
- Photos stored in /data/charno-photos on server
- Enables direct file management without kubectl
- Simplifies backup and restore operations"

git push origin main
```

### 4. Verify After Deployment

```bash
# Check PV/PVC status
kubectl get pv,pvc -n web

# Should show:
# persistentvolume/photos-pv    100Gi   ROX   Bound    web/photos-pvc
# persistentvolumeclaim/photos-pvc   Bound   photos-pv   100Gi   ROX

# Verify backend can access photos
POD=$(kubectl get pod -n web -l app=charno-backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n web $POD -- ls -la /data/photos/
```

## File Changes

### infra/k8s/base/photos-pvc.yaml

**Before:**
- Used k3s `local-path` StorageClass
- Dynamic provisioning
- ReadWriteOnce access mode

**After:**
- Manual PersistentVolume with hostPath
- Points to `/data/charno-photos` on server
- ReadOnlyMany access mode (pods read photos, no write needed)
- DirectoryOrCreate ensures directory exists

## Updated Documentation

Three documentation files have been updated:

1. **[docs/SERVER_PHOTO_STORAGE.md](docs/SERVER_PHOTO_STORAGE.md)** (NEW)
   - Complete guide for server-based photo management
   - Upload methods: rsync, scp, direct access
   - Helper scripts for batch uploads
   - Backup strategies
   - Troubleshooting

2. **[docs/UPLOADING_PHOTOS.md](docs/UPLOADING_PHOTOS.md)** (UPDATED)
   - Added note about server storage at the top
   - Shows server-based upload as recommended method
   - Keeps kubectl approach as alternative

3. **[PHOTO_MANAGEMENT.md](PHOTO_MANAGEMENT.md)** (Existing)
   - Still relevant for metadata format
   - Upload sections now reference SERVER_PHOTO_STORAGE.md

## How to Add Photos Now

### Quick Method

```bash
# 1. Upload photos to server
rsync -avz ~/photos/sikyon/ your-server:/tmp/sikyon-upload/

# 2. Move to photos directory
ssh your-server
sudo mkdir -p /data/charno-photos/sikyon
sudo rsync -a /tmp/sikyon-upload/ /data/charno-photos/sikyon/
sudo chown -R 1001:1001 /data/charno-photos/sikyon
sudo chmod 755 /data/charno-photos/sikyon
sudo chmod 644 /data/charno-photos/sikyon/*.jpg
sudo rm -rf /tmp/sikyon-upload

# 3. Update metadata locally
vim backend/content/en/galleries/sikyon.json
# Add photo entries

# 4. Validate and commit
node scripts/validate-gallery.js sikyon
git add backend/content/en/galleries/sikyon.json
git commit -m "feat: Add Sikyon gallery photos"
git push origin main
```

## Storage Location Mapping

| Location | Old (PVC) | New (hostPath) |
|----------|-----------|----------------|
| Server filesystem | `/var/lib/rancher/k3s/storage/pvc-xxxxx` | `/data/charno-photos` |
| Inside pod | `/data/photos` | `/data/photos` (unchanged) |
| Backend env var | `PHOTOS_DIR=/data/photos` | `PHOTOS_DIR=/data/photos` (unchanged) |
| Public URL | `/images/photos/gallery/photo.jpg` | `/images/photos/gallery/photo.jpg` (unchanged) |

The change is transparent to the application - only the server storage location changed.

## Permissions

The backend pod runs as UID 1001, so:

```bash
# All photos must be readable by UID 1001
sudo chown -R 1001:1001 /data/charno-photos
sudo find /data/charno-photos -type d -exec chmod 755 {} \;
sudo find /data/charno-photos -type f -exec chmod 644 {} \;
```

## Troubleshooting

### PV Not Binding

If the PV doesn't bind to the PVC:

```bash
# Check PV status
kubectl get pv photos-pv -o yaml

# Check PVC status
kubectl describe pvc photos-pvc -n web

# If needed, delete and recreate
kubectl delete pvc photos-pvc -n web
kubectl delete pv photos-pv
# Then let ArgoCD recreate them
```

### Photos Not Accessible

```bash
# 1. Check directory exists
ssh your-server
ls -la /data/charno-photos/

# 2. Check permissions
ls -la /data/charno-photos/sikyon/

# 3. Verify from pod
POD=$(kubectl get pod -n web -l app=charno-backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n web $POD -- ls -la /data/photos/sikyon/

# 4. Check web access
curl -I https://charno.net/images/photos/sikyon/photo.jpg
```

## Backup Strategy

### Simple Backup

```bash
# On your server
sudo tar czf ~/backups/charno-photos-$(date +%Y%m%d).tar.gz /data/charno-photos
```

### Automated Daily Backup

```bash
# Add to server crontab
sudo crontab -e

# Daily backup at 2 AM, keep 30 days
0 2 * * * tar czf /backup/charno-photos-$(date +\%Y\%m\%d).tar.gz /data/charno-photos && find /backup -name "charno-photos-*.tar.gz" -mtime +30 -delete
```

## Next Steps

1. ✅ Create `/data/charno-photos/` on your server
2. ✅ Migrate existing photos (if any)
3. ✅ Commit and push the configuration changes
4. ✅ Wait for deployment
5. ✅ Verify PV/PVC are bound
6. ✅ Start uploading photos using the new method!

See [docs/SERVER_PHOTO_STORAGE.md](docs/SERVER_PHOTO_STORAGE.md) for complete documentation.
