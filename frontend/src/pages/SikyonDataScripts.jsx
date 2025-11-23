import { useNavigate } from 'react-router-dom';
import './SikyonDataScripts.css';

const SikyonDataScripts = () => {
  const navigate = useNavigate();

  return (
    <div className="sikyon-page">
      <nav className="breadcrumb">
        <button onClick={() => navigate('/projects')} className="back-button">
          ← Back to Projects
        </button>
      </nav>

      <header className="project-header">
        <h1>Sikyon Survey Data Processing Scripts</h1>
        <p className="project-year">2008 - 2025</p>
        <p className="subtitle">Archaeological Data Automation for the Sikyon Survey Project Monograph</p>
      </header>

      <section className="project-intro">
        <div className="project-context">
          <h3>The Sikyon Survey Project</h3>
          <p>
            Between <strong>2004 and 2009</strong>, a multidisciplinary team conducted a systematic urban survey
            of the ancient city of Sikyon on the plateau of northeastern Peloponnese, Greece. This collaborative
            effort brought together researchers from the <strong>University of Thessaly</strong>, the{' '}
            <strong>University of York (UK)</strong>, the <strong>Institute of Mediterranean Studies at FORTH</strong>,
            and the <strong>37th Ephoreia of Prehistoric and Classical Antiquities</strong>.
          </p>
          <p>
            Over five field seasons, the team systematically documented and quantified pottery and architectural
            observations across the ancient urban landscape. All findings were captured in databases and GIS systems,
            creating a comprehensive digital record of material culture spanning multiple periods of occupation.
          </p>
        </div>

        <h2>Overview</h2>
        <p>
          This repository contains the data processing scripts that were essential to preparing archaeological
          survey data for publication in the project monograph. Originally developed in <strong>2008</strong> during
          the survey's analytical phase, these scripts automated the cleaning, integration, and analysis of pottery
          survey data from excavation databases. In <strong>2025</strong>, the codebase was modernized with Java 17+
          and Spring Boot while preserving the original implementation for reproducibility.
        </p>

        <div className="tech-stack">
          <strong>Technologies:</strong>
          <span>Java 17+</span>
          <span>Spring Boot 3.2</span>
          <span>MS Access</span>
          <span>UCanAccess 5.0.1</span>
          <span>Docker</span>
          <span>Maven 3.9+</span>
          <span>GIS</span>
        </div>

        <div className="publication-info">
          <h3>Publication</h3>
          <p>
            The research facilitated by these scripts was published in the prestigious <em>Meletemata</em> series
            in <strong>2018</strong> by the <strong>Greek National Research Foundation</strong>. The monograph
            represents the culmination of five field seasons and years of analytical work, presenting quantified
            pottery distributions, temporal patterns, and spatial analysis of ancient Sikyon's urban landscape.
          </p>
          <div className="publication-citation">
            <strong>Related Publications:</strong>
            <ul>
              <li>
                Sikyon Survey Project Monograph, <em>Meletemata</em> series, Greek National Research Foundation (2018)
              </li>
              <li>
                Lolos, Y. A. <em>Land of Sikyon: Archaeology and History of a Greek City-State</em> (2011)
              </li>
              <li>
                "Sikyon Survey Methodology," <em>Journal of Mediterranean Archaeology</em> (2008)
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="scripts-section">
        <h2>Data Processing Scripts</h2>
        <p className="scripts-intro">
          Each script addresses a specific stage in the archaeological data workflow, from initial cleaning
          through final analytical database construction. The automation eliminated manual data processing
          errors and ensured consistent application of analytical methods across the entire dataset.
        </p>

        <div className="script-grid">
          <div className="script-card">
            <div className="script-header">
              <h3>db-cleaner</h3>
              <span className="script-badge">Data Standardization</span>
            </div>
            <p className="script-description">
              Standardizes Square and Tract identifiers across the survey database. Archaeological field
              recording often produces variations in spatial unit naming conventions. This script normalizes
              these identifiers to ensure consistency for spatial analysis and GIS integration.
            </p>
            <div className="script-usage">
              <strong>Usage:</strong>
              <code>mvn spring-boot:run -Dspring-boot.run.arguments=--script=db-cleaner</code>
            </div>
          </div>

          <div className="script-card">
            <div className="script-header">
              <h3>density-builder</h3>
              <span className="script-badge">Quantitative Analysis</span>
            </div>
            <p className="script-description">
              Computes pottery and tile density metrics for spatial analysis. Calculates sherd counts per
              survey unit, enabling quantitative comparison of artifact distributions across the site and
              identification of high-density activity areas.
            </p>
            <div className="script-usage">
              <strong>Usage:</strong>
              <code>docker-compose run --rm sikyon-scripts --script=density-builder</code>
            </div>
          </div>

          <div className="script-card">
            <div className="script-header">
              <h3>pottery-hellenistic</h3>
              <span className="script-badge">Period Export</span>
            </div>
            <p className="script-description">
              Exports Hellenistic period pottery records to CSV format for temporal analysis. Isolates
              diagnostic pottery from the Hellenistic period (323-31 BCE), facilitating period-specific
              distribution studies and chronological analysis.
            </p>
            <div className="script-usage">
              <strong>Usage:</strong>
              <code>mvn spring-boot:run -Dspring-boot.run.arguments=--script=pottery-hellenistic</code>
            </div>
          </div>

          <div className="script-card">
            <div className="script-header">
              <h3>pottery-roman</h3>
              <span className="script-badge">Period Export</span>
            </div>
            <p className="script-description">
              Exports Roman period pottery records to CSV format for temporal analysis. Extracts diagnostic
              Roman pottery (27 BCE - 330 CE), enabling analysis of continuity and change between Hellenistic
              and Roman occupation phases.
            </p>
            <div className="script-usage">
              <strong>Usage:</strong>
              <code>mvn spring-boot:run -Dspring-boot.run.arguments=--script=pottery-roman</code>
            </div>
          </div>

          <div className="script-card">
            <div className="script-header">
              <h3>pottery-builder</h3>
              <span className="script-badge">GIS Integration</span>
            </div>
            <p className="script-description">
              Constructs GIS-compatible pottery tables for spatial visualization and analysis. Transforms
              relational database records into spatial datasets suitable for mapping in GIS software,
              linking artifact data to survey unit geometries.
            </p>
            <div className="script-usage">
              <strong>Usage:</strong>
              <code>docker-compose run --rm sikyon-scripts --script=pottery-builder</code>
            </div>
          </div>

          <div className="script-card highlight">
            <div className="script-header">
              <h3>main-database</h3>
              <span className="script-badge">Integration</span>
            </div>
            <p className="script-description">
              Generates the consolidated analysis database used for the monograph. Integrates all cleaned,
              standardized, and processed data into a unified analytical database, serving as the foundation
              for statistical analysis and publication-ready datasets.
            </p>
            <div className="script-usage">
              <strong>Usage:</strong>
              <code>mvn spring-boot:run -Dspring-boot.run.arguments=--script=main-database</code>
            </div>
          </div>
        </div>
      </section>

      <section className="workflow-section">
        <h2>Data Processing Workflow</h2>
        <div className="workflow-diagram">
          <div className="workflow-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Field Data Collection</h4>
              <p>Five seasons of survey data captured in MS Access databases with pottery observations, spatial units, and temporal classifications</p>
            </div>
          </div>
          <div className="workflow-arrow">↓</div>
          <div className="workflow-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Data Standardization</h4>
              <p><strong>db-cleaner</strong> normalizes Square and Tract identifiers across all survey units</p>
            </div>
          </div>
          <div className="workflow-arrow">↓</div>
          <div className="workflow-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Quantitative Processing</h4>
              <p><strong>density-builder</strong> computes pottery and tile density metrics for spatial analysis</p>
            </div>
          </div>
          <div className="workflow-arrow">↓</div>
          <div className="workflow-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Period-Specific Exports</h4>
              <p><strong>pottery-hellenistic</strong> and <strong>pottery-roman</strong> extract temporal subsets to CSV</p>
            </div>
          </div>
          <div className="workflow-arrow">↓</div>
          <div className="workflow-step">
            <div className="step-number">5</div>
            <div className="step-content">
              <h4>GIS Integration</h4>
              <p><strong>pottery-builder</strong> creates GIS-compatible spatial datasets for mapping and visualization</p>
            </div>
          </div>
          <div className="workflow-arrow">↓</div>
          <div className="workflow-step highlight">
            <div className="step-number">6</div>
            <div className="step-content">
              <h4>Analytical Database</h4>
              <p><strong>main-database</strong> generates the consolidated database for monograph analysis and publication</p>
            </div>
          </div>
        </div>
      </section>

      <section className="contribution-section">
        <h2>Contribution to the Monograph</h2>

        <div className="contribution-grid">
          <div className="contribution-card">
            <h3>Data Quality</h3>
            <p>
              Automated cleaning and standardization ensured consistency across five field seasons of data,
              eliminating transcription errors and naming convention variations that would have compromised
              spatial and statistical analysis.
            </p>
          </div>

          <div className="contribution-card">
            <h3>Reproducibility</h3>
            <p>
              Scripted workflows documented the exact analytical transformations applied to raw field data,
              enabling peer review and verification of methods. The original 2008 code is preserved in the
              repository for full reproducibility.
            </p>
          </div>

          <div className="contribution-card">
            <h3>Temporal Analysis</h3>
            <p>
              Period-specific pottery exports enabled detailed chronological analysis, revealing patterns of
              settlement continuity, abandonment, and reoccupation across Hellenistic and Roman phases.
            </p>
          </div>

          <div className="contribution-card">
            <h3>Spatial Integration</h3>
            <p>
              GIS-compatible outputs facilitated sophisticated spatial analysis and visualization, producing
              distribution maps that revealed clustering patterns, activity areas, and intra-site organization.
            </p>
          </div>

          <div className="contribution-card">
            <h3>Quantitative Rigor</h3>
            <p>
              Density calculations provided objective, quantifiable metrics for comparing artifact distributions,
              moving beyond impressionistic descriptions to statistically grounded interpretations.
            </p>
          </div>

          <div className="contribution-card">
            <h3>Publication Efficiency</h3>
            <p>
              Automated database construction dramatically reduced the time between field data collection and
              publication-ready analytical datasets, accelerating the research timeline.
            </p>
          </div>
        </div>
      </section>

      <section className="technical-section">
        <h2>Technical Implementation</h2>

        <div className="tech-details">
          <div className="tech-feature">
            <h3>Cross-Platform Compatibility</h3>
            <p>
              The modernized codebase runs on Windows, macOS, and Linux through Java 17+ and Docker containerization.
              UCanAccess 5.0.1 provides MS Access database connectivity without requiring Microsoft Access installation,
              enabling collaborative work across different operating systems.
            </p>
          </div>

          <div className="tech-feature">
            <h3>Reproducibility & Preservation</h3>
            <p>
              The original 2008 code is preserved unmodified in the <code>original/</code> directory, ensuring
              the exact analytical methods used for the 2018 publication remain accessible. The modernized version
              maintains identical logic while adding error handling, logging, and contemporary Java features.
            </p>
          </div>

          <div className="tech-feature">
            <h3>Configuration Management</h3>
            <p>
              YAML configuration files and environment variables enable flexible deployment. Database paths,
              Oracle connectivity parameters, and script-specific settings can be adjusted without code modification,
              supporting both development and production environments.
            </p>
          </div>

          <div className="tech-feature">
            <h3>Modern Java Features</h3>
            <p>
              The 2025 modernization leverages Java Records for immutable data models, providing compile-time
              type safety and reducing boilerplate code. Spring Boot 3.2 dependency injection and configuration
              management replace manual resource handling from the original implementation.
            </p>
          </div>

          <div className="tech-feature">
            <h3>Professional Logging</h3>
            <p>
              SLF4J and Logback provide structured logging throughout the data processing pipeline. Processing
              steps, record counts, validation warnings, and error conditions are logged with appropriate severity
              levels, facilitating debugging and quality assurance.
            </p>
          </div>

          <div className="tech-feature">
            <h3>Error Handling & Validation</h3>
            <p>
              Comprehensive validation checks ensure data integrity during processing. Scripts detect and report
              missing values, constraint violations, and referential integrity issues, preventing corrupted data
              from propagating through the analytical pipeline.
            </p>
          </div>
        </div>
      </section>

      <section className="usage-section">
        <h2>Usage Instructions</h2>

        <div className="usage-tabs">
          <div className="usage-method">
            <h3>Local Execution (Maven)</h3>
            <p>Requires Java 17+ and Maven 3.9+ installed on your system.</p>
            <div className="code-example">
              <div className="code-header">Prerequisites</div>
              <pre>{`# Verify Java version
java -version

# Verify Maven version
mvn -version`}</pre>
            </div>
            <div className="code-example">
              <div className="code-header">Running Scripts</div>
              <pre>{`# Clean and standardize database
mvn spring-boot:run -Dspring-boot.run.arguments=--script=db-cleaner

# Compute density metrics
mvn spring-boot:run -Dspring-boot.run.arguments=--script=density-builder

# Export Hellenistic pottery
mvn spring-boot:run -Dspring-boot.run.arguments=--script=pottery-hellenistic

# Export Roman pottery
mvn spring-boot:run -Dspring-boot.run.arguments=--script=pottery-roman

# Build GIS tables
mvn spring-boot:run -Dspring-boot.run.arguments=--script=pottery-builder

# Generate main analytical database
mvn spring-boot:run -Dspring-boot.run.arguments=--script=main-database`}</pre>
            </div>
          </div>

          <div className="usage-method">
            <h3>Docker Execution</h3>
            <p>Requires Docker Desktop. No Java or Maven installation needed.</p>
            <div className="code-example">
              <div className="code-header">Prerequisites</div>
              <pre>{`# Verify Docker is running
docker --version
docker-compose --version`}</pre>
            </div>
            <div className="code-example">
              <div className="code-header">Running Scripts</div>
              <pre>{`# Build Docker image
docker-compose build

# Run any script via Docker
docker-compose run --rm sikyon-scripts --script=db-cleaner
docker-compose run --rm sikyon-scripts --script=density-builder
docker-compose run --rm sikyon-scripts --script=pottery-hellenistic
docker-compose run --rm sikyon-scripts --script=pottery-roman
docker-compose run --rm sikyon-scripts --script=pottery-builder
docker-compose run --rm sikyon-scripts --script=main-database`}</pre>
            </div>
          </div>
        </div>

        <div className="configuration-info">
          <h3>Configuration</h3>
          <p>
            Database paths and connection parameters are configured via YAML files in <code>src/main/resources/</code>
            or environment variables. See <code>application.yml</code> for available configuration options.
          </p>
          <div className="code-example">
            <div className="code-header">Example Configuration</div>
            <pre>{`# application.yml
sikyon:
  database:
    path: /path/to/survey-database.accdb
  oracle:
    host: localhost
    port: 1521
    service: ORCL`}</pre>
          </div>
        </div>
      </section>

      <section className="modernization-section">
        <h2>2008 to 2025 Modernization</h2>

        <div className="comparison-grid">
          <div className="comparison-card">
            <h3>Original (2008)</h3>
            <ul>
              <li>Standalone Java application</li>
              <li>Manual configuration</li>
              <li>Platform-specific dependencies</li>
              <li>Limited error handling</li>
              <li>Console output logging</li>
              <li>Hard-coded file paths</li>
            </ul>
          </div>

          <div className="comparison-arrow">→</div>

          <div className="comparison-card highlight">
            <h3>Modernized (2025)</h3>
            <ul>
              <li>Spring Boot 3.2 application</li>
              <li>YAML configuration management</li>
              <li>Cross-platform (Docker + UCanAccess)</li>
              <li>Comprehensive validation & error handling</li>
              <li>Professional SLF4J/Logback logging</li>
              <li>Externalized configuration</li>
              <li>Java Records for type safety</li>
              <li>Maven dependency management</li>
              <li>Preserved original code for reproducibility</li>
            </ul>
          </div>
        </div>

        <div className="preservation-note">
          <h4>Preservation of Original Implementation</h4>
          <p>
            The original 2008 implementation remains in the <code>original/</code> directory, unmodified.
            This ensures the exact analytical methods described in the 2018 monograph can be verified and
            reproduced. The modernized version maintains identical logic while improving maintainability,
            error handling, and cross-platform compatibility.
          </p>
        </div>
      </section>

      <section className="project-links">
        <h2>Project Resources</h2>
        <div className="resources-grid">
          <a
            href="https://github.com/mcharno/sikyon-data-scripts"
            target="_blank"
            rel="noopener noreferrer"
            className="resource-link"
          >
            <strong>GitHub Repository</strong>
            <span>View source code and documentation</span>
          </a>
          <a
            href="https://github.com/mcharno/sikyon-data-scripts/tree/main/original"
            target="_blank"
            rel="noopener noreferrer"
            className="resource-link"
          >
            <strong>Original 2008 Code</strong>
            <span>Preserved implementation for reproducibility</span>
          </a>
        </div>
      </section>
    </div>
  );
};

export default SikyonDataScripts;
