import { it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import HeroSlider from '../src/components/HeroSlider.jsx';
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it('advances every three seconds and wraps back to the first image', () => {
  vi.useFakeTimers();
  render(<HeroSlider />);
  expect(screen.getByRole('group', { name: '1 of 2' })).toBeTruthy();
  act(() => vi.advanceTimersByTime(3000));
  expect(screen.getByRole('group', { name: '2 of 2' })).toBeTruthy();
  act(() => vi.advanceTimersByTime(3000));
  expect(screen.getByRole('group', { name: '1 of 2' })).toBeTruthy();
});
it('supports both arrows and resumes automatic sliding after hover', () => {
  vi.useFakeTimers();
  render(<HeroSlider />);
  fireEvent.click(screen.getByRole('button', { name: 'Next product image' }));
  expect(screen.getByRole('group', { name: '2 of 2' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Previous product image' }));
  const slider = screen.getByRole('region', { name: 'Papa’s Choice product highlights' });
  fireEvent.mouseEnter(slider);
  act(() => vi.advanceTimersByTime(6000));
  expect(screen.getByRole('group', { name: '1 of 2' })).toBeTruthy();
  fireEvent.mouseLeave(slider);
  expect(screen.queryByRole('button', { name: 'Pause product slideshow' })).toBeNull();
  act(() => vi.advanceTimersByTime(3000));
  expect(screen.getByRole('group', { name: '2 of 2' })).toBeTruthy();
});
it('leaves navigation manual for reduced motion', () => {
  vi.useFakeTimers();
  vi.mocked(window.matchMedia).mockReturnValueOnce({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  render(<HeroSlider />);
  act(() => vi.advanceTimersByTime(9000));
  expect(screen.getByRole('group', { name: '1 of 2' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Pause product slideshow' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Next product image' }));
  expect(screen.getByRole('group', { name: '2 of 2' })).toBeTruthy();
});
