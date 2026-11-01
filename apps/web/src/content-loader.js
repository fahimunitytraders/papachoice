import {
  defaultContent,
  defaultInterface,
  validateContent,
  configureSiteContent,
} from '@papas-choice/content';

// CloudFront is the only source of non-product content. Failures must reach the UI.
export const CONTENT_BASE_URL =
  import.meta.env.VITE_CONTENT_BASE_URL ?? 'https://d22teg2omtu6om.cloudfront.net/site-content/v1/';
export async function loadSiteContent(base = CONTENT_BASE_URL, fetcher = fetch) {
  configureSiteContent();
  if (!base) throw new Error('Content URL is not configured.');
  const url = new URL(base);
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname))
    throw new Error('Content must be served over HTTPS.');
  if (url.search || url.hash) throw new Error('Use a content directory URL.');
  const prefix = url.href.replace(/\/$/, '') + '/';
  const [site, copy] = await Promise.all(
    ['site.json', 'interface.json'].map(async (file) => {
      const response = await fetcher(prefix + file, {
        signal: AbortSignal.timeout(5000),
        cache: 'no-cache',
      });
      if (!response.ok) throw new Error(`Content HTTP ${response.status}`);
      return response.json();
    }),
  );
  if (Object.hasOwn(site, 'products') || Object.hasOwn(site, 'categories'))
    throw new Error('Product data belongs to the catalogue source.');
  const content = validateContent({
    ...site,
    products: defaultContent.products,
    categories: defaultContent.categories,
  });
  for (const [section, entries] of Object.entries(defaultInterface)) {
    for (const [key, fallback] of Object.entries(entries)) {
      const value = copy?.[section]?.[key];
      if (typeof value !== 'string' || value.length > 12000)
        throw new Error('Incomplete interface copy.');
      const tokens = (s) => (s.match(/\{\d+\}/g) || []).sort().join(',');
      if (tokens(value) !== tokens(fallback)) throw new Error('Keep template placeholders.');
    }
  }
  configureSiteContent(copy, prefix);
  return content;
}
