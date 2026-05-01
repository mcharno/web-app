import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { comicsAPI } from '../services/api';
import './ComicBooks.css';

const PLACEHOLDER_COVER = null;

const ComicBooks = () => {
  const navigate = useNavigate();

  const [allComics, setAllComics] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPublisher, setSelectedPublisher] = useState('all');
  const [selectedComic, setSelectedComic] = useState(null);

  const searchRef = useRef(null);

  useEffect(() => {
    Promise.all([
      comicsAPI.getAll(),
      comicsAPI.getPublishers(),
    ])
      .then(([comicsRes, pubRes]) => {
        setAllComics(Array.isArray(comicsRes.data.comics) ? comicsRes.data.comics : []);
        setPublishers(Array.isArray(pubRes.data.publishers) ? pubRes.data.publishers : []);
      })
      .catch(err => console.error('Error loading comics:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Close modal on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') setSelectedComic(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredComics = allComics.filter(comic => {
    if (selectedPublisher !== 'all' && comic.publisher !== selectedPublisher) return false;
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      if (!comic.title.toLowerCase().includes(term) && !comic.publisher.toLowerCase().includes(term)) return false;
    }
    return true;
  });

  if (loading) {
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
          {allComics.length > 0 && ` ${allComics.length} series in the archive.`}
        </p>
      </div>

      {/* Publisher filter tabs */}
      <div className="comics-tabs">
        <button
          className={`comics-tab ${selectedPublisher === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedPublisher('all')}
        >
          All
        </button>
        {publishers.map(pub => (
          <button
            key={pub}
            className={`comics-tab ${selectedPublisher === pub ? 'active' : ''}`}
            onClick={() => setSelectedPublisher(pub)}
          >
            {pub}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="comics-search-wrap" ref={searchRef}>
        <div className="comics-search">
          <input
            type="text"
            placeholder="Search by title or publisher..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="comics-search-input"
          />
          {searchTerm && (
            <button className="comics-search-clear" onClick={() => setSearchTerm('')}>×</button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="comics-count">
        {filteredComics.length === allComics.length
          ? `${allComics.length} series`
          : `${filteredComics.length} of ${allComics.length} series`}
      </p>

      {/* Table */}
      {filteredComics.length === 0 ? (
        <div className="comics-empty">No comics match your search.</div>
      ) : (
        <div className="comics-table-wrap">
          <table className="comics-table">
            <thead>
              <tr>
                <th className="col-thumb"></th>
                <th className="col-title">Title</th>
                <th className="col-publisher">Publisher</th>
                <th className="col-issues">Issues</th>
              </tr>
            </thead>
            <tbody>
              {filteredComics.map(comic => (
                <tr
                  key={comic.id}
                  className="comics-row"
                  onClick={() => setSelectedComic(comic)}
                >
                  <td className="col-thumb">
                    <div className="comic-thumb-placeholder">
                      {comic.cover_image
                        ? <img src={comic.cover_image} alt={comic.title} />
                        : <span className="thumb-icon">📚</span>
                      }
                    </div>
                  </td>
                  <td className="col-title">
                    <span className="comic-title">{comic.title}</span>
                    {comic.volume && (
                      <span className="comic-volume"> Vol. {comic.volume}</span>
                    )}
                  </td>
                  <td className="col-publisher">
                    <span className="publisher-tag">{comic.publisher || '—'}</span>
                  </td>
                  <td className="col-issues">
                    {comic.issues.length > 0
                      ? <span className="issues-count">{comic.issues.length} issue{comic.issues.length !== 1 ? 's' : ''}</span>
                      : <span className="issues-none">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {selectedComic && (
        <div className="comics-modal-overlay" onClick={() => setSelectedComic(null)}>
          <div className="comics-modal" onClick={e => e.stopPropagation()}>
            <button className="comics-modal-close" onClick={() => setSelectedComic(null)}>×</button>

            <div className="comics-modal-header">
              <h2 className="comics-modal-title">{selectedComic.title}</h2>
              {selectedComic.volume && (
                <span className="comics-modal-volume">Volume {selectedComic.volume}</span>
              )}
              {selectedComic.publisher && (
                <span className="comics-modal-publisher">{selectedComic.publisher}</span>
              )}
            </div>

            <div className="comics-modal-body">
              {selectedComic.issues.length > 0 ? (
                <>
                  <p className="comics-modal-issue-label">
                    {selectedComic.issues.length} issue{selectedComic.issues.length !== 1 ? 's' : ''} in collection
                  </p>
                  <div className="comics-modal-covers">
                    {selectedComic.issues.map(issue => (
                      <div key={issue} className="comic-cover-slot">
                        <div className="comic-cover-placeholder">
                          <span className="cover-issue-num">#{issue}</span>
                        </div>
                        <span className="cover-label">#{issue}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="comics-modal-no-issues">No specific issues recorded.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComicBooks;
