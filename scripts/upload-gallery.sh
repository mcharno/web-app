#!/bin/bash
# Upload a photo gallery to the server
# Usage: ./upload-gallery.sh GALLERY_NAME [SERVER]

set -e

GALLERY=$1
SERVER=${2:-"your-server"}  # Replace with your actual server hostname or IP
LOCAL_DIR="$HOME/photos-to-upload/$GALLERY"
REMOTE_DIR="/data/charno-photos"
BACKEND_UID=1001
BACKEND_GID=1001

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

if [ -z "$GALLERY" ]; then
  echo -e "${RED}❌ Error: Gallery name required${NC}"
  echo ""
  echo "Usage: $0 GALLERY_NAME [SERVER]"
  echo ""
  echo "Examples:"
  echo "  $0 sikyon"
  echo "  $0 jordan 192.168.1.100"
  echo "  $0 kyrgyzstan my-server.example.com"
  echo ""
  echo "Photos should be in: $HOME/photos-to-upload/GALLERY_NAME/"
  exit 1
fi

if [ ! -d "$LOCAL_DIR" ]; then
  echo -e "${RED}❌ Error: Directory not found: $LOCAL_DIR${NC}"
  echo ""
  echo "Please create the directory and add your photos:"
  echo "  mkdir -p $LOCAL_DIR"
  echo "  cp your-photos/*.jpg $LOCAL_DIR/"
  exit 1
fi

# Check if directory is empty
if [ -z "$(ls -A $LOCAL_DIR)" ]; then
  echo -e "${RED}❌ Error: No photos found in $LOCAL_DIR${NC}"
  exit 1
fi

# Count photos
PHOTO_COUNT=$(find "$LOCAL_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | wc -l)

if [ "$PHOTO_COUNT" -eq 0 ]; then
  echo -e "${RED}❌ Error: No image files found in $LOCAL_DIR${NC}"
  echo "Looking for: *.jpg, *.jpeg, *.png"
  exit 1
fi

echo -e "${BLUE}📸 Uploading $GALLERY gallery to $SERVER${NC}"
echo ""
echo -e "Local directory:  ${GREEN}$LOCAL_DIR${NC}"
echo -e "Remote directory: ${GREEN}$REMOTE_DIR/$GALLERY${NC}"
echo -e "Photos to upload: ${GREEN}$PHOTO_COUNT${NC}"
echo ""

# Confirm
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Step 1: Upload to temp directory
echo ""
echo -e "${YELLOW}[1/4]${NC} Uploading photos to server..."
rsync -avz --progress "$LOCAL_DIR/" "$SERVER:/tmp/$GALLERY-upload/"

# Step 2: Move to photos directory and set permissions
echo ""
echo -e "${YELLOW}[2/4]${NC} Moving to photos directory..."
ssh "$SERVER" "sudo mkdir -p $REMOTE_DIR/$GALLERY"
ssh "$SERVER" "sudo rsync -a /tmp/$GALLERY-upload/ $REMOTE_DIR/$GALLERY/"

# Step 3: Fix permissions
echo ""
echo -e "${YELLOW}[3/4]${NC} Setting permissions..."
ssh "$SERVER" "sudo chown -R $BACKEND_UID:$BACKEND_GID $REMOTE_DIR/$GALLERY"
ssh "$SERVER" "sudo chmod 755 $REMOTE_DIR/$GALLERY"
ssh "$SERVER" "sudo find $REMOTE_DIR/$GALLERY -type f -exec chmod 644 {} \;"

# Step 4: Cleanup temp directory
echo ""
echo -e "${YELLOW}[4/4]${NC} Cleaning up..."
ssh "$SERVER" "sudo rm -rf /tmp/$GALLERY-upload"

# Verify
echo ""
echo -e "${GREEN}✅ Upload complete!${NC}"
echo ""
echo "Photos on server:"
ssh "$SERVER" "ls -lh $REMOTE_DIR/$GALLERY/ | tail -10"

TOTAL_FILES=$(ssh "$SERVER" "ls -1 $REMOTE_DIR/$GALLERY/ | wc -l")
echo ""
echo -e "${GREEN}Total files uploaded: $TOTAL_FILES${NC}"

# Next steps
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo ""
echo "1. Update gallery metadata:"
echo -e "   ${YELLOW}vim backend/content/en/galleries/$GALLERY.json${NC}"
echo ""
echo "2. Validate metadata:"
echo -e "   ${YELLOW}node scripts/validate-gallery.js $GALLERY${NC}"
echo ""
echo "3. Commit and push:"
echo -e "   ${YELLOW}git add backend/content/en/galleries/$GALLERY.json${NC}"
echo -e "   ${YELLOW}git commit -m \"feat: Add $GALLERY gallery photos\"${NC}"
echo -e "   ${YELLOW}git push origin main${NC}"
echo ""
echo -e "${GREEN}Happy photo uploading! 📸${NC}"
