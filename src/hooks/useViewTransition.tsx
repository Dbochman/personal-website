import { useNavigate, useLocation, type LinkProps } from 'react-router-dom';
import { useCallback, useRef, useEffect, forwardRef, type MouseEvent } from 'react';

/**
 * Get the depth of a path (number of segments).
 */
function getPathDepth(path: string): number {
  return path.split('/').filter(Boolean).length;
}

/**
 * Get the top-level section of a path.
 */
function getSection(path: string): string {
  const segment = path.split('/').filter(Boolean)[0];
  return segment || 'home';
}

/**
 * Determine the transition type based on navigation pattern.
 */
function getTransitionType(from: string, to: string): string {
  const fromSection = getSection(from);
  const toSection = getSection(to);
  const fromDepth = getPathDepth(from);
  const toDepth = getPathDepth(to);

  // Going home from anywhere
  if (toSection === 'home') {
    return 'to-home';
  }

  // Cross-section navigation (blog ↔ projects)
  if (fromSection !== toSection && fromSection !== 'home') {
    return fromSection === 'blog' ? 'blog-to-projects' : 'projects-to-blog';
  }

  // Depth-based navigation within same section
  if (toDepth > fromDepth) {
    return 'forward';
  } else if (toDepth < fromDepth) {
    return 'back';
  }

  return 'forward';
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
      const transitionType = getTransitionType(lastPath.current, to);
      document.documentElement.dataset.transition = transitionType;

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
    onClick?.(e);
    if (e.defaultPrevented) {
      return;
    }
    e.preventDefault();
    transitionNavigate(to);
  };

  return (
    <a ref={ref} href={to} onClick={handleClick} {...props}>
      {children}
    </a>
  );
});
