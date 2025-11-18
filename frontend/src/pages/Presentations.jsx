import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import './Presentations.css';

const Presentations = () => {
  const { t } = useTranslation();
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

  useEffect(() => {
    // TODO: Add presentations API call when backend is ready
    // For now, using mock data
    const mockPresentations = [
      {
        id: 1,
        title: 'Modern Web Architecture with React and Node.js',
        conference: 'Web Dev Conference 2024',
        year: 2024,
        abstract: 'An overview of modern web architecture patterns using React for frontend and Node.js for backend.',
        slides_url: '#',
      },
      {
        id: 2,
        title: 'Database Optimization Strategies',
        conference: 'Tech Summit 2023',
        year: 2023,
        abstract: 'Best practices for optimizing PostgreSQL databases in production environments.',
        slides_url: '#',
      },
    ];

    setPresentations(mockPresentations);
    setLoading(false);
  }, [language]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="presentations-page">
      <h2>Presentations & Talks</h2>
      <p className="presentations-intro">{t('presentations.main') || 'Conference presentations and invited talks'}</p>

      <div className="presentations-list">
        {presentations.map((presentation) => (
          <a
            key={presentation.id}
            href={presentation.slides_url}
            target="_blank"
            rel="noopener noreferrer"
            className="presentation-card"
          >
            <h3>{presentation.title}</h3>
            <div className="presentation-meta">
              <span className="conference">{presentation.conference}</span>
              <span className="year">{presentation.year}</span>
            </div>
            <p className="abstract">{presentation.abstract}</p>
            <div className="slides-link-indicator">
              View Slides →
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default Presentations;
