import { expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { configureSiteContent, defaultContent, defaultInterface } from '@papas-choice/content';
import SiteRoot from '../src/SiteRoot.jsx';

it('shows a loading error instead of fallback content, and retries remote loading', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const loadContent = vi
    .fn()
    .mockRejectedValueOnce(new Error('Content HTTP 403'))
    .mockImplementationOnce(async () => {
      configureSiteContent(
        defaultInterface,
        'https://d22teg2omtu6om.cloudfront.net/site-content/v1/',
      );
      return defaultContent;
    });
  render(<SiteRoot loadContent={loadContent} />);
  expect(screen.getByRole('status').textContent).toContain('Loading');
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(screen.queryByRole('heading', { name: defaultContent.home.title })).toBeNull();
  expect(screen.queryByRole('banner')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('heading', { name: defaultContent.home.title })).toBeTruthy();
  expect(loadContent).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole('alert')).toBeNull();
  log.mockRestore();
});

it('keeps the crawlable HTML favicon when remote content loads', async () => {
  const icon = document.createElement('link');
  icon.rel = 'icon';
  icon.type = 'image/png';
  icon.setAttribute('href', '/favicon/favicon-96x96.png');
  document.head.append(icon);
  try {
    const content = structuredClone(defaultContent);
    content.metadata.favicon = 'https://example.com/legacy-favicon.svg';
    render(<SiteRoot loadContent={async () => content} />);
    await screen.findByRole('heading', { name: content.home.title });
    expect(icon.getAttribute('href')).toBe('/favicon/favicon-96x96.png');
    expect(icon.type).toBe('image/png');
  } finally {
    icon.remove();
  }
});
