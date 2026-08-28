import pool from '../config/database.js';

class NotFoundError extends Error {
  constructor(msg) { super(msg); this.status = 404; }
}
class ConflictError extends Error {
  constructor(msg) { super(msg); this.status = 409; }
}
class ValidationError extends Error {
  constructor(msg) { super(msg); this.status = 400; }
}

function handleError(err, res) {
  const status = err.status ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Internal server error' });
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Numeric-first ORDER BY clause for issue_number columns
const ISSUE_ORDER = `
  CASE WHEN issue_number ~ '^[0-9]+$' THEN issue_number::integer END NULLS LAST,
  issue_number
`;

// ── Schema ────────────────────────────────────────────────────────────────────

export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS comic_groups (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS comic_series (
      id            TEXT PRIMARY KEY,
      title         TEXT NOT NULL,
      publisher     TEXT NOT NULL DEFAULT '',
      volume        TEXT,
      group_id      TEXT REFERENCES comic_groups(id) ON DELETE SET NULL,
      comic_vine_id INTEGER,
      cover_image   TEXT,
      writers       JSONB NOT NULL DEFAULT '[]',
      artists       JSONB NOT NULL DEFAULT '[]',
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS comic_issues (
      id                  SERIAL PRIMARY KEY,
      series_id           TEXT NOT NULL REFERENCES comic_series(id) ON DELETE CASCADE,
      issue_number        TEXT NOT NULL,
      name                TEXT,
      cover_date          TEXT,
      cover_image         TEXT,
      writers             JSONB NOT NULL DEFAULT '[]',
      artists             JSONB NOT NULL DEFAULT '[]',
      characters          JSONB NOT NULL DEFAULT '[]',
      locations           JSONB NOT NULL DEFAULT '[]',
      story_arcs          JSONB NOT NULL DEFAULT '[]',
      description         TEXT,
      cv_issue_id         INTEGER,
      scrape_attempted_at TIMESTAMPTZ,
      created_at          TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (series_id, issue_number)
    );

    CREATE INDEX IF NOT EXISTS idx_comic_series_group  ON comic_series(group_id);
    CREATE INDEX IF NOT EXISTS idx_comic_series_title  ON comic_series(title);
    CREATE INDEX IF NOT EXISTS idx_comic_issues_series ON comic_issues(series_id);
    CREATE INDEX IF NOT EXISTS idx_comic_issues_chars  ON comic_issues USING GIN(characters);
    CREATE INDEX IF NOT EXISTS idx_comic_issues_locs   ON comic_issues USING GIN(locations);
    CREATE INDEX IF NOT EXISTS idx_comic_issues_arcs   ON comic_issues USING GIN(story_arcs);
  `);

  // Additive migrations — safe to run repeatedly
  await pool.query(`
    ALTER TABLE comic_issues ADD COLUMN IF NOT EXISTS teams   JSONB NOT NULL DEFAULT '[]';
    ALTER TABLE comic_issues ADD COLUMN IF NOT EXISTS objects JSONB NOT NULL DEFAULT '[]';
    CREATE INDEX IF NOT EXISTS idx_comic_issues_teams   ON comic_issues USING GIN(teams);
    CREATE INDEX IF NOT EXISTS idx_comic_issues_objects ON comic_issues USING GIN(objects);

    -- CV volume resolution bookkeeping: when auto-resolution fails, the top
    -- candidates are stored for manual review and the attempt is timestamped
    -- so the scheduled scrape stops retrying known failures.
    ALTER TABLE comic_series ADD COLUMN IF NOT EXISTS cv_candidates           JSONB;
    ALTER TABLE comic_series ADD COLUMN IF NOT EXISTS cv_resolve_attempted_at TIMESTAMPTZ;

    -- Group header image scraping: runner-up candidates kept for overrides.
    ALTER TABLE comic_groups ADD COLUMN IF NOT EXISTS header_candidates JSONB;

    -- Optional wide "hero" art for the group detail banner, distinct from the
    -- close-up cover_image used for tiles/search — falls back to cover_image
    -- when unset.
    ALTER TABLE comic_groups ADD COLUMN IF NOT EXISTS hero_image TEXT;

    -- Per-publisher hero art, for groups whose series span more than one
    -- real publisher (e.g. a licensed property published by different
    -- companies) — maps publisher string -> hero image path. hero_image
    -- above remains the group-wide fallback for any publisher without an
    -- entry here.
    ALTER TABLE comic_groups ADD COLUMN IF NOT EXISTS publisher_heroes JSONB NOT NULL DEFAULT '{}';
  `);
  console.log('[comics] schema ready');
}

// ── Groups ────────────────────────────────────────────────────────────────────

// GET /comics/groups?search=&page=&limit=
// Returns groups paginated, each with their series (including issue number arrays).
export async function getGroups(req, res) {
  try {
    const { search } = req.query;
    const page   = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit  = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const offset = (page - 1) * limit;

    const params = [];
    let p = 1;
    const where = search
      ? `WHERE g.name ILIKE $${p} OR EXISTS (
           SELECT 1 FROM comic_series s2
           WHERE s2.group_id = g.id AND (s2.title ILIKE $${p} OR s2.publisher ILIKE $${p})
         )`
      : '';
    if (search) { params.push(`%${search}%`); p++; }

    const total = parseInt(
      (await pool.query(`SELECT COUNT(*) FROM comic_groups g ${where}`, params)).rows[0].count,
      10
    );

    const { rows } = await pool.query(`
      SELECT
        g.id, g.name, g.description, g.cover_image,
        COALESCE(
          json_agg(
            json_build_object(
              'id',            s.id,
              'title',         s.title,
              'publisher',     s.publisher,
              'volume',        s.volume,
              'comic_vine_id', s.comic_vine_id,
              'cover_image',   s.cover_image,
              'writers',       s.writers,
              'artists',       s.artists,
              'issues', (
                SELECT COALESCE(json_agg(
                  i.issue_number ORDER BY
                    CASE WHEN i.issue_number ~ '^[0-9]+$' THEN i.issue_number::integer END NULLS LAST,
                    i.issue_number
                ), '[]'::json)
                FROM comic_issues i WHERE i.series_id = s.id
              )
            ) ORDER BY s.publisher NULLS LAST, s.title
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'::json
        ) AS series
      FROM comic_groups g
      LEFT JOIN comic_series s ON s.group_id = g.id
      ${where}
      GROUP BY g.id
      ORDER BY g.name
      LIMIT $${p} OFFSET $${p + 1}
    `, [...params, limit, offset]);

    res.json({ groups: rows, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    handleError(err, res);
  }
}

// GET /comics/groups/:id — one group with its series (issue number arrays)
export async function getGroupById(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        g.id, g.name, g.description, g.cover_image,
        COALESCE(g.hero_image, g.cover_image) AS hero_image,
        g.publisher_heroes,
        COALESCE(
          json_agg(
            json_build_object(
              'id',            s.id,
              'title',         s.title,
              'publisher',     s.publisher,
              'volume',        s.volume,
              'comic_vine_id', s.comic_vine_id,
              'cover_image',   s.cover_image,
              'writers',       s.writers,
              'artists',       s.artists,
              'issues', (
                SELECT COALESCE(json_agg(
                  i.issue_number ORDER BY
                    CASE WHEN i.issue_number ~ '^[0-9]+$' THEN i.issue_number::integer END NULLS LAST,
                    i.issue_number
                ), '[]'::json)
                FROM comic_issues i WHERE i.series_id = s.id
              )
            ) ORDER BY s.publisher NULLS LAST, s.title
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'::json
        ) AS series
      FROM comic_groups g
      LEFT JOIN comic_series s ON s.group_id = g.id
      WHERE g.id = $1
      GROUP BY g.id
    `, [req.params.id]);

    if (!rows.length) throw new NotFoundError(`Group "${req.params.id}" not found`);
    res.json(rows[0]);
  } catch (err) {
    handleError(err, res);
  }
}

// POST /comics/groups
export async function createGroup(req, res) {
  try {
    const { name, description, cover_image } = req.body;
    if (!name?.trim()) throw new ValidationError('name is required');
    const id = req.body.id?.trim() || slugify(name);

    const { rows } = await pool.query(
      `INSERT INTO comic_groups (id, name, description, cover_image)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, name.trim(), description ?? null, cover_image ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') handleError(new ConflictError('Group id already exists'), res);
    else handleError(err, res);
  }
}

// PATCH /comics/groups/:id
// hero_image here expects an already-hosted path (e.g. re-applying one this
// API previously downloaded). To set it from an arbitrary remote URL, use
// POST /comics/groups/:id/scrape-hero — self-hosts it first.
export async function updateGroup(req, res) {
  try {
    const { name, description, cover_image, hero_image } = req.body;
    const { rows, rowCount } = await pool.query(
      `UPDATE comic_groups SET
        name        = COALESCE($2, name),
        description = COALESCE($3, description),
        cover_image = COALESCE($4, cover_image),
        hero_image  = COALESCE($5, hero_image),
        updated_at  = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id, name ?? null, description ?? null, cover_image ?? null, hero_image ?? null]
    );
    if (!rowCount) throw new NotFoundError(`Group "${req.params.id}" not found`);
    res.json(rows[0]);
  } catch (err) {
    handleError(err, res);
  }
}

