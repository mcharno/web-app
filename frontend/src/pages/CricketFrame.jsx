import { useParams, useNavigate } from 'react-router-dom';
import './CricketFrame.css';

const CricketFrame = () => {
  const { page } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/archives');
  };

  return (
    <>
      <div className="cricket-toolbar">
        <button className="back-to-archives" onClick={handleBack}>
          ← Back to Archives
        </button>
      </div>
      <div className="cricket-frame-container">
        <iframe
          src={`/archives/cricket/${page}`}
          className="cricket-iframe"
          title="Cricket Page"
        />
      </div>
    </>
  );
};

export default CricketFrame;
