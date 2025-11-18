import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { papersAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import './Papers.css';

const Papers = () => {
  const { t } = useTranslation();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const response = await papersAPI.getAll(language);
        setPapers(response.data);
      } catch (error) {
        console.error('Error fetching papers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, [language]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="papers-page">
      <h2>Papers & Publications</h2>
      <p className="papers-intro">{t('papers.main')}</p>

      <div className="papers-list">
        {papers.map((paper) => (
          <a
            key={paper.id}
            href={paper.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="paper-card"
          >
            <h3>{paper.title}</h3>
            <div className="paper-meta">
              <span className="authors">{paper.authors}</span>
              <span className="year">{paper.year}</span>
            </div>
            <p className="abstract">{paper.abstract}</p>
            {paper.keywords && (
              <div className="keywords">
                <strong>Keywords:</strong> {paper.keywords}
              </div>
            )}
            <div className="pdf-link-indicator">
              View PDF →
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default Papers;