// DELETE /comics/groups/:id
export async function deleteGroup(req, res) {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM comic_groups WHERE id = $1`, [req.params.id]
    );
    if (!rowCount) throw new NotFoundError(`Group "${req.params.id}" not found`);
    res.status(204).end();
  } catch (err) {
    handleError(err, res);
  }
}

// ── Series ────────────────────────────────────────────────────────────────────

// GET /comics?search=&publisher=&group_id=&page=&limit=
export async function getAllComics(req, res) {
  try {
    const { search, publisher, group_id } = req.query;
    const page   = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit  = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let p = 1;

    if (search)    { conditions.push(`(s.title ILIKE $${p} OR s.publisher ILIKE $${p})`); params.push(`%${search}%`); p++; }
    if (publisher) { conditions.push(`s.publisher = $${p++}`); params.push(publisher); }
    if (group_id)  { conditions.push(`s.group_id = $${p++}`); params.push(group_id); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = parseInt(
      (await pool.query(`SELECT COUNT(*) FROM comic_series s ${where}`, params)).rows[0].count,
      10
    );

    const { rows } = await pool.query(`
      SELECT s.*,
        (SELECT COUNT(*) FROM comic_issues i WHERE i.series_id = s.id) AS issue_count
      FROM comic_series s
      ${where}
      ORDER BY s.title
      LIMIT $${p} OFFSET $${p + 1}
    `, [...params, limit, offset]);

    res.json({ comics: rows, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    handleError(err, res);
  }
}

// GET /comics/:id — series with full issue objects
export async function getComicById(req, res) {
  try {
    const { rows: series } = await pool.query(
      `SELECT * FROM comic_series WHERE id = $1`, [req.params.id]
    );
    if (!series.length) throw new NotFoundError(`Series "${req.params.id}" not found`);

    const { rows: issues } = await pool.query(
      `SELECT * FROM comic_issues WHERE series_id = $1
       ORDER BY
         CASE WHEN issue_number ~ '^[0-9]+$' THEN issue_number::integer END NULLS LAST,
         issue_number`,
      [req.params.id]
    );

    res.json({ ...series[0], issues });
  } catch (err) {
    handleError(err, res);
  }
}

// POST /comics
export async function createComic(req, res) {
  try {
    const {
      title, publisher = '', volume, group_id, comic_vine_id,
      cover_image, writers = [], artists = [], issues = [],
    } = req.body;
    if (!title?.trim()) throw new ValidationError('title is required');

    const id = req.body.id?.trim()
      || (slugify(title) + (volume ? `-vol-${slugify(String(volume))}` : ''));

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `INSERT INTO comic_series
           (id, title, publisher, volume, group_id, comic_vine_id, cover_image, writers, artists)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)
         RETURNING *`,
        [
          id, title.trim(), publisher.trim(), volume ?? null, group_id ?? null,
          comic_vine_id ?? null, cover_image ?? null,
          JSON.stringify(writers), JSON.stringify(artists),
        ]
      );

      if (issues.length) {
        const vals = issues.map((_, i) => `($1, $${i + 2})`).join(', ');
        await client.query(
          `INSERT INTO comic_issues (series_id, issue_number) VALUES ${vals} ON CONFLICT DO NOTHING`,
          [id, ...issues.map(String)]
        );
      }

      await client.query('COMMIT');
      res.status(201).json({ ...rows[0], issues: issues.map(String) });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    if (err.code === '23505') handleError(new ConflictError('Series id already exists'), res);
    else handleError(err, res);
  }
}

// PATCH /comics/:id
// Providing `issues` array adds any new issue numbers (never deletes existing ones).
export async function updateComic(req, res) {
  try {
    const {
      title, publisher, volume, group_id, comic_vine_id,
      cover_image, writers, artists, issues,
    } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows, rowCount } = await client.query(
        `UPDATE comic_series SET
          title         = COALESCE($2, title),
          publisher     = COALESCE($3, publisher),
          volume        = COALESCE($4, volume),
          group_id      = COALESCE($5, group_id),
          comic_vine_id = COALESCE($6, comic_vine_id),
          cover_image   = COALESCE($7, cover_image),
          writers       = COALESCE($8::jsonb, writers),
          artists       = COALESCE($9::jsonb, artists),
          updated_at    = NOW()
         WHERE id = $1 RETURNING *`,
        [
          req.params.id,
          title ?? null, publisher ?? null, volume ?? null, group_id ?? null,
          comic_vine_id ?? null, cover_image ?? null,
          writers ? JSON.stringify(writers) : null,
          artists ? JSON.stringify(artists) : null,
        ]
      );
      if (!rowCount) throw new NotFoundError(`Series "${req.params.id}" not found`);

      if (issues?.length) {
        const vals = issues.map((_, i) => `($1, $${i + 2})`).join(', ');
        await client.query(
          `INSERT INTO comic_issues (series_id, issue_number) VALUES ${vals} ON CONFLICT DO NOTHING`,
          [req.params.id, ...issues.map(String)]
        );
      }

      await client.query('COMMIT');
      res.json(rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    handleError(err, res);
  }
}

// DELETE /comics/:id
export async function deleteComic(req, res) {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM comic_series WHERE id = $1`, [req.params.id]
    );
    if (!rowCount) throw new NotFoundError(`Series "${req.params.id}" not found`);
    res.status(204).end();
  } catch (err) {
    handleError(err, res);
  }
}

