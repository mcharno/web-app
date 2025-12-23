#!/usr/bin/env node
/**
 * Gallery JSON Validator
 *
 * Validates gallery JSON files to ensure they have correct structure
 * and that referenced photo files exist.
 *
 * Usage: node scripts/validate-gallery.js <gallery-name>
 * Example: node scripts/validate-gallery.js 2600
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const galleryName = process.argv[2];

if (!galleryName) {
  console.error('❌ Error: Please provide a gallery name');
  console.log('Usage: node scripts/validate-gallery.js <gallery-name>');
  console.log('Example: node scripts/validate-gallery.js 2600');
  process.exit(1);
}

const galleryPath = path.join(__dirname, '..', 'backend', 'content', 'en', 'galleries', `${galleryName}.json`);
const photosDir = path.join(__dirname, '..', 'frontend', 'public', 'images', 'photos');

console.log(`\n🔍 Validating gallery: ${galleryName}`);
console.log(`📁 Gallery file: ${galleryPath}\n`);

// Check if gallery file exists
if (!fs.existsSync(galleryPath)) {
  console.error(`❌ Gallery file not found: ${galleryPath}`);
  process.exit(1);
}

// Read and parse gallery JSON
let gallery;
try {
  const content = fs.readFileSync(galleryPath, 'utf-8');
  gallery = JSON.parse(content);
  console.log('✅ Gallery JSON is valid');
} catch (error) {
  console.error(`❌ Invalid JSON: ${error.message}`);
  process.exit(1);
}

// Validate required gallery fields
const requiredGalleryFields = ['name', 'category', 'description', 'tags', 'photos'];
const missingFields = requiredGalleryFields.filter(field => !gallery[field]);

if (missingFields.length > 0) {
  console.error(`❌ Missing required gallery fields: ${missingFields.join(', ')}`);
  process.exit(1);
}

console.log('✅ All required gallery fields present');
console.log(`   - Name: ${gallery.name}`);
console.log(`   - Category: ${gallery.category}`);
console.log(`   - Description: ${gallery.description}`);
console.log(`   - Tags: ${gallery.tags.join(', ')}`);
console.log(`   - Photos: ${gallery.photos.length}\n`);

// Validate photos
const requiredPhotoFields = ['id', 'filename', 'caption', 'display_order'];
const optionalPhotoFields = ['location', 'latitude', 'longitude', 'taken_date', 'notes'];

let errors = 0;
let warnings = 0;

gallery.photos.forEach((photo, index) => {
  console.log(`\n📸 Photo ${index + 1}/${gallery.photos.length}: ${photo.id || 'UNNAMED'}`);

  // Check required fields
  const missing = requiredPhotoFields.filter(field => photo[field] === undefined);
  if (missing.length > 0) {
    console.error(`   ❌ Missing required fields: ${missing.join(', ')}`);
    errors++;
  } else {
    console.log(`   ✅ All required fields present`);
  }

  // Check if photo file exists
  if (photo.filename) {
    const photoPath = path.join(photosDir, photo.filename);
    if (fs.existsSync(photoPath)) {
      const stats = fs.statSync(photoPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`   ✅ Photo file exists (${sizeMB} MB)`);

      if (stats.size === 0) {
        console.warn(`   ⚠️  Warning: Photo file is empty`);
        warnings++;
      }
      if (stats.size > 2 * 1024 * 1024) {
        console.warn(`   ⚠️  Warning: Photo file is large (${sizeMB} MB > 2 MB)`);
        warnings++;
      }
    } else {
      console.error(`   ❌ Photo file not found: ${photoPath}`);
      errors++;
    }
  }

  // Check for GPS coordinates
  if (photo.latitude !== undefined && photo.longitude !== undefined) {
    console.log(`   📍 GPS: ${photo.latitude}, ${photo.longitude}`);
  } else {
    console.log(`   ℹ️  No GPS coordinates (photo won't appear on map)`);
  }

  // Validate coordinates if present
  if (photo.latitude !== undefined) {
    if (photo.latitude < -90 || photo.latitude > 90) {
      console.error(`   ❌ Invalid latitude: ${photo.latitude} (must be -90 to 90)`);
      errors++;
    }
  }
  if (photo.longitude !== undefined) {
    if (photo.longitude < -180 || photo.longitude > 180) {
      console.error(`   ❌ Invalid longitude: ${photo.longitude} (must be -180 to 180)`);
      errors++;
    }
  }

  // Validate date format
  if (photo.taken_date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(photo.taken_date)) {
      console.error(`   ❌ Invalid date format: ${photo.taken_date} (use YYYY-MM-DD)`);
      errors++;
    } else {
      console.log(`   📅 Date: ${photo.taken_date}`);
    }
  }
});

// Check for duplicate IDs
const ids = gallery.photos.map(p => p.id).filter(Boolean);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicateIds.length > 0) {
  console.error(`\n❌ Duplicate photo IDs found: ${[...new Set(duplicateIds)].join(', ')}`);
  errors++;
}

// Check for duplicate display_order
const orders = gallery.photos.map(p => p.display_order).filter(o => o !== undefined);
const duplicateOrders = orders.filter((order, index) => orders.indexOf(order) !== index);
if (duplicateOrders.length > 0) {
  console.warn(`\n⚠️  Warning: Duplicate display_order values: ${[...new Set(duplicateOrders)].join(', ')}`);
  warnings++;
}

// Summary
console.log(`\n${'='.repeat(50)}`);
console.log('📊 Validation Summary');
console.log(`${'='.repeat(50)}`);
console.log(`Gallery: ${gallery.name}`);
console.log(`Photos: ${gallery.photos.length}`);
console.log(`Errors: ${errors}`);
console.log(`Warnings: ${warnings}`);

if (errors === 0 && warnings === 0) {
  console.log(`\n✅ Gallery is valid and ready to use!`);
  process.exit(0);
} else if (errors === 0) {
  console.log(`\n⚠️  Gallery is valid but has ${warnings} warning(s)`);
  process.exit(0);
} else {
  console.log(`\n❌ Gallery has ${errors} error(s) that must be fixed`);
  process.exit(1);
}
