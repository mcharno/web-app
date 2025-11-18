import { useParams, useNavigate } from 'react-router-dom';
import './CricketFrame.css';

const CricketFrame = () => {
  const { page } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/cricket');
  };

  return (
    <div className="cricket-frame-container">
      <button className="back-button" onClick={handleBack}>
        ← Back
      </button>
      <iframe
        src={`/cricket/${page}`}
        className="cricket-iframe"
        title="Cricket Page"
      />
    </div>
  );
};

export default CricketFrame;
