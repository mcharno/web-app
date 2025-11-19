import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Navigation.css';

const Navigation = () => {
  const { t } = useTranslation();

  return (
    <nav className="navigation">
      <div className="menu">
        <NavLink to="/">{t('menu.about')}</NavLink>
        <NavLink to="/projects">{t('menu.projects')}</NavLink>
        <NavLink to="/publishings">publishings</NavLink>
        <NavLink to="/photos">{t('menu.photos')}</NavLink>
        <NavLink to="/cricket">cricket</NavLink>
        <NavLink to="/cv">{t('menu.cv')}</NavLink>
      </div>
    </nav>
  );
};

export default Navigation;
