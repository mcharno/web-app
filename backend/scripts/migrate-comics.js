/**
 * One-shot migration: comics.json → PostgreSQL
 *
 * Run from the backend directory:
 *   node scripts/migrate-comics.js
 *
 * Safe to re-run — all inserts use ON CONFLICT DO UPDATE.
 */

import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Import after dotenv so DB env vars are set
const { default: pool }      = await import('../src/config/database.js');
const { initSchema }         = await import('../src/controllers/comicsController.js');

const COMICS_FILE = path.join(__dirname, '../content/en/comics/comics.json');

async function run() {
  console.log('Initialising schema...');
  await initSchema();

  const raw = JSON.parse(await readFile(COMICS_FILE, 'utf8'));
  const { groups = [], comics = [] } = raw;

  console.log(`Migrating ${groups.length} groups, ${comics.length} series...`);

  // ── Groups ──────────────────────────────────────────────────────────────────
  for (const g of groups) {
    await pool.query(
      `INSERT INTO comic_groups (id, name, description, cover_image)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         name        = EXCLUDED.name,
         description = EXCLUDED.description,
         cover_image = EXCLUDED.cover_image,
         updated_at  = NOW()`,
      [g.id, g.name, g.description ?? null, g.cover_image ?? null]
    );
  }
  console.log(`  ✓ ${groups.length} groups`);

  // ── Series + issues ─────────────────────────────────────────────────────────
  let totalIssues = 0;
  for (const c of comics) {
    await pool.query(
      `INSERT INTO comic_series
         (id, title, publisher, volume, group_id, comic_vine_id, cover_image, writers, artists)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)
       ON CONFLICT (id) DO UPDATE SET
         title         = EXCLUDED.title,
         publisher     = EXCLUDED.publisher,
         volume        = EXCLUDED.volume,
         group_id      = EXCLUDED.group_id,
         comic_vine_id = EXCLUDED.comic_vine_id,
         cover_image   = EXCLUDED.cover_image,
         writers       = EXCLUDED.writers,
         artists       = EXCLUDED.artists,
         updated_at    = NOW()`,
      [
        c.id, c.title, c.publisher ?? '', c.volume ?? null,
        c.group ?? null, c.comic_vine_id ?? null, c.cover_image ?? null,
        JSON.stringify(c.writers || []), JSON.stringify(c.artists || []),
      ]
    );

    const issueNums   = c.issues        || [];
    const issueMeta   = c.issue_metadata || {};
    const issueCovers = c.issue_covers   || {};

    for (const num of issueNums) {
      const meta = issueMeta[num] || {};
      // Issues that already have CV metadata are marked as scraped so the
      // scrape queue doesn't re-process them.
      const scrapedAt = meta.cv_issue_id ? new Date() : null;

      await pool.query(
        `INSERT INTO comic_issues
           (series_id, issue_number, name, cover_date, cover_image,
            writers, artists, characters, locations, story_arcs,
            description, cv_issue_id, scrape_attempted_at)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11,$12,$13)
         ON CONFLICT (series_id, issue_number) DO UPDATE SET
           name                = COALESCE(EXCLUDED.name,        comic_issues.name),
           cover_date          = COALESCE(EXCLUDED.cover_date,  comic_issues.cover_date),
           cover_image         = COALESCE(EXCLUDED.cover_image, comic_issues.cover_image),
           writers             = COALESCE(EXCLUDED.writers,     comic_issues.writers),
           artists             = COALESCE(EXCLUDED.artists,     comic_issues.artists),
           characters          = COALESCE(EXCLUDED.characters,  comic_issues.characters),
           locations           = COALESCE(EXCLUDED.locations,   comic_issues.locations),
           story_arcs          = COALESCE(EXCLUDED.story_arcs,  comic_issues.story_arcs),
           description         = COALESCE(EXCLUDED.description, comic_issues.description),
           cv_issue_id         = COALESCE(EXCLUDED.cv_issue_id, comic_issues.cv_issue_id),
           scrape_attempted_at = COALESCE(EXCLUDED.scrape_attempted_at, comic_issues.scrape_attempted_at)`,
        [
          c.id, String(num),
          meta.name        ?? null,
          meta.cover_date  ?? null,
          issueCovers[num] ?? null,
          JSON.stringify(meta.writers    || []),
          JSON.stringify(meta.artists    || []),
          JSON.stringify(meta.characters || []),
          JSON.stringify(meta.locations  || []),
          JSON.stringify(meta.story_arcs || []),
          meta.description ?? null,
          meta.cv_issue_id ?? null,
          scrapedAt,
        ]
      );
      totalIssues++;
    }
  }

  console.log(`  ✓ ${comics.length} series, ${totalIssues} issues`);
  console.log('Migration complete.');
  await pool.end();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
