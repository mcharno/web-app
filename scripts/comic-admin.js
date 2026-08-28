#!/usr/bin/env node
/**
 * comic-admin.js — maintain the comic archive without a deployment.
 *
 * Talks to the live write API (never the database directly), so it works from
 * any machine that can reach charno.net and has the API key.
 *
 * Setup:
 *   export CHARNO_API_KEY=...            # backend API key (required for writes)
 *   export CHARNO_API_URL=...            # optional, default https://charno.net/api
 *
 * Commands: run `node scripts/comic-admin.js help` (or `--help` / `-h`, or no
 * args at all) for the full command reference with params and examples.
 */

import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { pathToFileURL } from 'node:url';

const API_URL = (process.env.CHARNO_API_URL || 'https://charno.net/api').replace(/\/$/, '');
const API_KEY = process.env.CHARNO_API_KEY;

// ── Issue list parsing ────────────────────────────────────────────────────────

/**
 * Parse a human issue list like "1-5, 12, Annual 1" into issue number strings:
 * ["1","2","3","4","5","12","Annual 1"]. Numeric ranges expand (capped at 500
 * per range); anything else is kept verbatim. Deduped, order preserved.
 */
export function parseIssueList(input) {
  const out = [];
  const seen = new Set();
  const push = (v) => {
    const t = String(v).trim();
    if (t && !seen.has(t)) { seen.add(t); out.push(t); }
  };

  for (const rawToken of String(input || '').split(',')) {
    const token = rawToken.trim();
    if (!token) continue;
    const range = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const from = parseInt(range[1], 10);
      const to   = parseInt(range[2], 10);
      if (to >= from && to - from < 500) {
        for (let n = from; n <= to; n++) push(n);
        continue;
      }
    }
    push(token);
  }
  return out;
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (method !== 'GET') {
    if (!API_KEY) fail('CHARNO_API_KEY is not set (required for write operations)');
    headers['Authorization'] = `Bearer ${API_KEY}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    // Bulk scrapes are slow (Comic Vine is rate-limited to ~1 req/s)
    signal: AbortSignal.timeout(30 * 60 * 1000),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) {
    throw new Error(`${method} ${path} → HTTP ${res.status}: ${data.error || text.slice(0, 200)}`);
  }
  return data;
}

const apiGet   = (path)       => request('GET', path);
const apiPost  = (path, body) => request('POST', path, body ?? {});
const apiPatch = (path, body) => request('PATCH', path, body);

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

// ── Interactive helpers ───────────────────────────────────────────────────────

let rl;
function getRl() {
  if (!rl) rl = readline.createInterface({ input: stdin, output: stdout });
  return rl;
}
const ask = async (q) => (await getRl().question(q)).trim();

// Print CV volume candidates as a numbered table
function printVolumeCandidates(candidates) {
  candidates.forEach((c, i) => {
    const bits = [
      c.start_year ?? '????',
      c.publisher ?? 'unknown publisher',
      `${c.issue_count ?? c.count_of_issues ?? '?'} issues`,
    ];
    const score = c.score !== undefined ? `  [score ${c.score}]` : '';
    console.log(`  ${i + 1}) ${c.name} (${bits.join(', ')})  cv:${c.id}${score}`);
  });
}

async function chooseVolume(candidates, { allowSearch = true } = {}) {
  while (true) {
    printVolumeCandidates(candidates);
    const extra = allowSearch ? ', (r)e-search' : '';
    const ans = await ask(`Pick 1-${candidates.length}, enter a CV id directly, (s)kip${extra}: `);
    if (ans.toLowerCase() === 's' || ans === '') return null;
    if (allowSearch && ans.toLowerCase() === 'r') {
      const q = await ask('New search query: ');
      const { results } = await apiGet(`/comics/search-cv?q=${encodeURIComponent(q)}`);
      if (!results.length) { console.log('  No results.'); continue; }
      candidates = results;
      continue;
    }
    const n = parseInt(ans, 10);
    if (!isNaN(n) && n >= 1 && n <= candidates.length) return candidates[n - 1].id;
    if (!isNaN(n) && n > 1000) return n; // direct CV id
    console.log('  Not a valid choice.');
  }
}

// ── Commands ──────────────────────────────────────────────────────────────────

async function cmdStatus() {
  const s = await apiGet('/comics/stats');
  console.log('Comic archive status');
  console.log(`  Groups:  ${s.groups}  (${s.groups_with_header} with header image, ${s.groups - s.groups_with_header} missing)`);
  console.log(`  Series:  ${s.series}  (${s.series_resolved} CV-resolved, ${s.series_parked} parked for manual review, ${s.series - s.series_resolved - s.series_parked} never attempted)`);
  console.log(`  Issues:  ${s.issues}  (${s.issues_attempted} scrape-attempted, ${s.issues_with_cover} with cover)`);
}

async function cmdAdd() {
  const title = await ask('Series title: ');
  if (!title) fail('Title is required');

  console.log('Searching Comic Vine…');
  const { results } = await apiGet(`/comics/search-cv?q=${encodeURIComponent(title)}`);
  let cvId = null;
  let cvPick = null;
  if (results.length) {
    cvId = await chooseVolume(results);
    cvPick = results.find(r => r.id === cvId) || null;
  } else {
    console.log('  No Comic Vine matches — series will be created unresolved.');
  }

  const publisher = await ask(`Publisher${cvPick?.publisher ? ` [${cvPick.publisher}]` : ''}: `)
    || cvPick?.publisher || '';
  const volume = await ask('Volume (blank if none): ');

  // Group: existing id, or create
  const { groups } = await apiGet('/comics/groups?limit=200');
  const groupInput = await ask('Group id (blank to skip, "?" to list, or a new id to create): ');
  let groupId = null;
  if (groupInput === '?') {
    groups.forEach(g => console.log(`  ${g.id}  (${g.name})`));
    groupId = (await ask('Group id: ')) || null;
  } else if (groupInput) {
    groupId = groupInput;
  }
  if (groupId && !groups.some(g => g.id === groupId)) {
    const name = await ask(`Group "${groupId}" doesn't exist. Name for new group [${groupId}]: `) || groupId;
    await apiPost('/comics/groups', { id: groupId, name });
    console.log(`  ✓ Created group ${groupId}`);
  }

  const issues = parseIssueList(await ask('Issues owned (e.g. "1-5, 12, Annual 1"): '));
  console.log(`\nCreating "${title}"${volume ? ` Vol. ${volume}` : ''} (${publisher || 'no publisher'})`
    + `${groupId ? `, group ${groupId}` : ''}, ${issues.length} issue(s)`
    + `${cvId ? `, comic_vine_id ${cvId}` : ', unresolved'}`);
  if ((await ask('Confirm? [Y/n]: ')).toLowerCase() === 'n') fail('Aborted');

  const series = await apiPost('/comics', {
    title, publisher, volume: volume || null, group_id: groupId,
    comic_vine_id: cvId, issues,
  });
  console.log(`  ✓ Created series ${series.id}`);

  if (issues.length) {
    console.log('Scraping covers/metadata (Comic Vine is rate-limited, ~2s per issue)…');
    const result = await apiPost(`/comics/${series.id}/scrape`);
    (result.log || []).forEach(l => console.log(`  ${l}`));
    console.log(result.ok ? '  ✓ Scrape complete' : `  ✗ ${result.reason}`);
  }
}

