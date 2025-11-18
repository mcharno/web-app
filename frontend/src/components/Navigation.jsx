import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import './Navigation.css';

const Navigation = () => {
  const { t } = useTranslation();
  const { switchToEnglish, switchToGreek } = useLanguage();

  return (
    <nav className="navigation">
      <div className="language-switcher">
        <button onClick={switchToEnglish} className="lang-btn">
          <img src="/images/en.jpg" alt="English" />
        </button>
        <button onClick={switchToGreek} className="lang-btn">
          <img src="/images/gr.jpg" alt="Greek" />
        </button>
      </div>
      <div className="menu">
        <Link to="/">{t('menu.about')}</Link>
        <Link to="/projects">{t('menu.projects')}</Link>
        <Link to="/papers">{t('menu.papers')}</Link>
        <Link to="/photos">{t('menu.photos')}</Link>
        <Link to="/blog">{t('menu.blog')}</Link>
        <Link to="/cv">{t('menu.cv')}</Link>
      </div>
    </nav>
  );
};

export default Navigation;
