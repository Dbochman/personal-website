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
