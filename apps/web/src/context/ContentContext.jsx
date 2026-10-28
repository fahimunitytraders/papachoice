import { createContext, useContext, useEffect, useState } from 'react';
import { defaultContent, cloneContent, validateContent } from '@papas-choice/content';
export const STORAGE_KEY = 'papas-choice-content-v1';
const ContentContext = createContext(null);
function initialContent() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? validateContent(JSON.parse(stored)) : cloneContent(defaultContent);
  } catch {
    return cloneContent(defaultContent);
  }
}
export function ContentProvider({ children }) {
  const [content, setContent] = useState(initialContent);
  useEffect(() => {
    for (const [key, value] of Object.entries(content.theme))
      document.documentElement.style.setProperty(
        '--' + key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()),
        value,
      );
  }, [content.theme]);
  function save(value) {
    const clean = validateContent(value);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    setContent(clean);
  }
  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    setContent(cloneContent(defaultContent));
  }
  return (
    <ContentContext.Provider value={{ content, save, reset }}>{children}</ContentContext.Provider>
  );
}
export const useContent = () => useContext(ContentContext);
