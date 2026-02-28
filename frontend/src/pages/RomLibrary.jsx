import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { romsAPI } from '../services/api';
import './RomLibrary.css';

const PLACEHOLDER_BOX_ART = '/images/roms/placeholder.svg';
const GAMES_PER_PAGE = 60;

const isAdultGame = (game) => game.tags?.includes('adults');

const RomLibrary = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [consoles, setConsoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsole, setSelectedConsole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gamesRes, consolesRes] = await Promise.all([
          romsAPI.getAll(),
          romsAPI.getConsoles(),
        ]);
        setGames(gamesRes.data);
        setConsoles(consolesRes.data);
      } catch (error) {
        console.error('Error fetching ROM library:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredGames = useMemo(() => {
    return games.filter(game => {
      if (selectedConsole !== 'all' && game.console !== selectedConsole) return false;
      if (searchTerm && !game.title?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (selectedTags.length > 0) {
        const gameTags = game.tags || [];
        if (!selectedTags.every(t => gameTags.includes(t))) return false;
      }
      return true;
    });
  }, [games, selectedConsole, searchTerm, selectedTags]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedConsole, searchTerm, selectedTags]);

  const totalPages = Math.ceil(filteredGames.length / GAMES_PER_PAGE);

  const paginatedGames = useMemo(() => {
    const start = (currentPage - 1) * GAMES_PER_PAGE;
    return filteredGames.slice(start, start + GAMES_PER_PAGE);
  }, [filteredGames, currentPage]);

  // Exclude 'adults' from the visible tag filter UI
  const availableTags = useMemo(() => {
    const tagSet = new Set();
    filteredGames.forEach(game => {
      (game.tags || []).forEach(tag => {
        if (tag !== 'adults') tagSet.add(tag);
      });
    });
    return Array.from(tagSet).sort();
  }, [filteredGames]);

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const changePage = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="rom-library-page">
        <div className="loading-state">Loading ROM library...</div>
      </div>
    );
  }

  return (
    <div className="rom-library-page">
      <button className="back-to-archives" onClick={() => navigate('/archives')}>
        ← Back to Archives
      </button>

      <div className="rom-library-header">
        <h2>ROM Library</h2>
        <p className="rom-library-intro">
          Retro game collection spanning {consoles.length} console{consoles.length !== 1 ? 's' : ''}.
          {games.length > 0 && ` ${games.length} game${games.length !== 1 ? 's' : ''} in the archive.`}
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

      <div className="rom-search">
        <input
          type="text"
          placeholder="Search games..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="rom-search-input"
        />
        {searchTerm && (
          <button className="search-clear" onClick={() => setSearchTerm('')}>×</button>
        )}
      </div>

      {availableTags.length > 0 && (
        <div className="tag-filters">
          {availableTags.map(tag => (
            <button
              key={tag}
              className={`tag-filter ${selectedTags.includes(tag) ? 'active' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button className="tag-filter-clear" onClick={() => setSelectedTags([])}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {filteredGames.length === 0 ? (
        <div className="rom-empty">
          {games.length === 0
            ? 'No games found. Run a scan to discover ROMs from the share.'
            : 'No games match your current filters.'}
        </div>
      ) : (
        <>
          <div className="rom-count-bar">
            <p className="rom-count">
              {filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''}
              {totalPages > 1 && ` — page ${currentPage} of ${totalPages}`}
            </p>
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ← Prev
                </button>
                <span className="page-indicator">{currentPage} / {totalPages}</span>
                <button
                  className="page-btn"
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </div>

          <div className="rom-grid">
            {paginatedGames.map(game => {
              const visibleTags = (game.tags || []).filter(t => t !== 'adults');
              return (
                <div key={game.id} className="rom-card" onClick={() => setSelectedGame(game)}>
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

          {totalPages > 1 && (
            <div className="pagination pagination-bottom">
              <button
                className="page-btn"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Prev
              </button>
              <span className="page-indicator">{currentPage} / {totalPages}</span>
              <button
                className="page-btn"
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
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

                {selectedGame.description && (
                  <p className="rom-modal-description">{selectedGame.description}</p>
                )}

                {(selectedGame.tags || []).filter(t => t !== 'adults').length > 0 && (
                  <div className="rom-modal-tags">
                    {selectedGame.tags.filter(t => t !== 'adults').map(tag => (
                      <span key={tag} className="rom-tag">{tag}</span>
                    ))}
                  </div>
                )}

                {!isAdultGame(selectedGame) && selectedGame.screenshots?.length > 0 && (
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
