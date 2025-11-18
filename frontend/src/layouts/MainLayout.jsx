import { Outlet } from 'react-router-dom';
import Navigation from '../components/Navigation';
import './MainLayout.css';

const MainLayout = () => {
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
        <p>&copy; {new Date().getFullYear()} Michael Charno</p>
      </footer>
    </div>
  );
};

export default MainLayout;
