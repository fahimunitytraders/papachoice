import { configureSiteContent, defaultInterface } from '@papas-choice/content';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(() => {
  cleanup();
  localStorage.clear();
});
window.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute('open');
};
window.matchMedia = vi.fn((media) => ({
  matches: false,
  media,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));

beforeEach(() =>
  configureSiteContent(defaultInterface, 'https://d22teg2omtu6om.cloudfront.net/site-content/v1/'),
);
