import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface ThemeContextType {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

// Track if theme has been initialized (first load complete)
let hasInitialized = false

// Reset function for tests
export function resetThemeState() {
  hasInitialized = false
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [isDark, setIsDark] = useState(() => {
    // Initialize from DOM to match server-rendered state
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark')
    }
    return false
  })

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const themeParam = urlParams.get('theme')

    let targetDark: boolean | null = null

    if (themeParam) {
      // URL has explicit theme param - always respect it
      targetDark = themeParam === 'dark'
    } else if (!hasInitialized) {
      // First load with no URL param - use system preference
      const mql = window.matchMedia?.('(prefers-color-scheme: dark)')
      targetDark = mql?.matches ?? false
    }
    // If no theme param and already initialized, preserve current state (targetDark stays null)

    hasInitialized = true

    // Only update if we have a target (explicit param or first load)
    if (targetDark !== null) {
      if (targetDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      setIsDark(targetDark)
    }
  }, [location.search])

  const toggleTheme = () => {
    const newIsDark = !isDark

    if (newIsDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    setIsDark(newIsDark)

    // Update URL param without page reload
    const url = new URL(window.location.href)
    url.searchParams.set('theme', newIsDark ? 'dark' : 'light')
    window.history.replaceState({}, '', url.toString())

    // Dispatch custom event for favicon update
    window.dispatchEvent(new CustomEvent('themeChange', { detail: { isDark: newIsDark } }))
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
