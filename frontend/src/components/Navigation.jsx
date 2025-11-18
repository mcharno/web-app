import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Navigation.css';

const Navigation = () => {
  const { t } = useTranslation();

  return (
    <nav className="navigation">
      <div className="menu">
        <Link to="/">{t('menu.about')}</Link>
        <Link to="/projects">{t('menu.projects')}</Link>
        <Link to="/papers">{t('menu.papers')}</Link>
        <Link to="/presentations">{t('menu.presentations') || 'Presentations'}</Link>
        <Link to="/photos">{t('menu.photos')}</Link>
        <Link to="/cricket">cricket</Link>
        <Link to="/cv">{t('menu.cv')}</Link>
      </div>
    </nav>
  );
};

export default Navigation;
