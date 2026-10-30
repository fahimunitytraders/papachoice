import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ContentProvider } from './context/ContentContext.jsx';
import App from './App.jsx';
import './styles.css';

const legacyPath = window.location.hash.slice(1);
if (window.location.pathname === '/' && /^\/(?![\\/])/.test(legacyPath)) {
  window.history.replaceState(window.history.state, '', legacyPath);
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ContentProvider>
        <App />
      </ContentProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
