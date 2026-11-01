import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  defaultSite,
  defaultInterface,
  defaultContent,
  configureSiteContent,
  localAsset,
  text,
} from '@papas-choice/content';
import { loadSiteContent } from '../src/content-loader.js';
import { ContentProvider } from '../src/context/ContentContext.jsx';
import App from '../src/App.jsx';

const base = 'https://d22teg2omtu6om.cloudfront.net/site-content/v1/';
const clone = (value) => JSON.parse(JSON.stringify(value));
function source(site = clone(defaultSite), copy = clone(defaultInterface)) {
  return vi.fn(async (url) => ({
    ok: true,
    json: async () => (url.endsWith('interface.json') ? copy : site),
  }));
}
afterEach(() => {
  configureSiteContent();
  vi.restoreAllMocks();
});
describe('remote site content', () => {
  it('renders changed page copy, interface text and roles while preserving catalogue data', async () => {
    const site = clone(defaultSite),
      copy = clone(defaultInterface);
    site.careersCopy.title = 'Build your future here';
    site.jobs[0].title = 'Finance colleague';
    copy.Careers.view_role = 'Read the opportunity';
    copy.Products.all_products = 'Entire range';
    const fetcher = source(site, copy);
    const content = await loadSiteContent(base, fetcher);
    expect(fetcher.mock.calls.map((args) => args[0])).toEqual([
      base + 'site.json',
      base + 'interface.json',
    ]);
    expect(content.products).toEqual(defaultContent.products);
    expect(content.categories).toEqual(defaultContent.categories);
    render(
      <MemoryRouter initialEntries={['/careers']}>
        <ContentProvider content={content}>
          <App />
        </ContentProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Build your future here' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Finance colleague' })).toBeTruthy();
    expect(screen.getAllByText('Read the opportunity')).toHaveLength(2);
    expect(localAsset('/assets/logo.png')).toBe(base + 'assets/logo.png');
    expect(localAsset('/assets/products/brown-beans.jpg')).toBe('/assets/products/brown-beans.jpg');
    expect(localAsset('/favicon.svg')).toBe(base + 'favicon.svg');
  });
  it('keeps catalogue filtering functional when the All products label changes', async () => {
    const copy = clone(defaultInterface);
    copy.Products.all_products = 'Entire range';
    const content = await loadSiteContent(base, source(clone(defaultSite), copy));
    render(
      <MemoryRouter initialEntries={['/products']}>
        <ContentProvider content={content}>
          <App />
        </ContentProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: 'Entire range' })).toBeTruthy();
    expect(screen.getByText('73 products')).toBeTruthy();
  });
  it.each(['http', 'json', 'network', 'schema', 'products', 'copy', 'placeholders', 'roles'])(
    'falls back atomically on %s failure',
    async (kind) => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const site = clone(defaultSite),
        copy = clone(defaultInterface);
      if (kind === 'schema') site.schemaVersion = 99;
      if (kind === 'products') site.products = [];
      if (kind === 'copy') delete copy.App;
      if (kind === 'placeholders') copy.App.apply_0 = 'Apply';
      if (kind === 'roles') site.jobs[0].id = 'unknown-role';
      let fetcher = source(site, copy);
      if (kind === 'http') fetcher = async () => ({ ok: false, status: 403 });
      if (kind === 'json')
        fetcher = async () => ({
          ok: true,
          json: async () => {
            throw new Error('HTML');
          },
        });
      if (kind === 'network')
        fetcher = async () => {
          throw new Error('offline');
        };
      expect(await loadSiteContent(base, fetcher)).toBe(defaultContent);
      expect(text('App.apply_0', ['Role'])).toBe('Apply: Role');
      expect(localAsset('/assets/logo.png')).toBe('/assets/logo.png');
    },
  );
  it('does not fetch when no content URL is configured', async () => {
    const fetcher = vi.fn();
    expect(await loadSiteContent('', fetcher)).toBe(defaultContent);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
