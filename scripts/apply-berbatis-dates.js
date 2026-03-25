#!/usr/bin/env node
/**
 * apply-berbatis-dates.js
 *
 * Reads scripts/berbatis-date-review.json, picks up any entries where you've
 * set a "chosen_date" (YYYY-MM-DD), and applies the date to shows.json.
 *
 * Usage:
 *   1. Open scripts/berbatis-date-review.json
 *   2. For each entry, add:  "chosen_date": "2003-10-03"
 *   3. Run: node scripts/apply-berbatis-dates.js
 */

import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REVIEW_FILE = path.join(__dirname, 'berbatis-date-review.json');
const SHOWS_FILE  = path.join(__dirname, '../backend/content/en/berbatis/shows.json');

const review = JSON.parse(await readFile(REVIEW_FILE, 'utf-8'));
const showsData = JSON.parse(await readFile(SHOWS_FILE, 'utf-8'));
const shows = showsData.shows;

// Auto-pick the date for single-candidate entries
for (const entry of review.pending) {
  if (!entry.chosen_date && entry.candidates.length === 1) {
    entry.chosen_date = entry.candidates[0].date;
  }
}

const chosen = review.pending.filter(e => e.chosen_date);
if (chosen.length === 0) {
  console.log('No chosen_date entries found — nothing to apply.');
  console.log('For multi-candidate entries, add "chosen_date": "YYYY-MM-DD" to each entry manually.');
  process.exit(0);
}

let applied = 0;
for (const entry of chosen) {
  const show = shows.find(s => s.id === entry.show_id);
  if (!show) {
    console.warn(`  ⚠ show_id not found: ${entry.show_id}`);
    continue;
  }
  const [y, m, d] = entry.chosen_date.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  show.date_year    = y;
  show.date_display = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  applied++;
  console.log(`  ✓ ${show.headliner} → ${show.date_display}`);
}

await writeFile(SHOWS_FILE, JSON.stringify(showsData, null, 2) + '\n', 'utf-8');

// Remove applied entries from review file
review.pending = review.pending.filter(e => !e.chosen_date);
await writeFile(REVIEW_FILE, JSON.stringify(review, null, 2) + '\n', 'utf-8');

console.log(`\nApplied ${applied} date${applied !== 1 ? 's' : ''} to shows.json`);
if (review.pending.length > 0) {
  console.log(`${review.pending.length} entries still pending in berbatis-date-review.json`);
}
