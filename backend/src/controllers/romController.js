import fs from 'fs';
import path from 'path';
import pool from '../config/database.js';

const ROMS_DIR = process.env.ROMS_DIR || null;
const ROM_IMAGES_DIR = process.env.ROM_IMAGES_DIR || null;

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
  '.zip',                                            // Arcade (MAME), Neo Geo
  '.pce',                                            // TurboGrafx-16 / PC Engine
  '.dsk', '.adf', '.adz', '.ipf',                   // Amiga disk images
  '.lha', '.lzx',                                   // Amiga archives
]);

export const listGames = async (req, res) => {
  try {
    const { console: consoleName, search, tags, no_art, exclude_console } = req.query;

    let query = 'SELECT * FROM rom_games WHERE available = true';
    if (no_art === 'true') query += ' AND box_art_url IS NULL';
    const params = [];
    let paramIndex = 1;

    if (exclude_console) {
      const excludeList = Array.isArray(exclude_console) ? exclude_console : [exclude_console];
      const placeholders = excludeList.map((_, i) => `$${paramIndex + i}`).join(', ');
      query += ` AND console NOT IN (${placeholders})`;
      params.push(...excludeList);
      paramIndex += excludeList.length;
    }

    if (consoleName) {
      query += ` AND console = $${paramIndex}`;
      params.push(consoleName);
      paramIndex++;
    }

    if (search) {
      query += ` AND title ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (tags) {
      const tagList = Array.isArray(tags) ? tags : [tags];
      for (const tag of tagList) {
        query += ` AND tags @> $${paramIndex}::jsonb`;
        params.push(JSON.stringify([tag]));
        paramIndex++;
      }
    }

    query += ' ORDER BY console ASC, display_order ASC, title ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error listing ROM games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getConsoles = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT console FROM rom_games WHERE available = true ORDER BY console ASC'
    );
    res.json(result.rows.map(r => r.console));
  } catch (error) {
    console.error('Error fetching consoles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getGameById = async (req, res) => {
  try {
    const { id } = req.params;
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
  try {
    const { id } = req.params;
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
      signal: AbortSignal.timeout(15000),
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
  if (!ROM_IMAGES_DIR) {
    return res.status(503).json({ error: 'ROM_IMAGES_DIR not configured' });
  }

  const { id } = req.params;
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
  amiga: 64, arcade: 75, genesis: 1, n64: 14,
  neogeo: 142, nes: 3, psx: 57, snes: 4, turbografx: 31, xbox: 32,
};

// Calls ScreenScraper from the backend (which has internet access) and saves everything
export const autoScrapeGame = async (req, res) => {
  if (!ROM_IMAGES_DIR) {
    return res.status(503).json({ error: 'ROM_IMAGES_DIR not configured' });
  }

  const { id } = req.params;
  const { ss_user, ss_password, ss_devid = '', ss_devpassword = '' } = req.body;

  if (!ss_user || !ss_password) {
    return res.status(400).json({ error: 'ss_user and ss_password are required' });
  }

  try {
    const gameResult = await pool.query('SELECT * FROM rom_games WHERE id = $1', [id]);
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    const game = gameResult.rows[0];

    const systemId = SS_SYSTEM_IDS[game.console] ?? 0;
    const params = new URLSearchParams({
      devid: ss_devid, devpassword: ss_devpassword,
      softname: 'charno-rom-scraper',
      ssid: ss_user, sspassword: ss_password,
      crc: '', systemeid: systemId,
      romtype: 'rom', romnom: game.filename, output: 'json',
    });

    const ssResponse = await fetch(
      `https://www.screenscraper.fr/api2/jeuInfos.php?${params}`,
      { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'charno-rom-scraper/1.0' } }
    );

    if (!ssResponse.ok) {
      return res.json({ id: game.id, ss_found: false, reason: `ScreenScraper HTTP ${ssResponse.status}` });
    }

    const ssData = await ssResponse.json();
    const jeu = ssData?.response?.jeu;
    if (!jeu) {
      const errMsg = ssData?.header?.error || 'No game data returned';
      return res.json({ id: game.id, ss_found: false, reason: errMsg });
    }

    // Extract metadata
    const titleObj = jeu.noms?.find(n => n.region === 'wor') || jeu.noms?.find(n => n.region === 'us') || jeu.noms?.[0];
    const title = titleObj?.text || game.title;

    const synopsisObj = jeu.synopsis?.find(s => s.langue === 'en') || jeu.synopsis?.[0];
    const description = synopsisObj?.text || null;

    const dateObj = jeu.dates?.find(d => d.region === 'wor') || jeu.dates?.find(d => d.region === 'us') || jeu.dates?.[0];
    const year = dateObj?.text ? parseInt(dateObj.text.slice(0, 4)) : null;

    const tags = (jeu.genres || []).flatMap(g =>
      (g.noms || []).filter(n => n.langue === 'en').map(n => n.text)
    ).filter(Boolean);

    // Build authenticated image URLs
    const addAuth = url => `${url}&ssid=${encodeURIComponent(ss_user)}&sspassword=${encodeURIComponent(ss_password)}`;
    const medias = jeu.medias || [];

    const boxArt = medias.find(m => m.type === 'box-2D' && m.region === 'wor')
                || medias.find(m => m.type === 'box-2D' && m.region === 'us')
                || medias.find(m => m.type === 'box-2D')
                || medias.find(m => m.type === 'box-3D');

    const screenshotMedias = medias.filter(m => m.type === 'ss').slice(0, 3);

    // Download images
    const savedBoxArt = boxArt?.url ? await downloadImage(addAuth(boxArt.url), `${id}-box`) : null;
    const savedScreenshots = [];
    for (let i = 0; i < screenshotMedias.length; i++) {
      const url = await downloadImage(addAuth(screenshotMedias[i].url), `${id}-ss-${i}`);
      if (url) savedScreenshots.push(url);
    }

    // Persist to DB
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
        year || null,
        savedBoxArt || null,
        savedScreenshots.length > 0 ? JSON.stringify(savedScreenshots) : null,
        tags.length > 0 ? JSON.stringify(tags) : null,
        id,
      ]
    );

    console.log(`Auto-scraped: ${title} (${game.console}, id=${id}) — box: ${!!savedBoxArt}, screenshots: ${savedScreenshots.length}`);
    res.json({ ...result.rows[0], ss_found: true });
  } catch (error) {
    console.error('Error auto-scraping game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const IGDB_PLATFORM_IDS = {
  amiga: 16, arcade: 52, genesis: 29, n64: 4,
  neogeo: 80, nes: 18, psx: 7, snes: 19, turbografx: 86, xbox: 11,
};

// Strip ROM filename annotations to get a clean search title
function cleanRomTitle(raw) {
  let title = raw.replace(/\.[^/.]+$/, '');           // remove extension
  title = title.replace(/\s*[\(\[][^\)\]]*[\)\]]/g, ''); // remove (USA), [!], etc.
  title = title.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return title;
}

