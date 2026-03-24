#!/usr/bin/env node
/**
 * seed-berbatis-shows.js
 *
 * Two modes:
 *
 * 1) SCAN mode (default) — lists image files on burnside via SSH and creates a
 *    skeleton entry in shows.json for each one. Existing entries are preserved
 *    so metadata you've already filled in is never lost. Safe to re-run as you
 *    add more posters to the server.
 *
 *    Usage:
 *      node scripts/seed-berbatis-shows.js --scan
 *
 *    Scans: burnside:/mnt/k3s-storage/media/posters
 *
 * 2) DATA mode — define shows manually in the SHOWS array below and run
 *    without --scan. Overwrites shows.json completely.
 *
 *    Usage:
 *      node scripts/seed-berbatis-shows.js
 *
 * Date fields:
 *   date_display  - Human-readable string shown in the UI. Use whatever you
 *                   have: "14 Feb 1995", "Feb 1995", "14 Feb", "1995".
 *   date_year     - Integer year, drives the decade-filter tabs. Omit if unknown.
 *   date_month    - Integer 1-12. Omit if unknown.
 *   date_day      - Integer day. Omit if unknown.
 */

import { readFile, writeFile } from 'fs/promises';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.join(__dirname, '../backend/content/en/berbatis/shows.json');

const REMOTE_HOST = 'burnside';
const REMOTE_DIR = '/mnt/k3s-storage/media/posters';
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

// ─── Manual show data (used in DATA mode only) ────────────────────────────────
// Edit this array and run without --scan to overwrite shows.json completely.

const SHOWS = [
  // {
  //   headliner: 'Frank Black',
  //   support_acts: [],
  //   date_display: '14 Feb 1995',
  //   date_day: 14,
  //   date_month: 2,
  //   date_year: 1995,
  //   poster_filename: 'frank-black-1995.jpg',
  //   keywords: ['Pixies', 'Black Francis'],  // optional — searched but not displayed
  //   notes: '',
  // },
];

// ─────────────────────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cleanEntry(entry, index) {
  const id = entry.id
    || `berbatis-${slugify(entry.headliner || `show-${String(index + 1).padStart(3, '0')}`)}-${entry.date_year || String(index + 1).padStart(3, '0')}`;
  const out = { id, ...entry };
  for (const key of ['date_day', 'date_month', 'date_year', 'poster_filename', 'notes']) {
    if (out[key] === undefined || out[key] === null || out[key] === '') {
      delete out[key];
    }
  }
  return out;
}

async function loadExisting() {
  try {
    const raw = await readFile(OUTPUT, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data.shows) ? data.shows : [];
  } catch {
    return [];
  }
}

async function scanMode() {
  console.log(`Connecting to ${REMOTE_HOST}...`);

  let rawListing;
  try {
    rawListing = execSync(`ssh ${REMOTE_HOST} "ls ${REMOTE_DIR}"`, { encoding: 'utf-8' });
  } catch (err) {
    console.error(`SSH command failed: ${err.message}`);
    process.exit(1);
  }

  const imageFiles = rawListing
    .split('\n')
    .map(f => f.trim())
    .filter(f => f && IMAGE_EXTS.has(path.extname(f).toLowerCase()))
    .sort();

  if (imageFiles.length === 0) {
    console.log(`No image files found in ${REMOTE_HOST}:${REMOTE_DIR}`);
    process.exit(0);
  }

  const existing = await loadExisting();
  const existingByFilename = new Map(existing.map(s => [s.poster_filename, s]));

  let added = 0;
  let preserved = 0;

  const shows = imageFiles.map((filename) => {
    if (existingByFilename.has(filename)) {
      preserved++;
      return existingByFilename.get(filename);
    }
    added++;
    return {
      id: `berbatis-${slugify(path.basename(filename, path.extname(filename)))}`,
      headliner: '',
      support_acts: [],
      date_display: '',
      poster_filename: filename,
      notes: '',
    };
  });

  const output = JSON.stringify({ shows }, null, 2) + '\n';
  await writeFile(OUTPUT, output, 'utf-8');

  console.log(`✓ Found ${imageFiles.length} image${imageFiles.length !== 1 ? 's' : ''} on ${REMOTE_HOST}:${REMOTE_DIR}`);
  console.log(`  ${preserved} existing entr${preserved !== 1 ? 'ies' : 'y'} preserved`);
  console.log(`  ${added} new skeleton entr${added !== 1 ? 'ies' : 'y'} added`);
  if (added > 0) {
    console.log(`\nFill in the blank fields in:\n  ${OUTPUT}`);
  }
}

async function dataMode() {
  const cleaned = SHOWS.map(cleanEntry);
  const output = JSON.stringify({ shows: cleaned }, null, 2) + '\n';
  await writeFile(OUTPUT, output, 'utf-8');
  console.log(`✓ Wrote ${cleaned.length} show${cleaned.length !== 1 ? 's' : ''} to ${OUTPUT}`);
  cleaned.forEach(s => console.log(`  • [${s.id}] ${s.headliner} — ${s.date_display || '(no date)'}`));
}

// ─── Run ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--scan')) {
  await scanMode();
} else {
  await dataMode();
}
