import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './i18n/config';
import './index.css';
import './App.css';
// Force cache bust

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
