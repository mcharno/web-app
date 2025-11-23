import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LinkedDataToolkit.css';

const LinkedDataToolkit = () => {
  const navigate = useNavigate();
  const [selectedSource, setSelectedSource] = useState('dbpedia');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('organization');
  const [demoResults, setDemoResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Example results for demo purposes
  const exampleResults = {
    dbpedia: {
      organization: {
        'Microsoft': [
          { label: 'Microsoft Corporation', uri: 'http://dbpedia.org/resource/Microsoft', abstract: 'American multinational technology corporation' },
          { label: 'Microsoft Research', uri: 'http://dbpedia.org/resource/Microsoft_Research', abstract: 'Research subsidiary of Microsoft' }
        ],
        'British Museum': [
          { label: 'British Museum', uri: 'http://dbpedia.org/resource/British_Museum', abstract: 'Public museum dedicated to human history, art and culture' },
          { label: 'British Museum Department of...', uri: 'http://dbpedia.org/resource/British_Museum_Department', abstract: 'Various departments of the British Museum' }
        ]
      }
    },
    geonames: {
      location: {
        'London': [
          { label: 'London', uri: 'http://sws.geonames.org/2643743/', country: 'United Kingdom', population: '8,961,989' },
          { label: 'London, Ontario', uri: 'http://sws.geonames.org/6058560/', country: 'Canada', population: '383,822' }
        ],
        'York': [
          { label: 'York', uri: 'http://sws.geonames.org/2633352/', country: 'United Kingdom', population: '198,051' },
          { label: 'York County, Maine', uri: 'http://sws.geonames.org/4975802/', country: 'United States', population: '203,102' }
        ]
      }
    },
    nomisma: {
      denomination: {
        'denarius': [
          { label: 'Denarius', uri: 'http://nomisma.org/id/denarius', definition: 'Ancient Roman silver coin' },
          { label: 'Denarius Aureus', uri: 'http://nomisma.org/id/denarius_aureus', definition: 'Gold denomination worth 25 denarii' }
        ]
      },
      mint: {
        'Rome': [
          { label: 'Rome', uri: 'http://nomisma.org/id/rome', definition: 'Mint located in Rome, capital of the Roman Empire' },
          { label: 'Rome (Ostia)', uri: 'http://nomisma.org/id/rome_ostia', definition: 'Mint at the port of Rome' }
        ]
      }
    },
    heritagedata: {
      monumentType: {
        'castle': [
          { label: 'Castle', uri: 'http://purl.org/heritagedata/schemes/eh_tmt/concepts/70132', scopeNote: 'A fortified residence' },
          { label: 'Castle Bailey', uri: 'http://purl.org/heritagedata/schemes/eh_tmt/concepts/70133', scopeNote: 'An enclosed courtyard of a castle' }
        ],
        'villa': [
          { label: 'Villa', uri: 'http://purl.org/heritagedata/schemes/eh_tmt/concepts/98432', scopeNote: 'A country house or estate' },
          { label: 'Roman Villa', uri: 'http://purl.org/heritagedata/schemes/eh_tmt/concepts/98433', scopeNote: 'Romano-British rural settlement' }
        ]
      }
    },
    getty: {
      material: {
        'bronze': [
          { label: 'bronze (metal)', uri: 'http://vocab.getty.edu/aat/300010957', scopeNote: 'Alloy of copper and tin' },
          { label: 'bronze (color)', uri: 'http://vocab.getty.edu/aat/300311836', scopeNote: 'Moderate to deep yellowish brown' }
        ],
        'marble': [
          { label: 'marble (rock)', uri: 'http://vocab.getty.edu/aat/300011443', scopeNote: 'Metamorphic rock composed of recrystallized carbonate minerals' },
          { label: 'marble (sculpture material)', uri: 'http://vocab.getty.edu/aat/300011288', scopeNote: 'Marble when used for carving' }
        ]
      }
    }
  };

  const handleDemoSearch = () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);

    // Simulate network delay
    setTimeout(() => {
      const results = exampleResults[selectedSource]?.[searchType]?.[searchTerm] || [];
      setDemoResults({
        source: selectedSource,
        type: searchType,
        term: searchTerm,
        results: results.length > 0 ? results : [{ label: 'No example results available', note: 'Try: "Microsoft", "British Museum", "London", "York", "denarius", "Rome", "castle", "villa", "bronze", or "marble"' }]
      });
      setIsSearching(false);
    }, 800);
  };

  const getSourceOptions = () => {
    switch(selectedSource) {
      case 'dbpedia':
        return [{ value: 'organization', label: 'Organizations' }];
      case 'geonames':
        return [{ value: 'location', label: 'Locations' }];
      case 'nomisma':
        return [
          { value: 'denomination', label: 'Denominations' },
          { value: 'mint', label: 'Mints' }
        ];
      case 'heritagedata':
        return [{ value: 'monumentType', label: 'Monument Types' }];
      case 'getty':
        return [{ value: 'material', label: 'Materials' }];
      default:
        return [];
    }
  };

  return (
    <div className="toolkit-page">
      <nav className="breadcrumb">
        <button onClick={() => navigate('/projects')} className="back-button">
          ← Back to Projects
        </button>
      </nav>

      <header className="project-header">
        <h1>Linked Data Toolkit</h1>
        <p className="project-year">2013 - Present</p>
        <p className="subtitle">TypeScript Library and CLI for Querying Linked Open Data Sources</p>
      </header>

      <section className="project-intro">
        <div className="evolution-story">
          <h3>Project Evolution</h3>
          <p>
            Originally created in <strong>2013</strong> as a Java-based toolkit to support cultural heritage data enrichment,
            this project has evolved significantly over the past decade. The toolkit was initially developed to solve a
            practical problem: how to efficiently enrich archaeological and heritage datasets by linking them to authoritative
            vocabularies and linked data sources.
          </p>
          <p>
            In <strong>2024</strong>, the project underwent a complete modernization, rewritten from the ground up in
            <strong> TypeScript</strong> with modern async/await patterns, comprehensive type safety, and improved developer
            experience. This version 2.0 maintains the same powerful functionality while adding new archaeological data sources
            and following FAIR principles for heritage data management.
          </p>
        </div>

        <h2>Overview</h2>
        <p>
          The Linked Data Toolkit provides a unified interface for querying SPARQL endpoints across multiple linked data
          authorities, vocabularies, and heritage data sources. It works both as a library for web applications and as
          a command-line tool for batch processing and data enrichment workflows.
        </p>

        <div className="tech-stack">
          <strong>Technologies:</strong>
          <span>TypeScript</span>
          <span>Node.js 18+</span>
          <span>SPARQL</span>
          <span>Jest</span>
          <span>ESLint</span>
          <span>tsup</span>
        </div>

        <div className="key-features">
          <h3>Key Features</h3>
          <div className="features-grid">
            <div className="feature">
              <h4>Fully Typed</h4>
              <p>Strict TypeScript configuration ensures type safety and excellent IDE support</p>
            </div>
            <div className="feature">
              <h4>Modern Async API</h4>
              <p>Promise-based async/await patterns for clean, readable code</p>
            </div>
            <div className="feature">
              <h4>Error Handling</h4>
              <p>Custom error classes with retry logic and exponential backoff</p>
            </div>
            <div className="feature">
              <h4>Dual Usage</h4>
              <p>Works as both a library and command-line tool</p>
            </div>
            <div className="feature">
              <h4>Configurable</h4>
              <p>Customizable timeouts, retry parameters, and result limits</p>
            </div>
            <div className="feature">
              <h4>Well Tested</h4>
              <p>Comprehensive test suite with Jest for reliability</p>
            </div>
          </div>
        </div>
      </section>

      <section className="data-sources">
        <h2>Supported Data Sources</h2>

        <div className="source-category">
          <h3>General Linked Data</h3>
          <div className="sources-grid">
            <div className="source-card">
              <h4>DBPedia</h4>
              <p>Organizations, entities, and general knowledge from Wikipedia</p>
            </div>
            <div className="source-card">
              <h4>Geonames</h4>
              <p>Geographic locations worldwide with population and coordinate data</p>
            </div>
            <div className="source-card">
              <h4>Library of Congress</h4>
              <p>Subject headings with exact and fuzzy matching</p>
            </div>
            <div className="source-card">
              <h4>Ordnance Survey</h4>
              <p>UK geographic data and administrative boundaries</p>
            </div>
          </div>
        </div>

        <div className="source-category">
          <h3>Archaeological & Heritage Data</h3>
          <div className="sources-grid">
            <div className="source-card">
              <h4>Nomisma</h4>
              <p>Numismatic data including denominations, mints, and coin types</p>
            </div>
            <div className="source-card">
              <h4>Heritage Data UK</h4>
              <p>FISH vocabularies for monument types and archaeological objects</p>
            </div>
            <div className="source-card">
              <h4>Getty AAT</h4>
              <p>Art & Architecture Thesaurus for materials and object types</p>
            </div>
            <div className="source-card">
              <h4>ADS</h4>
              <p>Archaeology Data Service vocabularies and thesauri</p>
            </div>
            <div className="source-card">
              <h4>NFDI4Objects</h4>
              <p>German archaeological knowledge graph</p>
            </div>
            <div className="source-card">
              <h4>PeriodO</h4>
              <p>Scholarly period definitions with temporal coverage</p>
            </div>
          </div>
        </div>
      </section>

      <section className="usage-examples">
        <h2>Usage Examples</h2>

        <div className="example-tabs">
          <div className="example-section">
            <h3>Library Usage</h3>
            <p>Import and use typed clients in your TypeScript/JavaScript applications:</p>

            <div className="code-example">
              <div className="code-header">DBPedia - Organizations</div>
              <pre>{`import { DBPediaClient } from '@charno/linked-data-toolkit';

const dbpedia = new DBPediaClient();
const results = await dbpedia.lookupOrganization('Microsoft', 10);

results.forEach(org => {
  console.log(org.label, org.uri);
});`}</pre>
            </div>

            <div className="code-example">
              <div className="code-header">Geonames - Geographic Locations</div>
              <pre>{`import { GeonamesClient } from '@charno/linked-data-toolkit';

const geonames = new GeonamesClient({
  username: 'your_username'
});

const locations = await geonames.lookupPreciseLocationInCountry(
  'London',
  'GB',
  10
);`}</pre>
            </div>

            <div className="code-example">
              <div className="code-header">Nomisma - Numismatic Data</div>
              <pre>{`import { NomismaClient } from '@charno/linked-data-toolkit';

const nomisma = new NomismaClient();

const denarii = await nomisma.findDenominations('denarius');
const mints = await nomisma.findMints('Rome');`}</pre>
            </div>

            <div className="code-example">
              <div className="code-header">Getty AAT - Materials</div>
              <pre>{`import { GettyAATClient } from '@charno/linked-data-toolkit';

const getty = new GettyAATClient();
const materials = await getty.searchMaterials('bronze');`}</pre>
            </div>
          </div>

          <div className="example-section">
            <h3>CLI Usage</h3>
            <p>Install globally and use from the command line:</p>

            <div className="code-example">
              <div className="code-header">Installation</div>
              <pre>{`npm install -g @charno/linked-data-toolkit`}</pre>
            </div>

            <div className="code-example">
              <div className="code-header">Query DBPedia</div>
              <pre>{`linked-data-toolkit dbpedia organization "Microsoft" --max 5`}</pre>
            </div>

            <div className="code-example">
              <div className="code-header">Search Heritage Data</div>
              <pre>{`linked-data-toolkit heritagedata monument-types "castle" --max 10`}</pre>
            </div>

            <div className="code-example">
              <div className="code-header">Find Geonames Locations</div>
              <pre>{`linked-data-toolkit geonames location "York" \\
  --country GB \\
  --max 5`}</pre>
            </div>
          </div>
        </div>
      </section>

      <section className="interactive-demo">
        <h2>Interactive Demo</h2>
        <p className="demo-intro">
          Try the toolkit functionality with example queries. Select a data source, choose a query type,
          and enter a search term to see sample results.
        </p>

        <div className="demo-interface">
          <div className="demo-controls">
            <div className="control-group">
              <label htmlFor="source-select">Data Source</label>
              <select
                id="source-select"
                value={selectedSource}
                onChange={(e) => {
                  setSelectedSource(e.target.value);
                  setSearchType(getSourceOptions()[0]?.value || '');
                  setDemoResults(null);
                }}
              >
                <option value="dbpedia">DBPedia</option>
                <option value="geonames">Geonames</option>
                <option value="nomisma">Nomisma</option>
                <option value="heritagedata">Heritage Data UK</option>
                <option value="getty">Getty AAT</option>
              </select>
            </div>

            <div className="control-group">
              <label htmlFor="type-select">Query Type</label>
              <select
                id="type-select"
                value={searchType}
                onChange={(e) => {
                  setSearchType(e.target.value);
                  setDemoResults(null);
                }}
              >
                {getSourceOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label htmlFor="search-input">Search Term</label>
              <input
                id="search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleDemoSearch()}
                placeholder="Enter search term..."
              />
            </div>

            <button
              className="demo-search-btn"
              onClick={handleDemoSearch}
              disabled={isSearching || !searchTerm.trim()}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {demoResults && (
            <div className="demo-results">
              <div className="results-header">
                <h4>Results for "{demoResults.term}"</h4>
                <span className="results-meta">
                  {demoResults.source} · {demoResults.type}
                </span>
              </div>
              <div className="results-list">
                {demoResults.results.map((result, idx) => (
                  <div key={idx} className="result-item">
                    <div className="result-label">{result.label}</div>
                    {result.uri && (
                      <div className="result-uri">
                        <code>{result.uri}</code>
                      </div>
                    )}
                    {result.abstract && (
                      <div className="result-detail">{result.abstract}</div>
                    )}
                    {result.country && (
                      <div className="result-detail">
                        <strong>Country:</strong> {result.country}
                        {result.population && ` · Population: ${result.population}`}
                      </div>
                    )}
                    {result.definition && (
                      <div className="result-detail">{result.definition}</div>
                    )}
                    {result.scopeNote && (
                      <div className="result-detail">{result.scopeNote}</div>
                    )}
                    {result.note && (
                      <div className="result-note">{result.note}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="demo-hints">
            <strong>Try these examples:</strong>
            <ul>
              <li><strong>DBPedia:</strong> "Microsoft", "British Museum"</li>
              <li><strong>Geonames:</strong> "London", "York"</li>
              <li><strong>Nomisma:</strong> "denarius" (denomination), "Rome" (mint)</li>
              <li><strong>Heritage Data:</strong> "castle", "villa"</li>
              <li><strong>Getty AAT:</strong> "bronze", "marble"</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="modernization">
        <h2>Java to TypeScript Modernization</h2>

        <div className="comparison-grid">
          <div className="comparison-card">
            <h3>Original (2013)</h3>
            <ul>
              <li>Java-based implementation</li>
              <li>Callback-based async patterns</li>
              <li>Limited type safety</li>
              <li>Complex error handling</li>
              <li>Manual dependency management</li>
              <li>General linked data sources</li>
            </ul>
          </div>

          <div className="comparison-arrow">→</div>

          <div className="comparison-card highlight">
            <h3>Modern (2024)</h3>
            <ul>
              <li>TypeScript with strict typing</li>
              <li>Async/await promises</li>
              <li>Full type safety & IDE support</li>
              <li>Structured error handling with retry logic</li>
              <li>npm package management</li>
              <li>Enhanced archaeological data sources</li>
              <li>FAIR principles for heritage data</li>
              <li>Comprehensive test coverage</li>
            </ul>
          </div>
        </div>

        <div className="migration-note">
          <h4>Key Improvements</h4>
          <p>
            The modernization effort focused on developer experience, type safety, and expanding support for
            specialized archaeological and heritage data sources. The new architecture makes it easier to integrate
            linked data lookups into modern web applications while maintaining backward compatibility with the
            original use cases.
          </p>
        </div>
      </section>

      <section className="project-links">
        <h2>Project Resources</h2>
        <div className="resources-grid">
          <a
            href="https://github.com/mcharno/linked-data-toolkit"
            target="_blank"
            rel="noopener noreferrer"
            className="resource-link"
          >
            <strong>GitHub Repository</strong>
            <span>View source code and documentation</span>
          </a>
          <a
            href="https://www.npmjs.com/package/@charno/linked-data-toolkit"
            target="_blank"
            rel="noopener noreferrer"
            className="resource-link"
          >
            <strong>npm Package</strong>
            <span>Install and use in your projects</span>
          </a>
        </div>
      </section>
    </div>
  );
};

export default LinkedDataToolkit;
