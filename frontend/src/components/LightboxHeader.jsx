import './LightboxHeader.css';

const LightboxHeader = ({ photoTitle, toolbar, infoPanelOpen, onToggleInfo }) => {
  // SVG Info Icon
  const InfoIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </svg>
  );

  // SVG Close Icon
  const CloseIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );

  return (
    <div className="lightbox-header">
      <div className="lightbox-header-title">
        <h3>{photoTitle || 'Untitled'}</h3>
      </div>
      <div className="lightbox-header-toolbar">
        <button
          type="button"
          className="lightbox-header-button"
          aria-label="Toggle info"
          onClick={onToggleInfo}
          style={{
            background: infoPanelOpen ? 'rgba(228, 236, 24, 0.2)' : 'transparent',
          }}
        >
          <InfoIcon />
        </button>
        {toolbar}
      </div>
    </div>
  );
};

export default LightboxHeader;
