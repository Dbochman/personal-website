import { useNavigate, useLocation, type LinkProps } from 'react-router-dom';
import { useCallback, useRef, useEffect, forwardRef, type MouseEvent } from 'react';

/**
 * Get the depth of a path (number of segments).
 * Used to determine navigation direction.
 */
function getPathDepth(path: string): number {
  return path.split('/').filter(Boolean).length;
}

/**
 * Hook that provides navigation with View Transitions API support.
 * Falls back to regular navigation in unsupported browsers.
 */
export function useViewTransitionNavigate() {
  const navigate = useNavigate();
  const location = useLocation();
  const lastPath = useRef(location.pathname);

  useEffect(() => {
    lastPath.current = location.pathname;
  }, [location.pathname]);

  return useCallback(
    (to: string) => {
      const isBack = getPathDepth(to) < getPathDepth(lastPath.current);
      document.documentElement.dataset.direction = isBack ? 'back' : 'forward';

      if (!document.startViewTransition) {
        navigate(to);
        return;
      }

      document.startViewTransition(() => {
        navigate(to);
      });
    },
    [navigate]
  );
}

/**
 * Drop-in replacement for Link that adds view transitions.
 * Renders as an anchor tag with onClick navigation.
 */
export const TransitionLink = forwardRef<
  HTMLAnchorElement,
  Omit<LinkProps, 'to'> & { to: string }
>(function TransitionLink({ to, onClick, children, ...props }, ref) {
  const transitionNavigate = useViewTransitionNavigate();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onClick?.(e);
    if (!e.defaultPrevented) {
      transitionNavigate(to);
    }
  };

  return (
    <a ref={ref} href={to} onClick={handleClick} {...props}>
      {children}
    </a>
  );
});
