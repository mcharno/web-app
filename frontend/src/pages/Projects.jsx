import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import './Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectsAPI.getAll(language);
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [language]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="projects-page">
      <h2>Projects</h2>
      <div className="projects-grid">
        {projects.map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="project-card"
          >
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            {project.technologies && (
              <p className="project-technologies">
                <strong>Technologies:</strong> {project.technologies}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Projects;
