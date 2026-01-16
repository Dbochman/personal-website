import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls to top of page on route change.
 * Place inside BrowserRouter to enable.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  // Disable browser's native scroll restoration on mount
  useLayoutEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  // Scroll to top on pathname change
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
