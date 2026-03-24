import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { berbatisAPI } from '../services/api';
import './BerbatisArchive.css';

const PLACEHOLDER_POSTER = '/images/berbatis-placeholder.svg';

const BerbatisArchive = () => {
  const navigate = useNavigate();

  const [allShows, setAllShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedDecade, setSelectedDecade] = useState('all');
  const [selectedShow, setSelectedShow] = useState(null);

  const searchRef = useRef(null);

  // Load all shows on mount
  useEffect(() => {
    berbatisAPI.getAll()
      .then(res => {
        setAllShows(Array.isArray(res.data.shows) ? res.data.shows : []);
      })
      .catch(err => console.error('Error loading Berbatis shows:', err))
      .finally(() => setLoading(false));
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Derive available decades from show data
  const decades = (() => {
    const years = allShows
      .map(s => s.date_year)
      .filter(Boolean);
    const decadeSet = new Set(years.map(y => Math.floor(y / 10) * 10));
    return Array.from(decadeSet).sort((a, b) => a - b);
  })();

  // Filter shows client-side
  const filteredShows = allShows.filter(show => {
    if (selectedDecade !== 'all') {
      if (!show.date_year) return false;
      if (Math.floor(show.date_year / 10) * 10 !== Number(selectedDecade)) return false;
    }
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      const inHeadliner = show.headliner?.toLowerCase().includes(term);
      const inSupport = (show.support_acts || []).some(act =>
        act.toLowerCase().includes(term)
      );
      const inDate = show.date_display?.toLowerCase().includes(term);
      const inKeywords = (show.keywords || []).some(kw =>
        kw.toLowerCase().includes(term)
      );
      if (!inHeadliner && !inSupport && !inDate && !inKeywords) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="berbatis-page">
        <div className="loading-state">Loading Berbatis archive...</div>
      </div>
    );
  }

  const hasFilters = selectedDecade !== 'all' || debouncedSearch;

  return (
    <div className="berbatis-page">
      <button className="back-to-archives" onClick={() => navigate('/archives')}>
        ← Back to Archives
      </button>

      <div className="berbatis-header">
        <h2>Berbatis</h2>
        <p className="berbatis-intro">
          Show poster archive from Berbatis Pass.
          {allShows.length > 0 && ` ${allShows.length} show${allShows.length !== 1 ? 's' : ''} in the archive.`}
        </p>
      </div>

      {/* Decade filter tabs */}
      {decades.length > 0 && (
        <div className="berbatis-tabs">
          <button
            className={`berbatis-tab ${selectedDecade === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedDecade('all')}
          >
            All
          </button>
          {decades.map(d => (
            <button
              key={d}
              className={`berbatis-tab ${selectedDecade === String(d) ? 'active' : ''}`}
              onClick={() => setSelectedDecade(String(d))}
            >
              {d}s
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="berbatis-search-wrap" ref={searchRef}>
        <div className="berbatis-search">
          <input
            type="text"
            placeholder="Search by headliner, support act or date..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="berbatis-search-input"
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm('')}>×</button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="berbatis-count">
        {hasFilters
          ? `${filteredShows.length} show${filteredShows.length !== 1 ? 's' : ''} matching`
          : `${filteredShows.length} show${filteredShows.length !== 1 ? 's' : ''}`}
      </p>

      {filteredShows.length === 0 ? (
        <div className="berbatis-empty">
          {hasFilters
            ? 'No shows match your search.'
            : 'No shows in the archive yet.'}
        </div>
      ) : (
        <div className="berbatis-grid">
          {filteredShows.map(show => (
            <div
              key={show.id}
              className="berbatis-card"
              onClick={() => setSelectedShow(show)}
            >
              <div className="berbatis-card-poster">
                <img
                  src={show.poster_url || PLACEHOLDER_POSTER}
                  alt={show.headliner}
                  loading="lazy"
                  onError={e => { e.target.src = PLACEHOLDER_POSTER; }}
                />
              </div>
              <div className="berbatis-card-info">
                <h3 className="berbatis-card-headliner">{show.headliner}</h3>
                {show.date_display && (
                  <p className="berbatis-card-date">{show.date_display}</p>
                )}
                {(show.support_acts || []).length > 0 && (
                  <p className="berbatis-card-support">
                    {show.support_acts.slice(0, 2).join(' · ')}
                    {show.support_acts.length > 2 && ` +${show.support_acts.length - 2}`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedShow && (
        <div className="berbatis-modal-overlay" onClick={() => setSelectedShow(null)}>
          <div className="berbatis-modal" onClick={e => e.stopPropagation()}>
            <button className="berbatis-modal-close" onClick={() => setSelectedShow(null)}>×</button>
            <div className="berbatis-modal-content">
              <div className="berbatis-modal-poster">
                <img
                  src={selectedShow.poster_url || PLACEHOLDER_POSTER}
                  alt={selectedShow.headliner}
                  onError={e => { e.target.src = PLACEHOLDER_POSTER; }}
                />
              </div>
              <div className="berbatis-modal-details">
                {selectedShow.date_display && (
                  <p className="berbatis-modal-date">{selectedShow.date_display}</p>
                )}
                <h2 className="berbatis-modal-headliner">{selectedShow.headliner}</h2>

                {(selectedShow.support_acts || []).length > 0 && (
                  <div className="berbatis-modal-support">
                    <h4>Support</h4>
                    <ul>
                      {selectedShow.support_acts.map((act, i) => (
                        <li key={i}>{act}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedShow.notes && (
                  <p className="berbatis-modal-notes">{selectedShow.notes}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BerbatisArchive;
