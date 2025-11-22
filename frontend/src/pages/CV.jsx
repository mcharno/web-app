import './CV.css';

const CV = () => {
  return (
    <div className="cv-page">
      <h2>Curriculum Vitae</h2>

      <div className="cv-content">
        <section className="cv-section">
          <h3>Education</h3>

          <div className="cv-item">
            <h4>University of York</h4>
            <p className="cv-meta">Master's degree with Distinction | 2005-2006</p>
            <p className="cv-location">York, United Kingdom</p>
            <p>Archaeological Information Systems Program, focusing on digital archiving,
               geospatial data, semantic web technologies, and information management.</p>
          </div>

          <div className="cv-item">
            <h4>Undergraduate Degree</h4>
            <p className="cv-meta">1998-2002</p>
            <p>Background in mathematics and computer science with additional coursework
               in Greek archaeology and surveying.</p>
          </div>
        </section>

        <section className="cv-section">
          <h3>Professional Experience</h3>

          <div className="cv-item">
            <h4>Nike</h4>
            <p className="cv-meta">Software Developer/Engineer</p>
            <p className="cv-location">Portland, Oregon, United States</p>
            <p>Building scalable software solutions for global enterprise systems.</p>
          </div>

          <div className="cv-item">
            <h4>Sky</h4>
            <p className="cv-meta">Digital Trading Developer</p>
            <p>Developed trading platform solutions and digital services.</p>
            <ul>
              <li>Recognized as Digital Trading Superstar (October 2016)</li>
              <li>Delivered innovative technical solutions for trading systems</li>
            </ul>
          </div>

          <div className="cv-item">
            <h4>Archaeology Data Service, University of York</h4>
            <p className="cv-meta">Applications Developer</p>
            <p className="cv-location">York, United Kingdom</p>
            <p>Developed and maintained digital preservation infrastructure for archaeological data.</p>
            <ul>
              <li>Implemented linked open data solutions using semantic web technologies</li>
              <li>Developed DOI minting and registration scripts via DataCite API</li>
              <li>Created mobile applications for archaeological data dissemination</li>
              <li>Contributed to digital preservation initiatives and file characterization</li>
              <li>Worked on controlled vocabularies and metadata standards (CIDOC CRM)</li>
              <li>Implemented search engine optimization for archaeological resources</li>
            </ul>
          </div>
        </section>

        <section className="cv-section">
          <h3>Certifications</h3>
          <div className="cv-item">
            <ul>
              <li>Oracle Certified Professional, Java EE5 Web Component Developer</li>
              <li>Sun Certified Programmer, Java SE6</li>
            </ul>
          </div>
        </section>

        <section className="cv-section">
          <h3>Publications</h3>

          <div className="cv-item">
            <h4>Template Based Semantic Integration: From Legacy Archaeological Datasets to Linked Data</h4>
            <p className="cv-meta">International Journal on Semantic Web and Information Systems | 2015</p>
            <p className="cv-authors">C. Binding, M. Charno, S. Jeffrey, K. May, D. Tudhope</p>
            <p>DOI: 10.4018/IJSWIS.2015010101</p>
          </div>

          <div className="cv-item">
            <h4>From the Slope of Enlightenment to the Plateau of Productivity: Developing Linked Data at the ADS</h4>
            <p className="cv-meta">Proceedings, Computer Applications and Quantitative Methods in Archaeology | 2013</p>
            <p className="cv-authors">S. Jeffrey, C. Binding, D. Tudhope, K. May, M. Charno</p>
          </div>

          <div className="cv-item">
            <h4>Making the LEAP: Linking Electronic Archives and Publications</h4>
            <p className="cv-meta">Conference Proceedings | 2011</p>
          </div>

          <div className="cv-item">
            <h4>An Interactive Image Using Ajax and SVG in Archaeology</h4>
            <p className="cv-meta">Internet Archaeology | 2008</p>
          </div>
        </section>

        <section className="cv-section">
          <h3>Awards & Recognition</h3>
          <div className="cv-item">
            <ul>
              <li><strong>Digital Trading Superstar</strong> - Sky (October 2016)</li>
              <li><strong>Best Archaeological Innovation</strong> - British Archaeological Awards (2012, 2008)</li>
              <li><strong>Making the Difference Award</strong> - University of York (2010)</li>
              <li><strong>Award for Publishing Innovation (Highly Commended)</strong> - Association of Learned & Professional Society Publishers (2009)</li>
            </ul>
          </div>
        </section>

        <section className="cv-section">
          <h3>Technical Skills & Interests</h3>
          <div className="cv-item">
            <ul>
              <li>Software Development (Java, JavaScript, Python, Shell scripting)</li>
              <li>Web Technologies (React, Node.js, HTML/CSS)</li>
              <li>Digital Archaeology & Data Preservation</li>
              <li>Semantic Web & Linked Open Data (SPARQL, RDF, CIDOC CRM)</li>
              <li>Geospatial Data & GIS</li>
              <li>Infrastructure & DevOps (Kubernetes, Docker, CI/CD)</li>
              <li>Mobile Application Development</li>
              <li>Data Visualization</li>
              <li>Metadata Standards & Controlled Vocabularies</li>
            </ul>
          </div>
        </section>

        <section className="cv-section">
          <h3>Volunteer Experience</h3>
          <div className="cv-item">
            <h4>FreeGeek</h4>
            <p className="cv-meta">Interim Board Member | March 2005 - September 2005</p>
            <p>Served on the Board of Directors, helping redraft organizational articles
               and contributing to strategic planning for this community technology organization.</p>
          </div>
        </section>

        <section className="cv-section">
          <h3>Professional Profile</h3>
          <div className="cv-item">
            <p>Software developer with extensive experience bridging technical innovation
               and domain expertise. Background spans enterprise software development,
               digital archaeology, semantic web technologies, and data preservation.
               Proven track record of delivering innovative solutions in both commercial
               and academic research environments. Passionate about open data, digital
               preservation, and building tools that make complex data accessible.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CV;
