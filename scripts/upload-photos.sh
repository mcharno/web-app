#!/bin/bash
# Upload photos to production server
#
# Usage: ./scripts/upload-photos.sh <gallery-name> [server]
# Example: ./scripts/upload-photos.sh 2600
# Example: ./scripts/upload-photos.sh 2600 user@k3s-srv

set -e

GALLERY_NAME="$1"
SERVER="${2:-user@k3s-srv}"

if [ -z "$GALLERY_NAME" ]; then
  echo "❌ Error: Gallery name required"
  echo ""
  echo "Usage: $0 <gallery-name> [server]"
  echo ""
  echo "Examples:"
  echo "  $0 2600"
  echo "  $0 cricket-memories user@k3s-srv"
  echo ""
  exit 1
fi

# Paths
LOCAL_DIR="frontend/public/images/photos/${GALLERY_NAME}"
REMOTE_DIR="/data/charno-photos/${GALLERY_NAME}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check if local directory exists
if [ ! -d "$PROJECT_ROOT/$LOCAL_DIR" ]; then
  echo "❌ Error: Local gallery directory not found: $LOCAL_DIR"
  exit 1
fi

# Count files to upload
FILE_COUNT=$(find "$PROJECT_ROOT/$LOCAL_DIR" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" \) | wc -l | xargs)

if [ "$FILE_COUNT" -eq 0 ]; then
  echo "⚠️  Warning: No image files found in $LOCAL_DIR"
  echo "Supported formats: .jpg, .jpeg, .png, .gif"
  exit 1
fi

echo "📸 Photo Upload to Production"
echo "=============================="
echo "Gallery: $GALLERY_NAME"
echo "Local:   $LOCAL_DIR"
echo "Server:  $SERVER"
echo "Remote:  $REMOTE_DIR"
echo "Files:   $FILE_COUNT image(s)"
echo ""

# Show what will be synced (dry run)
echo "🔍 Checking what needs to be uploaded (dry-run)..."
echo ""

rsync -avz --progress --dry-run \
  --include="*.jpg" \
  --include="*.jpeg" \
  --include="*.png" \
  --include="*.gif" \
  --include="*/" \
  --exclude="*" \
  "$PROJECT_ROOT/$LOCAL_DIR/" \
  "${SERVER}:${REMOTE_DIR}/" 2>&1 | grep -E "sending|total size|speedup" || true

echo ""
echo "=============================="
echo ""

# Confirm before proceeding
read -p "📤 Proceed with upload? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo "❌ Upload cancelled"
  exit 0
fi

echo ""
echo "📤 Uploading photos..."
echo ""

# Create remote directory if it doesn't exist
ssh "$SERVER" "mkdir -p ${REMOTE_DIR}"

# Upload files
rsync -avz --progress \
  --include="*.jpg" \
  --include="*.jpeg" \
  --include="*.png" \
  --include="*.gif" \
  --include="*/" \
  --exclude="*" \
  "$PROJECT_ROOT/$LOCAL_DIR/" \
  "${SERVER}:${REMOTE_DIR}/"

UPLOAD_EXIT_CODE=$?

if [ $UPLOAD_EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ Upload successful!"
  echo ""

  # Fix permissions on server
  echo "🔒 Setting permissions..."
  ssh "$SERVER" "sudo chown -R 1001:1001 ${REMOTE_DIR} && sudo chmod -R 755 ${REMOTE_DIR}"

  if [ $? -eq 0 ]; then
    echo "✅ Permissions set correctly"
  else
    echo "⚠️  Warning: Could not set permissions. You may need to run manually:"
    echo "   ssh $SERVER \"sudo chown -R 1001:1001 ${REMOTE_DIR} && sudo chmod -R 755 ${REMOTE_DIR}\""
  fi

  echo ""
  echo "=============================="
  echo "📋 Next Steps:"
  echo "=============================="
  echo ""
  echo "1. Verify files on server:"
  echo "   ssh $SERVER ls -la ${REMOTE_DIR}"
  echo ""
  echo "2. Check backend pod can see files:"
  echo "   kubectl exec -n web -l app=charno-backend -- ls -la /data/photos/${GALLERY_NAME}"
  echo ""
  echo "3. Update gallery metadata in:"
  echo "   backend/content/en/galleries/${GALLERY_NAME}.json"
  echo ""
  echo "4. Commit and push metadata:"
  echo "   git add backend/content/en/galleries/${GALLERY_NAME}.json"
  echo "   git commit -m \"Update ${GALLERY_NAME} gallery\""
  echo "   git push"
  echo ""
  echo "5. Wait for ArgoCD to sync, or force sync in ArgoCD UI"
  echo ""
  echo "6. View gallery at: https://your-domain.com/photos"
  echo ""
else
  echo "❌ Upload failed with exit code: $UPLOAD_EXIT_CODE"
  exit $UPLOAD_EXIT_CODE
fi
