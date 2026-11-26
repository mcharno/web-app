import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Navigation.css';

// Must match the media query in Navigation.css
const DESKTOP_QUERY = '(min-width: 1024px)';

const Navigation = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef(null);
  const toggleRef = useRef(null);

  const isArchivesActive = location.pathname.startsWith('/archives');
  const closeMenu = () => setIsOpen(false);

  // Close on browser back/forward as well as on link clicks. Adjusting state
  // during render avoids an extra effect pass.
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        toggleRef.current.focus();
        return;
      }
      if (event.key !== 'Tab') return;

      // Keep keyboard focus inside the full screen menu
      const focusable = navRef.current.querySelectorAll('button, a');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    // Don't leave the page scroll-locked if the window grows to desktop width
    const desktop = window.matchMedia?.(DESKTOP_QUERY);
    const handleResize = (event) => {
      if (event.matches) setIsOpen(false);
    };
    desktop?.addEventListener('change', handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      desktop?.removeEventListener('change', handleResize);
    };
  }, [isOpen]);

  return (
    <nav ref={navRef} className={isOpen ? 'navigation open' : 'navigation'}>
      <button
        ref={toggleRef}
        type="button"
        className="menu-toggle"
        aria-expanded={isOpen}
        aria-controls="main-menu"
        aria-label={isOpen ? t('menu.close') : t('menu.open')}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="menu-toggle-bar" />
        <span className="menu-toggle-bar" />
        <span className="menu-toggle-bar" />
      </button>
      <div id="main-menu" className="menu">
        <NavLink to="/" onClick={closeMenu}>{t('menu.about')}</NavLink>
        <NavLink to="/projects" onClick={closeMenu}>{t('menu.projects')}</NavLink>
        <NavLink to="/publishings" onClick={closeMenu}>publishings</NavLink>
        <NavLink to="/photos" onClick={closeMenu}>{t('menu.photos')}</NavLink>
        <NavLink to="/archives" onClick={closeMenu} className={isArchivesActive ? 'active' : ''}>archives</NavLink>
        <NavLink to="/cv" onClick={closeMenu}>{t('menu.cv')}</NavLink>
      </div>
    </nav>
  );
};

export default Navigation;
