import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './Home.css';

const formatTime = (date, timezone) =>
  date.toLocaleTimeString('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false });

const Home = () => {
  const { t } = useTranslation();
  const [times, setTimes] = useState({
    york: '',
    portland: '',
    vasiliko: ''
  });

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();

      setTimes({
        york: formatTime(now, 'Europe/London'),
        portland: formatTime(now, 'America/Los_Angeles'),
        vasiliko: formatTime(now, 'Asia/Nicosia')
      });
    };

    updateTimes();
    const interval = setInterval(updateTimes, 60000); // Update every minute instead of every second

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-page">
      <h2>{t('home.title')}</h2>

      <div className="time-zones">
        <p>{t('home.time', { city: 'York', time: times.york })}</p>
        <p>{t('home.time', { city: 'Portland', time: times.portland })}</p>
        <p>{t('home.time', { city: 'Vasiliko', time: times.vasiliko })}</p>
      </div>

      <div className="avatar-container">
        <img id="avatar" src="/images/avatar.gif" alt="Avatar" />
      </div>
    </div>
  );
};

export default Home;
