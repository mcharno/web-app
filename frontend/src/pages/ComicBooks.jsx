import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { comicsAPI } from '../services/api';
import './ComicBooks.css';

const PAGE_SIZE = 50;

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

const ComicBooks = () => {
  const navigate = useNavigate();

  // ── Main groups list ────────────────────────────────────────────────────────
  const [groupsData, setGroupsData] = useState({ groups: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // ── Issue search panel ──────────────────────────────────────────────────────
  const [issueQuery, setIssueQuery] = useState('');
  const [debouncedIssueQuery, setDebouncedIssueQuery] = useState('');
  const [issueResults, setIssueResults] = useState(null); // null = panel hidden
  const [issueSearchLoading, setIssueSearchLoading] = useState(false);

  // ── Modals ──────────────────────────────────────────────────────────────────
  // null | { type: 'loading' }
  //      | { type: 'series', comic }             comic has .issues[] with full objects
  //      | { type: 'issue', comic, issue, fromSeries }
  const [modal, setModal] = useState(null);

  // ── Data fetching ───────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    comicsAPI.getGroups({ search: debouncedSearch, page: currentPage, limit: PAGE_SIZE })
      .then(res => setGroupsData(res.data))
      .catch(err => console.error('Error loading comics:', err))
      .finally(() => setLoading(false));
  }, [debouncedSearch, currentPage]);

  // Debounce main search; reset to page 1 on new query
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchTerm); setCurrentPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Debounce issue search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedIssueQuery(issueQuery), 350);
    return () => clearTimeout(t);
  }, [issueQuery]);

  useEffect(() => {
    if (!debouncedIssueQuery.trim()) { setIssueResults(null); return; }
    setIssueSearchLoading(true);
    comicsAPI.searchIssues({ q: debouncedIssueQuery, limit: 30 })
      .then(res => setIssueResults(res.data.issues))
      .catch(err => console.error('Issue search error:', err))
      .finally(() => setIssueSearchLoading(false));
  }, [debouncedIssueQuery]);

  // ── Modal actions ───────────────────────────────────────────────────────────
  const closeModal = useCallback(() => setModal(null), []);

  // Opens series modal — fetches full issue list on demand
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

  // Opens issue modal from the table's issue number buttons
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

  // Opens issue modal from the series list modal
  const openIssueFromSeries = useCallback((comic, issue) => {
    setModal({ type: 'issue', comic, issue, fromSeries: true });
  }, []);

  // Opens issue modal from the issue search results
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

  // When backToSeries triggers a reload, fetch and open
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

  // ── Render ──────────────────────────────────────────────────────────────────
  const { groups, total, pages } = groupsData;
  const safePage = Math.min(currentPage, pages || 1);

  if (loading && !groups.length) {
    return (
      <div className="comics-page">
        <div className="loading-state">Loading comic book collection...</div>
      </div>
    );
  }

  return (
    <div className="comics-page">
      <button className="back-to-archives" onClick={() => navigate('/archives')}>
        ← Back to Archives
      </button>

      <div className="comics-header">
        <h2>Comic Books</h2>
        <p className="comics-intro">
          Personal comic book collection.
          {total > 0 && ` ${total} group${total !== 1 ? 's' : ''}.`}
        </p>
      </div>

      {/* ── Search ── */}
      <div className="comics-search-wrap">
        <div className="comics-search">
          <input
            type="text"
            placeholder="Search by character, publisher, or keyword..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="comics-search-input"
          />
          {searchTerm && (
            <button className="comics-search-clear" onClick={() => setSearchTerm('')}>×</button>
          )}
        </div>
      </div>

      {/* ── Issue search ── */}
      <div className="comics-search-wrap">
        <div className="comics-search">
          <input
            type="text"
            placeholder="Search issues by character, location, or story arc..."
            value={issueQuery}
            onChange={e => setIssueQuery(e.target.value)}
            className="comics-search-input"
          />
          {issueQuery && (
            <button className="comics-search-clear" onClick={() => setIssueQuery('')}>×</button>
          )}
        </div>
      </div>

      {/* ── Issue search results ── */}
      {issueResults !== null && (
        <div className="issue-search-panel">
          {issueSearchLoading ? (
            <div className="loading-state">Searching issues...</div>
          ) : issueResults.length === 0 ? (
            <div className="comics-empty">No issues match your search.</div>
          ) : (
            <>
              <p className="comics-count">{issueResults.length} issue{issueResults.length !== 1 ? 's' : ''} found</p>
              <div className="issue-search-results">
                {issueResults.map(issue => (
                  <button
                    key={issue.id}
                    className="issue-search-row"
                    onClick={() => openIssueFromSearch(issue)}
                  >
                    <div className="issue-search-cover">
                      {issue.cover_image
                        ? <img src={issue.cover_image} alt={`#${issue.issue_number}`} />
                        : <span className="issue-list-placeholder">#{issue.issue_number}</span>
                      }
                    </div>
                    <div className="issue-search-info">
                      <div className="issue-search-series">
                        {issue.series_title}
                        {issue.series_volume && ` Vol. ${issue.series_volume}`}
                        {issue.series_publisher && <span className="issue-search-pub"> · {issue.series_publisher}</span>}
                      </div>
                      <div className="issue-search-heading">
                        #{issue.issue_number}{issue.name ? ` — ${issue.name}` : ''}
                      </div>
                      {issue.cover_date && <div className="issue-list-date">{formatCoverDate(issue.cover_date)}</div>}
                    </div>
                    <span className="issue-list-arrow">›</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Count + groups list ── */}
      {issueResults === null && (
        <>
          <p className="comics-count">
            {total === groups.length
              ? `${total} groups`
              : `${groups.length} of ${total} groups`}
            {pages > 1 && ` — page ${safePage} of ${pages}`}
          </p>

          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : groups.length === 0 ? (
            <div className="comics-empty">No comics match your search.</div>
          ) : (
            <>
              <div className="comics-groups">
                {groups.map(group => {
                  const pubMap = new Map();
                  for (const comic of (group.series || [])) {
                    const pub = comic.publisher || '';
                    if (!pubMap.has(pub)) pubMap.set(pub, []);
                    pubMap.get(pub).push(comic);
                  }
                  const publisherGroups = [...pubMap.keys()]
                    .sort()
                    .map(pub => ({ publisher: pub, series: pubMap.get(pub) }));

                  return (
                    <div key={group.id} className="group-card">
                      <div className="group-image-col">
                        <div className="group-cover">
                          {group.cover_image
                            ? <img src={group.cover_image} alt={group.name} />
                            : <span className="group-cover-initial">{group.name.charAt(0)}</span>
                          }
                        </div>
                        <div className="group-name">{group.name}</div>
                      </div>

                      <div className="group-series-col">
                        {(group.series || []).length === 0 ? (
                          <span className="group-no-series">No series recorded</span>
                        ) : (
                          <table className="series-table">
                            <thead>
                              <tr>
                                <th className="col-series-publisher">Publisher</th>
                                <th className="col-series-title">Title</th>
                                <th className="col-series-issues">Issues</th>
                              </tr>
                            </thead>
                            <tbody>
                              {publisherGroups.flatMap(({ publisher, series }, pgIdx) =>
                                series.map((comic, idx) => (
                                  <tr
                                    key={comic.id}
                                    className={`series-row${idx === 0 && pgIdx > 0 ? ' pub-group-start' : ''}`}
                                  >
                                    {idx === 0 && (
                                      <td className="col-series-publisher" rowSpan={series.length}>
                                        <span className="publisher-label">{publisher || '—'}</span>
                                      </td>
                                    )}
                                    <td className="col-series-title">
                                      <button
                                        className="series-title-btn"
                                        onClick={() => openSeries(comic.id)}
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
                                                onClick={() => openIssueFromTable(comic.id, issueNum)}
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
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {pages > 1 && (
                <div className="comics-pagination">
                  <button
                    className="page-btn"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: pages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`page-btn${page === safePage ? ' page-btn-active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="page-btn"
                    onClick={() => setCurrentPage(p => Math.min(pages, p + 1))}
                    disabled={safePage === pages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Loading modal ── */}
      {modal?.type === 'loading' && (
        <div className="modal-overlay">
          <div className="modal-loading">Loading…</div>
        </div>
      )}

      {/* ── Series modal — vertical issue list ── */}
      {modal?.type === 'series' && (
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
                      ? <img src={issue.cover_image} alt={`#${issue.issue_number}`} />
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
      )}

      {/* ── Issue detail modal ── */}
      {modal?.type === 'issue' && (() => {
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
      })()}
    </div>
  );
};

export default ComicBooks;
