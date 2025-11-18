import { useParams } from 'react-router-dom';
import './ProjectDetail.css';

const ProjectDetail = () => {
  const { id } = useParams();

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
