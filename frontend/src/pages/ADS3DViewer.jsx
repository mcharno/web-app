import { useNavigate } from 'react-router-dom';
import './ADS3DViewer.css';

const ADS3DViewer = () => {
  const navigate = useNavigate();

  return (
    <div className="ads3d-page">
      <nav className="breadcrumb">
        <button onClick={() => navigate('/projects')} className="back-button">
          ← Back to Projects
        </button>
      </nav>

      <header className="project-header">
        <h1>ADS 3D Viewer</h1>
        <p className="project-year">2014 - 2016</p>
        <p className="subtitle">Web-Based 3D Visualization for Archaeological Stratigraphy</p>
      </header>

      <section className="project-intro">
        <div className="project-context">
          <h3>A Pioneer in Archaeological 3D Web Visualization</h3>
          <p>
            The ADS 3D Viewer represents the <strong>first example of a web-based visualization system for the
            preservation and analysis of archaeological stratigraphy integrated within a trusted digital repository</strong>.
            This two-year project, funded by the <strong>Marie Curie Actions Seventh Framework Programme</strong>,
            investigated how browser-based 3D graphics using WebGL could create an open-access infrastructure for
            archaeological data.
          </p>
          <p>
            Developed through collaboration between the <strong>University of York's Archaeology Data Service</strong>
            and the <strong>Visual Computing Lab at ISTI-CNR (Italy)</strong>, the project broke new ground by bringing
            professional 3D archaeological visualization directly into web browsers, eliminating the need for specialized
            software or plugins.
          </p>
        </div>

        <h2>Overview</h2>
        <p>
          The ADS 3D Viewer project developed a <strong>web-based working environment for the management and
          analysis of archaeological data</strong> using WebGL technology. The system enables experts to share
          and analyze digital excavation records collaboratively through standard web browsers, democratizing
          access to 3D archaeological data.
        </p>

        <div className="tech-stack">
          <strong>Technologies:</strong>
          <span>WebGL</span>
          <span>3DHOP</span>
          <span>JavaScript</span>
          <span>OBJ Format</span>
          <span>ASCII 3D Data</span>
          <span>Trackball Navigation</span>
          <span>Touch Controls</span>
        </div>

        <div className="funding-info">
          <h3>Funding & Duration</h3>
          <div className="funding-details">
            <div className="funding-item">
              <strong>Funding Source:</strong>
              <p>Marie Curie Actions Seventh Framework Programme</p>
            </div>
            <div className="funding-item">
              <strong>Duration:</strong>
              <p>2 years (2014-2016)</p>
            </div>
            <div className="funding-item">
              <strong>Publication:</strong>
              <p>Journal of Archaeological Science: Reports (October 2016)</p>
            </div>
          </div>
        </div>
      </section>

      <section className="team-section">
        <h2>Collaborative Team</h2>
        <div className="team-grid">
          <div className="team-group">
            <h3>University of York</h3>
            <ul>
              <li><strong>Fabrizio Galeazzi</strong> - Project Lead</li>
              <li><strong>Julian Richards</strong> - Professor of Archaeology</li>
              <li><strong>Michael Charno</strong> - Applications Developer, ADS</li>
              <li><strong>Kieron Niven</strong> - Collections Development Manager, ADS</li>
            </ul>
          </div>
          <div className="team-group highlight">
            <h3>Visual Computing Lab, ISTI-CNR</h3>
            <ul>
              <li><strong>Marco Callieri</strong> - Senior Researcher</li>
              <li><strong>Matteo Dellepiane</strong> - Researcher</li>
              <li><strong>Roberto Scopigno</strong> - Research Director</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="viewers-section">
        <h2>Dual Viewer System</h2>
        <p className="section-intro">
          The project developed two complementary visualization tools, each designed for specific archaeological
          use cases within the ADS digital repository infrastructure.
        </p>

        <div className="viewer-cards">
          <div className="viewer-card">
            <div className="viewer-header">
              <h3>Object Level 3D Viewer</h3>
              <span className="viewer-badge">Individual Artifacts</span>
            </div>
            <div className="viewer-content">
              <h4>Purpose</h4>
              <p>
                Enables real-time 3D model interaction directly within project archives. Researchers can examine
                individual archaeological objects with full rotation, zoom, and inspection capabilities without
                downloading files or installing software.
              </p>

              <h4>Key Features</h4>
              <ul>
                <li>Real-time WebGL rendering using the 3DHOP visualization tool</li>
                <li>Trackball navigation for intuitive 3D manipulation</li>
                <li>Touch-based controls for mobile and tablet devices</li>
                <li>Support for OBJ and ASCII 3D data formats</li>
                <li>JPG texture mapping</li>
                <li>Integrated directly within ADS archive pages</li>
              </ul>

              <h4>Archaeological Applications</h4>
              <p>
                Ideal for examining individual finds, pottery vessels, small artifacts, and architectural
                fragments. The viewer facilitates detailed morphological analysis and enables researchers to
                share 3D representations of artifacts alongside traditional photographic documentation.
              </p>
            </div>
          </div>

          <div className="viewer-card highlight">
            <div className="viewer-header">
              <h3>Stratigraphy 3D Viewer</h3>
              <span className="viewer-badge">Excavation Context</span>
            </div>
            <div className="viewer-content">
              <h4>Purpose</h4>
              <p>
                Aggregates multiple stratigraphic layers into a unified 3D environment with layer transparency
                controls. This groundbreaking tool allows archaeologists to visualize and analyze the vertical
                and horizontal relationships between excavation contexts in three dimensions.
              </p>

              <h4>Key Features</h4>
              <ul>
                <li>Multi-layer stratigraphic visualization</li>
                <li>Layer transparency controls for selective visibility</li>
                <li>Synchronized viewing of multiple contexts</li>
                <li>Temporal sequence navigation</li>
                <li>Spatial relationship analysis tools</li>
                <li>Integration with excavation documentation</li>
              </ul>

              <h4>Archaeological Significance</h4>
              <p>
                The Stratigraphy Viewer represents a <strong>major breakthrough in digital archaeology</strong>.
                For the first time, archaeologists can interact with stratigraphic sequences in their full
                three-dimensional complexity through a web browser. This capability transforms how excavation
                data is analyzed, interpreted, and communicated.
              </p>

              <div className="significance-note">
                <h5>Innovation Impact</h5>
                <p>
                  As the first web-based stratigraphic visualization system integrated within a trusted digital
                  repository, this viewer set new standards for archaeological data preservation and accessibility.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="technology-section">
        <h2>Technical Innovation</h2>

        <div className="tech-features">
          <div className="tech-feature">
            <h3>WebGL Browser-Based Rendering</h3>
            <p>
              The project leveraged WebGL (Web Graphics Library) to bring hardware-accelerated 3D graphics directly
              to web browsers. This eliminated the traditional barriers of specialized software installation, making
              professional-grade 3D visualization accessible to anyone with a modern browser.
            </p>
          </div>

          <div className="tech-feature">
            <h3>3DHOP Integration</h3>
            <p>
              The 3D Heritage Online Presenter (3DHOP) toolkit provided the foundation for interactive visualization.
              This open-source tool was specifically designed for cultural heritage applications, offering optimized
              performance for archaeological 3D models.
            </p>
          </div>

          <div className="tech-feature">
            <h3>Cross-Platform Accessibility</h3>
            <p>
              Touch-based controls ensure the viewers function seamlessly across desktop computers, tablets, and
              mobile devices. Researchers can examine 3D archaeological data regardless of their hardware platform.
            </p>
          </div>

          <div className="tech-feature">
            <h3>Repository Integration</h3>
            <p>
              Unlike standalone 3D viewers, the ADS 3D Viewer is deeply integrated with the ADS digital repository
              infrastructure. 3D models are preserved alongside excavation documentation, photographs, databases,
              and reports, maintaining the intellectual connections between different data types.
            </p>
          </div>

          <div className="tech-feature">
            <h3>Open Data Standards</h3>
            <p>
              The project adhered to open data standards and formats (OBJ, ASCII) ensuring long-term preservation
              and preventing vendor lock-in. Archaeological data remains accessible even as specific technologies
              evolve.
            </p>
          </div>

          <div className="tech-feature">
            <h3>Performance Optimization</h3>
            <p>
              The Visual Computing Lab's expertise in 3D graphics optimization ensured smooth performance even with
              complex archaeological models. Careful attention to polygon counts, texture resolution, and rendering
              techniques balanced visual quality with web performance requirements.
            </p>
          </div>
        </div>
      </section>

      <section className="impact-section">
        <h2>Project Impact & Legacy</h2>

        <div className="impact-grid">
          <div className="impact-card">
            <h3>Open Access Achievement</h3>
            <p>
              By creating browser-based 3D visualization, the project dramatically lowered barriers to accessing
              archaeological 3D data. Researchers worldwide can now examine excavation stratigraphy and artifacts
              without expensive software licenses or specialized hardware.
            </p>
          </div>

          <div className="impact-card">
            <h3>Research Collaboration</h3>
            <p>
              The web-based infrastructure enables distributed research teams to collaboratively analyze 3D
              archaeological data. Team members can reference specific views and features using URLs, facilitating
              remote collaboration and peer review.
            </p>
          </div>

          <div className="impact-card">
            <h3>Educational Resource</h3>
            <p>
              The viewers provide invaluable teaching tools for archaeological education. Students can explore
              stratigraphy and artifacts interactively, developing spatial understanding that static images cannot
              convey.
            </p>
          </div>

          <div className="impact-card">
            <h3>Preservation Standard</h3>
            <p>
              The project established best practices for preserving and presenting 3D archaeological data in
              digital repositories. The integration model influenced subsequent repository development internationally.
            </p>
          </div>

          <div className="impact-card">
            <h3>Public Engagement</h3>
            <p>
              Web accessibility extends beyond academic researchers to interested public audiences. The viewers
              support archaeological outreach by making excavation data tangible and understandable to non-specialists.
            </p>
          </div>

          <div className="impact-card">
            <h3>Technical Advancement</h3>
            <p>
              The project demonstrated the viability of WebGL for serious archaeological research applications,
              paving the way for subsequent web-based 3D tools across cultural heritage domains.
            </p>
          </div>
        </div>
      </section>

      <section className="challenges-section">
        <h2>Technical Challenges & Solutions</h2>

        <div className="challenge-grid">
          <div className="challenge-item">
            <div className="challenge-problem">
              <h4>Browser Performance Limitations</h4>
              <p>
                Early WebGL implementations had limited performance compared to native applications, particularly
                for complex archaeological models with high polygon counts.
              </p>
            </div>
            <div className="challenge-solution">
              <strong>Solution:</strong>
              <p>
                Careful model optimization, level-of-detail techniques, and progressive loading strategies ensured
                acceptable performance across different browser capabilities and network speeds.
              </p>
            </div>
          </div>

          <div className="challenge-item">
            <div className="challenge-problem">
              <h4>Data Format Standardization</h4>
              <p>
                Archaeological 3D data comes from diverse sources using varied formats, making standardized
                preservation and presentation challenging.
              </p>
            </div>
            <div className="challenge-solution">
              <strong>Solution:</strong>
              <p>
                Adopted widely-supported open formats (OBJ, ASCII) and developed conversion pipelines to normalize
                incoming data while preserving original files for authenticity.
              </p>
            </div>
          </div>

          <div className="challenge-item">
            <div className="challenge-problem">
              <h4>Stratigraphic Complexity</h4>
              <p>
                Excavation stratigraphy can involve dozens of intersecting contexts with complex spatial relationships,
                creating visualization and interaction design challenges.
              </p>
            </div>
            <div className="challenge-solution">
              <strong>Solution:</strong>
              <p>
                Layer transparency controls and selective visibility toggles allow users to manage complexity by
                focusing on relevant stratigraphic relationships. Temporal sequencing helps users navigate through
                occupation phases systematically.
              </p>
            </div>
          </div>

          <div className="challenge-item">
            <div className="challenge-problem">
              <h4>Repository Integration</h4>
              <p>
                Integrating interactive 3D viewers into existing repository infrastructure without disrupting
                established workflows and user interfaces required careful planning.
              </p>
            </div>
            <div className="challenge-solution">
              <strong>Solution:</strong>
              <p>
                Modular design allowed 3D viewers to be embedded within existing archive pages as enhancement
                rather than replacement. Fallback mechanisms ensure accessibility even when WebGL is unavailable.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="publication-section">
        <h2>Publication & Dissemination</h2>

        <div className="publication-card">
          <h3>Peer-Reviewed Publication</h3>
          <div className="pub-details">
            <p className="pub-title">
              Web-based visualization for 3D data in archaeology: The ADS 3D viewer
            </p>
            <p className="pub-authors">
              Fabrizio Galeazzi, Marco Callieri, Matteo Dellepiane, Michael Charno,
              Julian Richards, Roberto Scopigno
            </p>
            <p className="pub-venue">
              <strong>Journal of Archaeological Science: Reports</strong>, October 2016
            </p>
            <p className="pub-doi">
              DOI: <a href="https://doi.org/10.1016/j.jasrep.2016.06.001" target="_blank" rel="noopener noreferrer">
                10.1016/j.jasrep.2016.06.001
              </a>
            </p>
          </div>
        </div>

        <div className="dissemination-info">
          <h3>Conference Presentations</h3>
          <p>
            Project results were presented at multiple international conferences including Computer Applications
            and Quantitative Methods in Archaeology (CAA), demonstrating the viewers to the archaeological research
            community and gathering feedback for improvements.
          </p>
        </div>
      </section>

      <section className="project-links">
        <h2>Project Resources</h2>
        <div className="resources-grid">
          <a
            href="https://archaeologydataservice.ac.uk/about/projects/ads-3d-viewer/"
            target="_blank"
            rel="noopener noreferrer"
            className="resource-link"
          >
            <strong>ADS Project Page</strong>
            <span>Official project information and documentation</span>
          </a>
          <a
            href="https://doi.org/10.1016/j.jasrep.2016.06.001"
            target="_blank"
            rel="noopener noreferrer"
            className="resource-link"
          >
            <strong>Published Article</strong>
            <span>Journal of Archaeological Science: Reports (2016)</span>
          </a>
          <a
            href="http://3dhop.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="resource-link"
          >
            <strong>3DHOP Tool</strong>
            <span>Open-source 3D visualization framework</span>
          </a>
        </div>
      </section>
    </div>
  );
};

export default ADS3DViewer;
