/**
 * Deferred analytics tracking utilities
 *
 * These utilities defer analytics calls to avoid blocking the main thread
 * during user interactions, improving INP (Interaction to Next Paint) scores.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Track an event with deferred execution using requestIdleCallback.
 * Falls back to setTimeout for browsers that don't support requestIdleCallback.
 *
 * @param eventName - The GA4 event name
 * @param params - Event parameters
 */
export function trackEventDeferred(
  eventName: string,
  params: Record<string, unknown>
): void {
  // Guard for SSR and missing gtag
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  const sendEvent = () => {
    window.gtag?.('event', eventName, params);
  };

  // Use requestIdleCallback for non-blocking execution
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(sendEvent, { timeout: 2000 });
  } else {
    // Fallback for Safari and older browsers
    setTimeout(sendEvent, 0);
  }
}

/**
 * Track an event synchronously (for critical tracking needs).
 * Use sparingly - prefer trackEventDeferred for most use cases.
 *
 * @param eventName - The GA4 event name
 * @param params - Event parameters
 */
export function trackEvent(
  eventName: string,
  params: Record<string, unknown>
): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }
  window.gtag('event', eventName, params);
}
