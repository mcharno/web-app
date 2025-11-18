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
            <p className="cv-meta">Archaeological Information Systems Program</p>
            <p>Graduate studies in Archaeological Information Systems, focusing on digital archiving,
               geospatial data, and information management.</p>
          </div>
        </section>

        <section className="cv-section">
          <h3>Background</h3>
          <div className="cv-item">
            <p>Educational and professional background in mathematics and computers (general Information
               Technologies) with additional experience in Greek archaeology and surveying.</p>
          </div>
        </section>

        <section className="cv-section">
          <h3>Research Interests</h3>
          <div className="cv-item">
            <ul>
              <li>Digital Archaeology</li>
              <li>Geospatial Data and GIS</li>
              <li>Linked Open Data</li>
              <li>Web Development for Archaeological Applications</li>
              <li>Data Visualization</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CV;
