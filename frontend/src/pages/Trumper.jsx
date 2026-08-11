import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trumperLetters } from '../data/trumperLetters';
import { Headpiece, Colophon } from '../components/TrumperOrnaments';
import './Trumper.css';

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Wrap search matches in <mark>, returning React nodes
const highlight = (text, term) => {
  if (!term) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(term)})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === term.toLowerCase() ? <mark key={i}>{part}</mark> : part
  );
};

const countMatches = (letter, term) => {
  if (!term) return 0;
  const regex = new RegExp(escapeRegExp(term), 'gi');
  const haystack = [letter.title, letter.subtitle, letter.summary, ...letter.paragraphs].join('\n');
  return (haystack.match(regex) || []).length;
};

const Trumper = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());

  const term = searchTerm.trim();
  const searching = term.length >= 2;

  const results = trumperLetters
    .map(letter => ({ letter, matches: countMatches(letter, searching ? term : '') }))
    .filter(({ matches }) => !searching || matches > 0);

  const toggleExpanded = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="trumper-page">
      <button className="back-to-archives" onClick={() => navigate('/archives')}>
        ← Back to Archives
      </button>

      <div className="trumper-header">
        <h1>F.W. Trumper</h1>
        <h2>The Beau Ideal of Batsmen</h2>
        <p className="trumper-description">
          Match reports from the pen of F.W. Trumper, venerable chronicler of Alcohology CC
          in the University of York Tin Pot 20/20 League. Between bouts of hallucinatory
          malaise, incarceration in Madame Tussauds, and other regrettable mishaps, the old
          scribe faithfully recorded the team&apos;s Corinthian exploits.
        </p>
      </div>

      <div className="trumper-search">
        <input
          type="text"
          placeholder="Search the letters — players, opponents, incidents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search Trumper letters"
        />
        {searching && (
          <p className="search-status">
            {results.length === 0
              ? 'No letters match your search.'
              : `${results.length} letter${results.length === 1 ? '' : 's'} matching "${term}"`}
          </p>
        )}
      </div>

      <div className="trumper-letters">
        {results.map(({ letter, matches }) => {
          const expanded = searching || expandedIds.has(letter.id);
          // First substantive paragraph gets the illuminated initial;
          // skips short salutations like "Chaps," so they keep normal size.
          const dropCapIndex = letter.paragraphs.findIndex(p => p.length >= 80);
          return (
            <article key={letter.id} className="trumper-letter">
              <header
                className="letter-header"
                onClick={() => !searching && toggleExpanded(letter.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (!searching && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    toggleExpanded(letter.id);
                  }
                }}
              >
                <div className="letter-titles">
                  <h3>{highlight(letter.title, searching ? term : '')}</h3>
                  <p className="letter-subtitle">{highlight(letter.subtitle, searching ? term : '')}</p>
                </div>
                <div className="letter-meta">
                  {searching && <span className="match-count">{matches} match{matches === 1 ? '' : 'es'}</span>}
                  {!searching && (
                    <span className="expand-indicator">{expanded ? '−' : '+'}</span>
                  )}
                </div>
              </header>
              {!expanded && (
                <p className="letter-summary">{letter.summary}</p>
              )}
              {expanded && (
                <div className="letter-body">
                  <Headpiece />
                  {letter.paragraphs.map((para, i) => (
                    <p key={i} className={i === dropCapIndex ? 'illuminated' : undefined}>
                      {highlight(para, searching ? term : '')}
                    </p>
                  ))}
                  <Colophon />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default Trumper;
