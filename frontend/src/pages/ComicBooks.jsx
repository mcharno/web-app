import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { comicsAPI } from '../services/api';
import './ComicBooks.css';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function formatCoverDate(dateStr) {
  if (!dateStr) return null;
  const [year, month] = dateStr.split('-');
  if (!year) return dateStr;
  return month ? `${MONTHS[parseInt(month, 10) - 1]} ${year}` : year;
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Which metadata fields of an issue matched the query — shown as a hint chip
// on universal search results ("matched character: Venom").
function matchedFields(issue, q) {
  const term = q.toLowerCase();
  const hits = [];
  const scan = (label, arr) => {
    const hit = (arr || []).find(v => v.toLowerCase().includes(term));
    if (hit) hits.push(`${label}: ${hit}`);
  };
  scan('character', issue.characters);
  scan('team',      issue.teams);
  scan('location',  issue.locations);
  scan('story arc', issue.story_arcs);
  scan('object',    issue.objects);
  if (!hits.length && issue.name?.toLowerCase().includes(term)) hits.push('title');
  if (!hits.length && issue.description?.toLowerCase().includes(term)) hits.push('description');
  return hits.slice(0, 2);
}

const issueCountOfGroup = (group) =>
  (group.series || []).reduce((sum, s) => sum + (s.issues?.length || 0), 0);

// "series" is already invariant singular/plural; only "issue(s)" needs it.
const issueLabel = (n) => `${n} issue${n === 1 ? '' : 's'}`;

/**
 * Split a group's series into page sections by real (non-blank) publisher.
 *
 * Most groups have one publisher (or a mix of one real publisher plus some
 * blanks) — those render as a single section, unchanged from before. A group
 * whose series span two or more distinct real publishers (e.g. a licensed
 * property published by different companies) gets one section per publisher
 * instead, each with its own hero image and series table; any series with no
 * publisher recorded are bucketed into a trailing "Other" section (publisher:
 * null) so nothing is silently dropped.
 */
export function groupSeriesByPublisher(series) {
  const list = series || [];
  const realPublishers = [...new Set(list.map(s => s.publisher).filter(Boolean))];

  if (realPublishers.length < 2) {
    return { isMulti: false, sections: [{ publisher: null, series: list }] };
  }

  const sections = [...realPublishers].sort().map(publisher => ({
    publisher,
    series: list.filter(s => s.publisher === publisher),
  }));
  const unpublished = list.filter(s => !s.publisher);
  if (unpublished.length) sections.push({ publisher: null, series: unpublished });

  return { isMulti: true, sections };
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function GroupCover({ group, className }) {
  return (
    <div className={className}>
      {group.cover_image
        ? <img src={group.cover_image} alt={group.name} loading="lazy" />
        : <span className="group-cover-initial">{group.name.charAt(0)}</span>
      }
    </div>
  );
}

// Publisher-grouped series table (used on the group detail page). Set
// showPublisherColumn={false} when the caller has already split series by
// publisher (see groupSeriesByPublisher) — the column would just repeat one
// value in that case.
function SeriesTable({ series, showPublisherColumn = true, onOpenSeries, onOpenIssue }) {
  const publisherGroups = useMemo(() => {
    if (!showPublisherColumn) return [{ publisher: '', series: series || [] }];
    const pubMap = new Map();
    for (const comic of (series || [])) {
      const pub = comic.publisher || '';
      if (!pubMap.has(pub)) pubMap.set(pub, []);
      pubMap.get(pub).push(comic);
    }
    return [...pubMap.keys()].sort().map(pub => ({ publisher: pub, series: pubMap.get(pub) }));
  }, [series, showPublisherColumn]);

  if (!series?.length) {
    return <span className="group-no-series">No series recorded</span>;
  }

  return (
    <table className="series-table">
      <thead>
        <tr>
          {showPublisherColumn && <th className="col-series-publisher">Publisher</th>}
          <th className="col-series-title">Title</th>
          <th className="col-series-issues">Issues</th>
        </tr>
      </thead>
      <tbody>
        {publisherGroups.flatMap(({ publisher, series: pubSeries }, pgIdx) =>
          pubSeries.map((comic, idx) => (
            <tr
              key={comic.id}
              className={`series-row${showPublisherColumn && idx === 0 && pgIdx > 0 ? ' pub-group-start' : ''}`}
            >
              {showPublisherColumn && idx === 0 && (
                <td className="col-series-publisher" rowSpan={pubSeries.length}>
                  <span className="publisher-label">{publisher || '—'}</span>
                </td>
              )}
              <td className="col-series-title">
                <button
                  className="series-title-btn"
                  onClick={() => onOpenSeries(comic.id)}
                  disabled={!comic.issues?.length}
                >
                  {comic.title}
                </button>
                {comic.volume && (
                  <span className="series-volume"> Vol. {comic.volume}</span>
                )}
              </td>
              <td className="col-series-issues">
                {comic.issues?.length > 0 ? (
                  <span className="issue-nums">
                    {comic.issues.map((issueNum, i) => (
                      <span key={issueNum} className="issue-num-wrap">
                        {i > 0 && <span className="issue-sep">, </span>}
                        <button
                          className="issue-num-btn"
                          onClick={() => onOpenIssue(comic.id, issueNum)}
                        >
                          {issueNum}
                        </button>
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="data-empty">—</span>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const ComicBooks = () => {
  const navigate = useNavigate();
  const { groupId } = useParams();

  // ── Landing: group grid ─────────────────────────────────────────────────────
  const [groups, setGroups] = useState(null); // null = loading
  useEffect(() => {
    if (groupId) return;
    comicsAPI.getGroups({ limit: 200 })
      .then(res => setGroups(res.data.groups))
      .catch(err => { console.error('Error loading comics:', err); setGroups([]); });
  }, [groupId]);

  // ── Group detail ────────────────────────────────────────────────────────────
  const [group, setGroup] = useState(null);
  const [groupError, setGroupError] = useState(false);
  useEffect(() => {
    if (!groupId) { setGroup(null); setGroupError(false); return; }
    setGroup(null);
    setGroupError(false);
    comicsAPI.getGroup(groupId)
      .then(res => setGroup(res.data))
      .catch(err => { console.error('Failed to load group:', err); setGroupError(true); });
  }, [groupId]);

  // ── Universal search ────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState(null); // null = not searching
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const q = searchTerm.trim();
    if (!q) { setResults(null); setSearchLoading(false); return; }
    setSearchLoading(true);
    const t = setTimeout(() => {
      comicsAPI.search({ q, limit: 30 })
        .then(res => setResults(res.data))
        .catch(err => console.error('Search error:', err))
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const searching = searchTerm.trim().length > 0;

  // ── Modals ──────────────────────────────────────────────────────────────────
  // null | { type: 'loading' }
  //      | { type: 'series', comic }             comic has .issues[] with full objects
  //      | { type: 'issue', comic, issue, fromSeries }
  const [modal, setModal] = useState(null);
  const closeModal = useCallback(() => setModal(null), []);

  const openSeries = useCallback(async (seriesId) => {
    setModal({ type: 'loading' });
    try {
      const res = await comicsAPI.getById(seriesId);
      setModal({ type: 'series', comic: res.data });
    } catch (err) {
      console.error('Failed to load series:', err);
      setModal(null);
    }
  }, []);

  const openIssueFromTable = useCallback(async (seriesId, issueNumber) => {
    setModal({ type: 'loading' });
    try {
      const res = await comicsAPI.getById(seriesId);
      const comic = res.data;
      const issue = comic.issues.find(i => String(i.issue_number) === String(issueNumber));
      setModal(issue ? { type: 'issue', comic, issue, fromSeries: false } : null);
    } catch (err) {
      console.error('Failed to load issue:', err);
      setModal(null);
    }
  }, []);

  const openIssueFromSeries = useCallback((comic, issue) => {
    setModal({ type: 'issue', comic, issue, fromSeries: true });
  }, []);

  const openIssueFromSearch = useCallback((issue) => {
    setModal({
      type: 'issue',
      issue,
      comic: {
        id:        issue.series_id,
        title:     issue.series_title,
        publisher: issue.series_publisher,
        volume:    issue.series_volume,
      },
      fromSeries: false,
    });
  }, []);

  const backToSeries = useCallback(() => {
    setModal(prev => prev?.comic ? { type: 'series_reload', seriesId: prev.comic.id } : null);
  }, []);

  useEffect(() => {
    if (modal?.type === 'series_reload') {
      openSeries(modal.seriesId);
    }
  }, [modal, openSeries]);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeModal]);

  // ── Render: search results ──────────────────────────────────────────────────
  const renderSearchResults = () => {
    if (searchLoading || !results) {
      return <div className="loading-state">Searching…</div>;
    }
    const { groups: rGroups, series: rSeries, issues: rIssues } = results;
    if (!rGroups.length && !rSeries.length && !rIssues.length) {
      return <div className="comics-empty">Nothing in the collection matches “{results.query}”.</div>;
    }
    return (
      <div className="search-results">
        {rGroups.length > 0 && (
          <section className="search-section">
            <h3 className="search-section-title">Groups <span className="search-section-count">{rGroups.length}</span></h3>
            <div className="search-group-tiles">
              {rGroups.map(g => (
                <Link key={g.id} to={`/archives/comics/${g.id}`} className="search-group-tile">
                  <GroupCover group={g} className="search-group-cover" />
                  <div className="search-group-info">
                    <span className="search-group-name">{g.name}</span>
                    <span className="search-group-counts">
                      {g.series_count} series · {issueLabel(g.issue_count)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {rSeries.length > 0 && (
          <section className="search-section">
            <h3 className="search-section-title">Series <span className="search-section-count">{rSeries.length}</span></h3>
            <div className="search-rows">
              {rSeries.map(s => (
                <button
                  key={s.id}
                  className="search-row"
                  onClick={() => s.issue_count > 0 ? openSeries(s.id) : navigate(`/archives/comics/${s.group_id}`)}
                >
                  <div className="search-row-info">
                    <div className="search-row-heading">
                      {s.title}
                      {s.volume && <span className="series-volume"> Vol. {s.volume}</span>}
                    </div>
                    <div className="search-row-sub">
                      {s.publisher && <span>{s.publisher}</span>}
                      {s.group_name && <span> · {s.group_name}</span>}
                      <span> · {s.issue_count} issue{s.issue_count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <span className="issue-list-arrow">›</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {rIssues.length > 0 && (
          <section className="search-section">
            <h3 className="search-section-title">Issues <span className="search-section-count">{rIssues.length}</span></h3>
            <div className="search-rows">
              {rIssues.map(issue => {
                const matches = matchedFields(issue, results.query);
                return (
                  <button
                    key={issue.id}
                    className="search-row"
                    onClick={() => openIssueFromSearch(issue)}
                  >
                    <div className="search-row-cover">
                      {issue.cover_image
                        ? <img src={issue.cover_image} alt={`#${issue.issue_number}`} loading="lazy" />
                        : <span className="issue-list-placeholder">#{issue.issue_number}</span>
                      }
                    </div>
                    <div className="search-row-info">
                      <div className="search-row-sub">
                        {issue.series_title}
                        {issue.series_volume && ` Vol. ${issue.series_volume}`}
                        {issue.series_publisher && ` · ${issue.series_publisher}`}
                      </div>
                      <div className="search-row-heading">
                        #{issue.issue_number}{issue.name ? ` — ${issue.name}` : ''}
                      </div>
                      <div className="search-row-meta">
                        {issue.cover_date && <span>{formatCoverDate(issue.cover_date)}</span>}
                        {matches.map(m => (
                          <span key={m} className="match-chip">{m}</span>
                        ))}
                      </div>
                    </div>
                    <span className="issue-list-arrow">›</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    );
  };

  // ── Render: group detail page ───────────────────────────────────────────────
  if (groupId) {
    return (
      <div className="comics-page">
        <button className="back-to-archives" onClick={() => navigate('/archives/comics')}>
          ← All Comics
        </button>

        {groupError ? (
          <div className="comics-empty">Group not found.</div>
        ) : !group ? (
          <div className="loading-state">Loading…</div>
        ) : (() => {
          const { isMulti, sections } = groupSeriesByPublisher(group.series);
          return (
            <>
              <div className="group-header">
                <h2 className="group-header-name">{group.name}</h2>
                {!isMulti && (
                  <p className="group-header-counts">
                    {group.series.length} series · {issueLabel(issueCountOfGroup(group))}
                  </p>
                )}
                {group.description && (
                  <p className="group-header-desc">{stripHtml(group.description)}</p>
                )}
              </div>

              {sections.map(section => {
                const heroSrc = (section.publisher && group.publisher_heroes?.[section.publisher])
                  || group.hero_image;
                const sectionIssues = section.series.reduce((sum, s) => sum + (s.issues?.length || 0), 0);

                return (
                  <section key={section.publisher || '_all'} className="pub-section">
                    {isMulti && (
                      <h3 className="pub-section-title">{section.publisher || 'Other'}</h3>
                    )}
                    <div className="group-hero">
                      {heroSrc ? (
                        <img className="group-hero-img" src={heroSrc} alt="" aria-hidden="true" />
                      ) : (
                        <div className="group-hero-img group-hero-placeholder">
                          <span>{(section.publisher || group.name).charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    {isMulti && (
                      <p className="pub-section-counts">
                        {section.series.length} series · {issueLabel(sectionIssues)}
                      </p>
                    )}
                    <div className="group-detail-table">
                      <SeriesTable
                        series={section.series}
                        showPublisherColumn={!isMulti}
                        onOpenSeries={openSeries}
                        onOpenIssue={openIssueFromTable}
                      />
                    </div>
                  </section>
                );
              })}
            </>
          );
        })()}

        {renderModals(modal, closeModal, openIssueFromSeries, backToSeries)}
      </div>
    );
  }

  // ── Render: landing (grid + search) ─────────────────────────────────────────
  const totalIssues = (groups || []).reduce((sum, g) => sum + issueCountOfGroup(g), 0);

  return (
    <div className="comics-page">
      <button className="back-to-archives" onClick={() => navigate('/archives')}>
        ← Back to Archives
      </button>

      <div className="comics-header">
        <h2>Comic Books</h2>
        <p className="comics-intro">
          Personal comic book collection.
          {groups && ` ${groups.length} groups, ${totalIssues} issues.`}
        </p>
      </div>

      <div className="comics-search-wrap">
        <div className="comics-search">
          <input
            type="text"
            placeholder="Search characters, series, publishers, story arcs, locations…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="comics-search-input"
            aria-label="Search the comic collection"
          />
          {searchTerm && (
            <button className="comics-search-clear" onClick={() => setSearchTerm('')}>×</button>
          )}
        </div>
      </div>

      {searching ? renderSearchResults() : (
        groups === null ? (
          <div className="loading-state">Loading comic book collection…</div>
        ) : groups.length === 0 ? (
          <div className="comics-empty">No comics in the collection yet.</div>
        ) : (
          <div className="comics-grid">
            {groups.map(g => (
              <Link key={g.id} to={`/archives/comics/${g.id}`} className="group-tile">
                <GroupCover group={g} className="group-tile-cover" />
                <div className="group-tile-plate">
                  <span className="group-tile-name">{g.name}</span>
                  <span className="group-tile-counts">
                    {(g.series || []).length} series · {issueLabel(issueCountOfGroup(g))}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      {renderModals(modal, closeModal, openIssueFromSeries, backToSeries)}
    </div>
  );
};

// ── Modals (shared between landing and group detail) ──────────────────────────

function renderModals(modal, closeModal, openIssueFromSeries, backToSeries) {
  if (!modal) return null;

  if (modal.type === 'loading') {
    return (
      <div className="modal-overlay">
        <div className="modal-loading">Loading…</div>
      </div>
    );
  }

  if (modal.type === 'series') {
    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="series-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-header-text">
              <h3 className="modal-title">{modal.comic.title}</h3>
              {(modal.comic.publisher || modal.comic.volume) && (
                <div className="modal-meta">
                  {modal.comic.publisher && (
                    <span className="modal-meta-publisher">{modal.comic.publisher}</span>
                  )}
                  {modal.comic.publisher && modal.comic.volume && (
                    <span className="modal-meta-sep">·</span>
                  )}
                  {modal.comic.volume && (
                    <span className="modal-meta-volume">Vol. {modal.comic.volume}</span>
                  )}
                </div>
              )}
            </div>
            <button className="modal-close" onClick={closeModal}>×</button>
          </div>
          <div className="issue-list">
            {modal.comic.issues.map(issue => (
              <button
                key={issue.id}
                className="issue-list-row"
                onClick={() => openIssueFromSeries(modal.comic, issue)}
              >
                <div className="issue-list-cover">
                  {issue.cover_image
                    ? <img src={issue.cover_image} alt={`#${issue.issue_number}`} loading="lazy" />
                    : <span className="issue-list-placeholder">#{issue.issue_number}</span>
                  }
                </div>
                <div className="issue-list-meta">
                  <div className="issue-list-num">#{issue.issue_number}</div>
                  {issue.name && <div className="issue-list-heading">{issue.name}</div>}
                  {issue.cover_date && <div className="issue-list-date">{formatCoverDate(issue.cover_date)}</div>}
                </div>
                <span className="issue-list-arrow">›</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (modal.type === 'issue') {
    const { comic, issue, fromSeries } = modal;
    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="issue-detail-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-header-text">
              {fromSeries && (
                <button
                  className="modal-back"
                  onClick={e => { e.stopPropagation(); backToSeries(); }}
                >
                  ← Back
                </button>
              )}
              <h3 className="modal-title">
                {comic.title}
                <span className="modal-issue-badge"> #{issue.issue_number}</span>
              </h3>
              {(comic.publisher || comic.volume) && (
                <div className="modal-meta">
                  {comic.publisher && (
                    <span className="modal-meta-publisher">{comic.publisher}</span>
                  )}
                  {comic.publisher && comic.volume && (
                    <span className="modal-meta-sep">·</span>
                  )}
                  {comic.volume && (
                    <span className="modal-meta-volume">Vol. {comic.volume}</span>
                  )}
                </div>
              )}
            </div>
            <button className="modal-close" onClick={closeModal}>×</button>
          </div>

          <div className="issue-detail-body">
            <div className="issue-detail-cover">
              {issue.cover_image
                ? <img src={issue.cover_image} alt={`${comic.title} #${issue.issue_number}`} />
                : <div className="issue-detail-placeholder"><span>#{issue.issue_number}</span></div>
              }
            </div>

            <div className="issue-detail-info">
              {issue.name && <p className="issue-detail-name">{issue.name}</p>}
              <dl className="issue-detail-dl">
                <dt>Published</dt>
                <dd>{formatCoverDate(issue.cover_date) || '—'}</dd>
                <dt>Writers</dt>
                <dd>{issue.writers?.length ? issue.writers.join(', ') : '—'}</dd>
                <dt>Artists</dt>
                <dd>{issue.artists?.length ? issue.artists.join(', ') : '—'}</dd>
                {issue.characters?.length > 0 && <>
                  <dt>Characters</dt>
                  <dd>{issue.characters.join(', ')}</dd>
                </>}
                {issue.locations?.length > 0 && <>
                  <dt>Locations</dt>
                  <dd>{issue.locations.join(', ')}</dd>
                </>}
                {issue.story_arcs?.length > 0 && <>
                  <dt>Story Arcs</dt>
                  <dd>{issue.story_arcs.join(', ')}</dd>
                </>}
                {issue.teams?.length > 0 && <>
                  <dt>Teams</dt>
                  <dd>{issue.teams.join(', ')}</dd>
                </>}
                {issue.objects?.length > 0 && <>
                  <dt>Objects</dt>
                  <dd>{issue.objects.join(', ')}</dd>
                </>}
              </dl>
              {issue.description && (
                <p className="issue-detail-desc">{stripHtml(issue.description)}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default ComicBooks;
