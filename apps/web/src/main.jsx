import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ContentProvider } from './context/ContentContext.jsx';
import App from './App.jsx';
import { localAsset } from '@papas-choice/content';
import { loadSiteContent } from './content-loader.js';
import './styles.css';

const legacyPath = window.location.hash.slice(1);
if (window.location.pathname === '/' && /^\/(?![\\/])/.test(legacyPath)) {
  window.history.replaceState(window.history.state, '', legacyPath);
}

const content = await loadSiteContent();
document
  .querySelector('meta[name=description]')
  ?.setAttribute('content', content.metadata.description);
document
  .querySelector('link[rel=icon]')
  ?.setAttribute('href', localAsset(content.metadata.favicon));
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ContentProvider content={content}>
        <App />
      </ContentProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
