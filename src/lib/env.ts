/**
 * Environment detection utilities
 */

// Preview mode when VITE_ENV is 'preview' or when on pages.dev domain
export const isPreview =
  import.meta.env.VITE_ENV === 'preview' ||
  (typeof window !== 'undefined' && window.location.hostname.endsWith('.pages.dev'));

// Production is the main site
export const isProduction =
  typeof window !== 'undefined' && window.location.hostname === 'dylanbochman.com';

// Disable analytics in preview environments
export const shouldTrackAnalytics = isProduction && !isPreview;

// Show preview banner in non-production environments
export const showPreviewBanner = isPreview;