// GET /comics/unresolved
// Series with no Comic Vine volume id, with any parked candidates from the
// last failed auto-resolution — the CLI uses this for manual fixes.
export async function getUnresolvedSeries(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT s.id, s.title, s.publisher, s.volume, s.group_id,
        s.cv_candidates, s.cv_resolve_attempted_at,
        (SELECT COUNT(*) FROM comic_issues i WHERE i.series_id = s.id) AS issue_count
      FROM comic_series s
      WHERE s.comic_vine_id IS NULL
      ORDER BY s.cv_resolve_attempted_at DESC NULLS LAST, s.title
    `);
    res.json({ series: rows, total: rows.length });
  } catch (err) {
    handleError(err, res);
  }
}

// GET /comics/stats — collection + scrape progress totals (used by the CLI)
export async function getStats(req, res) {
  try {
    const { rows: [stats] } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM comic_groups)                                   AS groups,
        (SELECT COUNT(*) FROM comic_groups WHERE cover_image IS NOT NULL)     AS groups_with_header,
        (SELECT COUNT(*) FROM comic_series)                                   AS series,
        (SELECT COUNT(*) FROM comic_series WHERE comic_vine_id IS NOT NULL)   AS series_resolved,
        (SELECT COUNT(*) FROM comic_series
          WHERE comic_vine_id IS NULL AND cv_resolve_attempted_at IS NOT NULL) AS series_parked,
        (SELECT COUNT(*) FROM comic_issues)                                   AS issues,
        (SELECT COUNT(*) FROM comic_issues WHERE scrape_attempted_at IS NOT NULL) AS issues_attempted,
        (SELECT COUNT(*) FROM comic_issues WHERE cover_image IS NOT NULL)     AS issues_with_cover
    `);
    res.json(Object.fromEntries(
      Object.entries(stats).map(([k, v]) => [k, parseInt(v, 10)])
    ));
  } catch (err) {
    handleError(err, res);
  }
}

