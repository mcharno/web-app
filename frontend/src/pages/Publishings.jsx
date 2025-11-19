import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { papersAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import './Publishings.css';

const Publishings = () => {
  const { t } = useTranslation();
  const [publishings, setPublishings] = useState([]);
  const [filteredPublishings, setFilteredPublishings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const fetchPublishings = async () => {
      try {
        // Fetch papers from API
        const papersResponse = await papersAPI.getAll(language);
        const papersData = papersResponse.data.map(paper => ({
          ...paper,
          type: 'paper',
          date: paper.year
        }));

        // Mock presentations data
        const presentationsData = [
          {
            id: 'pres-1',
            title: 'Modern Web Architecture with React and Node.js',
            conference: 'Web Dev Conference 2024',
            year: 2024,
            abstract: 'An overview of modern web architecture patterns using React for frontend and Node.js for backend.',
            slides_url: '#',
            type: 'talk',
            date: 2024
          },
          {
            id: 'pres-2',
            title: 'Database Optimization Strategies',
            conference: 'Tech Summit 2023',
            year: 2023,
            abstract: 'Best practices for optimizing PostgreSQL databases in production environments.',
            slides_url: '#',
            type: 'talk',
            date: 2023
          },
        ];

        // Combine both arrays
        const combined = [...papersData, ...presentationsData];
        setPublishings(combined);
        setFilteredPublishings(combined);
      } catch (error) {
        console.error('Error fetching publishings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublishings();
  }, [language]);

  useEffect(() => {
    let filtered = [...publishings];

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    // Apply sort
    filtered.sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.date - a.date;
      } else {
        return a.date - b.date;
      }
    });

    setFilteredPublishings(filtered);
  }, [publishings, typeFilter, sortOrder]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="publishings-page">
      <h2>publishings</h2>
      <h3 className="subtitle">papers, publications and talks</h3>

      <div className="controls">
        <div className="filter-control">
          <label htmlFor="type-filter">Filter by type:</label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="paper">Papers</option>
            <option value="publication">Publications</option>
            <option value="talk">Talks</option>
          </select>
        </div>

        <div className="sort-control">
          <label htmlFor="sort-order">Sort by date:</label>
          <select
            id="sort-order"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      <div className="publishings-list">
        {filteredPublishings.map((item) => (
          <a
            key={item.id}
            href={item.pdf_url || item.slides_url}
            target="_blank"
            rel="noopener noreferrer"
            className="publishing-card"
          >
            <div className="type-badge">{item.type}</div>
            <h3>{item.title}</h3>
            <div className="publishing-meta">
              <span className="meta-info">
                {item.authors || item.conference}
              </span>
              <span className="year">{item.year}</span>
            </div>
            <p className="abstract">{item.abstract}</p>
            {item.keywords && (
              <div className="keywords">
                <strong>Keywords:</strong> {item.keywords}
              </div>
            )}
            <div className="link-indicator">
              {item.type === 'talk' ? 'View Slides →' : 'View PDF →'}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default Publishings;
