
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useParallax } from './useParallax';

describe('useParallax', () => {
  beforeEach(() => {
    vi.spyOn(window, 'addEventListener');
    vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should add scroll event listener on mount and remove on unmount', () => {
    const { unmount } = renderHook(() => useParallax());

    expect(window.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('should apply parallax effect on scroll', () => {
    const parallaxElement = document.createElement('div');
    parallaxElement.setAttribute('data-speed', '0.5');
    document.body.appendChild(parallaxElement);

    vi.spyOn(document, 'querySelectorAll').mockReturnValue([parallaxElement] as unknown as NodeListOf<Element>);

    renderHook(() => useParallax());

    window.scrollY = 100;
    window.dispatchEvent(new Event('scroll'));

    expect(parallaxElement.style.transform).toBe('translate3d(0, -50px, 0)');

    document.body.removeChild(parallaxElement);
  });
});
