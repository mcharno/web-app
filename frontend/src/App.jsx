import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import About from './pages/About';
import Projects from './pages/Projects';
import Papers from './pages/Papers';
import Photos from './pages/Photos';
import Blog from './pages/Blog';
import CV from './pages/CV';
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
            <Route path="photos" element={<Photos />} />
            <Route path="blog" element={<Blog />} />
            <Route path="cv" element={<CV />} />
          </Route>
        </Routes>
      </LanguageProvider>
    </Router>
  );
}

export default App;
