import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import About from './pages/About';
import Projects from './pages/Projects';
import Papers from './pages/Papers';
import Presentations from './pages/Presentations';
import Photos from './pages/Photos';
import CV from './pages/CV';
import Cricket from './pages/Cricket';
import './App.css';

function App() {
  return (
    <Router>
      <LanguageProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="projects" element={<Projects />} />
            <Route path="papers" element={<Papers />} />
            <Route path="presentations" element={<Presentations />} />
            <Route path="photos" element={<Photos />} />
            <Route path="cricket" element={<Cricket />} />
            <Route path="cv" element={<CV />} />
          </Route>
        </Routes>
      </LanguageProvider>
    </Router>
  );
}

export default App;
