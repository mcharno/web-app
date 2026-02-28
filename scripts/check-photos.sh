#!/bin/bash
# Check photos on production server
#
# Usage: ./scripts/check-photos.sh [gallery-name] [server]
# Example: ./scripts/check-photos.sh 2600
# Example: ./scripts/check-photos.sh 2600 user@k3s-srv

GALLERY_NAME="$1"
SERVER="${2:-user@k3s-srv}"

echo "📸 Photo Gallery Check"
echo "======================"
echo ""

if [ -z "$GALLERY_NAME" ]; then
  # List all galleries
  echo "📁 Available galleries on server:"
  echo ""
  ssh "$SERVER" "ls -1 /mnt/k3s-storage/media/photos/web/" 2>/dev/null | while read dir; do
    COUNT=$(ssh "$SERVER" "find /mnt/k3s-storage/media/photos/web/$dir -type f \( -name '*.jpg' -o -name '*.jpeg' -o -name '*.png' -o -name '*.gif' \) 2>/dev/null | wc -l" | xargs)
    printf "  %-30s %s files\n" "$dir" "$COUNT"
  done
  echo ""
  echo "Usage: $0 <gallery-name> [server]"
  echo "Example: $0 2600"
  exit 0
fi

REMOTE_DIR="/mnt/k3s-storage/media/photos/web/${GALLERY_NAME}"

echo "Gallery: $GALLERY_NAME"
echo "Server:  $SERVER"
echo ""

# Check if directory exists on server
if ! ssh "$SERVER" "[ -d ${REMOTE_DIR} ]" 2>/dev/null; then
  echo "❌ Gallery directory not found on server: ${REMOTE_DIR}"
  exit 1
fi

# Check permissions
echo "🔍 Checking directory permissions..."
echo ""
PERMS=$(ssh "$SERVER" "ls -ld ${REMOTE_DIR}" 2>/dev/null)
echo "$PERMS"
echo ""

# List all photos
echo "📸 Photos on server:"
echo ""
ssh "$SERVER" "find ${REMOTE_DIR} -type f \( -name '*.jpg' -o -name '*.jpeg' -o -name '*.png' -o -name '*.gif' \) -exec ls -lh {} \;" 2>/dev/null | \
  awk '{printf "  %-50s %10s\n", $9, $5}'
echo ""

# Count and summarize
TOTAL_FILES=$(ssh "$SERVER" "find ${REMOTE_DIR} -type f \( -name '*.jpg' -o -name '*.jpeg' -o -name '*.png' -o -name '*.gif' \) | wc -l" | xargs)
TOTAL_SIZE=$(ssh "$SERVER" "du -sh ${REMOTE_DIR}" 2>/dev/null | awk '{print $1}')

echo "📊 Summary:"
echo "  Total files: $TOTAL_FILES"
echo "  Total size:  $TOTAL_SIZE"
echo ""

# Check if backend pod can see the files
echo "🔍 Checking backend pod access..."
BACKEND_POD=$(kubectl get pod -n web -l app=charno-backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

if [ -n "$BACKEND_POD" ]; then
  echo "  Backend pod: $BACKEND_POD"
  echo ""
  POD_FILES=$(kubectl exec -n web "$BACKEND_POD" -- ls -la "/data/photos/${GALLERY_NAME}" 2>/dev/null | tail -n +4 | wc -l | xargs)
  if [ "$POD_FILES" -gt 0 ]; then
    echo "  ✅ Backend pod can see $POD_FILES files"
  else
    echo "  ⚠️  Backend pod cannot see files or directory doesn't exist in pod"
  fi
else
  echo "  ⚠️  Backend pod not found or kubectl not configured"
fi
echo ""

# Check ownership
echo "🔒 Checking ownership (should be 1001:1001)..."
OWNER=$(ssh "$SERVER" "stat -c '%u:%g' ${REMOTE_DIR}" 2>/dev/null)
if [ "$OWNER" = "1001:1001" ]; then
  echo "  ✅ Ownership is correct: $OWNER"
else
  echo "  ⚠️  Ownership is $OWNER (expected 1001:1001)"
  echo "  Fix with: ssh $SERVER \"sudo chown -R 1001:1001 ${REMOTE_DIR}\""
fi
echo ""

echo "======================"
echo ""
