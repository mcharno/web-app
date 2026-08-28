import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import {
  normalizeTitle, titleSimilarity, scoreVolumeCandidate,
  AUTO_ACCEPT_SCORE, AUTO_ACCEPT_TITLE_SIM,
} from '../utils/cvMatching.js';

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
    if (k === 'filter' || k === 'field_list') {
      // CV uses literal colons and commas as separators — don't let URLSearchParams
      // encode them as %3A / %2C
      extras.push(`${k}=${encodeURIComponent(String(v)).replace(/%3A/gi, ':').replace(/%2C/gi, ',')}`);
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

// Query strings to try against CV in priority order. The fuzzy /search
// endpoint copes with most local-entry quirks, but a cleaned-up variant and a
// broad first-words fallback still improve recall.
function searchVariants(title) {
  const seen = new Set();
  const add = (s) => { const t = s.trim(); if (t) seen.add(t); };

  add(title);
  add(normalizeTitle(title));
  // First couple of significant words as broad fallback
  const words = normalizeTitle(title).split(' ')
    .filter(w => w.length > 2 && !['the', 'a', 'an', 'and'].includes(w));
  if (words.length) add(words.slice(0, 2).join(' '));

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

const VOLUME_FIELDS = 'id,name,start_year,count_of_issues,publisher,image';

// Gather CV volume candidates for a title: the fuzzy /search endpoint first
// (handles typos and punctuation drift), then the strict filter endpoint as a
// backup. Deduped by volume id.
async function gatherVolumeCandidates(title) {
  const byId = new Map();
  const collect = (results) => {
    for (const v of results || []) if (v?.id && !byId.has(v.id)) byId.set(v.id, v);
  };

  for (const query of searchVariants(title)) {
    const data = await cvGet('search', {
      resources: 'volume',
      query,
      field_list: VOLUME_FIELDS,
      limit: 20,
    });
    await sleep(CV_DELAY);
    collect(data.results);
    // A confident hit on the first (most specific) query is enough
    if (byId.size && [...byId.values()].some(v => titleSimilarity(title, v.name) >= 0.9)) break;
  }

  if (!byId.size) {
    // Strict filter endpoint as last resort — occasionally finds volumes the
    // search index misses
    const data = await cvGet('volumes', {
      filter: `name:${normalizeTitle(title)}`,
      field_list: VOLUME_FIELDS,
      limit: 10,
    });
    await sleep(CV_DELAY);
    collect(data.results);
  }

  return [...byId.values()];
}

// Slim a scored CV volume down to what's worth persisting in cv_candidates
function candidateSummary(v) {
  return {
    id:          v.id,
    name:        v.name,
    start_year:  v.start_year ?? null,
    issue_count: v.count_of_issues ?? null,
    publisher:   v.publisher?.name ?? null,
    image:       v.image?.small_url ?? v.image?.medium_url ?? null,
    score:       Math.round(v._score * 100) / 100,
  };
}

// Resolve the Comic Vine volume ID for a series.
// Uses stored comic_vine_id if present; otherwise gathers candidates, scores
// them (title similarity + publisher + issue-count plausibility), and
// auto-accepts only above a confidence threshold. When series.volume is set
// and several candidates match the title equally well, picks the Nth
// chronologically. Returns scored candidates either way so failures can be
// parked for manual resolution.
async function resolveVolumeId(series, ownedIssueNumbers = []) {
  if (series.comic_vine_id) return { id: series.comic_vine_id, candidates: [], resolved: false };

  const volumes = await gatherVolumeCandidates(series.title);
  for (const v of volumes) v._score = scoreVolumeCandidate(series, v, ownedIssueNumbers);
  volumes.sort((a, b) => b._score - a._score);
  const candidates = volumes.slice(0, 5).map(candidateSummary);

  if (!volumes.length) return { id: null, candidates, resolved: false };

  let best = volumes[0];

  // Same-title reprints/relaunches: use the local volume number to pick the
  // Nth run chronologically among near-equal title matches.
  const topSim = titleSimilarity(series.title, best.name);
  if (series.volume) {
    const n = parseInt(series.volume, 10);
    const runs = volumes.filter(v => titleSimilarity(series.title, v.name) >= topSim - 0.05);
    if (!isNaN(n) && runs.length > 1) {
      const sorted = [...runs].sort((a, b) => (a.start_year || 0) - (b.start_year || 0));
      best = sorted[n - 1] || best;
    }
  }

  const accepted =
    best._score >= AUTO_ACCEPT_SCORE &&
    titleSimilarity(series.title, best.name) >= AUTO_ACCEPT_TITLE_SIM;

  return { id: accepted ? best.id : null, candidates, resolved: accepted };
}

// ── Core scrape logic ─────────────────────────────────────────────────────────

async function scrapeOneSeries(series) {
  const log = [];

  // Owned issue numbers inform candidate scoring (a matching volume must have
  // at least as many issues as the highest owned number)
  const { rows: ownedRows } = await pool.query(
    `SELECT issue_number FROM comic_issues WHERE series_id = $1`, [series.id]
  );
  const ownedIssueNumbers = ownedRows.map(r => r.issue_number);

  const { id: volumeId, candidates, resolved } = await resolveVolumeId(series, ownedIssueNumbers);
  if (!volumeId) {
    // Park for manual resolution: store the scored candidates and stamp the
    // attempt so the scheduled job stops retrying this series.
    await pool.query(
      `UPDATE comic_series SET
        cv_candidates           = $2::jsonb,
        cv_resolve_attempted_at = NOW(),
        updated_at              = NOW()
       WHERE id = $1`,
      [series.id, JSON.stringify(candidates)]
    );
    return {
      ok: false,
      reason: candidates.length
        ? `No confident Comic Vine match for "${series.title}" — ${candidates.length} candidate(s) stored for manual review`
        : `No Comic Vine volume found for "${series.title}"`,
      log, candidates,
    };
  }

  if (resolved) {
    await pool.query(
      `UPDATE comic_series SET
        comic_vine_id           = $2,
        cv_candidates           = NULL,
        cv_resolve_attempted_at = NOW(),
        updated_at              = NOW()
       WHERE id = $1`,
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
      // Step 1: find the issue ID via list endpoint (credits not available here)
      const listData = await cvGet('issues', {
        filter: `volume:${volumeId},issue_number:${issueNum}`,
        field_list: 'id,issue_number,name,image,cover_date,description,deck',
        limit: 1,
      });
      await sleep(CV_DELAY);

      const cvIssueStub = listData.results?.[0];
      if (!cvIssueStub) {
        await pool.query(
          `UPDATE comic_issues SET scrape_attempted_at = $2 WHERE id = $1`,
          [issue.id, now]
        );
        log.push(`#${issueNum}: not found on Comic Vine`);
        continue;
      }

      // Step 2: fetch full credits from individual issue detail endpoint
      // (person_credits, character_credits etc. are only on the detail resource)
      const detailData = await cvGet(`issue/4000-${cvIssueStub.id}`, {
        field_list: 'id,person_credits,character_credits,location_credits,story_arc_credits,team_credits,object_credits',
      });
      await sleep(CV_DELAY);
      const cvIssue = { ...cvIssueStub, ...detailData.results };

      // Extract credits — writer = any writer role; artist = penciler, inker,
      // colorist, letterer, cover artist, or general artist
      const issueWriters = [];
      const issueArtists = [];
      for (const credit of (cvIssue.person_credits || [])) {
        const role = (credit.role || '').toLowerCase();
        const isWriter = role.includes('writer');
        const isArtist = role.includes('pencil') || role.includes('ink') ||
                         role.includes('color') || role.includes('colour') ||
                         role.includes('letter') || role.includes('cover') ||
                         role.includes('artist');
        if (isWriter) { writerSet.add(credit.name); issueWriters.push(credit.name); }
        if (isArtist) { artistSet.add(credit.name); issueArtists.push(credit.name); }
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
          teams               = $11::jsonb,
          objects             = $12::jsonb,
          description         = $13,
          cv_issue_id         = $14,
          scrape_attempted_at = $15
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
          JSON.stringify((cvIssue.team_credits      || []).map(t => t.name).filter(Boolean)),
          JSON.stringify((cvIssue.object_credits    || []).map(o => o.name).filter(Boolean)),
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

// ── Group header images ───────────────────────────────────────────────────────
//
// A group header should be identifiable art for the character/franchise
// WITHOUT title lettering. CV character and team profile images are usually
// clean art, so those resource types are preferred; a volume cover (which
// carries the logo) is only a last resort.

const HEADER_RESOURCE_BONUS = { character: 0.15, team: 0.12, volume: 0 };
const HEADER_MIN_SIM = 0.7;

// Best usable image URL from a CV image object
function cvImageUrl(image) {
  return image?.medium_url || image?.super_url || image?.small_url || null;
}

// Search CV characters/teams/volumes for a group name and return scored
// image candidates, best first.
async function gatherHeaderCandidates(groupName) {
  const data = await cvGet('search', {
    resources: 'character,team,volume',
    query: groupName,
    field_list: 'id,name,image,resource_type,publisher',
    limit: 30,
  });
  await sleep(CV_DELAY);

  const scored = [];
  for (const r of data.results || []) {
    const image = cvImageUrl(r.image);
    if (!image) continue;
    const sim = titleSimilarity(groupName, r.name);
    if (sim < HEADER_MIN_SIM) continue;
    scored.push({
      cv_id:         r.id,
      name:          r.name,
      resource_type: r.resource_type,
      publisher:     r.publisher?.name ?? null,
      image,
      score: Math.round((sim + (HEADER_RESOURCE_BONUS[r.resource_type] ?? 0)) * 100) / 100,
    });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

// Download an image to the groups dir and persist it as the group's header.
// The stored path carries a version query so replacements bust browser caches.
async function saveGroupHeader(groupId, imageUrl, candidates = null) {
  const rawExt = (imageUrl.split('.').pop()?.split('?')[0] || 'jpg').toLowerCase();
  const ext    = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(rawExt) ? rawExt : 'jpg';
  const dest   = path.join(COMICS_IMAGES_DIR, 'groups', `${groupId}.${ext}`);
  await downloadFile(imageUrl, dest);
  const coverPath = `/images/comics/groups/${groupId}.${ext}?v=${Date.now()}`;

  await pool.query(
    `UPDATE comic_groups SET
      cover_image       = $2,
      header_candidates = COALESCE($3::jsonb, header_candidates),
      updated_at        = NOW()
     WHERE id = $1`,
    [groupId, coverPath, candidates ? JSON.stringify(candidates) : null]
  );
  return coverPath;
}

function slugifyPublisher(publisher) {
  return publisher.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Download an image to the groups dir and persist it as the group's hero
// banner art (distinct from the header/cover thumbnail). When unset, the API
// falls back to cover_image, so this is only needed when a wider/different
// piece of art is wanted for the full-bleed detail-page banner.
//
// With a `publisher`, the image is stored in publisher_heroes[publisher]
// instead of the group-wide hero_image — for groups whose series span more
// than one real publisher, where each publisher's section on the detail page
// gets its own hero art.
async function saveGroupHero(groupId, imageUrl, publisher = null) {
  const rawExt = (imageUrl.split('.').pop()?.split('?')[0] || 'jpg').toLowerCase();
  const ext    = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(rawExt) ? rawExt : 'jpg';
  const suffix = publisher ? `-hero-${slugifyPublisher(publisher)}` : '-hero';
  const dest   = path.join(COMICS_IMAGES_DIR, 'groups', `${groupId}${suffix}.${ext}`);
  await downloadFile(imageUrl, dest);
  const heroPath = `/images/comics/groups/${groupId}${suffix}.${ext}?v=${Date.now()}`;

  if (publisher) {
    await pool.query(
      `UPDATE comic_groups SET
        publisher_heroes = jsonb_set(publisher_heroes, ARRAY[$2]::text[], to_jsonb($3::text), true),
        updated_at        = NOW()
       WHERE id = $1`,
      [groupId, publisher, heroPath]
    );
  } else {
    await pool.query(
      `UPDATE comic_groups SET hero_image = $2, updated_at = NOW() WHERE id = $1`,
      [groupId, heroPath]
    );
  }
  return heroPath;
}

// Scrape one group's header. Returns { ok, cover_image?, chosen?, candidates }.
async function scrapeOneGroupHeader(group) {
  const candidates = await gatherHeaderCandidates(group.name);
  if (!candidates.length) {
    await pool.query(
      `UPDATE comic_groups SET header_candidates = '[]'::jsonb, updated_at = NOW() WHERE id = $1`,
      [group.id]
    );
    return { ok: false, reason: `No usable Comic Vine art found for "${group.name}"`, candidates };
  }

  const [best, ...rest] = candidates;
  try {
    const coverPath = await saveGroupHeader(group.id, best.image, rest.slice(0, 8));
    return { ok: true, cover_image: coverPath, chosen: best, candidates: rest.slice(0, 8) };
  } catch (err) {
    return { ok: false, reason: `Image download failed — ${err.message}`, candidates };
  }
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
      // Persist the manual resolution (and clear any parked candidates)
      await pool.query(
        `UPDATE comic_series SET
          comic_vine_id           = $2,
          cv_candidates           = NULL,
          cv_resolve_attempted_at = NOW(),
          updated_at              = NOW()
         WHERE id = $1`,
        [series.id, series.comic_vine_id]
      );
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

// POST /comics/scrape-unscraped?limit=20&retry_failed=true
// Finds series with unscraped issues and processes them in sequence.
// Series whose CV resolution already failed are skipped (their candidates are
// parked for manual review) unless retry_failed=true.
// Called by n8n every 8 hours; can also be triggered manually.
export async function scrapeUnscraped(req, res) {
  if (!process.env.COMIC_VINE_API_KEY) {
    return res.status(503).json({ error: 'COMIC_VINE_API_KEY not configured' });
  }
  try {
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
    const retryFailed = req.query.retry_failed === 'true';

    const { rows: queue } = await pool.query(`
      SELECT DISTINCT ON (s.id) s.*
      FROM comic_series s
      JOIN comic_issues i ON i.series_id = s.id
      WHERE i.scrape_attempted_at IS NULL
        AND ($2 OR s.comic_vine_id IS NOT NULL OR s.cv_resolve_attempted_at IS NULL)
      ORDER BY s.id, s.title
      LIMIT $1
    `, [limit, retryFailed]);

    const results = {};
    for (const series of queue) {
      console.log(`[comics-scrape] ${series.id}`);
      results[series.id] = await scrapeOneSeries(series);
    }

    const { rows: [counts] } = await pool.query(`
      SELECT
        COUNT(DISTINCT i.series_id) FILTER (
          WHERE s.comic_vine_id IS NOT NULL OR s.cv_resolve_attempted_at IS NULL
        ) AS actionable,
        COUNT(DISTINCT i.series_id) FILTER (
          WHERE s.comic_vine_id IS NULL AND s.cv_resolve_attempted_at IS NOT NULL
        ) AS parked
      FROM comic_issues i
      JOIN comic_series s ON s.id = i.series_id
      WHERE i.scrape_attempted_at IS NULL
    `);

    res.json({
      queued:    queue.length,
      remaining: Math.max(0, parseInt(counts.actionable, 10) - queue.length),
      parked:    parseInt(counts.parked, 10),
      results,
    });
  } catch (err) {
    handleError(err, res);
  }
}

// POST /comics/groups/:id/scrape-header
// Body { image_url } sets a manual override (downloaded and self-hosted);
// otherwise auto-scrapes from Comic Vine character/team/volume art.
export async function scrapeGroupHeader(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM comic_groups WHERE id = $1`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: `Group "${req.params.id}" not found` });
    const group = rows[0];

    if (req.body?.image_url) {
      const coverPath = await saveGroupHeader(group.id, String(req.body.image_url));
      return res.json({ ok: true, cover_image: coverPath, manual: true });
    }

    if (!process.env.COMIC_VINE_API_KEY) {
      return res.status(503).json({ error: 'COMIC_VINE_API_KEY not configured' });
    }
    res.json(await scrapeOneGroupHeader(group));
  } catch (err) {
    handleError(err, res);
  }
}

// POST /comics/groups/:id/scrape-hero
// Body { image_url } (required), { publisher } (optional) — downloads and
// self-hosts a wide banner image for the detail-page hero, distinct from the
// header/cover thumbnail. With `publisher`, sets that publisher's entry in
// publisher_heroes instead of the group-wide hero_image — for groups whose
// series span more than one real publisher, each gets its own section (and
// hero) on the detail page. There's no auto-scrape source for this (Comic
// Vine doesn't distinguish "wide" art) — it's manual-only, used when the
// default (falling back to cover_image) isn't wide/clean enough for a
// full-bleed banner.
export async function scrapeGroupHero(req, res) {
  try {
    if (!req.body?.image_url) {
      return res.status(400).json({ error: 'image_url is required' });
    }
    const { rowCount } = await pool.query(`SELECT 1 FROM comic_groups WHERE id = $1`, [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: `Group "${req.params.id}" not found` });

    const publisher = req.body.publisher ? String(req.body.publisher) : null;
    const heroPath = await saveGroupHero(req.params.id, String(req.body.image_url), publisher);
    res.json(publisher
      ? { ok: true, publisher, hero_image: heroPath }
      : { ok: true, hero_image: heroPath });
  } catch (err) {
    handleError(err, res);
  }
}

// POST /comics/scrape-headers?force=true&limit=60
// Scrapes headers for all groups missing one (force=true redoes all).
export async function scrapeGroupHeaders(req, res) {
  if (!process.env.COMIC_VINE_API_KEY) {
    return res.status(503).json({ error: 'COMIC_VINE_API_KEY not configured' });
  }
  try {
    const force = req.query.force === 'true' || req.body?.force;
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 60);

    const { rows: queue } = await pool.query(`
      SELECT * FROM comic_groups
      WHERE $1 OR cover_image IS NULL
      ORDER BY name
      LIMIT $2
    `, [Boolean(force), limit]);

    const results = {};
    for (const group of queue) {
      console.log(`[comics-header] ${group.id}`);
      results[group.id] = await scrapeOneGroupHeader(group);
    }

    const succeeded = Object.values(results).filter(r => r.ok).length;
    res.json({ queued: queue.length, succeeded, failed: queue.length - succeeded, results });
  } catch (err) {
    handleError(err, res);
  }
}
