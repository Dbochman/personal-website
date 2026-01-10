import './polyfills' // Must be first to setup browser polyfills
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Respect system dark-mode on first paint
if (
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
) {
  document.documentElement.classList.add('dark')
}

createRoot(document.getElementById("root")!).render(<App />);

// Lazy load Sentry after initial render
// This defers ~128KB (44KB gzipped) of code that's not needed for first paint
if (typeof window !== 'undefined') {
  // Initialize Sentry after a short delay to allow critical rendering first
  setTimeout(() => {
    import('@sentry/react').then((Sentry) => {
      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        tracesSampleRate: 1.0,
        integrations: [
          Sentry.browserTracingIntegration(),
        ],
      });
    });
  }, 1000);
}

// Lazy load Web Vitals reporting after page has loaded
// This defers ~40KB of code that's not needed for initial render
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    import('./lib/reportWebVitals').then(({ reportWebVitals }) => {
      reportWebVitals();
    });
  });
}
