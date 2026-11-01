import { createContext, useContext, useEffect } from 'react';
import { defaultContent } from '@papas-choice/content';

const ContentContext = createContext(null);
export function ContentProvider({ children, content = defaultContent }) {
  useEffect(() => {
    for (const [key, value] of Object.entries(content.theme))
      document.documentElement.style.setProperty(
        '--' + key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()),
        value,
      );
  }, [content]);
  return <ContentContext.Provider value={{ content }}>{children}</ContentContext.Provider>;
}
export const useContent = () => useContext(ContentContext);