// GET /comics/publishers
export async function getPublishers(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT publisher FROM comic_series
       WHERE publisher != '' ORDER BY publisher`
    );
    res.json({ publishers: rows.map(r => r.publisher) });
  } catch (err) {
    handleError(err, res);
  }
}

// ── Issues ────────────────────────────────────────────────────────────────────

// Free-text match across an issue's name, description, and all JSONB tag arrays.
// $n is the placeholder index of the ILIKE pattern.
function issueFreeTextCondition(n) {
  return `
    i.name ILIKE $${n} OR i.description ILIKE $${n}
    OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(i.characters) e WHERE e ILIKE $${n})
    OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(i.locations)  e WHERE e ILIKE $${n})
    OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(i.story_arcs) e WHERE e ILIKE $${n})
    OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(i.teams)      e WHERE e ILIKE $${n})
    OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(i.objects)    e WHERE e ILIKE $${n})
  `;
}

// GET /comics/issues?q=&characters=&locations=&story_arcs=&series_id=&page=&limit=
// q does a free-text ILIKE across name, description, and all three JSONB array fields.
// characters/locations/story_arcs accept comma-separated exact terms (JSONB containment).
export async function searchIssues(req, res) {
  try {
    const { q, series_id } = req.query;
    const characters = req.query.characters ? req.query.characters.split(',').map(s => s.trim()).filter(Boolean) : [];
    const locations  = req.query.locations  ? req.query.locations.split(',').map(s => s.trim()).filter(Boolean)  : [];
    const story_arcs = req.query.story_arcs ? req.query.story_arcs.split(',').map(s => s.trim()).filter(Boolean) : [];
    const page   = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let p = 1;

    if (series_id) { conditions.push(`i.series_id = $${p++}`); params.push(series_id); }

    if (q) {
      conditions.push(`(${issueFreeTextCondition(p)})`);
      params.push(`%${q}%`);
      p++;
    }

    if (characters.length) { conditions.push(`i.characters @> $${p++}::jsonb`); params.push(JSON.stringify(characters)); }
    if (locations.length)  { conditions.push(`i.locations  @> $${p++}::jsonb`); params.push(JSON.stringify(locations));  }
    if (story_arcs.length) { conditions.push(`i.story_arcs @> $${p++}::jsonb`); params.push(JSON.stringify(story_arcs)); }

    if (!conditions.length) return res.json({ issues: [], total: 0, page, pages: 0 });

    const where = `WHERE ${conditions.join(' AND ')}`;

    const total = parseInt(
      (await pool.query(`SELECT COUNT(*) FROM comic_issues i ${where}`, params)).rows[0].count,
      10
    );

    const { rows } = await pool.query(`
      SELECT i.*,
        s.title     AS series_title,
        s.publisher AS series_publisher,
        s.volume    AS series_volume,
        s.group_id  AS series_group_id
      FROM comic_issues i
      JOIN comic_series s ON s.id = i.series_id
      ${where}
      ORDER BY s.title,
        CASE WHEN i.issue_number ~ '^[0-9]+$' THEN i.issue_number::integer END NULLS LAST,
        i.issue_number
      LIMIT $${p} OFFSET $${p + 1}
    `, [...params, limit, offset]);

    res.json({ issues: rows, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    handleError(err, res);
  }
}

// PATCH /comics/issues/:id
export async function updateIssue(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) throw new ValidationError('Invalid issue id');

    const { name, cover_date, cover_image, writers, artists, characters, locations, story_arcs, description, cv_issue_id } = req.body;

    const { rows, rowCount } = await pool.query(
      `UPDATE comic_issues SET
        name        = COALESCE($2,        name),
        cover_date  = COALESCE($3,        cover_date),
        cover_image = COALESCE($4,        cover_image),
        writers     = COALESCE($5::jsonb, writers),
        artists     = COALESCE($6::jsonb, artists),
        characters  = COALESCE($7::jsonb, characters),
        locations   = COALESCE($8::jsonb, locations),
        story_arcs  = COALESCE($9::jsonb, story_arcs),
        description = COALESCE($10,       description),
        cv_issue_id = COALESCE($11,       cv_issue_id)
       WHERE id = $1 RETURNING *`,
      [
        id,
        name ?? null, cover_date ?? null, cover_image ?? null,
        writers     ? JSON.stringify(writers)    : null,
        artists     ? JSON.stringify(artists)    : null,
        characters  ? JSON.stringify(characters) : null,
        locations   ? JSON.stringify(locations)  : null,
        story_arcs  ? JSON.stringify(story_arcs) : null,
        description ?? null, cv_issue_id ?? null,
      ]
    );
    if (!rowCount) throw new NotFoundError(`Issue ${id} not found`);
    res.json(rows[0]);
  } catch (err) {
    handleError(err, res);
  }
}

// DELETE /comics/issues/:id
export async function deleteIssue(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) throw new ValidationError('Invalid issue id');
    const { rowCount } = await pool.query(`DELETE FROM comic_issues WHERE id = $1`, [id]);
    if (!rowCount) throw new NotFoundError(`Issue ${id} not found`);
    res.status(204).end();
  } catch (err) {
    handleError(err, res);
  }
}

// ── Universal search ──────────────────────────────────────────────────────────

// GET /comics/search?q=&limit=
// One query, three sections: matching groups, series, and issues.
// Issues are matched on name/description and all tag arrays (characters,
// locations, story arcs, teams, objects).
export async function universalSearch(req, res) {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ query: q, groups: [], series: [], issues: [] });

    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 30));
    const pattern = `%${q}%`;

    const [groups, series, issues] = await Promise.all([
      pool.query(`
        SELECT g.id, g.name, g.description, g.cover_image,
          (SELECT COUNT(*) FROM comic_series s WHERE s.group_id = g.id) AS series_count,
          (SELECT COUNT(*) FROM comic_issues i
             JOIN comic_series s ON s.id = i.series_id
           WHERE s.group_id = g.id) AS issue_count
        FROM comic_groups g
        WHERE g.name ILIKE $1
        ORDER BY g.name
        LIMIT $2
      `, [pattern, limit]),

      pool.query(`
        SELECT s.id, s.title, s.publisher, s.volume, s.group_id, s.cover_image,
          g.name AS group_name,
          (SELECT COUNT(*) FROM comic_issues i WHERE i.series_id = s.id) AS issue_count
        FROM comic_series s
        LEFT JOIN comic_groups g ON g.id = s.group_id
        WHERE s.title ILIKE $1 OR s.publisher ILIKE $1
        ORDER BY s.title
        LIMIT $2
      `, [pattern, limit]),

      pool.query(`
        SELECT i.*,
          s.title     AS series_title,
          s.publisher AS series_publisher,
          s.volume    AS series_volume,
          s.group_id  AS series_group_id
        FROM comic_issues i
        JOIN comic_series s ON s.id = i.series_id
        WHERE ${issueFreeTextCondition(1)}
        ORDER BY s.title,
          CASE WHEN i.issue_number ~ '^[0-9]+$' THEN i.issue_number::integer END NULLS LAST,
          i.issue_number
        LIMIT $2
      `, [pattern, limit]),
    ]);

    res.json({
      query:  q,
      groups: groups.rows,
      series: series.rows,
      issues: issues.rows,
    });
  } catch (err) {
    handleError(err, res);
  }
}

// ── Comic Vine search ─────────────────────────────────────────────────────────

// GET /comics/search-cv?q=title
// Returns CV volume candidates — use the id as comic_vine_id when creating a series.
export async function searchComicVine(req, res) {
  try {
    const { q } = req.query;
    if (!q?.trim()) throw new ValidationError('q is required');
    if (!process.env.COMIC_VINE_API_KEY) {
      return res.status(503).json({ error: 'COMIC_VINE_API_KEY not configured' });
    }

    const url = new URL('https://comicvine.gamespot.com/api/volumes/');
    url.searchParams.set('format', 'json');
    url.searchParams.set('api_key', process.env.COMIC_VINE_API_KEY);
    url.searchParams.set('filter', `name:${q.trim()}`);
    url.searchParams.set('field_list', 'id,name,start_year,count_of_issues,publisher,image');
    url.searchParams.set('limit', '10');

    const cvRes = await fetch(url.toString(), {
      headers: { 'User-Agent': 'charno-comic-scraper/1.0' },
      signal: AbortSignal.timeout(15000),
    });
    if (!cvRes.ok) throw new Error(`Comic Vine HTTP ${cvRes.status}`);
    const data = await cvRes.json();
    if (data.status_code !== 1) throw new Error(`Comic Vine: ${data.error}`);

    res.json({
      results: (data.results || []).map(v => ({
        id:          v.id,
        name:        v.name,
        start_year:  v.start_year,
        issue_count: v.count_of_issues,
        publisher:   v.publisher?.name ?? null,
        cover_image: v.image?.medium_url ?? null,
      })),
    });
  } catch (err) {
    handleError(err, res);
  }
}
