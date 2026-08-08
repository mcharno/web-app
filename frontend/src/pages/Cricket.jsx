import { Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Cricket.css';

const Cricket = () => {
  const navigate = useNavigate();
  const seasons = [
    { year: '2011', label: '2011' },
    { year: '2010', label: '2010' },
    { year: '2009', label: '2009' },
    { year: '2008', label: '2008' },
    { year: '2007', label: '2007' },
    { year: '2006', label: '2006' },
    { year: '2005', label: '2005' },
    { year: '2004', label: '2004' },
    { year: '2003', label: '2003' },
    { year: '2002', label: '2002' },
    { year: '2001', label: '2001' },
    { year: '2000', label: '2000' },
    { year: '1999', label: '1999' },
    { year: '1998', label: '1998' },
    { year: '1997', label: '1997' },
  ];

  return (
    <Fragment>
      <div className="cricket-toolbar">
        <button className="back-to-archives" onClick={() => navigate('/archives')}>
          ← Back to Archives
        </button>
      </div>
      <div className="cricket-page">
        <div className="cricket-header">
          <img
            src="/archives/cricket/ball_small.gif"
            alt="Cricket ball"
            className="cricket-ball-left"
          />
          <div className="cricket-title-container">
            <h1 className="cricket-main-title">The Tin Pot 20/20 League</h1>
            <h2 className="cricket-subtitle">
              University of York Inter-Departmental Cricket
            </h2>
            <p className="cricket-description">
              Evening cricket for university staff and postgraduates (1997-2012)
            </p>
          </div>
          <img
            src="/archives/cricket/ball_small.gif"
            alt="Cricket ball"
            className="cricket-ball-right"
          />
        </div>

        <div className="cricket-intro">
          <p>
            Welcome to the archives of the University of York Inter-Departmental Cricket League,
            a beloved institution that ran from 1997 to 2012. This league brought together staff
            and postgraduates from across the university for friendly T20 cricket matches on
            summer evenings.
          </p>
          <p>
            Browse through fifteen seasons of fixtures, results, league tables, and match reports
            below. The league featured memorable teams like the "All Out Chemists", "Heavy Rollers",
            "Bioaccumulators", "Panthers", and many more.
          </p>
        </div>

        <div className="cricket-content-grid">
          <div className="cricket-section">
            <h3>Season Archives</h3>
            <div className="cricket-seasons">
              {seasons.map((season) => (
                <div key={season.year} className="season-links">
                  <h4>{season.label} Season</h4>
                  <ul>
                    <li>
                      <Link to={`/archives/cricket/results${season.year.slice(-2)}.html`}>
                        Fixtures & Results
                      </Link>
                    </li>
                    <li>
                      <Link to={`/archives/cricket/league${season.year.slice(-2)}.html`}>
                        League Table
                      </Link>
                    </li>
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="cricket-section">
            <h3>League Information</h3>
            <ul className="cricket-info-links">
              <li>
                <Link to="/archives/cricket/history.html">
                  League History
                </Link>
              </li>
              <li>
                <Link to="/archives/cricket/leaguehist.html">
                  Champions 1983-2010
                </Link>
              </li>
              <li>
                <Link to="/archives/cricket/records.html">
                  League Records
                </Link>
              </li>
              <li>
                <Link to="/archives/cricket/rules.html">
                  League Rules
                </Link>
              </li>
              <li>
                <Link to="/archives/cricket/ump.html">
                  Notes for Umpires
                </Link>
              </li>
              <li>
                <Link to="/archives/cricket/letters.html">
                  Letters to Organizers
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="cricket-section cricket-links-section">
          <h3>
            <img
              src="/archives/cricket/blueball.gif"
              alt=""
              className="cricket-links-bullet"
            />
            Links
          </h3>
          <ul className="cricket-external-links">
            <li>
              <a href="http://www.ecb.co.uk/ecb/ecb-association-of-cricket-officials/" target="_blank" rel="noopener noreferrer">
                Association of Cricket Umpires Site
              </a>.
            </li>
            <li>
              <a href="http://yorkshireccc.org.uk/" target="_blank" rel="noopener noreferrer">
                Yorkshire County Cricket Club
              </a>.
            </li>
            <li>
              <a href="http://www.bbc.co.uk/radio4/" target="_blank" rel="noopener noreferrer">
                Radio 4
              </a> with link to TMS RealAudio feed.
            </li>
            <li>
              <a href="http://www-uk.cricket.org/" target="_blank" rel="noopener noreferrer">
                CricInfo UK Web Site
              </a> - news, reviews, live match coverage.
            </li>
            <li>
              <a href="http://www.lords.org/" target="_blank" rel="noopener noreferrer">
                Official Lords cricket ground Site
              </a>.
            </li>
            <li>
              <a href="http://directory.google.com/Top/Sports/Cricket/" target="_blank" rel="noopener noreferrer">
                Google cricket directory
              </a>.
            </li>
            <li>
              <a href="http://dir.yahoo.com/Recreation/Sports/Cricket/" target="_blank" rel="noopener noreferrer">
                Yahoo! Rec:Sports:Cricket
              </a> links directory.
            </li>
            <li>
              <a href="http://news.bbc.co.uk/sportacademy/bsp/hi/cricket/rules/umpires_signals/html/default.stm" target="_blank" rel="noopener noreferrer">
                A wonderful guide to umpiring and signals
              </a>.
            </li>
          </ul>
          <p className="cricket-links-note">
            Links preserved from the original site (circa 2011) — some destinations may
            have moved on, much like the league itself.
          </p>
        </div>

        <div className="cricket-footer">
          <p className="disclaimer">
            All statistics and scores believed true, but some errors may have occurred.
            This is an archive of historical data from 1997-2012.
          </p>
        </div>
      </div>
    </Fragment>
  );
};

export default Cricket;