// Calls IGDB (via Twitch OAuth) from the backend and saves metadata + images
export const igdbScrapeGame = async (req, res) => {
  if (!ROM_IMAGES_DIR) {
    return res.status(503).json({ error: 'ROM_IMAGES_DIR not configured' });
  }

  const { id } = req.params;
  const { igdb_client_id, igdb_client_secret, igdb_access_token } = req.body;

  if (!igdb_client_id || (!igdb_client_secret && !igdb_access_token)) {
    return res.status(400).json({ error: 'igdb_client_id and either igdb_client_secret or igdb_access_token are required' });
  }

  try {
    const gameResult = await pool.query('SELECT * FROM rom_games WHERE id = $1', [id]);
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    const game = gameResult.rows[0];

    // 1. Get Twitch OAuth token (skip if pre-fetched token provided)
    let access_token = igdb_access_token;
    if (!access_token) {
      const tokenRes = await fetch(
        `https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(igdb_client_id)}&client_secret=${encodeURIComponent(igdb_client_secret)}&grant_type=client_credentials`,
        { method: 'POST', signal: AbortSignal.timeout(10000) }
      );
      if (!tokenRes.ok) {
        return res.json({ id: game.id, igdb_found: false, reason: `Twitch auth failed: HTTP ${tokenRes.status}` });
      }
      const tokenData = await tokenRes.json();
      access_token = tokenData.access_token;
      if (!access_token) {
        return res.json({ id: game.id, igdb_found: false, reason: 'No access token returned from Twitch' });
      }
    }

    // 2. Search IGDB — first with platform filter, then without if no results
    const searchTitle = cleanRomTitle(game.title || game.filename);
    const platformId = IGDB_PLATFORM_IDS[game.console];
    const fields = 'fields name,summary,first_release_date,genres.name,cover.image_id,screenshots.image_id;';

    const igdbHeaders = {
      'Client-ID': igdb_client_id,
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'text/plain',
    };

    const igdbSearch = async (whereClause) => {
      const body = `${fields} search "${searchTitle}"; ${whereClause ? `where ${whereClause};` : ''} limit 5;`;
      const res = await fetch('https://api.igdb.com/v4/games', {
        method: 'POST',
        headers: igdbHeaders,
        body,
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`IGDB HTTP ${res.status}`);
      return res.json();
    };

    let igdbData;
    try {
      // Pass 1: with platform filter
      igdbData = platformId ? await igdbSearch(`platforms = (${platformId})`) : [];
      // Pass 2: no platform filter if first pass found nothing
      if (!Array.isArray(igdbData) || igdbData.length === 0) {
        igdbData = await igdbSearch(null);
      }
    } catch (e) {
      return res.json({ id: game.id, igdb_found: false, reason: e.message });
    }

    if (!Array.isArray(igdbData)) {
      // IGDB returned a non-array — likely an auth/access error object
      console.warn(`IGDB returned non-array for game ${id} ("${searchTitle}"): ${JSON.stringify(igdbData)}`);
      return res.json({ id: game.id, igdb_found: false, reason: `IGDB error: ${JSON.stringify(igdbData)}` });
    }

    if (igdbData.length === 0) {
      console.warn(`IGDB: no match for game ${id} ("${searchTitle}", console: ${game.console})`);
      return res.json({ id: game.id, igdb_found: false, reason: 'No match found on IGDB' });
    }

    const match = igdbData[0];
    const title = match.name || null;
    const description = match.summary || null;
    const year = match.first_release_date
      ? new Date(match.first_release_date * 1000).getFullYear()
      : null;
    const tags = (match.genres || []).map(g => g.name).filter(Boolean);

    // 3. Download cover art
    const savedBoxArt = match.cover?.image_id
      ? await downloadImage(
          `https://images.igdb.com/igdb/image/upload/t_cover_big/${match.cover.image_id}.jpg`,
          `${id}-box`
        )
      : null;

    // 4. Download up to 3 screenshots
    const savedScreenshots = [];
    for (let i = 0; i < Math.min((match.screenshots || []).length, 3); i++) {
      const saved = await downloadImage(
        `https://images.igdb.com/igdb/image/upload/t_screenshot_big/${match.screenshots[i].image_id}.jpg`,
        `${id}-ss-${i}`
      );
      if (saved) savedScreenshots.push(saved);
    }

    // 5. Persist to DB
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
        year || null,
        savedBoxArt || null,
        savedScreenshots.length > 0 ? JSON.stringify(savedScreenshots) : null,
        tags.length > 0 ? JSON.stringify(tags) : null,
        id,
      ]
    );

    console.log(`IGDB scraped: ${title} (${game.console}, id=${id}) — box: ${!!savedBoxArt}, screenshots: ${savedScreenshots.length}`);
    res.json({ ...result.rows[0], igdb_found: true });
  } catch (error) {
    console.error('Error IGDB-scraping game:', error);
    res.status(500).json({ error: 'Internal server error' });
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

      // Collect ROM entries: direct files with known extensions, or subdirectory names
      // (for consoles like Amiga where each game lives in its own folder)
      const romEntries = []; // { filename, title }

      const directFiles = allEntries
        .filter(entry => entry.isFile())
        .map(entry => entry.name)
        .filter(name => ROM_EXTENSIONS.has(path.extname(name).toLowerCase()));

      if (directFiles.length > 0) {
        // Normal flat layout: files directly in the console dir
        for (const filename of directFiles) {
          romEntries.push({
            filename,
            title: path.basename(filename, path.extname(filename))
          });
        }
      } else {
        // Check for subdirectory-per-game layout (e.g., Amiga)
        const subDirs = allEntries.filter(entry => entry.isDirectory()).map(entry => entry.name);
        for (const subDir of subDirs) {
          const subPath = path.join(consoleDir, subDir);
          const subEntries = fs.readdirSync(subPath, { withFileTypes: true });
          const hasRomFile = subEntries.some(
            e => e.isFile() && ROM_EXTENSIONS.has(path.extname(e.name).toLowerCase())
          );
          if (hasRomFile) {
            romEntries.push({ filename: subDir, title: subDir });
          }
        }
      }

      const filenameList = romEntries.map(e => e.filename);

      // Upsert each discovered ROM
      for (const { filename, title } of romEntries) {
        const result = await pool.query(
          `INSERT INTO rom_games (filename, console, title, available)
           VALUES ($1, $2, $3, true)
           ON CONFLICT (filename, console) DO UPDATE SET available = true
           RETURNING (xmax = 0) AS is_new`,
          [filename, consoleName, title]
        );
        if (result.rows[0]?.is_new) {
          added++;
        } else {
          alreadyPresent++;
        }
      }

      // Mark ROMs in this console that are no longer present on disk
      if (filenameList.length > 0) {
        const placeholders = filenameList.map((_, i) => `$${i + 2}`).join(', ');
        const updateResult = await pool.query(
          `UPDATE rom_games SET available = false
           WHERE console = $1 AND filename NOT IN (${placeholders}) AND available = true`,
          [consoleName, ...filenameList]
        );
        markedUnavailable += updateResult.rowCount;
      } else {
        // No ROMs found in this console dir — mark all as unavailable
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
      markedUnavailable
    });
  } catch (error) {
    console.error('Error scanning ROMs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
