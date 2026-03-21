#!/usr/bin/env python3
"""
populate-gallery.py — Auto-populate gallery JSON from image files.

Scans a gallery's photo directory for images not yet in the gallery JSON,
extracts EXIF metadata (GPS coordinates, date taken), and appends new entries
with empty fields for manual completion.

Photos can be read locally or streamed from the server over SSH.

Usage:
    python3 scripts/populate-gallery.py <gallery-name> [options]

Options:
    --remote               Read photos from the server via SSH (ssh burnside)
    --photos-dir <path>    Override the photos directory path
                           Default local:  frontend/public/images/photos
                           Default remote: /mnt/k3s-storage/media/photos/web

Examples:
    # Local dev photos
    python3 scripts/populate-gallery.py 2600

    # Photos on the server
    python3 scripts/populate-gallery.py cricket --remote

    # Custom local path
    python3 scripts/populate-gallery.py cricket --photos-dir /some/other/path
"""

import sys
import json
import os
import re
import io
import subprocess
from pathlib import Path
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS

SCRIPT_DIR = Path(__file__).parent.resolve()
REPO_ROOT = SCRIPT_DIR.parent
GALLERIES_DIR = REPO_ROOT / "backend" / "content" / "en" / "galleries"
DEFAULT_LOCAL_PHOTOS_DIR = REPO_ROOT / "frontend" / "public" / "images" / "photos"
DEFAULT_REMOTE_PHOTOS_DIR = "/mnt/k3s-storage/media/photos/web"
SSH_HOST = "burnside"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".tiff", ".tif"}


# ---------------------------------------------------------------------------
# EXIF helpers
# ---------------------------------------------------------------------------

def parse_gps_coord(coord_tuple, ref):
    """Convert EXIF GPS tuple (deg, min, sec) + ref to decimal degrees."""
    try:
        degrees = float(coord_tuple[0])
        minutes = float(coord_tuple[1])
        seconds = float(coord_tuple[2])
        decimal = degrees + minutes / 60 + seconds / 3600
        if ref in ("S", "W"):
            decimal = -decimal
        return round(decimal, 6)
    except (TypeError, IndexError, ZeroDivisionError):
        return None


def extract_exif_from_image(img):
    """Extract GPS and date metadata from an open Pillow Image. Returns a dict."""
    result = {"latitude": None, "longitude": None, "taken_date": None}
    try:
        exif_data = img._getexif()
        if not exif_data:
            return result

        tagged = {TAGS.get(tag_id, tag_id): value for tag_id, value in exif_data.items()}

        # Date taken
        for date_tag in ("DateTimeOriginal", "DateTime", "DateTimeDigitized"):
            if date_tag in tagged:
                match = re.match(r"(\d{4}):(\d{2}):(\d{2})", tagged[date_tag])
                if match:
                    result["taken_date"] = f"{match.group(1)}-{match.group(2)}-{match.group(3)}"
                    break

        # GPS
        if "GPSInfo" in tagged:
            gps = {GPSTAGS.get(k, k): v for k, v in tagged["GPSInfo"].items()}
            lat = parse_gps_coord(gps.get("GPSLatitude"), gps.get("GPSLatitudeRef", "N"))
            lon = parse_gps_coord(gps.get("GPSLongitude"), gps.get("GPSLongitudeRef", "E"))
            if lat is not None and lon is not None:
                result["latitude"] = lat
                result["longitude"] = lon

    except Exception as e:
        print(f"    Warning: Could not parse EXIF: {e}")

    return result


# ---------------------------------------------------------------------------
# File access — local vs remote
# ---------------------------------------------------------------------------

def list_local_images(directory):
    """Return sorted list of image filenames in a local directory."""
    d = Path(directory)
    return sorted(
        f.name for f in d.iterdir()
        if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS
    )


