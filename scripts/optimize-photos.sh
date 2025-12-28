#!/bin/bash
# Optimize photos for web display on charno.net
# Resizes to 2048px max dimension, quality 85, strips EXIF

set -e

INPUT_DIR="$1"
OUTPUT_DIR="${INPUT_DIR}-optimized"
MAX_SIZE=2048
QUALITY=85

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ -z "$INPUT_DIR" ]; then
  echo -e "${RED}❌ Error: Input directory required${NC}"
  echo ""
  echo "Usage: $0 INPUT_DIRECTORY"
  echo ""
  echo "Example:"
  echo "  $0 ~/photos-to-upload/sikyon"
  echo "  # Creates: ~/photos-to-upload/sikyon-optimized/"
  exit 1
fi

if [ ! -d "$INPUT_DIR" ]; then
  echo -e "${RED}❌ Error: Directory not found: $INPUT_DIR${NC}"
  exit 1
fi

# Check for ImageMagick
if ! command -v convert &> /dev/null; then
  echo -e "${RED}❌ Error: ImageMagick not found${NC}"
  echo ""
  echo "Please install ImageMagick:"
  echo "  macOS:   brew install imagemagick"
  echo "  Ubuntu:  sudo apt install imagemagick"
  echo "  Windows: https://imagemagick.org/script/download.php"
  exit 1
fi

echo -e "${BLUE}🖼️  Photo Optimization for charno.net${NC}"
echo ""
echo -e "Input directory:  ${GREEN}$INPUT_DIR${NC}"
echo -e "Output directory: ${GREEN}$OUTPUT_DIR${NC}"
echo -e "Max dimension:    ${GREEN}${MAX_SIZE}px${NC}"
echo -e "JPEG quality:     ${GREEN}${QUALITY}%${NC}"
echo ""

# Count images
IMAGE_COUNT=$(find "$INPUT_DIR" -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.JPG" -o -iname "*.JPEG" -o -iname "*.PNG" \) 2>/dev/null | wc -l | tr -d ' ')

if [ "$IMAGE_COUNT" -eq 0 ]; then
  echo -e "${RED}❌ Error: No image files found in $INPUT_DIR${NC}"
  echo "Looking for: *.jpg, *.jpeg, *.png"
  exit 1
fi

echo -e "Found ${GREEN}$IMAGE_COUNT${NC} images to optimize"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo ""
echo -e "${YELLOW}Optimizing images...${NC}"
echo ""

# Track progress
PROCESSED=0
FAILED=0

# Process each image
for img in "$INPUT_DIR"/*.{jpg,JPG,jpeg,JPEG,png,PNG}; do
  # Skip if file doesn't exist (no matches for that extension)
  [ -f "$img" ] || continue

  filename=$(basename "$img")
  name="${filename%.*}"
  output="$OUTPUT_DIR/${name}.jpg"

  echo -n "  📸 $filename ... "

  # Get original size
  original_size=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img" 2>/dev/null)
  original_size_kb=$((original_size / 1024))

  # Optimize
  if convert "$img" \
      -resize "${MAX_SIZE}x${MAX_SIZE}>" \
      -quality $QUALITY \
      -sampling-factor 4:2:0 \
      -strip \
      -colorspace sRGB \
      "$output" 2>/dev/null; then

    # Get new size
    new_size=$(stat -f%z "$output" 2>/dev/null || stat -c%s "$output" 2>/dev/null)
    new_size_kb=$((new_size / 1024))

    # Calculate reduction percentage
    if [ "$original_size" -gt 0 ]; then
      reduction=$(( (original_size - new_size) * 100 / original_size ))
    else
      reduction=0
    fi

    echo -e "${GREEN}✓${NC} ${original_size_kb}KB → ${new_size_kb}KB (${reduction}% smaller)"
    PROCESSED=$((PROCESSED + 1))
  else
    echo -e "${RED}✗ Failed${NC}"
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo -e "${GREEN}✅ Optimization complete!${NC}"
echo ""

# Calculate total sizes
if command -v du &> /dev/null; then
  original_total=$(du -sh "$INPUT_DIR" 2>/dev/null | cut -f1 || echo "Unknown")
  optimized_total=$(du -sh "$OUTPUT_DIR" 2>/dev/null | cut -f1 || echo "Unknown")

  echo "Summary:"
  echo "  Original size:  $original_total"
  echo "  Optimized size: $optimized_total"
  echo "  Images processed: $PROCESSED"
  if [ "$FAILED" -gt 0 ]; then
    echo -e "  ${RED}Failed: $FAILED${NC}"
  fi
fi

echo ""
echo "Output directory: $OUTPUT_DIR"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Review optimized images in: $OUTPUT_DIR"
echo "2. Move to upload directory:"
echo -e "   ${YELLOW}mv $OUTPUT_DIR ~/photos-to-upload/gallery-name${NC}"
echo "3. Upload to server:"
echo -e "   ${YELLOW}./scripts/upload-gallery.sh gallery-name${NC}"
echo ""
