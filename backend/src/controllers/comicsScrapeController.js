import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const COMICS_IMAGES_DIR = process.env.COMICS_IMAGES_DIR
  || path.join(__dirname, '../../../frontend/public/images/comics');

const CV_BASE  = 'https://comicvine.gamespot.com/api';
const CV_DELAY = 1100;
const sleep    = ms => new Promise(r => setTimeout(r, ms));

// ── Comic Vine helpers ────────────────────────────────────────────────────────

async function cvGet(endpoint, params = {}) {
  const apiKey = process.env.COMIC_VINE_API_KEY;
  if (!apiKey) throw Object.assign(new Error('COMIC_VINE_API_KEY not set'), { status: 503 });

  // Build base params without filter — URLSearchParams encodes ':' as '%3A' which
  // breaks Comic Vine's field:value filter syntax, so filter is appended manually.
  const base = new URLSearchParams({ format: 'json', api_key: apiKey });
  const extras = [];
  for (const [k, v] of Object.entries(params)) {
    if (k === 'filter') {
      extras.push(`filter=${encodeURIComponent(String(v)).replace(/%3A/gi, ':')}`);
    } else {
      base.set(k, String(v));
    }
  }
  const urlStr = `${CV_BASE}/${endpoint}/?${base.toString()}${extras.length ? '&' + extras.join('&') : ''}`;

  const res = await fetch(urlStr, {
    headers: { 'User-Agent': 'charno-comic-scraper/1.0' },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Comic Vine HTTP ${res.status}`);
  const data = await res.json();
  if (data.status_code !== 1) throw new Error(`Comic Vine API: ${data.error}`);
  return data;
}

// Return search variants to try against CV in priority order.
// CV uses '&' not 'and', does substring matching, and ignores punctuation
// differently from how series data is often entered locally.
function searchVariants(title) {
  const seen = new Set();
  const add = (s) => { const t = s.trim(); if (t) seen.add(t); };

  add(title);
  // CV titles use '&' not 'and'
  add(title.replace(/\band\b/gi, '&'));
  // Strip hyphens/colons
  const stripped = title.replace(/[:\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  add(stripped);
  add(stripped.replace(/\band\b/gi, '&'));
  // First significant word as broad fallback
  const firstWord = title.split(/[\s\-:,]+/).find(w => w.length > 2 && !['the','a','an'].includes(w.toLowerCase()));
  if (firstWord) add(firstWord);

  return [...seen];
}

async function downloadFile(imageUrl, destPath) {
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  const res = await fetch(imageUrl, {
    headers: { 'User-Agent': 'charno-comic-scraper/1.0' },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Image download HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  await fs.writeFile(destPath, Buffer.from(buf));
}

// Resolve the Comic Vine volume ID for a series.
// Uses stored comic_vine_id if present; otherwise searches by title and picks
// the Nth result chronologically when series.volume is set.
async function resolveVolumeId(series) {
  if (series.comic_vine_id) return { id: series.comic_vine_id, candidates: [] };

  for (const searchTitle of searchVariants(series.title)) {
    const data = await cvGet('volumes', {
      filter: `name:${searchTitle}`,
      field_list: 'id,name,start_year,count_of_issues,publisher',
      limit: 10,
    });
    await sleep(CV_DELAY);

    const results = data.results || [];
    if (!results.length) continue;

    const exact = results.filter(v => v.name.toLowerCase() === series.title.toLowerCase());
    const pool2 = exact.length ? exact : results;

    let match = pool2[0];
    if (series.volume && pool2.length > 1) {
      const n = parseInt(series.volume, 10);
      if (!isNaN(n)) {
        const sorted = [...pool2].sort((a, b) => (a.start_year || 0) - (b.start_year || 0));
        match = sorted[n - 1] || sorted[0];
      }
    }

    return { id: match.id, candidates: pool2 };
  }

  return { id: null, candidates: [] };
}

// ── Core scrape logic ─────────────────────────────────────────────────────────

async function scrapeOneSeries(series) {
  const log = [];

  const { id: volumeId, candidates } = await resolveVolumeId(series);
  if (!volumeId) {
    return { ok: false, reason: `No Comic Vine volume found for "${series.title}"`, log, candidates };
  }

  if (!series.comic_vine_id) {
    await pool.query(
      `UPDATE comic_series SET comic_vine_id = $2, updated_at = NOW() WHERE id = $1`,
      [series.id, volumeId]
    );
    log.push(`Resolved comic_vine_id: ${volumeId}`);
  }

  // Fetch only issues that have not been scraped yet for this series
  const { rows: unscraped } = await pool.query(
    `SELECT id, issue_number FROM comic_issues
     WHERE series_id = $1 AND scrape_attempted_at IS NULL
     ORDER BY
       CASE WHEN issue_number ~ '^[0-9]+$' THEN issue_number::integer END NULLS LAST,
       issue_number`,
    [series.id]
  );

  if (!unscraped.length) {
    log.push('No unscraped issues found');
    return { ok: true, volumeId, candidates, scraped: 0, log };
  }

  const writerSet = new Set(Array.isArray(series.writers) ? series.writers : []);
  const artistSet = new Set(Array.isArray(series.artists) ? series.artists : []);

  for (const issue of unscraped) {
    const issueNum = issue.issue_number;
    const now = new Date();

    try {
      const data = await cvGet('issues', {
        filter: `volume:${volumeId},issue_number:${issueNum}`,
        field_list: 'id,issue_number,name,image,person_credits,cover_date,description,deck,character_credits,location_credits,story_arc_credits',
        limit: 1,
      });
      await sleep(CV_DELAY);

      const cvIssue = data.results?.[0];
      if (!cvIssue) {
        await pool.query(
          `UPDATE comic_issues SET scrape_attempted_at = $2 WHERE id = $1`,
          [issue.id, now]
        );
        log.push(`#${issueNum}: not found on Comic Vine`);
        continue;
      }

      // Extract credits
      const issueWriters = [];
      const issueArtists = [];
      for (const credit of (cvIssue.person_credits || [])) {
        const role = (credit.role || '').toLowerCase();
        if (role.includes('writer'))  { writerSet.add(credit.name); issueWriters.push(credit.name); }
        if (role.includes('pencil') || (role.includes('artist') && !role.includes('cover'))) {
          artistSet.add(credit.name); issueArtists.push(credit.name);
        }
      }

      // Download cover
      let coverImagePath = null;
      const imageUrl = cvIssue.image?.medium_url || cvIssue.image?.small_url || cvIssue.image?.super_url;
      if (imageUrl) {
        const rawExt = (imageUrl.split('.').pop()?.split('?')[0] || 'jpg').toLowerCase();
        const ext    = ['jpg', 'jpeg', 'png', 'webp'].includes(rawExt) ? rawExt : 'jpg';
        const dest   = path.join(COMICS_IMAGES_DIR, series.id, `${issueNum}.${ext}`);
        try {
          await downloadFile(imageUrl, dest);
          coverImagePath = `/images/comics/${series.id}/${issueNum}.${ext}`;
          log.push(`#${issueNum}: cover saved`);
        } catch (dlErr) {
          log.push(`#${issueNum}: cover download failed — ${dlErr.message}`);
        }
      }

      await pool.query(
        `UPDATE comic_issues SET
          name                = $3,
          cover_date          = $4,
          cover_image         = COALESCE($5, cover_image),
          writers             = $6::jsonb,
          artists             = $7::jsonb,
          characters          = $8::jsonb,
          locations           = $9::jsonb,
          story_arcs          = $10::jsonb,
          description         = $11,
          cv_issue_id         = $12,
          scrape_attempted_at = $13
         WHERE id = $1 AND series_id = $2`,
        [
          issue.id, series.id,
          cvIssue.name || null,
          cvIssue.cover_date || null,
          coverImagePath,
          JSON.stringify(issueWriters),
          JSON.stringify(issueArtists),
          JSON.stringify((cvIssue.character_credits || []).map(c => c.name).filter(Boolean)),
          JSON.stringify((cvIssue.location_credits  || []).map(l => l.name).filter(Boolean)),
          JSON.stringify((cvIssue.story_arc_credits || []).map(a => a.name).filter(Boolean)),
          cvIssue.description || cvIssue.deck || null,
          cvIssue.id,
          now,
        ]
      );
    } catch (err) {
      await pool.query(
        `UPDATE comic_issues SET scrape_attempted_at = $2 WHERE id = $1`,
        [issue.id, now]
      );
      log.push(`#${issueNum}: error — ${err.message}`);
      await sleep(CV_DELAY);
    }
  }

  // Roll up aggregated writers/artists onto the series
  await pool.query(
    `UPDATE comic_series SET writers = $2::jsonb, artists = $3::jsonb, updated_at = NOW() WHERE id = $1`,
    [series.id, JSON.stringify([...writerSet]), JSON.stringify([...artistSet])]
  );

  return { ok: true, volumeId, candidates, scraped: unscraped.length, log };
}

