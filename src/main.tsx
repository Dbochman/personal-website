import './polyfills' // Must be first to setup browser polyfills
import * as Sentry from '@sentry/react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize Sentry before rendering to capture all errors including first-paint
// This is required since App.tsx uses Sentry.ErrorBoundary
if (typeof window !== 'undefined' && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_COMMIT_SHA,
    tracesSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
  });
}

// Apply theme on first paint (URL param > system preference)
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search)
  const themeParam = urlParams.get('theme')
  const prefersDark = themeParam === 'dark' ||
    (themeParam === null && window.matchMedia?.('(prefers-color-scheme: dark)')?.matches)

  if (prefersDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

createRoot(document.getElementById("root")!).render(<App />);

// Set traffic classification BEFORE other analytics events
// This tags the session as human/bot/ci for filtering in GA4
if (typeof window !== 'undefined') {
  import('./lib/analytics/clientTrafficClassifier').then(({ setGA4TrafficType }) => {
    setGA4TrafficType();
  });
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
