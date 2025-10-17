import { createRoot } from 'react-dom/client'
import * as Sentry from "@sentry/react"
import App from './App.tsx'
import './index.css'

// Initialize Sentry for error tracking
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
})

// Respect system dark-mode on first paint
if (
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
) {
  document.documentElement.classList.add('dark')
}

createRoot(document.getElementById("root")!).render(<App />);
