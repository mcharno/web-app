import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import { romsAPI } from '../services/api';
import './RomLibrary.css';

const PLACEHOLDER_BOX_ART = '/images/roms/placeholder.svg';

const RomLibrary = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [consoles, setConsoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsole, setSelectedConsole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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

  const availableTags = useMemo(() => {
    const tagSet = new Set();
    filteredGames.forEach(game => {
      (game.tags || []).forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [filteredGames]);

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const openGame = (game) => {
    setSelectedGame(game);
  };

  const closeModal = () => {
    setSelectedGame(null);
    setLightboxOpen(false);
  };

  const openScreenshots = (index = 0) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const screenshotSlides = selectedGame?.screenshots
    ? selectedGame.screenshots.map(url => ({ src: url }))
    : [];

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
          <p className="rom-count">{filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''}</p>
          <div className="rom-grid">
            {filteredGames.map(game => (
              <div key={game.id} className="rom-card" onClick={() => openGame(game)}>
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
                  {game.tags?.length > 0 && (
                    <div className="rom-card-tags">
                      {game.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="rom-tag">{tag}</span>
                      ))}
                      {game.tags.length > 3 && (
                        <span className="rom-tag rom-tag-more">+{game.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedGame && (
        <div className="rom-modal-overlay" onClick={closeModal}>
          <div className="rom-modal" onClick={e => e.stopPropagation()}>
            <button className="rom-modal-close" onClick={closeModal}>×</button>

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

                {selectedGame.tags?.length > 0 && (
                  <div className="rom-modal-tags">
                    {selectedGame.tags.map(tag => (
                      <span key={tag} className="rom-tag">{tag}</span>
                    ))}
                  </div>
                )}

                {selectedGame.screenshots?.length > 0 && (
                  <div className="rom-modal-screenshots">
                    <h4>Screenshots</h4>
                    <div className="screenshot-thumbs">
                      {selectedGame.screenshots.map((url, i) => (
                        <div
                          key={i}
                          className="screenshot-thumb"
                          onClick={() => openScreenshots(i)}
                        >
                          <img src={url} alt={`Screenshot ${i + 1}`} loading="lazy" />
                        </div>
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

      {lightboxOpen && screenshotSlides.length > 0 && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={screenshotSlides}
          index={lightboxIndex}
          plugins={[Zoom, Thumbnails]}
          zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true }}
          thumbnails={{
            position: 'bottom',
            width: 120,
            height: 80,
            border: 1,
            borderRadius: 0,
            padding: 0,
            gap: 16,
          }}
          animation={{ fade: 250 }}
          controller={{ closeOnBackdropClick: true }}
        />
      )}
    </div>
  );
};

export default RomLibrary;
