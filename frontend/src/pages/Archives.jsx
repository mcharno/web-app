import { Link } from 'react-router-dom';
import './Archives.css';

const Archives = () => {
  const archiveSections = [
    {
      id: 'tin-pot-league',
      title: 'The Tin Pot 20/20 League',
      subtitle: 'University of York Inter-Departmental Cricket',
      description: 'Evening cricket for university staff and postgraduates (1997-2012)',
      link: '/cricket',
      icon: '/cricket/ball_small.gif',
      details: 'Browse through fifteen seasons of fixtures, results, league tables, and match reports from the beloved University of York Inter-Departmental Cricket League.'
    },
    {
      id: 'berbatis',
      title: 'Berbatis',
      subtitle: 'A Collection of Memories',
      description: 'Stories and photographs from Berbati',
      link: '#',
      icon: null,
      details: 'Coming soon: A tribute to the village of Berbati in Greece, with historical photographs and personal recollections.',
      comingSoon: true
    },
    {
      id: 'web-1-0',
      title: 'Web 1.0',
      subtitle: 'The Early Days of the Internet',
      description: 'A nostalgic look at the web before social media',
      link: '#',
      icon: null,
      details: 'Coming soon: Preserved pages and memories from the early internet era, when websites were simpler and personal homepages ruled.',
      comingSoon: true
    },
    {
      id: 'fw-trumper',
      title: 'F.W. Trumper',
      subtitle: 'The Beau Ideal of Batsmen',
      description: 'A tribute to cricket\'s golden age',
      link: '#',
      icon: null,
      details: 'Coming soon: A dedicated page celebrating Victor Trumper, one of cricket\'s greatest and most stylish batsmen.',
      comingSoon: true
    }
  ];

  return (
    <div className="archives-page">
      <div className="archives-header">
        <h1>Archives</h1>
        <p className="archives-intro">
          A collection of historical projects, memories, and digital artifacts from various periods.
          Some sections are works in progress and will be expanded over time.
        </p>
      </div>

      <div className="archives-grid">
        {archiveSections.map((section) => (
          <div key={section.id} className="archive-card">
            {section.comingSoon && (
              <div className="coming-soon-badge">Coming Soon</div>
            )}
            <div className="archive-card-header">
              {section.icon && (
                <img src={section.icon} alt={section.title} className="archive-icon" />
              )}
              <div className="archive-titles">
                <h2>{section.title}</h2>
                <h3>{section.subtitle}</h3>
                <p className="archive-description">{section.description}</p>
              </div>
            </div>
            <div className="archive-content">
              <p className="archive-details">{section.details}</p>
              {!section.comingSoon && (
                <Link to={section.link} className="archive-link">
                  Explore {section.title}
                  <span className="arrow">→</span>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Archives;
