#!/bin/bash
# Setup script for photo storage on the server
# Run this on your server to create the photo storage directory

set -e

PHOTOS_DIR="/data/charno-photos"
BACKEND_UID=1001
BACKEND_GID=1001

echo "🖼️  Setting up photo storage for charno.net"
echo ""

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root or with sudo"
   echo "   Usage: sudo $0"
   exit 1
fi

# Create directory
echo "📁 Creating directory: $PHOTOS_DIR"
mkdir -p "$PHOTOS_DIR"

# Set ownership
echo "👤 Setting ownership to UID:GID $BACKEND_UID:$BACKEND_GID"
chown -R $BACKEND_UID:$BACKEND_GID "$PHOTOS_DIR"

# Set permissions
echo "🔒 Setting permissions (755 for directories, 644 for files)"
chmod 755 "$PHOTOS_DIR"

# If there are any existing files/directories, fix their permissions too
if [ "$(ls -A $PHOTOS_DIR)" ]; then
    echo "📝 Fixing permissions for existing content..."
    find "$PHOTOS_DIR" -type d -exec chmod 755 {} \;
    find "$PHOTOS_DIR" -type f -exec chmod 644 {} \;
fi

# Verify setup
echo ""
echo "✅ Photo storage setup complete!"
echo ""
echo "Directory details:"
ls -ld "$PHOTOS_DIR"

# Check disk space
echo ""
echo "💾 Available disk space:"
df -h "$PHOTOS_DIR" | tail -1

echo ""
echo "📋 Next steps:"
echo "1. Upload photos to $PHOTOS_DIR/gallery-name/"
echo "   Example: rsync -avz photos/sikyon/ server:$PHOTOS_DIR/sikyon/"
echo ""
echo "2. Update gallery metadata in backend/content/en/galleries/"
echo ""
echo "3. Commit and push the metadata changes"
echo ""
echo "See docs/SERVER_PHOTO_STORAGE.md for detailed instructions."