async function cmdAddIssues(seriesId) {
  if (!seriesId) fail('Usage: comic-admin.js add-issues <series-id>');
  const series = await apiGet(`/comics/${seriesId}`);
  console.log(`${series.title}${series.volume ? ` Vol. ${series.volume}` : ''} — currently ${series.issues.length} issue(s): `
    + series.issues.map(i => i.issue_number).join(', '));

  const issues = parseIssueList(await ask('Issues to add: '));
  if (!issues.length) fail('Nothing to add');

  await apiPatch(`/comics/${seriesId}`, { issues });
  console.log(`  ✓ Added (new numbers only; existing ones untouched)`);

  console.log('Scraping new issues…');
  const result = await apiPost(`/comics/${seriesId}/scrape`);
  (result.log || []).forEach(l => console.log(`  ${l}`));
  console.log(result.ok ? '  ✓ Scrape complete' : `  ✗ ${result.reason}`);
}

async function cmdUnresolved() {
  const { series, total } = await apiGet('/comics/unresolved');
  if (!total) { console.log('✓ Every series has a Comic Vine id.'); return; }
  console.log(`${total} unresolved series.\n`);

  for (const s of series) {
    console.log(`── ${s.title}${s.volume ? ` Vol. ${s.volume}` : ''} (${s.publisher || 'no publisher'}, ${s.issue_count} issues)  [${s.id}]`);
    let candidates = s.cv_candidates || [];
    if (!candidates.length) {
      console.log('  No stored candidates — searching CV…');
      const { results } = await apiGet(`/comics/search-cv?q=${encodeURIComponent(s.title)}`);
      candidates = results;
    }
    if (!candidates.length) {
      console.log('  Still nothing on Comic Vine; skipping.\n');
      continue;
    }
    const cvId = await chooseVolume(candidates);
    if (cvId === null) { console.log('  Skipped.\n'); continue; }

    console.log(`  Resolving to cv:${cvId} and scraping…`);
    const result = await apiPost(`/comics/${s.id}/scrape`, { comic_vine_id: cvId });
    (result.log || []).forEach(l => console.log(`  ${l}`));
    console.log(result.ok ? '  ✓ Done\n' : `  ✗ ${result.reason}\n`);
  }
}

