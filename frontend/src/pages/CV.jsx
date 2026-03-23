import './CV.css';

const CV = () => {
  return (
    <div className="cv-page">
      <h2>Curriculum Vitae</h2>

      <div className="cv-content">
        <section className="cv-section">
          <h3>Professional Profile</h3>
          <div className="cv-item">
            <p>Software engineer with extensive experience bridging technical innovation
               and domain expertise. Background spans enterprise software development at global
               scale, digital archaeology, semantic web technologies, and data preservation.
               Proven track record of delivering innovative solutions in both commercial
               and academic research environments. Passionate about open data, digital
               preservation, and building tools that make complex data accessible.</p>
          </div>
        </section>

        <section className="cv-section">
          <h3>Technical Skills</h3>

          <div className="cv-item">
            <h4>Languages</h4>
            <p>Proficient in: Java, JavaScript/ES6, HTML, CSS, SQL, XSLT, Bash, CFML, Groovy, SPARQL</p>
          </div>

          <div className="cv-item">
            <h4>Cloud & Infrastructure</h4>
            <ul>
              <li><strong>AWS:</strong> Lambda, ECS Fargate, EKS, S3, DynamoDB, SNS/SQS, Secrets Manager, API Gateway, Route 53, IAM, CloudFront, CloudWatch</li>
              <li><strong>Systems/Platforms:</strong> Kubernetes, Docker, Apache, Tomcat, Glassfish, Cloud Foundry, Heroku, Akamai, ColdFusion</li>
              <li><strong>Infrastructure as Code:</strong> Terraform</li>
            </ul>
          </div>

          <div className="cv-item">
            <h4>Frameworks & Libraries</h4>
            <ul>
              <li><strong>Backend:</strong> Spring Boot/MVC, Node.js, Express, Struts, JSP, JSF, Facelets, JAX-WS, EJB, GWT</li>
              <li><strong>Frontend:</strong> React, Redux, Backbone, Angular, jQuery, OpenLayers, Bootstrap</li>
            </ul>
          </div>

          <div className="cv-item">
            <h4>Build, Testing & CI/CD</h4>
            <ul>
              <li><strong>Build Tools:</strong> Maven, Gradle, Ant/Ivy, Grunt, Bower</li>
              <li><strong>CI/CD:</strong> Jenkins, Go CD, CircleCI, TeamCity, Hudson</li>
              <li><strong>Testing:</strong> JUnit, Mockito, Jasmine, Karma, Enzyme, Cucumber, WireMock, JMeter, Gatling, Jest</li>
            </ul>
          </div>

          <div className="cv-item">
            <h4>Databases</h4>
            <p>Oracle, MySQL, PostgreSQL, Redis, AllegroGraph, Neo4j, MS Access</p>
          </div>

          <div className="cv-item">
            <h4>Domain-Specific</h4>
            <ul>
              <li>Semantic Web &amp; Linked Open Data (SPARQL, RDF, CIDOC CRM)</li>
              <li>Geospatial Data &amp; GIS</li>
              <li>Digital Preservation &amp; Archiving</li>
              <li>Metadata Standards &amp; Controlled Vocabularies</li>
              <li>Observability (Prometheus, Jaeger, ELK, Grafana)</li>
            </ul>
          </div>
        </section>

        <section className="cv-section">
          <h3>Professional Experience</h3>

          <div className="cv-item">
            <h4>Nike</h4>
            <p className="cv-meta">Senior Software Engineer | August 2018 – Present</p>
            <p className="cv-location">Portland, Oregon, USA</p>
            <p>Building back-end services for the Enterprise Platforms group within Global Technology,
               supporting all aspects of the business within its digital offensive. Working in an agile
               environment with full ownership over products and processes. All backend service API
               interactions secured using Okta/OAuth.</p>
            <ul>
              <li><strong>Business Rules Engine:</strong> Led a small team building a serverless abstraction layer between apps/services and a SaaS Rules Engine, covering architecture planning, development, and customer engagement. Created proof of concepts for diverse business domains and performance tested the platform — shaving ~450ms (90%) of request latency.
                <br/><em>Technologies: AWS (ECS Fargate, Lambda, DynamoDB, SQS, Secrets Manager, API Gateway, Route 53, CloudWatch), Node.js, Go, Jest, Terraform, Jenkins, Gatling</em>
              </li>
              <li><strong>Asset Management System:</strong> Built a bespoke asset management system over existing AWS services. Leveraged Kubernetes to orchestrate microservices and implemented the core observability module providing custom metrics and distributed tracing.
                <br/><em>Technologies: Kubernetes, AWS (EKS, DynamoDB, S3, SQS/SNS, CloudFront), Node.js, React, Jest, Terraform, Jenkins, Prometheus, Jaeger</em>
              </li>
            </ul>
          </div>

          <div className="cv-item">
            <h4>Sky</h4>
            <p className="cv-meta">Senior Software Developer | January 2017 – July 2018</p>
            <p className="cv-location">Leeds, UK</p>
            <p>Development lead across two squads, running standups, aligning squad efforts to project
               and business objectives, and providing feedback to the business. Fulfilled DevOps
               responsibilities including Go CD &amp; TeamCity pipelines and ELK &amp; Grafana configuration.
               Software Engineering Chapter Lead &amp; Manager, mentoring direct reports through monthly
               1:1s and supporting junior developers with objectives that aligned with squad goals.</p>
            <ul>
              <li><strong>Microservice Re-architecting:</strong> Contributed to new microservices architectural design focused on business domain and single responsibility principles. Led development of a keystone microservice managing sessions, enabling other microservices to be stateless.</li>
            </ul>

            <p className="cv-meta" style={{marginTop: '1rem'}}>Software Developer | January 2016 – January 2017</p>
            <ul>
              <li><strong>Akamai Subject Matter Expert:</strong> Supported developers across the organisation with Akamai caching and routing. Developed CDN strategies increasing asset delivery offload by an average of 26%.</li>
              <li><strong>Lead Support Developer, Black Friday Week:</strong> Coordinated developer support for Sky's busiest online sales week; absorbed 3× normal throughput and maintained 99.998% uptime across legacy apps.</li>
              <li><strong>Buy App Development (Greenfield):</strong> Planning, pipeline creation, deployment strategy, and development from scratch.
                <br/><em>Technologies: Node.js, React, Redux, GraphQL, Karma, Enzyme, TeamCity</em>
              </li>
              <li><strong>Buy Page Development:</strong> Extended existing Spring app for non-UK sales; refactored controllers and frontend components; implemented cache busting for JS &amp; CSS assets.
                <br/><em>Technologies: Java 8, Spring 4.x, Backbone, JUnit, Cucumber, Go CD</em>
              </li>
            </ul>
          </div>

          <div className="cv-item">
            <h4>Archaeology Data Service (ADS), University of York</h4>
            <p className="cv-location">York, UK</p>

            <p className="cv-meta">Lead Applications Developer | December 2013 – December 2015</p>
            <ul>
              <li>Lead on systems and technical decisions; prioritised technical tasks across the organisation</li>
              <li>Managed and mentored developers, curators, and interns within the technical team</li>
              <li>Led the largest-ever ADS systems migration: from a monolithic 4-server architecture to 22 focused, minimally-resourced VMs</li>
              <li>Improved uptime of the primary web application from 98.1% to 99.9% by isolating the web app and tuning the JVM</li>
              <li>Instituted GitLab and standardised coding conventions across the development team</li>
            </ul>

            <p className="cv-meta" style={{marginTop: '1rem'}}>Applications Developer | November 2011 – December 2013</p>
            <ul>
              <li>Developed secure RESTful services for exposing commercially sensitive data to external consumers</li>
              <li>Deployed and managed SOAP and WMS services consumed by a major domain-specific portal</li>
              <li>Engineered custom data loaders for ingesting and normalising deposited database and spreadsheet data into Oracle 11</li>
              <li>Presented the work of the ADS at conferences and workshops; regular contributor to undergraduate and postgraduate courses</li>
              <li>Built a bespoke comments system for an online journal using a Java servlet and custom ColdFusion tag transferring XML between client and server</li>
            </ul>

            <p className="cv-meta" style={{marginTop: '1rem'}}>Digital Archivist | September 2006 – November 2011</p>
            <ul>
              <li>Built web applications using HTML, ColdFusion, JavaScript, and CSS</li>
              <li>Responsible for all aspects of Apache domain and subdomain management: web proxies, HTTPS configuration, AJP connections, and legacy redirects</li>
              <li>Implemented linked open data solutions using semantic web technologies</li>
              <li>Developed DOI minting and registration scripts via the DataCite API</li>
              <li>Contributed to digital preservation initiatives and file characterisation</li>
              <li>Worked on controlled vocabularies and metadata standards (CIDOC CRM)</li>
            </ul>
          </div>
        </section>

        <section className="cv-section">
          <h3>Education</h3>

          <div className="cv-item">
            <h4>University of York</h4>
            <p className="cv-meta">Master of Science, Archaeological Information Systems — Distinction | 2005–2006</p>
            <p className="cv-location">York, England</p>
            <p>Programme focusing on digital archiving, geospatial data, semantic web technologies,
               and information management. Dissertation: <em>Virtual Research Environments: A Sikyon Tool</em>.</p>
          </div>

          <div className="cv-item">
            <h4>University of Puget Sound</h4>
            <p className="cv-meta">Bachelor of Science, Mathematics — Minor in Computer Science | 1998–2002</p>
            <p className="cv-location">Tacoma, Washington, USA</p>
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
            <h4>Books</h4>
            <ul>
              <li>Charno, M. &amp; Lolos, Y. (Eds) (2021) <em>Sikyon I: The Urban Survey.</em> Athens: Institute for Historical Research.</li>
            </ul>
          </div>

          <div className="cv-item">
            <h4>Peer-Reviewed Journal Articles</h4>
            <ul>
              <li>Binding, C., Charno, M., Jeffrey, S., May, K. &amp; Tudhope, D. (2015) "Template Based Semantic Integration: From Legacy Archaeological Datasets to Linked Data", <em>International Journal on Semantic Web and Information Systems</em>, Vol 11, No 1. DOI: 10.4018/IJSWIS.2015010101</li>
              <li>Charno, M. (2008) "An Interactive Image Using Ajax and SVG in Archaeology", <em>Internet Archaeology</em> 23. DOI: 10.11141:ia.23.5</li>
            </ul>
          </div>

          <div className="cv-item">
            <h4>Conference Proceedings</h4>
            <ul>
              <li>Charno, M., Jeffrey, S., Tudhope, D., Binding, C. &amp; May, K. (2013) "From the Slope of Enlightenment to the Plateau of Productivity: developing linked data at the ADS", in <em>Proc. 40th Int. Conf. on Computer Applications and Quantitative Methods in Archaeology (CAA)</em>, eds. G. Earle et al., Southampton, pp. 216–224.</li>
              <li>Richards, J., Winters, J. &amp; Charno, M. (2011) "Making the LEAP: Linking electronic archives and publications", in <em>Proc. 36th Int. Conf. on Computer Applications and Quantitative Methods in Archaeology (CAA)</em>, eds. E. Jerem, F. Redo &amp; V. Szeverenyi, Budapest, pp. 470–475.</li>
            </ul>
          </div>
        </section>

        <section className="cv-section">
          <h3>Conference Papers &amp; Presentations</h3>
          <div className="cv-item">
            <h4>Notable Conference Papers</h4>
            <ul>
              <li>"The Future of Data Management at the Archaeology Data Service", Computer Applications in Archaeology UK. Birmingham, England, April 2011</li>
              <li>"Digging into Data: Electronic publications in Archaeology", Beyond Books: What STM &amp; Social Science publishing should learn from each other. London, England, April 2010</li>
              <li>"Natural Language Processing within the Archaeotools Project", Computer Applications in Archaeology 2009. Williamsburg, USA, March 2009</li>
              <li>"Making the LEAP: Linking Electronic Archives to Publication", World Archaeology Congress 2008. Dublin, Ireland, June 2008</li>
            </ul>
          </div>

          <div className="cv-item">
            <h4>Selected External Lectures</h4>
            <ul>
              <li>House of Lords of the United Kingdom: Geospatial Data Seminar, 2015</li>
              <li>Glasgow School of Art: Heritage Visualization MA, 2014</li>
              <li>University College Dublin: Researching Archaeology MA, 2010</li>
              <li>University College London: Undergraduate Research and Presentation Skills Course, 2008</li>
              <li>Birkbeck College, University of London: Archaeology Core MA, 2007 &amp; 2008</li>
              <li>University of Oxford: Graduate Skills Seminar, 2007; Professional Archaeology MSc Course, 2007</li>
              <li>University of Manchester: Archaeological Field Practice MA, 2007</li>
            </ul>
          </div>
        </section>

        <section className="cv-section">
          <h3>Awards &amp; Recognition</h3>
          <div className="cv-item">
            <ul>
              <li><strong>Digital Trading Superstar</strong> — Sky (October 2016). Recognised by colleagues for above-and-beyond contributions to the tribe.</li>
              <li><strong>Best Archaeological Innovation</strong> — British Archaeological Awards (2012). For work and contributions to the association of DOIs with ADS Grey Literature.</li>
              <li><strong>Best Archaeological Innovation</strong> — British Archaeological Awards (2008).</li>
              <li><strong>Making the Difference Award</strong> — University of York (2010). In recognition of outstanding work on web development across a wide range of projects and commitment to technical skills development.</li>
              <li><strong>Award for Publishing Innovation (Highly Commended)</strong> — Association of Learned &amp; Professional Society Publishers (2009). For work and contributions to the LEAP Project and its exemplars.</li>
            </ul>
          </div>
        </section>

        <section className="cv-section">
          <h3>Volunteer Experience</h3>
          <div className="cv-item">
            <h4>FreeGeek</h4>
            <p className="cv-meta">Interim Board Member | March 2005 – September 2005</p>
            <p>Served on the Board of Directors, helping redraft organisational articles and
               contributing to strategic planning for this community technology organisation.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CV;
