import { Link } from 'react-router-dom';
import './BellingTheCat.css';

const BellingTheCat = () => {
  return (
    <div className="belling-page">
      <nav className="breadcrumb">
        <Link to="/projects">← Back to Projects</Link>
      </nav>

      <header className="project-header">
        <h1>Belling the Cat</h1>
        <p className="subtitle">A Linked Open Data Tutorial for Cultural Heritage Professionals</p>
        <div className="project-meta">
          <span className="meta-item">CIDOC CRM</span>
          <span className="meta-item">RDF/XML</span>
          <span className="meta-item">Virtuoso</span>
          <span className="meta-item">SPARQL</span>
        </div>
      </header>

      <section className="project-intro">
        <h2>Overview</h2>
        <p>
          This workshop provides a practical, hands-on guide for publishing CIDOC Conceptual Reference
          Model (CRM) data as Linked Open Data using free and open-source software. The project uses
          an Aesop's fable analogy: mice debate attaching a bell to a cat for warning, but face the
          challenge of implementation. Similarly, this tutorial addresses the "how" of making CRM data
          publicly available as LOD.
        </p>

        <div className="tutorial-goals">
          <h3>What You'll Learn</h3>
          <ul>
            <li>Convert relational database exports to RDF/XML format</li>
            <li>Set up a triple store using Virtuoso Open Source</li>
            <li>Configure Linked Open Data endpoints</li>
            <li>Publish cultural heritage data following CIDOC CRM standards</li>
            <li>Deploy on minimal hardware (Raspberry Pi or virtual machine)</li>
          </ul>
        </div>

        <div className="target-audience">
          <h3>Who This Is For</h3>
          <p>
            Cultural heritage informatics professionals seeking to convert and publish database exports
            as accessible linked data, especially those working in organizations with limited IT support
            infrastructure.
          </p>
        </div>
      </section>

      <section className="tutorial-section">
        <h2>Tutorial Modules</h2>

        <div className="module">
          <div className="module-header">
            <span className="module-number">1</span>
            <h3>Raspberry Pi Setup</h3>
          </div>
          <div className="module-content">
            <p>
              Set up a Raspberry Pi with Raspbian OS to create a low-cost, low-power server for
              hosting your Linked Open Data infrastructure.
            </p>

            <h4>Installation Steps</h4>
            <ul>
              <li>Download Raspbian image or NOOBS package</li>
              <li>Write image to SD card using <code>dd</code> command</li>
              <li>Configure system using <code>raspi-config</code> tool</li>
              <li>Expand filesystem, set password, enable SSH</li>
              <li>Configure network (WiFi or Ethernet)</li>
            </ul>

            <h4>SD Card Preparation</h4>
            <div className="code-block">
              <pre>{`# Identify SD card
diskutil list

# Unmount partition
diskutil unmountDisk /dev/disk2

# Write image (takes several minutes)
sudo dd if=raspbian.img of=/dev/rdisk2 bs=1m`}</pre>
            </div>

            <h4>Network Configuration</h4>
            <p>Edit network configuration files for WiFi connection:</p>
            <div className="code-block">
              <pre>{`# /etc/network/interfaces
auto wlan0
iface wlan0 inet dhcp
wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf

# /etc/wpa_supplicant/wpa_supplicant.conf
network={
    ssid="YourNetworkName"
    psk="YourPassword"
}`}</pre>
            </div>

            <h4>Remote Access</h4>
            <div className="code-block">
              <pre>{`# SSH into the Pi
ssh pi@192.168.1.x

# Update system
sudo apt-get update
sudo apt-get upgrade`}</pre>
            </div>
          </div>
        </div>

        <div className="module">
          <div className="module-header">
            <span className="module-number">2</span>
            <h3>Virtual Machine Setup (Alternative)</h3>
          </div>
          <div className="module-content">
            <p>
              If you don't have a Raspberry Pi, you can use VirtualBox to create a virtual machine
              running Ubuntu, providing an equivalent environment for the tutorial.
            </p>

            <h4>Requirements</h4>
            <ul>
              <li>VirtualBox installed on your host system</li>
              <li>Ubuntu Desktop ISO image</li>
              <li>At least 2GB RAM allocated to VM</li>
              <li>10GB+ disk space</li>
            </ul>

            <h4>Setup Steps</h4>
            <ul>
              <li>Create new virtual machine in VirtualBox</li>
              <li>Allocate resources (2GB RAM recommended)</li>
              <li>Install Ubuntu from ISO</li>
              <li>Configure network as bridged adapter</li>
              <li>Enable SSH for remote access</li>
            </ul>
          </div>
        </div>

        <div className="module">
          <div className="module-header">
            <span className="module-number">3</span>
            <h3>Virtuoso Installation & Configuration</h3>
          </div>
          <div className="module-content">
            <p>
              Virtuoso Open Source (VOS) is a high-performance triple store that will host your
              RDF data and provide SPARQL query endpoints.
            </p>

            <h4>Installation</h4>
            <div className="code-block">
              <pre>{`# Install Virtuoso (version 6.1)
sudo apt-get install virtuoso-opensource

# Approximately 15 packages, ~30MB total`}</pre>
            </div>

            <div className="warning-box">
              <strong>Important:</strong> During installation, set passwords for dba and dav users.
              If left blank, the Virtuoso service will not start. Default credentials are dba/dba
              and dav/dav if setup fails.
            </div>

            <h4>Configuration</h4>
            <p>Edit the configuration file to enable RDF loading:</p>
            <div className="code-block">
              <pre>{`# Edit virtuoso.ini
sudo nano /etc/virtuoso-opensource-6.1/virtuoso.ini

# Find DirsAllowed parameter and add home directory
DirsAllowed = ., /usr/share/virtuoso-opensource-6.1, /home/pi`}</pre>
            </div>

            <h4>Service Management</h4>
            <div className="code-block">
              <pre>{`# Start Virtuoso
sudo /etc/init.d/virtuoso-opensource-6.1 start

# Stop Virtuoso
sudo /etc/init.d/virtuoso-opensource-6.1 stop

# Monitor logs
tail -f /var/lib/virtuoso-opensource-6.1/db/virtuoso.log`}</pre>
            </div>

            <h4>Web Administration</h4>
            <p>
              Access the Conductor interface at:
            </p>
            <ul>
              <li>Local: <code>http://localhost:8890/conductor</code></li>
              <li>Remote: <code>http://[YOUR_IP]:8890/conductor</code></li>
            </ul>
          </div>
        </div>

        <div className="module">
          <div className="module-header">
            <span className="module-number">4</span>
            <h3>Creating RDF from Relational Data</h3>
          </div>
          <div className="module-content">
            <p>
              Convert your tabular data into RDF/XML format conforming to CIDOC-CRM standards
              using the STELLAR tools and LinkedDataToolkit.
            </p>

            <h4>Know Your Data</h4>
            <p>Understanding your dataset structure is crucial. The British Museum example includes:</p>
            <ul>
              <li>PRN (Primary Reference Number)</li>
              <li>Label and Title</li>
              <li>Period/Culture information</li>
              <li>Place and Country</li>
              <li>Material composition</li>
              <li>Object Name and Description</li>
            </ul>

            <h4>LinkedDataToolkit Process</h4>
            <p>Enrich your CSV files by adding URIs through vocabulary lookups:</p>
            <ul>
              <li><strong>Archaeological objects</strong> → FISH Thesaurus</li>
              <li><strong>Places</strong> → Geonames</li>
              <li><strong>Periods</strong> → English Heritage Periods</li>
              <li><strong>Materials</strong> → DBpedia</li>
            </ul>

            <div className="code-block">
              <pre>{`# Run LinkedDataToolkit
java -jar LinkedDataToolkit.jar [CSV_PATH] [GEONAMES_USER]

# Example
java -jar LinkedDataToolkit.jar data/british-museum.csv myusername`}</pre>
            </div>

            <h4>STELLAR Template Fields</h4>
            <p>The crm_objects template expects these column headers:</p>
            <ul>
              <li><code>object_id</code> (mandatory)</li>
              <li><code>object_label</code>, <code>object_title</code></li>
              <li><code>object_type_label</code>, <code>object_type_uri</code></li>
              <li><code>find_place_label</code>, <code>find_place_uri</code></li>
              <li><code>production_period_label</code>, <code>production_period_uri</code></li>
              <li><code>production_material_label</code>, <code>production_material_uri</code></li>
            </ul>

            <h4>Using STELLAR.Web</h4>
            <p>Generate RDF/XML by providing:</p>
            <ol>
              <li>Enhanced CSV file (output from LinkedDataToolkit)</li>
              <li>Selected template (crm_objects)</li>
              <li>Namespace prefix for resource URIs</li>
            </ol>

            <h4>Visualization Tools</h4>
            <p>Verify your RDF output using:</p>
            <ul>
              <li>Simile Welkin</li>
              <li>SemanticWorks</li>
              <li>Gruff</li>
              <li>RDF-Gravity</li>
            </ul>
          </div>
        </div>

        <div className="module">
          <div className="module-header">
            <span className="module-number">5</span>
            <h3>Configuring Virtuoso for LOD</h3>
          </div>
          <div className="module-content">
            <p>
              Configure Virtuoso Open Source to serve your RDF data as Linked Open Data with
              proper content negotiation and SPARQL endpoints.
            </p>

            <h4>Loading RDF into Virtuoso</h4>
            <div className="code-block">
              <pre>{`-- In Virtuoso Conductor SQL interface
DB.DBA.RDF_LOAD_RDFXML_MT(
  file_to_string_output('/home/pi/data/output.rdf'),
  '',
  'http://example.org/your-namespace/'
);`}</pre>
            </div>

            <h4>Configure URL Rewriting</h4>
            <p>Set up URL rewriting rules to enable content negotiation:</p>
            <ul>
              <li>HTML for web browsers</li>
              <li>RDF/XML for semantic web clients</li>
              <li>N-Triples, Turtle for other RDF serializations</li>
            </ul>

            <h4>SPARQL Endpoint</h4>
            <p>Your SPARQL endpoint will be available at:</p>
            <div className="code-block">
              <pre>{`http://[YOUR_IP]:8890/sparql`}</pre>
            </div>

            <h4>Testing Your Endpoint</h4>
            <p>Test with a simple SPARQL query:</p>
            <div className="code-block">
              <pre>{`SELECT ?s ?p ?o
WHERE {
  ?s ?p ?o
}
LIMIT 10`}</pre>
            </div>
          </div>
        </div>

        <div className="module">
          <div className="module-header">
            <span className="module-number">6</span>
            <h3>Conclusion & Next Steps</h3>
          </div>
          <div className="module-content">
            <h4>What You've Accomplished</h4>
            <ul>
              <li>Set up a complete LOD infrastructure on minimal hardware</li>
              <li>Converted relational data to CIDOC CRM-compliant RDF</li>
              <li>Deployed a production-ready triple store</li>
              <li>Configured SPARQL endpoints for data access</li>
              <li>Made cultural heritage data accessible as Linked Open Data</li>
            </ul>

            <h4>Further Resources</h4>
            <ul>
              <li><a href="http://www.cidoc-crm.org/" target="_blank" rel="noopener noreferrer">CIDOC CRM Official Site</a></li>
              <li><a href="http://virtuoso.openlinksw.com/" target="_blank" rel="noopener noreferrer">Virtuoso Documentation</a></li>
              <li><a href="https://www.w3.org/TR/sparql11-query/" target="_blank" rel="noopener noreferrer">SPARQL 1.1 Specification</a></li>
              <li><a href="http://www.geonames.org/" target="_blank" rel="noopener noreferrer">Geonames</a></li>
            </ul>

            <h4>Key Advantages</h4>
            <p>
              This approach deliberately uses modest hardware to demonstrate that organizations
              with limited IT support can still deploy sophisticated data infrastructure. The
              entire solution requires minimal resources while maintaining full functionality.
            </p>
          </div>
        </div>
      </section>

      <section className="project-links">
        <h2>Project Resources</h2>
        <div className="resources-grid">
          <a
            href="https://github.com/mcharno/belling-the-cat"
            target="_blank"
            rel="noopener noreferrer"
            className="resource-link"
          >
            <strong>GitHub Repository</strong>
            <span>View complete tutorial and source files</span>
          </a>
          <a
            href="https://github.com/mcharno/linked-data-toolkit"
            target="_blank"
            rel="noopener noreferrer"
            className="resource-link"
          >
            <strong>LinkedDataToolkit</strong>
            <span>Java tool for URI enrichment</span>
          </a>
        </div>
      </section>
    </div>
  );
};

export default BellingTheCat;