function handleError(err, res) {
  const status = err.status ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Internal server error' });
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

// POST /comics/:id/scrape
// Optional body: { comic_vine_id } to override auto-detection.
// Optional query: ?force=true resets scrape_attempted_at so all issues are re-scraped.
export async function scrapeComic(req, res) {
  if (!process.env.COMIC_VINE_API_KEY) {
    return res.status(503).json({ error: 'COMIC_VINE_API_KEY not configured' });
  }
  try {
    const { rows } = await pool.query(
      `SELECT * FROM comic_series WHERE id = $1`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: `Series "${req.params.id}" not found` });

    const series = rows[0];
    if (req.body?.comic_vine_id) {
      // Accept either the bare numeric ID (21508) or CV's full slug format (4050-21508)
      const raw = String(req.body.comic_vine_id);
      const numeric = raw.includes('-') ? raw.split('-').pop() : raw;
      series.comic_vine_id = Number(numeric);
    }

    if (req.query.force === 'true' || req.body?.force) {
      await pool.query(
        `UPDATE comic_issues SET scrape_attempted_at = NULL WHERE series_id = $1`,
        [series.id]
      );
    }

    res.json(await scrapeOneSeries(series));
  } catch (err) {
    handleError(err, res);
  }
}

// POST /comics/scrape-unscraped?limit=20
// Finds series with unscraped issues and processes them in sequence.
// Called by n8n every 8 hours; can also be triggered manually.
export async function scrapeUnscraped(req, res) {
  if (!process.env.COMIC_VINE_API_KEY) {
    return res.status(503).json({ error: 'COMIC_VINE_API_KEY not configured' });
  }
  try {
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);

    const { rows: queue } = await pool.query(`
      SELECT DISTINCT ON (s.id) s.*
      FROM comic_series s
      JOIN comic_issues i ON i.series_id = s.id
      WHERE i.scrape_attempted_at IS NULL
      ORDER BY s.id, s.title
      LIMIT $1
    `, [limit]);

    const results = {};
    for (const series of queue) {
      console.log(`[comics-scrape] ${series.id}`);
      results[series.id] = await scrapeOneSeries(series);
    }

    const { rows: remaining } = await pool.query(
      `SELECT COUNT(DISTINCT series_id) AS n FROM comic_issues WHERE scrape_attempted_at IS NULL`
    );

    res.json({
      queued:    queue.length,
      remaining: Math.max(0, parseInt(remaining[0].n, 10) - queue.length),
      results,
    });
  } catch (err) {
    handleError(err, res);
  }
}
