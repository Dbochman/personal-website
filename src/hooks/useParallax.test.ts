
import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useParallax } from './useParallax';

describe('useParallax', () => {
  let mockIntersectionObserver: any;
  
  beforeEach(() => {
    vi.spyOn(window, 'addEventListener');
    vi.spyOn(window, 'removeEventListener');
    vi.clearAllMocks();
    
    // Mock IntersectionObserver with callback
    mockIntersectionObserver = {
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    };
    
    global.IntersectionObserver = vi.fn().mockImplementation((callback) => {
      mockIntersectionObserver.callback = callback;
      return mockIntersectionObserver;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Clean up DOM
    document.querySelectorAll('[data-speed]').forEach(el => el.remove());
  });

  it('should add scroll event listener on mount and remove on unmount', () => {
    const { unmount } = renderHook(() => useParallax());

    expect(window.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('should apply parallax effect on scroll when visible', () => {
    const parallaxElement = document.createElement('div');
    parallaxElement.setAttribute('data-speed', '0.5');
    document.body.appendChild(parallaxElement);

    vi.spyOn(document, 'querySelectorAll').mockReturnValue([parallaxElement] as unknown as NodeListOf<Element>);

    renderHook(() => useParallax());

    // Simulate page being visible (default state)
    window.scrollY = 100;
    
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(parallaxElement.style.transform).toBe('translate3d(0, -50px, 0)');

    document.body.removeChild(parallaxElement);
  });

  it('should not apply parallax effect when page is not visible', () => {
    const parallaxElement = document.createElement('div');
    parallaxElement.setAttribute('data-speed', '0.5');
    document.body.appendChild(parallaxElement);

    vi.spyOn(document, 'querySelectorAll').mockReturnValue([parallaxElement] as unknown as NodeListOf<Element>);

    renderHook(() => useParallax());

    // Simulate page becoming invisible first
    act(() => {
      mockIntersectionObserver.callback([{ isIntersecting: false }]);
    });

    // Clear any previous transforms
    parallaxElement.style.transform = '';
    window.scrollY = 100;
    
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    // Transform should not be applied when not visible
    expect(parallaxElement.style.transform).toBe('');

    document.body.removeChild(parallaxElement);
  });

  it('should handle elements without data-speed attribute', () => {
    const parallaxElement = document.createElement('div');
    // No data-speed attribute
    document.body.appendChild(parallaxElement);

    vi.spyOn(document, 'querySelectorAll').mockReturnValue([parallaxElement] as unknown as NodeListOf<Element>);

    renderHook(() => useParallax());

    window.scrollY = 100;
    
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    // Should default to speed 0, resulting in 0px movement
    expect(parallaxElement.style.transform).toBe('translate3d(0, 0px, 0)');

    document.body.removeChild(parallaxElement);
  });

  it('should handle multiple parallax elements with different speeds', () => {
    const element1 = document.createElement('div');
    element1.setAttribute('data-speed', '0.3');
    const element2 = document.createElement('div');
    element2.setAttribute('data-speed', '0.7');
    
    document.body.appendChild(element1);
    document.body.appendChild(element2);

    vi.spyOn(document, 'querySelectorAll').mockReturnValue([element1, element2] as unknown as NodeListOf<Element>);

    renderHook(() => useParallax());

    window.scrollY = 100;
    
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(element1.style.transform).toBe('translate3d(0, -30px, 0)');
    expect(element2.style.transform).toBe('translate3d(0, -70px, 0)');

    document.body.removeChild(element1);
    document.body.removeChild(element2);
  });

  it('should throttle scroll events with requestAnimationFrame', () => {
    renderHook(() => useParallax());

    // Fire multiple scroll events rapidly
    act(() => {
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('scroll'));
    });

    // Should call requestAnimationFrame (initial call + throttled calls)
    expect(global.requestAnimationFrame).toHaveBeenCalled();
  });

  it('should cleanup properly on unmount', () => {
    const { unmount } = renderHook(() => useParallax());

    // Trigger scroll to create pending frame
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    // Should not throw on unmount
    expect(() => unmount()).not.toThrow();
  });

  it('should setup and cleanup IntersectionObserver', () => {
    const { unmount } = renderHook(() => useParallax());

    expect(IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { threshold: 0.1 }
    );
    expect(mockIntersectionObserver.observe).toHaveBeenCalledWith(document.body);

    unmount();

    expect(mockIntersectionObserver.disconnect).toHaveBeenCalled();
  });

  it('should handle environment without IntersectionObserver', () => {
    // Temporarily remove IntersectionObserver
    const originalIO = global.IntersectionObserver;
    global.IntersectionObserver = undefined as any;

    const { unmount } = renderHook(() => useParallax());

    // Should not throw and should still work
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    unmount();

    // Restore IntersectionObserver
    global.IntersectionObserver = originalIO;
  });

  it('should handle visibility changes via IntersectionObserver', () => {
    const parallaxElement = document.createElement('div');
    parallaxElement.setAttribute('data-speed', '0.5');
    document.body.appendChild(parallaxElement);

    vi.spyOn(document, 'querySelectorAll').mockReturnValue([parallaxElement] as unknown as NodeListOf<Element>);

    renderHook(() => useParallax());

    // Initially visible (default)
    window.scrollY = 100;
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(parallaxElement.style.transform).toBe('translate3d(0, -50px, 0)');

    // Become invisible
    act(() => {
      mockIntersectionObserver.callback([{ isIntersecting: false }]);
    });

    // Reset element
    parallaxElement.style.transform = '';
    window.scrollY = 200;
    
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    
    // Should not update transform when invisible
    expect(parallaxElement.style.transform).toBe('');

    // Become visible again
    act(() => {
      mockIntersectionObserver.callback([{ isIntersecting: true }]);
    });

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    
    // Should update transform when visible again
    expect(parallaxElement.style.transform).toBe('translate3d(0, -100px, 0)');

    document.body.removeChild(parallaxElement);
  });
});
