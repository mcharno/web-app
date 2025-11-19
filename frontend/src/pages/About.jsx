import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './About.css';

const About = () => {
  const { t } = useTranslation();
  const [times, setTimes] = useState({
    york: '',
    portland: '',
    vasiliko: ''
  });

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();

      // Format time for specific timezone using Intl.DateTimeFormat
      const formatTimeInZone = (timeZone) => {
        return new Intl.DateTimeFormat('en-US', {
          timeZone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).format(now);
      };

      setTimes({
        york: formatTimeInZone('Europe/London'),
        portland: formatTimeInZone('America/Los_Angeles'),
        vasiliko: formatTimeInZone('Europe/Athens')
      });
    };

    updateTimes();
    const interval = setInterval(updateTimes, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="about-page">
      <h2>About</h2>

      <div className="about-content">
        <p>
          Welcome! I'm a researcher and developer passionate about archaeology,
          digital humanities, and web technologies. My work bridges the gap between
          ancient history and modern computational methods.
        </p>

        <p>
          I specialize in creating digital tools and platforms that make archaeological
          research more accessible and engaging. Whether it's building interactive
          visualizations, managing complex datasets, or developing educational resources,
          I'm always excited to explore new ways technology can enhance our understanding
          of the past.
        </p>

        <p>
          When I'm not coding or researching, you'll find me exploring ancient sites,
          playing cricket, or experimenting with new programming languages and frameworks.
          I believe in open-source collaboration and sharing knowledge with the broader
          community.
        </p>

        <p>
          Feel free to explore my projects, publications, and photography. If you'd like
          to collaborate or just chat about archaeology and tech, don't hesitate to reach out!
        </p>
      </div>

      <div className="time-zones">
        <p>York, UK: {times.york} GMT</p>
        <p>Portland, OR: {times.portland} PST</p>
        <p>Vasiliko, Cyprus: {times.vasiliko} EET</p>
      </div>
    </div>
  );
};

export default About;