async function cmdHeaders(arg) {
  if (arg && arg !== '--force') {
    // Single group
    const result = await apiPost(`/comics/groups/${arg}/scrape-header`);
    if (result.ok) {
      console.log(`✓ ${arg}: ${result.chosen?.name} (${result.chosen?.resource_type}) → ${result.cover_image}`);
    } else {
      console.log(`✗ ${arg}: ${result.reason}`);
    }
    if (result.candidates?.length) {
      console.log('  Other candidates (use set-header with an image URL to override):');
      result.candidates.forEach(c =>
        console.log(`   - ${c.name} (${c.resource_type}, score ${c.score})\n     ${c.image}`));
    }
    return;
  }

  const force = arg === '--force';
  console.log(`Scraping headers for ${force ? 'ALL groups' : 'groups missing one'}…`);
  const result = await apiPost(`/comics/scrape-headers${force ? '?force=true' : ''}`);
  for (const [id, r] of Object.entries(result.results)) {
    console.log(r.ok
      ? `  ✓ ${id}: ${r.chosen.name} (${r.chosen.resource_type})`
      : `  ✗ ${id}: ${r.reason}`);
  }
  console.log(`Done: ${result.succeeded}/${result.queued} succeeded.`);
  if (result.failed) console.log('Fix failures with: comic-admin.js set-header <group-id> <image-url>');
}

async function cmdSetHeader(groupId, imageUrl) {
  if (!groupId || !imageUrl) fail('Usage: comic-admin.js set-header <group-id> <image-url>');
  const result = await apiPost(`/comics/groups/${groupId}/scrape-header`, { image_url: imageUrl });
  console.log(`✓ ${groupId} header set → ${result.cover_image}`);
}

async function cmdSetHero(groupId, imageUrl) {
  if (!groupId || !imageUrl) fail('Usage: comic-admin.js set-hero <group-id> <image-url>');
  const result = await apiPost(`/comics/groups/${groupId}/scrape-hero`, { image_url: imageUrl });
  console.log(`✓ ${groupId} hero set → ${result.hero_image}`);
}

// Each entry: [command line shown in the usage table, one-line summary].
// Kept in display order so cmdHelp() and the top-level usage line stay in sync.
const COMMANDS = [
  ['status',                           'Collection + scrape progress totals'],
  ['add',                              'Add a new series (interactive, Comic Vine-matched)'],
  ['add-issues <series-id>',           'Append issues to an existing series'],
  ['unresolved',                       'Resolve series that failed automatic Comic Vine matching'],
  ['headers [--force]',                'Bulk-scrape header images for groups missing one (or all, with --force)'],
  ['headers <group-id>',               "Re-scrape one group's header image"],
  ['set-header <group-id> <url>',      "Manually set a group's header image from any URL"],
  ['set-hero <group-id> <url>',        'Set a distinct wide hero banner image for a group'],
  ['help',                             'Show this message'],
];