def list_remote_images(remote_dir):
    """Return sorted list of image filenames in a remote directory via SSH."""
    result = subprocess.run(
        ["ssh", SSH_HOST, f"ls -1 {remote_dir}"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"Error listing remote directory {remote_dir}:\n{result.stderr}")
        sys.exit(1)
    return sorted(
        name for name in result.stdout.splitlines()
        if Path(name).suffix.lower() in IMAGE_EXTENSIONS
    )


def open_local_image(path):
    """Open a local image file with Pillow."""
    return Image.open(path)


def open_remote_image(remote_path):
    """Stream a remote image over SSH into Pillow."""
    result = subprocess.run(
        ["ssh", SSH_HOST, f"cat '{remote_path}'"],
        capture_output=True
    )
    if result.returncode != 0:
        raise IOError(f"SSH cat failed for {remote_path}")
    return Image.open(io.BytesIO(result.stdout))


def extract_exif(image_source, remote=False):
    """Open an image (local path or remote path string) and extract EXIF."""
    try:
        if remote:
            img = open_remote_image(image_source)
        else:
            img = open_local_image(image_source)
        return extract_exif_from_image(img)
    except Exception as e:
        print(f"    Warning: Could not read image: {e}")
        return {"latitude": None, "longitude": None, "taken_date": None}


# ---------------------------------------------------------------------------
# ID helpers
# ---------------------------------------------------------------------------

def next_id_number(photos):
    """Find the highest numeric suffix across all existing IDs and return next."""
    max_n = 0
    for photo in photos:
        match = re.search(r"(\d+)$", photo.get("id", ""))
        if match:
            max_n = max(max_n, int(match.group(1)))
    return max_n + 1


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def parse_args(argv):
    args = {"gallery": None, "remote": False, "photos_dir": None}
    i = 1
    while i < len(argv):
        if argv[i] == "--remote":
            args["remote"] = True
        elif argv[i] == "--photos-dir" and i + 1 < len(argv):
            i += 1
            args["photos_dir"] = argv[i]
        elif not argv[i].startswith("--"):
            args["gallery"] = argv[i]
        i += 1
    return args


def main():
    args = parse_args(sys.argv)

    if not args["gallery"]:
        print(__doc__)
        sys.exit(1)

    gallery_name = args["gallery"]
    remote = args["remote"]

    if args["photos_dir"]:
        photos_root = args["photos_dir"]
    elif remote:
        photos_root = DEFAULT_REMOTE_PHOTOS_DIR
    else:
        photos_root = str(DEFAULT_LOCAL_PHOTOS_DIR)

    gallery_file = GALLERIES_DIR / f"{gallery_name}.json"
    gallery_photos_dir = f"{photos_root}/{gallery_name}" if remote else Path(photos_root) / gallery_name

    # Validate gallery JSON exists
    if not gallery_file.exists():
        print(f"Error: Gallery file not found: {gallery_file}")
        sys.exit(1)

    # Validate photos directory
    if remote:
        result = subprocess.run(
            ["ssh", SSH_HOST, f"test -d '{gallery_photos_dir}' && echo ok"],
            capture_output=True, text=True
        )
        if result.stdout.strip() != "ok":
            print(f"Error: Remote directory not found: {SSH_HOST}:{gallery_photos_dir}")
            sys.exit(1)
        print(f"Reading from {SSH_HOST}:{gallery_photos_dir}")
    else:
        if not Path(gallery_photos_dir).exists():
            print(f"Error: Photos directory not found: {gallery_photos_dir}")
            sys.exit(1)
        print(f"Reading from {gallery_photos_dir}")

    # Load gallery JSON
    with open(gallery_file) as f:
        gallery = json.load(f)

    existing_photos = gallery.get("photos", [])
    existing_filenames = {p["filename"] for p in existing_photos}

    # List image files
    if remote:
        image_files = list_remote_images(gallery_photos_dir)
    else:
        image_files = list_local_images(gallery_photos_dir)

    if not image_files:
        print(f"No image files found in {gallery_photos_dir}")
        sys.exit(0)

    print(f"Found {len(image_files)} image(s), {len(existing_photos)} already in JSON\n")

    new_entries = []
    next_order = max((p.get("display_order", 0) for p in existing_photos), default=0) + 1
    next_id_n = next_id_number(existing_photos)

    for filename in image_files:
        relative_filename = f"{gallery_name}/{filename}"

        if relative_filename in existing_filenames:
            print(f"  skip  {filename}")
            continue

        print(f"  add   {filename}", end="", flush=True)

        if remote:
            image_source = f"{gallery_photos_dir}/{filename}"
        else:
            image_source = Path(gallery_photos_dir) / filename

        exif = extract_exif(image_source, remote=remote)

        markers = []
        if exif["taken_date"]:
            markers.append(exif["taken_date"])
        if exif["latitude"] is not None:
            markers.append(f"GPS {exif['latitude']}, {exif['longitude']}")
        print(f"  [{', '.join(markers)}]" if markers else "  [no EXIF]")

        entry = {
            "id": f"{gallery_name}-{next_id_n:03d}",
            "filename": relative_filename,
            "caption": "",
            "location": "",
            "taken_date": exif["taken_date"] or "",
            "display_order": next_order,
            "notes": "",
        }
        if exif["latitude"] is not None:
            entry["latitude"] = exif["latitude"]
            entry["longitude"] = exif["longitude"]

        new_entries.append(entry)
        next_order += 1
        next_id_n += 1

    if not new_entries:
        print("\nNo new photos to add.")
        sys.exit(0)

    gallery["photos"] = existing_photos + new_entries

    with open(gallery_file, "w") as f:
        json.dump(gallery, f, indent=2)
        f.write("\n")

    print(f"\nAdded {len(new_entries)} photo(s) to {gallery_file.name}")
    print("Fill in 'caption' and 'location' fields manually.")


if __name__ == "__main__":
    main()
