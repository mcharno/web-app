import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { romsAPI } from '../services/api';
import './RomLibrary.css';

const PLACEHOLDER_BOX_ART = '/images/roms/placeholder.svg';
const GAMES_PER_PAGE = 60;

const RomLibrary = () => {
  const navigate = useNavigate();

  // Paginated game list (current page only)
  const [games, setGames] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [archiveTotal, setArchiveTotal] = useState(0);

  // Metadata loaded once on mount
  const [consoles, setConsoles] = useState([]);
  const [allTags, setAllTags] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [selectedConsole, setSelectedConsole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDropdown, setShowDropdown] = useState(false);

  // Modal
  const [selectedGame, setSelectedGame] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const searchContainerRef = useRef(null);
  const archiveTotalSet = useRef(false);

  // Fetch consoles + all tags once on mount
  useEffect(() => {
    Promise.all([romsAPI.getConsoles(), romsAPI.getTags()])
      .then(([consolesRes, tagsRes]) => {
        setConsoles(Array.isArray(consolesRes.data) ? consolesRes.data : []);
        setAllTags(Array.isArray(tagsRes.data) ? tagsRes.data : []);
      })
      .catch(err => console.error('Error fetching ROM metadata:', err));
  }, []);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedConsole, debouncedSearch, selectedTags]);

  // Fetch games whenever page or filters change
  useEffect(() => {
    let cancelled = false;

    const fetchGames = async () => {
      setLoading(true);
      try {
        const params = { page: currentPage, limit: GAMES_PER_PAGE };
        if (selectedConsole !== 'all') params.console = selectedConsole;
        if (debouncedSearch) params.search = debouncedSearch;
        if (selectedTags.length > 0) params.tags = selectedTags;

        const res = await romsAPI.getAll(params);
        if (cancelled) return;

        setGames(Array.isArray(res.data.games) ? res.data.games : []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 1);

        // Save unfiltered total for the header ("N games in the archive")
        if (!archiveTotalSet.current && selectedConsole === 'all' && !debouncedSearch && selectedTags.length === 0) {
          setArchiveTotal(res.data.total);
          archiveTotalSet.current = true;
        }
      } catch (error) {
        if (!cancelled) console.error('Error fetching ROM games:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchGames();
    return () => { cancelled = true; };
  }, [selectedConsole, debouncedSearch, selectedTags, currentPage]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tag suggestions: filter allTags client-side (instant, no round-trip needed)
  const tagSuggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    if (!Array.isArray(allTags)) return [];
    const lower = searchTerm.toLowerCase();
    return allTags.filter(tag =>
      typeof tag === 'string' && tag.toLowerCase().includes(lower) && !selectedTags.includes(tag)
    );
  }, [searchTerm, allTags, selectedTags]);

  const selectTag = (tag) => {
    setSelectedTags(prev => [...prev, tag]);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const removeTag = (tag) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const changePage = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open modal immediately with card data, then fetch full details
  const openModal = async (cardGame) => {
    setSelectedGame(cardGame);
    setModalLoading(true);
    try {
      const res = await romsAPI.getById(cardGame.id);
      setSelectedGame(res.data);
    } catch (err) {
      console.error('Error fetching game details:', err);
    } finally {
      setModalLoading(false);
    }
  };

  // Full-page spinner only on initial load (no games yet)
  if (loading && games.length === 0) {
    return (
      <div className="rom-library-page">
        <div className="loading-state">Loading ROM library...</div>
      </div>
    );
  }

  const hasActiveFilters = selectedConsole !== 'all' || debouncedSearch || selectedTags.length > 0;

  return (
    <div className="rom-library-page">
      <button className="back-to-archives" onClick={() => navigate('/archives')}>
        ← Back to Archives
      </button>

      <div className="rom-library-header">
        <h2>ROM Library</h2>
        <p className="rom-library-intro">
          Retro game collection spanning {consoles.length} console{consoles.length !== 1 ? 's' : ''}.
          {archiveTotal > 0 && ` ${archiveTotal} game${archiveTotal !== 1 ? 's' : ''} in the archive.`}
        </p>
      </div>

      <div className="rom-library-controls">
        <div className="console-tabs">
          <button
            className={`console-tab ${selectedConsole === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedConsole('all')}
          >
            All
          </button>
          {consoles.map(c => (
            <button
              key={c}
              className={`console-tab ${selectedConsole === c ? 'active' : ''}`}
              onClick={() => setSelectedConsole(c)}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Search + tag autocomplete */}
      <div className="rom-search-container" ref={searchContainerRef}>
        <div className="rom-search">
          <input
            type="text"
            placeholder="Search games or filter by tag..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={e => {
              if (e.key === 'Escape') setShowDropdown(false);
            }}
            className="rom-search-input"
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => { setSearchTerm(''); setShowDropdown(false); }}>×</button>
          )}
        </div>

        {showDropdown && tagSuggestions.length > 0 && (
          <div className="search-dropdown">
            {tagSuggestions.map(tag => (
              <button
                key={tag}
                className="search-dropdown-item"
                onMouseDown={e => e.preventDefault()}
                onClick={() => selectTag(tag)}
              >
                <span className="dropdown-tag-badge">TAG</span>
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active tag chips */}
      {selectedTags.length > 0 && (
        <div className="active-tag-filters">
          {selectedTags.map(tag => (
            <span key={tag} className="active-tag-chip">
              {tag}
              <button className="active-tag-remove" onClick={() => removeTag(tag)}>×</button>
            </span>
          ))}
          {selectedTags.length > 1 && (
            <button className="tag-filter-clear" onClick={() => setSelectedTags([])}>
              Clear all
            </button>
          )}
        </div>
      )}

      {!loading && games.length === 0 ? (
        <div className="rom-empty">
          {!hasActiveFilters
            ? 'No games found. Run a scan to discover ROMs from the share.'
            : 'No games match your current filters.'}
        </div>
      ) : (
        <>
          <div className="rom-count-bar">
            <p className="rom-count">
              {loading
                ? 'Loading...'
                : `${total} game${total !== 1 ? 's' : ''}${hasActiveFilters ? ' matching' : ''}${pages > 1 ? ` — page ${currentPage} of ${pages}` : ''}`
              }
            </p>
            {pages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  ← Prev
                </button>
                <span className="page-indicator">{currentPage} / {pages}</span>
                <button
                  className="page-btn"
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === pages || loading}
                >
                  Next →
                </button>
              </div>
            )}
          </div>

          <div className={`rom-grid${loading ? ' rom-grid--loading' : ''}`} data-console={selectedConsole}>
            {games.map(game => {
              const visibleTags = (game.tags || []).filter(t => t.toLowerCase() !== 'adults');
              return (
                <div key={game.id} className="rom-card" data-console={game.console} onClick={() => openModal(game)}>
                  <div className="rom-card-art">
                    <img
                      src={game.box_art_url || PLACEHOLDER_BOX_ART}
                      alt={game.title || game.filename}
                      loading="lazy"
                      onError={e => { e.target.src = PLACEHOLDER_BOX_ART; }}
                    />
                  </div>
                  <div className="rom-card-info">
                    <span className="rom-console-badge">{game.console.toUpperCase()}</span>
                    <h3 className="rom-card-title">{game.title || game.filename}</h3>
                    {game.year && <p className="rom-card-year">{game.year}</p>}
                    {visibleTags.length > 0 && (
                      <div className="rom-card-tags">
                        {visibleTags.slice(0, 3).map(tag => (
                          <span key={tag} className="rom-tag">{tag}</span>
                        ))}
                        {visibleTags.length > 3 && (
                          <span className="rom-tag rom-tag-more">+{visibleTags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {pages > 1 && (
            <div className="pagination pagination-bottom">
              <button
                className="page-btn"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                ← Prev
              </button>
              <span className="page-indicator">{currentPage} / {pages}</span>
              <button
                className="page-btn"
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === pages || loading}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {selectedGame && (
        <div className="rom-modal-overlay" onClick={() => setSelectedGame(null)}>
          <div className="rom-modal" onClick={e => e.stopPropagation()}>
            <button className="rom-modal-close" onClick={() => setSelectedGame(null)}>×</button>

            <div className="rom-modal-content">
              <div className="rom-modal-art">
                <img
                  src={selectedGame.box_art_url || PLACEHOLDER_BOX_ART}
                  alt={selectedGame.title || selectedGame.filename}
                  onError={e => { e.target.src = PLACEHOLDER_BOX_ART; }}
                />
              </div>

              <div className="rom-modal-details">
                <div className="rom-modal-meta">
                  <span className="rom-console-badge rom-console-badge-large">
                    {selectedGame.console.toUpperCase()}
                  </span>
                  {selectedGame.year && (
                    <span className="rom-modal-year">{selectedGame.year}</span>
                  )}
                </div>

                <h2 className="rom-modal-title">
                  {selectedGame.title || selectedGame.filename}
                </h2>

                {modalLoading ? (
                  <p className="rom-modal-loading">Loading details...</p>
                ) : (
                  <>
                    {selectedGame.description && (
                      <p className="rom-modal-description">{selectedGame.description}</p>
                    )}

                    {(selectedGame.tags || []).filter(t => t.toLowerCase() !== 'adults').length > 0 && (
                      <div className="rom-modal-tags">
                        {selectedGame.tags.filter(t => t.toLowerCase() !== 'adults').map(tag => (
                          <span key={tag} className="rom-tag">{tag}</span>
                        ))}
                      </div>
                    )}

                    {!(selectedGame.tags || []).some(t => t.toLowerCase() === 'adults') && (selectedGame.screenshots || []).length > 0 && (
                      <div className="rom-modal-screenshots">
                        <h4>Screenshots</h4>
                        <div className="screenshot-grid">
                          {selectedGame.screenshots.map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt={`Screenshot ${i + 1}`}
                              loading="lazy"
                              className="screenshot-full"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <p className="rom-modal-filename">{selectedGame.filename}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RomLibrary;
