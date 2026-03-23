import fs from 'fs';
import path from 'path';
import pool from '../config/database.js';

const ROMS_DIR = process.env.ROMS_DIR || null;
const ROM_IMAGES_DIR = process.env.ROM_IMAGES_DIR || null;

const isValidId = (id) => id && /^\d+$/.test(String(id));

const ROM_EXTENSIONS = new Set([
  '.iso', '.bin', '.cue', '.img', '.chd', '.mdf',  // disc images
  '.sfc', '.smc',                                    // SNES
  '.nes',                                            // NES
  '.z64', '.n64', '.v64',                            // N64
  '.gb', '.gbc',                                     // Game Boy
  '.gba',                                            // GBA
  '.nds',                                            // DS
  '.md', '.gen', '.smd',                             // Genesis/Mega Drive
  '.xbe',                                            // Xbox
  '.xiso',                                           // Xbox ISO
  '.zip', '.7z',                                     // Arcade (MAME), Neo Geo; compressed ROMs
  '.pce',                                            // TurboGrafx-16 / PC Engine
  '.dsk', '.adf', '.adz', '.ipf',                   // Amiga disk images
  '.lha', '.lzx',                                   // Amiga archives
]);

// Consoles where every subdirectory is a valid game, regardless of file contents.
// Used for ScummVM/engine-data collections (e.g. Amiga) where game files have
// non-standard extensions (.CLU, .LFL, .pak, etc.).
const SCANDIR_CONSOLES = new Set(['amiga']);

// Compute the deduplication key from a raw filename — mirrors the SQL in schema.sql.
function titleKey(raw) {
  let key = raw.replace(/\.[^/.]+$/, '');              // strip extension
  key = key.replace(/\s*\([^)]*\)/g, '');              // remove (xxx)
  key = key.replace(/\s*\[[^\]]*\]/g, '');             // remove [xxx]
  key = key.replace(/[_\s]+/g, ' ').trim();            // underscores/spaces → single space
  return key || raw.replace(/\.[^/.]+$/, '');          // fallback: filename without ext
}

