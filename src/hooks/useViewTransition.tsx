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
 * Keep a best-effort transition hint in sync with route changes.
 * Useful for back/forward or programmatic navigations that bypass TransitionLink.
 */
export function useViewTransitionHints() {
  const location = useLocation();
  const lastPath = useRef(location.pathname);

  useEffect(() => {
    const from = lastPath.current;
    const to = location.pathname;
    if (from === to) {
      return;
    }
    document.documentElement.dataset.transition = getTransitionType(from, to);
    lastPath.current = to;
  }, [location.pathname]);
}

/**
 * Check if click should use default browser behavior.
 * Returns true for modifier keys, non-left clicks, or external targets.
 */
function shouldUseDefaultBehavior(
  e: MouseEvent<HTMLAnchorElement>,
  target?: string
): boolean {
  return (
    e.button !== 0 || // Non-left click (middle, right)
    e.metaKey || // Cmd+click (Mac)
    e.ctrlKey || // Ctrl+click (Windows/Linux)
    e.shiftKey || // Shift+click (new window)
    e.altKey || // Alt+click (download)
    (target !== undefined && target !== '_self')
  );
}

/**
 * Drop-in replacement for Link that adds view transitions.
 * Renders as an anchor tag with onClick navigation.
 * Honors modifier keys and alternate click behaviors.
 */
export const TransitionLink = forwardRef<
  HTMLAnchorElement,
  Omit<LinkProps, 'to'> & { to: string; target?: string }
>(function TransitionLink({ to, onClick, target, children, ...props }, ref) {
  const transitionNavigate = useViewTransitionNavigate();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || shouldUseDefaultBehavior(e, target)) {
      return;
    }
    e.preventDefault();
    transitionNavigate(to);
  };

  return (
    <a ref={ref} href={to} target={target} onClick={handleClick} {...props}>
      {children}
    </a>
  );
});