function cmdHelp() {
  console.log(`
comic-admin — maintain the charno.net comic archive without a deployment

Talks only to the live write API (never the database directly), so it
works from any machine that can reach ${API_URL.replace(/\/api$/, '')} and has the API key.

SETUP
  export CHARNO_API_KEY=...     backend API key — required for anything that
                                 writes (add, add-issues, unresolved, headers,
                                 set-header, set-hero). Read-only "status"
                                 works without it.
  export CHARNO_API_URL=...     optional, default https://charno.net/api

USAGE
  cadmin <command> [args]

COMMANDS
${COMMANDS.map(([c, desc]) => `  ${c.padEnd(32)}${desc}`).join('\n')}

DETAILS

  status
    Groups with/without a header image, series resolved/parked-for-review/
    never-attempted, issues scrape-attempted/with-cover.
      cadmin status

  add
    Prompts for a title, searches Comic Vine live and lets you pick the
    match (or skip and create it unresolved), prompts for publisher/volume,
    lets you pick or create a group, then prompts for the issues you own —
    accepts ranges and named issues, e.g. "1-5, 12, Annual 1". Creates the
    series and immediately scrapes covers/metadata for those issues.
      cadmin add

  add-issues <series-id>
    Appends more issues to a series that already exists (only adds new
    numbers — existing ones are untouched) and scrapes just the new ones.
    <series-id> is the slug id (e.g. "ghost-rider"), findable via
    GET /api/comics?search=<title> or GET /api/comics/groups.
      cadmin add-issues ghost-rider
      # then when prompted: 51-55, Annual 2

  unresolved
    Walks through every series that failed automatic Comic Vine matching.
    For each one, shows candidate volumes (stored from the last attempt, or
    freshly searched if none were stored) scored by title/publisher/issue-
    count match. At each prompt you can:
      1-N        pick that numbered candidate
      <cv-id>    enter a Comic Vine volume id directly (e.g. 5444)
      r          re-search with a different query
      s / Enter  skip this series for now
    Picking or entering an id resolves the series and scrapes its issues.
      cadmin unresolved

  headers [--force]
    Bulk-scrapes header images (Comic Vine character/team/volume art,
    preferring title-free close-ups) for every group missing one. Add
    --force to redo every group, including ones that already have one.
      cadmin headers
      cadmin headers --force

  headers <group-id>
    Re-scrapes the header image for just one group.
      cadmin headers ghost-rider

  set-header <group-id> <url>
    Manually overrides a group's header image from any image URL —
    downloads and self-hosts it (never hotlinks the original). Use this
    when the auto-scrape picked the wrong art or found nothing.
      cadmin set-header headlight-comics https://comicvine.gamespot.com/a/uploads/original/123.jpg

  set-hero <group-id> <url>
    Sets a distinct wide "hero" banner image for a group's detail-page
    banner, separate from its header thumbnail (falls back to the header
    image if never set). Same download-and-host behavior as set-header.
      cadmin set-hero ghost-rider https://example.com/wide-banner.jpg

NOTES
  - Bulk operations (headers, and the scheduled scrape-unscraped job) can
    keep running past a minute server-side — Comic Vine is rate-limited to
    about 1 request/second. If a command seems to hang or times out, it's
    usually still working; check progress with \`cadmin status\`.
  - Series/group ids are slugs, not titles ("Ghost Rider" → "ghost-rider").
    If you're not sure of one, search first:
    GET ${API_URL}/comics?search=<title>
`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  try {
    switch (cmd) {
      case 'status':     await cmdStatus(); break;
      case 'add':        await cmdAdd(); break;
      case 'add-issues': await cmdAddIssues(args[0]); break;
      case 'unresolved': await cmdUnresolved(); break;
      case 'headers':    await cmdHeaders(args[0]); break;
      case 'set-header': await cmdSetHeader(args[0], args[1]); break;
      case 'set-hero':   await cmdSetHero(args[0], args[1]); break;
      case 'help':
      case '--help':
      case '-h':
      case undefined:
        cmdHelp();
        break;
      default:
        console.log(`Unknown command: "${cmd}"\n`);
        cmdHelp();
        process.exitCode = 1;
    }
  } catch (err) {
    fail(err.message);
  } finally {
    rl?.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