export const listGames = async (req, res) => {
  try {
    const { console: consoleName, search, tags, no_art, exclude_console, page = 1, limit = 60 } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(1000, Math.max(1, parseInt(limit) || 60));
    const offset = (pageNum - 1) * limitNum;

    const conditions = ['available = true', 'hidden = false'];
    const params = [];
    let paramIndex = 1;

    if (no_art === 'true') conditions.push('box_art_url IS NULL');

    if (exclude_console) {
      const excludeList = Array.isArray(exclude_console) ? exclude_console : [exclude_console];
      const placeholders = excludeList.map((_, i) => `$${paramIndex + i}`).join(', ');
      conditions.push(`console NOT IN (${placeholders})`);
      params.push(...excludeList);
      paramIndex += excludeList.length;
    }

    if (consoleName) {
      conditions.push(`console = $${paramIndex}`);
      params.push(consoleName);
      paramIndex++;
    }

    if (search) {
      conditions.push(`title ILIKE $${paramIndex}`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (tags) {
      const tagList = Array.isArray(tags) ? tags : [tags];
      for (const tag of tagList) {
        conditions.push(`tags @> $${paramIndex}::jsonb`);
        params.push(JSON.stringify([tag]));
        paramIndex++;
      }
    }

    const where = 'WHERE ' + conditions.join(' AND ');

    const countResult = await pool.query(`SELECT COUNT(*) FROM rom_games ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    // When fetching the scrape queue (no_art=true), prioritise never-attempted games
    // first, then oldest-attempted, so the queue cycles through all consoles evenly.
    const orderBy = no_art === 'true'
      ? 'scrape_attempted_at ASC NULLS FIRST, console ASC, title ASC'
      : 'display_order ASC, title ASC';

    const dataResult = await pool.query(
      `SELECT id, title_key, filenames, console, title, year, box_art_url, tags
       FROM rom_games ${where}
       ORDER BY ${orderBy}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limitNum, offset]
    );

    res.json({
      games: dataResult.rows,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('Error listing ROM games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTags = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT jsonb_array_elements_text(tags) AS tag
      FROM rom_games
      WHERE available = true AND hidden = false
      ORDER BY tag ASC
    `);
    res.json(result.rows.map(r => r.tag));
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getConsoles = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT console FROM rom_games WHERE available = true AND hidden = false ORDER BY console ASC'
    );
    res.json(result.rows.map(r => r.console));
  } catch (error) {
    console.error('Error fetching consoles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getGameById = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(400).json({ error: 'Invalid game ID' });
  try {
    const result = await pool.query('SELECT * FROM rom_games WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching ROM game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateGame = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(400).json({ error: 'Invalid game ID' });
  try {
    const { title, description, year, box_art_url, screenshots, tags, display_order } = req.body;

    const result = await pool.query(
      `UPDATE rom_games SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        year = COALESCE($3, year),
        box_art_url = COALESCE($4, box_art_url),
        screenshots = COALESCE($5::jsonb, screenshots),
        tags = COALESCE($6::jsonb, tags),
        display_order = COALESCE($7, display_order)
      WHERE id = $8
      RETURNING *`,
      [
        title ?? null,
        description ?? null,
        year ?? null,
        box_art_url ?? null,
        screenshots != null ? JSON.stringify(screenshots) : null,
        tags != null ? JSON.stringify(tags) : null,
        display_order ?? null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating ROM game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

async function downloadImage(url, basename) {
  if (!url) return null;
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(45000),
      headers: { 'User-Agent': 'charno-rom-scraper/1.0' },
    });
    if (!response.ok) {
      console.warn(`Image download failed (${response.status}): ${url}`);
      return null;
    }
    const contentType = response.headers.get('content-type') || '';
    const ext = contentType.includes('png') ? 'png'
               : contentType.includes('webp') ? 'webp'
               : 'jpg';
    const buffer = Buffer.from(await response.arrayBuffer());
    const filename = `${basename}.${ext}`;
    fs.writeFileSync(path.join(ROM_IMAGES_DIR, filename), buffer);
    return `/images/roms/${filename}`;
  } catch (e) {
    console.warn(`Failed to download image: ${e.message}`);
    return null;
  }
}

export const scrapeGame = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(400).json({ error: 'Invalid game ID' });
  if (!ROM_IMAGES_DIR) {
    return res.status(503).json({ error: 'ROM_IMAGES_DIR not configured' });
  }
  const { box_art_url, screenshot_urls = [], title, description, year, tags } = req.body;

  try {
    const gameResult = await pool.query('SELECT id FROM rom_games WHERE id = $1', [id]);
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const savedBoxArt = await downloadImage(box_art_url, `${id}-box`);

    const savedScreenshots = [];
    for (let i = 0; i < Math.min(screenshot_urls.length, 5); i++) {
      const url = await downloadImage(screenshot_urls[i], `${id}-ss-${i}`);
      if (url) savedScreenshots.push(url);
    }

    const result = await pool.query(
      `UPDATE rom_games SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        year = COALESCE($3, year),
        box_art_url = COALESCE($4, box_art_url),
        screenshots = COALESCE($5::jsonb, screenshots),
        tags = COALESCE($6::jsonb, tags)
      WHERE id = $7
      RETURNING *`,
      [
        title || null,
        description || null,
        year ? parseInt(year) : null,
        savedBoxArt || null,
        savedScreenshots.length > 0 ? JSON.stringify(savedScreenshots) : null,
        tags?.length > 0 ? JSON.stringify(tags) : null,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error scraping game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const SS_SYSTEM_IDS = {
  amiga: 64, arcade: 75, gba: 12, genesis: 1, n64: 14,
  neogeo: 142, nes: 3, psx: 57, snes: 4, turbografx: 31, xbox: 32,
};

// Some consoles store mixed software: e.g. "amiga" contains both native Amiga
// WHDLoad titles and ScummVM/DOS games. When the primary system returns 404,
// try these fallback (systemeid, extension) pairs in order.
const SS_FALLBACK_SYSTEMS = {
  amiga: [{ systemeid: 135, ext: '.zip' }],  // PC/DOS for ScummVM titles
};

// Default ROM extension per console — used when a game is stored as a directory
// (no extension on filename). ScreenScraper requires an extension in romnom.
const SS_DEFAULT_EXT = {
  psx: '.bin', snes: '.sfc', nes: '.nes', n64: '.z64',
  genesis: '.md', neogeo: '.zip', turbografx: '.pce',
  amiga: '.lha', arcade: '.zip', xbox: '.iso',
};

// Pick the best filename from a game's filenames array for use as the scrape romnom.
// Prefers World/USA releases; falls back to the first entry.
// For directory-based entries (no extension), looks inside for the primary ROM file.
function resolveRomFilename(game) {
  const filenames = Array.isArray(game.filenames) ? game.filenames : [];
  if (filenames.length === 0) {
    const defaultExt = SS_DEFAULT_EXT[game.console] || '.bin';
    return (game.title_key || 'unknown') + defaultExt;
  }

  const preferred =
    filenames.find(f => /\(world\)/i.test(f)) ||
    filenames.find(f => /\(usa\)/i.test(f)) ||
    filenames.find(f => /\(europe\)/i.test(f)) ||
    filenames[0];

  const hasExt = path.extname(preferred) !== '';
  if (hasExt) return preferred;

  // Directory-based game: look inside for the primary ROM file
  if (ROMS_DIR) {
    try {
      const dirPath = path.join(ROMS_DIR, game.console, preferred);
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      const romFile = entries.find(
        e => e.isFile() && ROM_EXTENSIONS.has(path.extname(e.name).toLowerCase())
      );
      if (romFile) return romFile.name;
    } catch {
      // Directory unreadable — fall through to default extension
    }
  }

  const defaultExt = SS_DEFAULT_EXT[game.console] || '.bin';
  return preferred + defaultExt;
}

// Shared core: search ScreenScraper, download assets, persist to DB for one game row.
// Returns { ss_found: true, ...dbRow } or { ss_found: false, reason: string }
async function _ssScrapeOne(game, ssUser, ssPassword, ssDevId = '', ssDevPassword = '') {
  const fetchSSJeu = async (systemeid, romnom) => {
    const params = new URLSearchParams({
      devid: ssDevId, devpassword: ssDevPassword,
      softname: 'charno-rom-scraper',
      ssid: ssUser, sspassword: ssPassword,
      crc: '', systemeid, romtype: 'rom', romnom, output: 'json',
    });
    const resp = await fetch(
      `https://www.screenscraper.fr/api2/jeuInfos.php?${params}`,
      { signal: AbortSignal.timeout(45000), headers: { 'User-Agent': 'charno-rom-scraper/1.0' } }
    );
    if (!resp.ok) return null;
    try {
      const data = JSON.parse(await resp.text());
      return data?.response?.jeu ?? null;
    } catch { return null; }
  };

  const searchSSJeu = async (searchTitle, systemeid) => {
    const params = new URLSearchParams({
      devid: ssDevId, devpassword: ssDevPassword,
      softname: 'charno-rom-scraper',
      ssid: ssUser, sspassword: ssPassword,
      systemeid, recherche: searchTitle, output: 'json',
    });
    const resp = await fetch(
      `https://www.screenscraper.fr/api2/jeuRecherche.php?${params}`,
      { signal: AbortSignal.timeout(45000), headers: { 'User-Agent': 'charno-rom-scraper/1.0' } }
    );
    if (!resp.ok) return null;
    try {
      const data = JSON.parse(await resp.text());
      return data?.response?.jeux?.[0] ?? null;
    } catch { return null; }
  };

  const primaryFilename = resolveRomFilename(game);
  const primarySystemId = SS_SYSTEM_IDS[game.console] ?? 0;

  let jeu = await fetchSSJeu(primarySystemId, primaryFilename);

  // Fallback systems (e.g. PC/DOS for ScummVM games stored in the amiga dir)
  if (!jeu) {
    const fallbacks = SS_FALLBACK_SYSTEMS[game.console] ?? [];
    for (const { systemeid, ext } of fallbacks) {
      const fallbackFilename = path.basename(primaryFilename, path.extname(primaryFilename)) + ext;
      jeu = await fetchSSJeu(systemeid, fallbackFilename);
      if (jeu) break;
    }
  }

  // Last resort: title search
  if (!jeu) {
    const searchTitle = game.title_key || cleanRomTitle(primaryFilename);
    const searchSystems = [primarySystemId, ...(SS_FALLBACK_SYSTEMS[game.console] ?? []).map(f => f.systemeid)];
    for (const systemeid of searchSystems) {
      jeu = await searchSSJeu(searchTitle, systemeid);
      if (jeu) break;
    }
  }

  if (!jeu) {
    await pool.query('UPDATE rom_games SET scrape_attempted_at = NOW() WHERE id = $1', [game.id]).catch(() => {});
    return { ss_found: false, reason: 'Not found on ScreenScraper' };
  }

  const titleObj = jeu.noms?.find(n => n.region === 'wor') || jeu.noms?.find(n => n.region === 'us') || jeu.noms?.[0];
  const title = titleObj?.text || game.title;

  const synopsisObj = jeu.synopsis?.find(s => s.langue === 'en') || jeu.synopsis?.[0];
  const description = synopsisObj?.text || null;

  const dateObj = jeu.dates?.find(d => d.region === 'wor') || jeu.dates?.find(d => d.region === 'us') || jeu.dates?.[0];
  const year = dateObj?.text ? parseInt(dateObj.text.slice(0, 4)) : null;

  const tags = (jeu.genres || []).flatMap(g =>
    (g.noms || []).filter(n => n.langue === 'en').map(n => n.text)
  ).filter(Boolean);

  const addAuth = url => `${url}&ssid=${encodeURIComponent(ssUser)}&sspassword=${encodeURIComponent(ssPassword)}`;
  const medias = jeu.medias || [];

  const boxArt = medias.find(m => m.type === 'box-2D' && m.region === 'wor')
              || medias.find(m => m.type === 'box-2D' && m.region === 'us')
              || medias.find(m => m.type === 'box-2D')
              || medias.find(m => m.type === 'box-3D');
  const screenshotMedias = medias.filter(m => m.type === 'ss').slice(0, 3);

  const savedBoxArt = boxArt?.url ? await downloadImage(addAuth(boxArt.url), `${game.id}-box`) : null;
  const savedScreenshots = [];
  for (let i = 0; i < screenshotMedias.length; i++) {
    const url = await downloadImage(addAuth(screenshotMedias[i].url), `${game.id}-ss-${i}`);
    if (url) savedScreenshots.push(url);
  }

  const result = await pool.query(
    `UPDATE rom_games SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      year = COALESCE($3, year),
      box_art_url = COALESCE($4, box_art_url),
      screenshots = COALESCE($5::jsonb, screenshots),
      tags = COALESCE($6::jsonb, tags)
     WHERE id = $7
     RETURNING *`,
    [
      title || null, description || null, year || null, savedBoxArt || null,
      savedScreenshots.length > 0 ? JSON.stringify(savedScreenshots) : null,
      tags.length > 0 ? JSON.stringify(tags) : null,
      game.id,
    ]
  );

  console.log(`SS scraped: ${title} (${game.console}, id=${game.id}) — box: ${!!savedBoxArt}, screenshots: ${savedScreenshots.length}`);
  return { ss_found: true, ...result.rows[0] };
}

// Calls ScreenScraper from the backend for a single game (credentials from request body)
export const autoScrapeGame = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(400).json({ error: 'Invalid game ID' });
  if (!ROM_IMAGES_DIR) return res.status(503).json({ error: 'ROM_IMAGES_DIR not configured' });

  const { ss_user, ss_password, ss_devid = '', ss_devpassword = '' } = req.body;
  if (!ss_user || !ss_password) {
    return res.status(400).json({ error: 'ss_user and ss_password are required' });
  }

  try {
    const gameResult = await pool.query('SELECT * FROM rom_games WHERE id = $1', [id]);
    if (gameResult.rows.length === 0) return res.status(404).json({ error: 'Game not found' });

    const result = await _ssScrapeOne(gameResult.rows[0], ss_user, ss_password, ss_devid, ss_devpassword);
    res.json(result);
  } catch (error) {
    console.error('Error auto-scraping game:', error);
    res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
};

const IGDB_PLATFORM_IDS = {
  amiga: 16, arcade: 52, gba: 24, genesis: 29, n64: 4,
  neogeo: 80, nes: 18, psx: 7, snes: 19, turbografx: 86, xbox: 11,
};

// Strip ROM filename annotations to get a clean search title
function cleanRomTitle(raw) {
  let title = raw.replace(/\.[^/.]+$/, '');           // remove extension
  title = title.replace(/\s*[\(\[][^\)\]]*[\)\]]/g, ''); // remove (USA), [!], etc.
  title = title.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return title;
}

// Shared core: search IGDB, download assets, persist to DB for one game row.
// Returns { igdb_found: true, ...dbRow } or { igdb_found: false, reason: string }
async function _igdbScrapeOne(game, clientId, accessToken) {
  const searchTitle = cleanRomTitle(game.title || game.title_key || (game.filenames?.[0] ?? ''));
  const platformId = IGDB_PLATFORM_IDS[game.console];
  const fields = 'fields name,summary,first_release_date,genres.name,cover.image_id,screenshots.image_id;';

  const igdbHeaders = {
    'Client-ID': clientId,
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'text/plain',
  };

  const igdbSearch = async (whereClause) => {
    const body = `${fields} search "${searchTitle}"; ${whereClause ? `where ${whereClause};` : ''} limit 5;`;
    const r = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST', headers: igdbHeaders, body,
      signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) throw new Error(`IGDB HTTP ${r.status}`);
    return r.json();
  };

  let igdbData = platformId ? await igdbSearch(`platforms = (${platformId})`) : [];
  if (!Array.isArray(igdbData) || igdbData.length === 0) {
    igdbData = await igdbSearch(null);
  }

  if (!Array.isArray(igdbData)) {
    console.warn(`IGDB returned non-array for game ${game.id} ("${searchTitle}"): ${JSON.stringify(igdbData)}`);
    return { igdb_found: false, reason: `IGDB error: ${JSON.stringify(igdbData)}` };
  }
  if (igdbData.length === 0) {
    console.warn(`IGDB: no match for game ${game.id} ("${searchTitle}", console: ${game.console})`);
    return { igdb_found: false, reason: 'No match found on IGDB' };
  }

  const match = igdbData[0];
  const title = match.name || null;
  const description = match.summary || null;
  const year = match.first_release_date
    ? new Date(match.first_release_date * 1000).getFullYear()
    : null;
  const tags = (match.genres || []).map(g => g.name).filter(Boolean);

  const savedBoxArt = match.cover?.image_id
    ? await downloadImage(
        `https://images.igdb.com/igdb/image/upload/t_cover_big/${match.cover.image_id}.jpg`,
        `${game.id}-box`
      )
    : null;

  const savedScreenshots = [];
  for (let i = 0; i < Math.min((match.screenshots || []).length, 3); i++) {
    const saved = await downloadImage(
      `https://images.igdb.com/igdb/image/upload/t_screenshot_big/${match.screenshots[i].image_id}.jpg`,
      `${game.id}-ss-${i}`
    );
    if (saved) savedScreenshots.push(saved);
  }

  const result = await pool.query(
    `UPDATE rom_games SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      year = COALESCE($3, year),
      box_art_url = COALESCE($4, box_art_url),
      screenshots = COALESCE($5::jsonb, screenshots),
      tags = COALESCE($6::jsonb, tags)
    WHERE id = $7
    RETURNING *`,
    [
      title || null, description || null, year || null, savedBoxArt || null,
      savedScreenshots.length > 0 ? JSON.stringify(savedScreenshots) : null,
      tags.length > 0 ? JSON.stringify(tags) : null,
      game.id,
    ]
  );

  console.log(`IGDB scraped: ${title} (${game.console}, id=${game.id}) — box: ${!!savedBoxArt}, screenshots: ${savedScreenshots.length}`);
  return { igdb_found: true, ...result.rows[0] };
}

