import { createContext, useContext, useEffect } from 'react';
import { defaultContent } from '@papas-choice/content';

const ContentContext = createContext(null);
export function ContentProvider({ children }) {
  useEffect(() => {
    for (const [key, value] of Object.entries(defaultContent.theme))
      document.documentElement.style.setProperty(
        '--' + key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()),
        value,
      );
  }, []);
  return (
    <ContentContext.Provider value={{ content: defaultContent }}>
      {children}
    </ContentContext.Provider>
  );
}
export const useContent = () => useContext(ContentContext);
