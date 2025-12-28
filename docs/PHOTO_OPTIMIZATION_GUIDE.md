# Photo Optimization Guide

This guide explains how to optimize photos for web display on charno.net.

## Recommended Specifications

### Single Optimized Image Approach

For each photo, upload one optimized web version:

| Property | Specification | Why |
|----------|---------------|-----|
| **Format** | JPEG (.jpg) | Best compression for photos |
| **Quality** | 85% | Sweet spot for quality vs. file size |
| **Max Dimension** | 2048px | Looks great on 4K screens, manageable file size |
| **File Size Target** | 200-500 KB | Fast loading, good quality |
| **Color Space** | sRGB | Standard for web display |
| **Resolution** | 72 DPI | Web standard (DPI doesn't matter for screens) |

### Why This Works

Your gallery implementation already has:
- ✅ **Lazy loading** - Only loads images when scrolled into view
- ✅ **1-year caching** - Images cached after first load
- ✅ **Immutable headers** - Browser never re-fetches
- ✅ **Grid downscaling** - Thumbnails displayed at 280px, browser handles resize
- ✅ **Lightbox for full view** - Users can zoom to see details

This means a single 2048px image works for both thumbnail grid AND full-screen lightbox view.

## Optimization Methods

### Option 1: ImageMagick (Best for Batch Processing)

Install ImageMagick if you don't have it:
```bash
# macOS
brew install imagemagick

# Ubuntu/Debian
sudo apt install imagemagick

# Windows
# Download from: https://imagemagick.org/script/download.php
```

**Single Photo:**
```bash
convert original.jpg \
  -resize 2048x2048\> \
  -quality 85 \
  -sampling-factor 4:2:0 \
  -strip \
  -colorspace sRGB \
  optimized.jpg
```

**Batch Process All Photos:**
```bash
#!/bin/bash
# optimize-photos.sh

INPUT_DIR="$1"
OUTPUT_DIR="${INPUT_DIR}-optimized"

if [ -z "$INPUT_DIR" ]; then
  echo "Usage: $0 INPUT_DIRECTORY"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

for img in "$INPUT_DIR"/*.{jpg,JPG,jpeg,JPEG}; do
  [ -f "$img" ] || continue
  filename=$(basename "$img")
  echo "Optimizing: $filename"

  convert "$img" \
    -resize 2048x2048\> \
    -quality 85 \
    -sampling-factor 4:2:0 \
    -strip \
    -colorspace sRGB \
    "$OUTPUT_DIR/$filename"
done

echo ""
echo "✅ Optimization complete!"
echo "Original: $(du -sh "$INPUT_DIR" | cut -f1)"
echo "Optimized: $(du -sh "$OUTPUT_DIR" | cut -f1)"
```

Save as `scripts/optimize-photos.sh` and use:
```bash
chmod +x scripts/optimize-photos.sh
./scripts/optimize-photos.sh ~/photos-to-upload/sikyon
# Creates ~/photos-to-upload/sikyon-optimized/
```

### Option 2: GUI Tools

**macOS - Preview:**
1. Open image in Preview
2. Tools → Adjust Size
3. Set width or height to 2048px (maintain aspect ratio)
4. File → Export
5. Format: JPEG
6. Quality: ~80-85% (adjust slider)

**Windows - IrfanView:**
1. Open image
2. Image → Resize/Resample
3. Set largest dimension to 2048px
4. Save with quality 85

**Cross-platform - GIMP:**
1. Open image
2. Image → Scale Image
3. Set width or height to 2048px
4. File → Export As
5. Choose JPEG, quality 85

### Option 3: Online Tools

If you prefer web-based tools:

- **TinyPNG** (https://tinypng.com) - Excellent compression
- **Squoosh** (https://squoosh.app) - Google's image optimizer
- **ImageOptim** (https://imageoptim.com/mac) - macOS only, drag & drop

These handle optimization automatically but you may want to resize first.

## Understanding the Parameters

### ImageMagick Options Explained

```bash
-resize 2048x2048\>
```
- Resize to fit within 2048x2048 box
- `\>` means "only shrink, don't enlarge"
- Maintains aspect ratio

```bash
-quality 85
```
- JPEG quality (0-100)
- 85 is the sweet spot for photos
- Lower = smaller file, worse quality
- Higher = larger file, minimal quality gain

```bash
-sampling-factor 4:2:0
```
- Chroma subsampling (standard for photos)
- Human eyes less sensitive to color detail
- Reduces file size without visible quality loss

```bash
-strip
```
- Remove EXIF metadata (GPS, camera settings, etc.)
- Reduces file size
- **Important:** Extract GPS coords BEFORE stripping!

```bash
-colorspace sRGB
```
- Convert to standard web color space
- Ensures consistent colors across browsers

## Complete Workflow Example

### Sikyon Gallery Optimization

```bash
# 1. Copy original photos
mkdir -p ~/photo-originals/sikyon
cp ~/Pictures/greece-2023/*.jpg ~/photo-originals/sikyon/

# 2. Rename with descriptive names
cd ~/photo-originals/sikyon
mv IMG_1234.jpg excavation-2023-trench-a.jpg
mv IMG_1235.jpg excavation-2023-trench-b.jpg
mv IMG_1236.jpg artifact-ceramic-vessel.jpg
mv IMG_1237.jpg hellenistic-wall-foundation.jpg

# 3. Extract GPS coordinates (before stripping metadata)
for img in *.jpg; do
  echo "$img:"
  exiftool "$img" | grep GPS
  echo ""
done > ../sikyon-gps-data.txt

# 4. Optimize for web
cd ~/photo-originals
./optimize-photos.sh sikyon
# Creates sikyon-optimized/

# 5. Verify file sizes
ls -lh sikyon-optimized/

# 6. Move to upload directory
mv sikyon-optimized ~/photos-to-upload/sikyon

# 7. Upload to server
cd ~/projects/homelab/web-app
./scripts/upload-gallery.sh sikyon
```

## Quality Comparison

### Different Quality Settings

| Quality | File Size | Use Case |
|---------|-----------|----------|
| 60 | ~100 KB | Too low, visible artifacts |
| 70 | ~150 KB | Acceptable for thumbnails only |
| 80 | ~200 KB | Good for web, slight quality loss |
| **85** | **250-350 KB** | **Recommended - best balance** |
| 90 | ~400 KB | Excellent quality, larger files |
| 95 | ~600 KB | Near-original, often unnecessary |
| 100 | ~1 MB+ | Lossless, too large for web |

### File Size Examples

For a typical 4000x3000 photo:

| Processing | File Size | Notes |
|------------|-----------|-------|
| Original (camera) | 8-12 MB | Too large for web |
| Resized to 2048px, quality 100 | 1.5 MB | Unnecessary quality |
| **Resized to 2048px, quality 85** | **300 KB** | **Recommended** |
| Resized to 2048px, quality 70 | 180 KB | Quality loss visible |
| Resized to 1024px, quality 85 | 120 KB | Too small for lightbox |

## Advanced: WebP Format (Optional)

WebP offers ~30% smaller files than JPEG at same quality. However:

**Pros:**
- Smaller file sizes
- Better compression
- Supports transparency

**Cons:**
- Older browser support
- Requires `<picture>` element for fallback
- More complex implementation

**Convert to WebP:**
```bash
# Install tools
brew install webp  # macOS
sudo apt install webp  # Linux

# Convert
cwebp -q 85 input.jpg -o output.webp

# With resize
convert input.jpg -resize 2048x2048\> - | cwebp -q 85 - -o output.webp
```

**Not recommended for now** - JPEG is simpler and your caching strategy makes size less critical.

## Extracting GPS Coordinates

Before stripping EXIF metadata, extract GPS coordinates for your gallery JSON:

### Using exiftool

```bash
# Install exiftool
brew install exiftool  # macOS
sudo apt install libimage-exiftool-perl  # Linux

# Get GPS data
exiftool photo.jpg | grep GPS

# Example output:
# GPS Position : 37 deg 59' 4.92" N, 22 deg 43' 18.12" E
```

Convert to decimal degrees:
- 37° 59' 4.92" N = 37.9847
- 22° 43' 18.12" E = 22.7217

### Using ImageMagick identify

```bash
identify -verbose photo.jpg | grep GPS
```

### Bulk Extract GPS

```bash
#!/bin/bash
# extract-gps.sh

for img in *.jpg; do
  echo "--- $img ---"
  exiftool "$img" -GPS* -DateTimeOriginal
  echo ""
done > gps-data.txt
```

## Quality Checklist

Before uploading, verify:

- [ ] Image width or height ≤ 2048px
- [ ] File size 200-500 KB per photo
- [ ] JPEG quality ~85%
- [ ] GPS coordinates extracted (if needed)
- [ ] EXIF metadata stripped
- [ ] Descriptive filename (lowercase, hyphens)
- [ ] sRGB color space
- [ ] Photos look sharp on your monitor

## Storage Requirements

### Estimating Gallery Size

**Per Photo:**
- Optimized: ~300 KB average
- 10 photos: ~3 MB
- 50 photos: ~15 MB
- 100 photos: ~30 MB

**Your 15 Galleries:**
- If each has 20 photos: 15 × 20 × 300 KB = ~90 MB total
- If each has 50 photos: 15 × 50 × 300 KB = ~225 MB total

The 100 GB volume you configured (`/data/charno-photos`) can handle thousands of photos.

## Troubleshooting

### Photo Looks Blurry

- Original may be out of focus (check before optimizing)
- Quality setting too low (try 90 instead of 85)
- Resized from too small an original

### File Size Too Large

- Quality setting too high (use 80 instead of 85)
- Original dimensions too large (ensure resize to 2048px)
- Try WebP format for 30% reduction

### Colors Look Wrong

- Ensure `-colorspace sRGB` in convert command
- Check original isn't in Adobe RGB or ProPhoto RGB
- Some browsers don't handle wide gamut correctly

### Batch Script Not Working

```bash
# Check ImageMagick is installed
convert --version

# Check file permissions
ls -la original-photo.jpg

# Try with full path
convert "/full/path/to/photo.jpg" ...

# Check for spaces in filenames (use quotes)
```

## Recommended Workflow Summary

1. **Organize** - Copy originals to working directory
2. **Rename** - Use descriptive filenames
3. **Extract GPS** - Before stripping metadata
4. **Optimize** - Resize to 2048px, quality 85, strip EXIF
5. **Verify** - Check file sizes and quality
6. **Upload** - Use upload script to server
7. **Update Metadata** - Edit gallery JSON
8. **Deploy** - Commit and push

See [UPLOADING_PHOTOS.md](UPLOADING_PHOTOS.md) for the complete upload workflow.

## Tools Summary

| Tool | Platform | Best For |
|------|----------|----------|
| ImageMagick | All | Batch processing, automation |
| Preview | macOS | Quick single image edits |
| GIMP | All | Manual control, visual editing |
| exiftool | All | GPS extraction, metadata |
| TinyPNG | Web | Simple drag & drop |
| Squoosh | Web | WebP conversion, comparison |

## See Also

- [PHOTO_QUICK_START.md](../PHOTO_QUICK_START.md) - Quick upload guide
- [SERVER_PHOTO_STORAGE.md](SERVER_PHOTO_STORAGE.md) - Server setup
- [UPLOADING_PHOTOS.md](UPLOADING_PHOTOS.md) - Complete workflow
