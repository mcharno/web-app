import { useParams } from 'react-router-dom';
import BellingTheCat from './BellingTheCat';
import LinkedDataToolkit from './LinkedDataToolkit';
import './ProjectDetail.css';

const ProjectDetail = () => {
  const { id } = useParams();

  // Map project IDs to their specific components
  const projectComponents = {
    'linked-data-toolkit': LinkedDataToolkit,
    'belling-the-cat': BellingTheCat,
  };

  // Get the specific component for this project
  const SpecificProject = projectComponents[id];

  // If a specific component exists, render it
  if (SpecificProject) {
    return <SpecificProject />;
  }

  // Otherwise, show placeholder
  return (
    <div className="project-detail-page">
      <h2>Project Details</h2>
      <p className="placeholder-message">
        This is a placeholder for project {id}. Detailed project information will be displayed here.
      </p>
      <div className="placeholder-content">
        <h3>Coming Soon</h3>
        <p>
          Project details, screenshots, documentation, and other relevant information
          will be added in a future update.
        </p>
      </div>
    </div>
  );
};

export default ProjectDetail;
