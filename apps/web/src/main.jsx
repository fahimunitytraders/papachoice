import React from 'react';
import { createRoot } from 'react-dom/client';
import SiteRoot from './SiteRoot.jsx';
import './styles.css';

const legacyPath = window.location.hash.slice(1);
if (window.location.pathname === '/' && /^\/(?![\\/])/.test(legacyPath)) {
  window.history.replaceState(window.history.state, '', legacyPath);
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SiteRoot />
  </React.StrictMode>,
);