// Calls IGDB (via Twitch OAuth) from the backend and saves metadata + images
export const igdbScrapeGame = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(400).json({ error: 'Invalid game ID' });
  if (!ROM_IMAGES_DIR) return res.status(503).json({ error: 'ROM_IMAGES_DIR not configured' });

  const { igdb_client_id, igdb_client_secret, igdb_access_token } = req.body;
  if (!igdb_client_id || (!igdb_client_secret && !igdb_access_token)) {
    return res.status(400).json({ error: 'igdb_client_id and either igdb_client_secret or igdb_access_token are required' });
  }

  try {
    const gameResult = await pool.query('SELECT * FROM rom_games WHERE id = $1', [id]);
    if (gameResult.rows.length === 0) return res.status(404).json({ error: 'Game not found' });
    const game = gameResult.rows[0];

    let access_token = igdb_access_token;
    if (!access_token) {
      const tokenRes = await fetch(
        `https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(igdb_client_id)}&client_secret=${encodeURIComponent(igdb_client_secret)}&grant_type=client_credentials`,
        { method: 'POST', signal: AbortSignal.timeout(30000) }
      );
      if (!tokenRes.ok) return res.json({ id: game.id, igdb_found: false, reason: `Twitch auth failed: HTTP ${tokenRes.status}` });
      const tokenData = await tokenRes.json();
      access_token = tokenData.access_token;
      if (!access_token) return res.json({ id: game.id, igdb_found: false, reason: 'No access token returned from Twitch' });
    }

    try {
      const scrapeResult = await _igdbScrapeOne(game, igdb_client_id, access_token);
      res.json(scrapeResult);
    } catch (e) {
      res.json({ id: game.id, igdb_found: false, reason: e.message });
    }
  } catch (error) {
    console.error('Error IGDB-scraping game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Bulk-scrape games missing box art using whichever scrapers are configured via env vars.
// ScreenScraper: reads SS_USER + SS_PASSWORD (+ optional SS_DEVID, SS_DEVPASSWORD)
// IGDB:          reads IGDB_CLIENT_ID + IGDB_CLIENT_SECRET
// Each game is tried with SS first (if configured), then IGDB as fallback (if configured).
// Returns an error only if neither scraper is configured at all.
// Query param: ?limit=N (default 50, max 100)
export const scrapeUnscraped = async (req, res) => {
  if (!ROM_IMAGES_DIR) return res.status(503).json({ error: 'ROM_IMAGES_DIR not configured' });

  const ssUser       = process.env.SS_USER;
  const ssPassword   = process.env.SS_PASSWORD;
  const ssDevId      = process.env.SS_DEVID      || '';
  const ssDevPassword = process.env.SS_DEVPASSWORD || '';
  const igdbClientId     = process.env.IGDB_CLIENT_ID;
  const igdbClientSecret = process.env.IGDB_CLIENT_SECRET;

  const useSS   = !!(ssUser && ssPassword);
  const useIGDB = !!(igdbClientId && igdbClientSecret);

  if (!useSS && !useIGDB) {
    return res.status(503).json({
      error: 'No scraper credentials configured. Set SS_USER + SS_PASSWORD for ScreenScraper and/or IGDB_CLIENT_ID + IGDB_CLIENT_SECRET for IGDB.',
    });
  }

  const limit = Math.min(100, parseInt(req.query.limit) || 50);

  try {
    // Get IGDB access token once upfront (only if IGDB is configured)
    let igdbAccessToken = null;
    if (useIGDB) {
      const tokenRes = await fetch(
        `https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(igdbClientId)}&client_secret=${encodeURIComponent(igdbClientSecret)}&grant_type=client_credentials`,
        { method: 'POST', signal: AbortSignal.timeout(30000) }
      );
      if (!tokenRes.ok) {
        if (!useSS) return res.status(502).json({ error: `Twitch auth failed: HTTP ${tokenRes.status}` });
        console.warn(`IGDB auth failed (HTTP ${tokenRes.status}), will use ScreenScraper only`);
      } else {
        const tokenData = await tokenRes.json();
        igdbAccessToken = tokenData.access_token ?? null;
        if (!igdbAccessToken) console.warn('No IGDB access token returned from Twitch, will use ScreenScraper only');
      }
    }

    const gamesResult = await pool.query(
      `SELECT id, title_key, filenames, console, title FROM rom_games
       WHERE box_art_url IS NULL AND available = true AND hidden = false
       ORDER BY scrape_attempted_at ASC NULLS FIRST, console ASC, title_key ASC
       LIMIT $1`,
      [limit]
    );

    if (gamesResult.rows.length === 0) {
      return res.json({ scraped: 0, failed: 0, total: 0, scrapers: { ss: useSS, igdb: useIGDB && !!igdbAccessToken } });
    }

    let scraped = 0;
    let failed = 0;
    const results = [];

    for (const game of gamesResult.rows) {
      let found = false;

      // 1. Try ScreenScraper
      if (useSS) {
        try {
          const ssResult = await _ssScrapeOne(game, ssUser, ssPassword, ssDevId, ssDevPassword);
          if (ssResult.ss_found) {
            scraped++;
            results.push({ id: game.id, title: ssResult.title, status: 'scraped', scraper: 'screenscraper' });
            found = true;
          }
        } catch (e) {
          console.warn(`SS error for game ${game.id} (${game.title_key}): ${e.message}`);
        }
      }

      // 2. Fall back to IGDB
      if (!found && useIGDB && igdbAccessToken) {
        try {
          const igdbResult = await _igdbScrapeOne(game, igdbClientId, igdbAccessToken);
          if (igdbResult.igdb_found) {
            scraped++;
            results.push({ id: game.id, title: igdbResult.title, status: 'scraped', scraper: 'igdb' });
            found = true;
          }
        } catch (e) {
          console.warn(`IGDB error for game ${game.id} (${game.title_key}): ${e.message}`);
        }
      }

      if (!found) {
        failed++;
        results.push({ id: game.id, title: game.title || game.title_key, status: 'not_found' });
      }
    }

    console.log(`scrape-unscraped: ${scraped} scraped, ${failed} failed of ${gamesResult.rows.length}`);
    res.json({ scraped, failed, total: gamesResult.rows.length, scrapers: { ss: useSS, igdb: useIGDB && !!igdbAccessToken }, results });
  } catch (error) {
    console.error('Error in scrape-unscraped:', error);
    res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
};

// Manually merge a specific set of game IDs into one entry.
// Body: { ids: [1, 2, 3], keep_id: 1 }
//   ids     — required, at least 2
//   keep_id — optional; which row's metadata to preserve (defaults to the row with most metadata)
// All filenames are merged onto the winner; other rows are deleted.
export const mergeGames = async (req, res) => {
  const { ids, keep_id } = req.body;

  if (!Array.isArray(ids) || ids.length < 2) {
    return res.status(400).json({ error: 'ids must be an array of at least 2 game IDs' });
  }
  if (!ids.every(id => isValidId(id))) {
    return res.status(400).json({ error: 'All ids must be valid integers' });
  }
  if (keep_id !== undefined && !isValidId(keep_id)) {
    return res.status(400).json({ error: 'keep_id must be a valid integer' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM rom_games WHERE id = ANY($1) ORDER BY id',
      [ids]
    );

    if (result.rows.length !== ids.length) {
      const found = result.rows.map(r => r.id);
      const missing = ids.filter(id => !found.includes(parseInt(id)));
      return res.status(404).json({ error: `Games not found: ${missing.join(', ')}` });
    }

    const rows = result.rows;

    const consoles = [...new Set(rows.map(r => r.console))];
    if (consoles.length > 1) {
      return res.status(400).json({ error: `Cannot merge games from different consoles: ${consoles.join(', ')}` });
    }

    const winner = keep_id
      ? rows.find(r => r.id === parseInt(keep_id))
      : rows.reduce((best, r) => {
          const score = (r.box_art_url ? 1 : 0) + (r.description ? 1 : 0) + (r.year ? 1 : 0) + (r.title ? 1 : 0);
          const bestScore = (best.box_art_url ? 1 : 0) + (best.description ? 1 : 0) + (best.year ? 1 : 0) + (best.title ? 1 : 0);
          return score > bestScore ? r : best;
        }, rows[0]);

    if (!winner) {
      return res.status(400).json({ error: `keep_id ${keep_id} not found in provided ids` });
    }

    const allFilenames = [...new Set(rows.flatMap(r => Array.isArray(r.filenames) ? r.filenames : []))].sort();

    const updated = await pool.query(
      `UPDATE rom_games SET filenames = $1::jsonb WHERE id = $2 RETURNING *`,
      [JSON.stringify(allFilenames), winner.id]
    );

    const loserIds = rows.map(r => r.id).filter(id => id !== winner.id);
    await pool.query('DELETE FROM rom_games WHERE id = ANY($1)', [loserIds]);

    console.log(`Manual merge: kept id=${winner.id} (${winner.console}/${winner.title_key}), deleted ids=${loserIds.join(',')}, filenames=${allFilenames.length}`);
    res.json({ merged: updated.rows[0], deleted_ids: loserIds });
  } catch (error) {
    console.error('Error merging games:', error);
    res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
};

// Merge rows that share the same (console, title) after scraping.
// Useful for arcade/MAME ROMs where filenames are opaque short identifiers
// (e.g. ARKANOID, ARKNOIDJ, ARKNOIDU) that all scraped to the same display title.
// Keeps the row with the most metadata; merges all filenames onto it; deletes the rest.
// Optional query param: ?console=arcade  to limit scope to one console.
export const mergeByTitle = async (req, res) => {
  const { console: consoleName } = req.query;

  try {
    // Find all (console, title) groups with more than one row and a non-null title
    const conditions = ["title IS NOT NULL", "title != ''"];
    const params = [];
    if (consoleName) {
      conditions.push(`console = $1`);
      params.push(consoleName);
    }

    const groupsResult = await pool.query(
      `SELECT console, title, array_agg(id ORDER BY
          (CASE WHEN box_art_url IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN description IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN year        IS NOT NULL THEN 1 ELSE 0 END) DESC,
          id ASC
       ) AS ids
       FROM rom_games
       WHERE ${conditions.join(' AND ')}
       GROUP BY console, title
       HAVING COUNT(*) > 1`,
      params
    );

    if (groupsResult.rows.length === 0) {
      return res.json({ merged_groups: 0, deleted_rows: 0, groups: [] });
    }

    let deletedRows = 0;
    const groups = [];

    for (const { console: con, title, ids } of groupsResult.rows) {
      const winnerId = ids[0];
      const loserIds = ids.slice(1);

      // Collect all filenames across the whole group
      const filenamesResult = await pool.query(
        `SELECT jsonb_array_elements_text(filenames) AS f FROM rom_games WHERE id = ANY($1)`,
        [ids]
      );
      const allFilenames = [...new Set(filenamesResult.rows.map(r => r.f))].sort();

      // Write merged filenames onto the winner
      await pool.query(
        `UPDATE rom_games SET filenames = $1::jsonb WHERE id = $2`,
        [JSON.stringify(allFilenames), winnerId]
      );

      // Delete the losers
      const deleteResult = await pool.query(
        `DELETE FROM rom_games WHERE id = ANY($1)`,
        [loserIds]
      );
      deletedRows += deleteResult.rowCount;

      groups.push({ console: con, title, winner_id: winnerId, merged_count: ids.length, filenames: allFilenames });
    }

    console.log(`merge-by-title: ${groupsResult.rows.length} groups merged, ${deletedRows} rows deleted`);
    res.json({ merged_groups: groupsResult.rows.length, deleted_rows: deletedRows, groups });
  } catch (error) {
    console.error('Error in merge-by-title:', error);
    res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
};

// Split a merged game row back into one row per filename.
// Useful when merge-by-title (or scan-time deduplication) incorrectly grouped
// different games together (e.g. IGDB returned the same title for NHL Hockey 91 & 92).
// Each split row gets its own title_key derived from its filename; metadata is cleared
// so each can be re-scraped independently.
export const splitGame = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(400).json({ error: 'Invalid game ID' });

  try {
    const gameResult = await pool.query('SELECT * FROM rom_games WHERE id = $1', [id]);
    if (gameResult.rows.length === 0) return res.status(404).json({ error: 'Game not found' });

    const game = gameResult.rows[0];
    const filenames = Array.isArray(game.filenames) ? game.filenames : [];

    if (filenames.length <= 1) {
      return res.status(400).json({ error: 'Game has only one filename — nothing to split' });
    }

    const created = [];
    const skipped = [];

    for (const filename of filenames) {
      const key = titleKey(filename);
      try {
        const result = await pool.query(
          `INSERT INTO rom_games (console, title_key, filenames, available)
           VALUES ($1, $2, $3::jsonb, $4)
           ON CONFLICT (console, title_key) DO NOTHING
           RETURNING id, console, title_key, filenames`,
          [game.console, key, JSON.stringify([filename]), game.available]
        );
        if (result.rows.length > 0) {
          created.push(result.rows[0]);
        } else {
          skipped.push({ filename, title_key: key, reason: 'title_key already exists' });
        }
      } catch (e) {
        skipped.push({ filename, title_key: key, reason: e.message });
      }
    }

    // Only delete the original if all filenames were successfully rehomed
    if (created.length + skipped.length === filenames.length && created.length > 0) {
      await pool.query('DELETE FROM rom_games WHERE id = $1', [id]);
    }

    console.log(`split game ${id} (${game.console}/${game.title_key}): ${created.length} created, ${skipped.length} skipped`);
    res.json({ original_id: id, created, skipped });
  } catch (error) {
    console.error('Error splitting game:', error);
    res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
};

// Bulk-split all rows whose filenames were incorrectly merged by merge-by-title.
// A row is "mismerged" if its filenames produce more than one distinct title_key —
// meaning the scan would have kept them as separate games, but merge-by-title
// collapsed them because IGDB set the same display title on both.
// Rows where all filenames share the same title_key (scan-time merges, e.g. regional
// variants of the same cartridge game) are left untouched.
//
// Arcade is EXCLUDED by default because MAME filenames are always opaque short IDs
// (ARKANOID, ARKNOIDJ, …) that legitimately have different title_keys but belong to
// the same game. Pass ?console=arcade explicitly if you really want to split arcade.
//
// Optional query param: ?console=genesis  to limit scope to one console.
export const splitMismerged = async (req, res) => {
  const { console: consoleName } = req.query;

  try {
    const conditions = ['jsonb_array_length(filenames) > 1'];
    const params = [];
    if (consoleName) {
      conditions.push(`console = $1`);
      params.push(consoleName);
    } else {
      // Exclude arcade when no console filter is given
      conditions.push(`console != 'arcade'`);
    }

    const rows = await pool.query(
      `SELECT * FROM rom_games WHERE ${conditions.join(' AND ')}`,
      params
    );

    let splitCount = 0;
    let skippedCount = 0;
    const splitDetails = [];
    const skippedDetails = [];

    for (const game of rows.rows) {
      const filenames = Array.isArray(game.filenames) ? game.filenames : [];

      // Compute the title_key each filename would produce independently
      const keyGroups = new Map(); // title_key → filename[]
      for (const filename of filenames) {
        const key = titleKey(filename);
        if (!keyGroups.has(key)) keyGroups.set(key, []);
        keyGroups.get(key).push(filename);
      }

      if (keyGroups.size <= 1) {
        // All filenames map to the same title_key — correct scan-time merge, leave it
        skippedCount++;
        skippedDetails.push({ id: game.id, console: game.console, title_key: game.title_key, filenames });
        continue;
      }

      // Multiple distinct title_keys — this was a merge-by-title collapse, split it.
      // Copy scraped metadata onto every split row so merge-by-title can re-group them
      // later if needed, and so the library doesn't go blank while re-scraping.
      const created = [];
      const failed = [];

      for (const [key, fnames] of keyGroups) {
        try {
          const result = await pool.query(
            `INSERT INTO rom_games
               (console, title_key, filenames, title, description, year,
                box_art_url, screenshots, tags, available)
             VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10)
             ON CONFLICT (console, title_key) DO UPDATE SET
               filenames    = EXCLUDED.filenames,
               available    = EXCLUDED.available
             RETURNING id, console, title_key, filenames`,
            [
              game.console, key, JSON.stringify(fnames),
              game.title, game.description, game.year,
              game.box_art_url,
              JSON.stringify(game.screenshots ?? []),
              JSON.stringify(game.tags ?? []),
              game.available,
            ]
          );
          created.push(result.rows[0]);
        } catch (e) {
          failed.push({ title_key: key, filenames: fnames, error: e.message });
        }
      }

      if (failed.length === 0) {
        await pool.query('DELETE FROM rom_games WHERE id = $1', [game.id]);
        splitCount++;
        splitDetails.push({
          original_id: game.id,
          original_title_key: game.title_key,
          console: game.console,
          split_into: created.map(r => ({ id: r.id, title_key: r.title_key, filenames: r.filenames })),
        });
      } else {
        failed.forEach(f => console.error(`split-mismerged: failed to insert ${game.console}/${f.title_key}: ${f.error}`));
      }
    }

    console.log(`split-mismerged: ${splitCount} rows split, ${skippedCount} correct merges left intact`);
    res.json({ split: splitCount, skipped: skippedCount, split_details: splitDetails, skipped_details: skippedDetails });
  } catch (error) {
    console.error('Error in split-mismerged:', error);
    res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
};

// Debug endpoint: dry-run both scrapers and return raw API responses without writing to DB.
export const debugScrapeGame = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(400).json({ error: 'Invalid game ID' });

  const { ss_user, ss_password, ss_devid = '', ss_devpassword = '',
          igdb_client_id, igdb_client_secret } = req.body;

  try {
    const gameResult = await pool.query('SELECT * FROM rom_games WHERE id = $1', [id]);
    if (gameResult.rows.length === 0) return res.status(404).json({ error: 'Game not found' });
    const game = gameResult.rows[0];

    const primaryFilename = resolveRomFilename(game);
    const primarySystemId = SS_SYSTEM_IDS[game.console] ?? null;
    const igdbPlatformId = IGDB_PLATFORM_IDS[game.console] ?? null;
    const cleanTitle = cleanRomTitle(game.title || game.title_key || (game.filenames?.[0] ?? ''));

    const debug = {
      game: { id: game.id, title_key: game.title_key, filenames: game.filenames, console: game.console, title: game.title },
      resolved_filename: primaryFilename,
      ss_system_id: primarySystemId,
      igdb_platform_id: igdbPlatformId,
      clean_title_for_igdb: cleanTitle,
      screenscraper: null,
      igdb: null,
    };

    // --- ScreenScraper probe ---
    if (ss_user && ss_password) {
      const ssResults = [];

      const probeSS = async (systemeid, romnom, label) => {
        const params = new URLSearchParams({
          devid: ss_devid, devpassword: ss_devpassword,
          softname: 'charno-rom-scraper',
          ssid: ss_user, sspassword: ss_password,
          crc: '', systemeid, romtype: 'rom', romnom, output: 'json',
        });
        try {
          const resp = await fetch(
            `https://www.screenscraper.fr/api2/jeuInfos.php?${params}`,
            { signal: AbortSignal.timeout(45000), headers: { 'User-Agent': 'charno-rom-scraper/1.0' } }
          );
          const text = await resp.text();
          let parsed = null;
          try { parsed = JSON.parse(text); } catch { /* leave null */ }
          ssResults.push({ label, systemeid, romnom, http_status: resp.status, raw: parsed ?? text.slice(0, 500) });
        } catch (e) {
          ssResults.push({ label, systemeid, romnom, error: e.message });
        }
      };

      // Primary lookup
      if (primarySystemId !== null) {
        await probeSS(primarySystemId, primaryFilename, 'primary');
      } else {
        ssResults.push({ label: 'primary', error: `No SS_SYSTEM_IDS entry for console "${game.console}"` });
      }

      // Fallback lookups
      const fallbacks = SS_FALLBACK_SYSTEMS[game.console] ?? [];
      for (const { systemeid, ext } of fallbacks) {
        const fallbackFilename = path.basename(game.filename, path.extname(game.filename)) + ext;
        await probeSS(systemeid, fallbackFilename, `fallback (system ${systemeid})`);
      }

      // Title search fallback
      const searchSystems = [
        ...(primarySystemId !== null ? [primarySystemId] : []),
        ...fallbacks.map(f => f.systemeid),
      ];
      for (const systemeid of searchSystems) {
        const searchParams = new URLSearchParams({
          devid: ss_devid, devpassword: ss_devpassword,
          softname: 'charno-rom-scraper',
          ssid: ss_user, sspassword: ss_password,
          systemeid, recherche: cleanTitle, output: 'json',
        });
        try {
          const resp = await fetch(
            `https://www.screenscraper.fr/api2/jeuRecherche.php?${searchParams}`,
            { signal: AbortSignal.timeout(45000), headers: { 'User-Agent': 'charno-rom-scraper/1.0' } }
          );
          const text = await resp.text();
          let parsed = null;
          try { parsed = JSON.parse(text); } catch { /* leave null */ }
          ssResults.push({ label: `title-search (system ${systemeid})`, systemeid, recherche: cleanTitle, http_status: resp.status, raw: parsed ?? text.slice(0, 500) });
        } catch (e) {
          ssResults.push({ label: `title-search (system ${systemeid})`, error: e.message });
        }
      }

      debug.screenscraper = ssResults;
    } else {
      debug.screenscraper = 'skipped (no ss_user/ss_password provided)';
    }

    // --- IGDB probe ---
    if (igdb_client_id && igdb_client_secret) {
      try {
        const tokenRes = await fetch(
          `https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(igdb_client_id)}&client_secret=${encodeURIComponent(igdb_client_secret)}&grant_type=client_credentials`,
          { method: 'POST', signal: AbortSignal.timeout(30000) }
        );
        if (!tokenRes.ok) {
          debug.igdb = { error: `Twitch auth failed: HTTP ${tokenRes.status}` };
        } else {
          const { access_token } = await tokenRes.json();
          const igdbHeaders = {
            'Client-ID': igdb_client_id,
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'text/plain',
          };
          const fields = 'fields name,summary,first_release_date,genres.name,cover.image_id,screenshots.image_id;';
          const igdbResults = [];

          const probeIGDB = async (whereClause, label) => {
            const body = `${fields} search "${cleanTitle}"; ${whereClause ? `where ${whereClause};` : ''} limit 5;`;
            try {
              const r = await fetch('https://api.igdb.com/v4/games', {
                method: 'POST', headers: igdbHeaders, body,
                signal: AbortSignal.timeout(30000),
              });
              const json = await r.json();
              igdbResults.push({ label, where: whereClause, http_status: r.status, results: json });
            } catch (e) {
              igdbResults.push({ label, where: whereClause, error: e.message });
            }
          };

          if (igdbPlatformId !== null) {
            await probeIGDB(`platforms = (${igdbPlatformId})`, 'platform-filtered');
          } else {
            igdbResults.push({ label: 'platform-filtered', error: `No IGDB_PLATFORM_IDS entry for console "${game.console}"` });
          }
          await probeIGDB(null, 'no-platform-filter');

          debug.igdb = igdbResults;
        }
      } catch (e) {
        debug.igdb = { error: e.message };
      }
    } else {
      debug.igdb = 'skipped (no igdb_client_id/igdb_client_secret provided)';
    }

    res.json(debug);
  } catch (error) {
    console.error('Error in debug-scrape:', error);
    res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
};

const PATCH_ALLOWED = new Set(['title', 'description', 'year', 'box_art_url', 'screenshots', 'tags', 'display_order', 'hidden']);
const JSONB_FIELDS = new Set(['screenshots', 'tags']);

export const patchGame = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) return res.status(400).json({ error: 'Invalid game ID' });

  const fields = Object.keys(req.body).filter(k => PATCH_ALLOWED.has(k));
  if (fields.length === 0)
    return res.status(400).json({ error: 'No valid fields to update' });

  try {
    const sets = fields.map((f, i) =>
      JSONB_FIELDS.has(f) ? `${f} = $${i + 1}::jsonb` : `${f} = $${i + 1}`
    );
    const values = fields.map(f =>
      JSONB_FIELDS.has(f) ? JSON.stringify(req.body[f]) : req.body[f]
    );

    const result = await pool.query(
      `UPDATE rom_games SET ${sets.join(', ')} WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Game not found' });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error patching ROM game:', error);
    res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
};

export const scanRoms = async (req, res) => {
  if (!ROMS_DIR) {
    return res.status(503).json({ error: 'ROMS_DIR environment variable not configured' });
  }
  if (!fs.existsSync(ROMS_DIR)) {
    return res.status(503).json({ error: `ROMS_DIR path does not exist: ${ROMS_DIR}` });
  }

  try {
    let added = 0;
    let alreadyPresent = 0;
    let markedUnavailable = 0;

    const consoleDirs = fs.readdirSync(ROMS_DIR, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);

    for (const consoleName of consoleDirs) {
      const consoleDir = path.join(ROMS_DIR, consoleName);
      const allEntries = fs.readdirSync(consoleDir, { withFileTypes: true });

      // Collect every ROM filename found on disk for this console
      const discoveredFilenames = [];

      for (const entry of allEntries) {
        if (entry.isFile() && ROM_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
          discoveredFilenames.push(entry.name);
        }
      }

      // Subdirectory-per-game layout (e.g. PSX multi-disc, Amiga WHDLoad)
      for (const entry of allEntries) {
        if (!entry.isDirectory()) continue;
        const subPath = path.join(consoleDir, entry.name);
        const subEntries = fs.readdirSync(subPath, { withFileTypes: true });
        const hasRomFile = SCANDIR_CONSOLES.has(consoleName)
          || subEntries.some(e => e.isFile() && ROM_EXTENSIONS.has(path.extname(e.name).toLowerCase()));
        if (hasRomFile) {
          discoveredFilenames.push(entry.name);
        }
      }

      // Group discovered filenames by their normalised title_key.
      // Multiple regional variants of the same game (e.g. "Arkanoid (World).zip",
      // "Arkanoid (Japan).zip") collapse into a single entry.
      const groups = new Map(); // title_key → string[]
      for (const filename of discoveredFilenames) {
        const key = titleKey(filename);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(filename);
      }

      // Insert new groups; for existing rows only mark available — never overwrite filenames.
      // This preserves manual merges (e.g. merge-by-title on arcade) across scans.
      for (const [key, filenames] of groups) {
        const result = await pool.query(
          `INSERT INTO rom_games (console, title_key, filenames, title, available)
           VALUES ($1, $2, $3::jsonb, $4, true)
           ON CONFLICT (console, title_key) DO UPDATE SET
             available = true
           RETURNING (xmax = 0) AS is_new`,
          [consoleName, key, JSON.stringify(filenames), key]
        );
        if (result.rows[0]?.is_new) {
          added++;
        } else {
          alreadyPresent++;
        }
      }

      // Mark games unavailable when NONE of their filenames are still on disk.
      // Checking against the flat filename list (not title_keys) means merged rows
      // stay available as long as at least one of their files is present.
      if (discoveredFilenames.length > 0) {
        const updateResult = await pool.query(
          `UPDATE rom_games SET available = false
           WHERE console = $1 AND available = true
             AND NOT EXISTS (
               SELECT 1 FROM jsonb_array_elements_text(filenames) AS f
               WHERE f = ANY($2::text[])
             )`,
          [consoleName, discoveredFilenames]
        );
        markedUnavailable += updateResult.rowCount;
      } else {
        const updateResult = await pool.query(
          `UPDATE rom_games SET available = false WHERE console = $1 AND available = true`,
          [consoleName]
        );
        markedUnavailable += updateResult.rowCount;
      }
    }

    res.json({
      success: true,
      consoles: consoleDirs,
      added,
      alreadyPresent,
      markedUnavailable,
    });
  } catch (error) {
    console.error('Error scanning ROMs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
