import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { loadSiteContent } from './content-loader.js';
import { ContentProvider } from './context/ContentContext.jsx';
import App from './App.jsx';

export default function SiteRoot({ loadContent = loadSiteContent }) {
  const [content, setContent] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    loadContent()
      .then((loaded) => {
        if (cancelled) return;
        document
          .querySelector('meta[name=description]')
          ?.setAttribute('content', loaded.metadata.description);
        setContent(loaded);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Unable to load remote site content:', error);
        setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt, loadContent]);
  if (failed)
    return (
      <main className="container page-section" role="alert">
        <h1>We couldn’t load the website</h1>
        <p>Please try again in a moment.</p>
        <button className="button" onClick={() => setAttempt((value) => value + 1)}>
          Try again
        </button>
      </main>
    );
  if (!content)
    return (
      <main className="container page-section" role="status">
        Loading website…
      </main>
    );
  return (
    <BrowserRouter>
      <ContentProvider content={content}>
        <App />
      </ContentProvider>
    </BrowserRouter>
  );
}
