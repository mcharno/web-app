import { Outlet } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useLanguage } from '../contexts/LanguageContext';
import './MainLayout.css';

const MainLayout = () => {
  const { switchToEnglish, switchToGreek } = useLanguage();

  return (
    <div className="main-layout">
      <header>
        <h1 className="site-title">charno.net</h1>
        <Navigation />
      </header>
      <main className="content">
        <Outlet />
      </main>
      <footer>
        <div className="footer-content">
          <p>&copy; {new Date().getFullYear()} Michael Charno</p>
          <div className="language-switcher">
            <button onClick={switchToEnglish} className="lang-btn">
              <img src="/images/en.jpg" alt="English" />
            </button>
            <button onClick={switchToGreek} className="lang-btn">
              <img src="/images/gr.jpg" alt="Greek" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
