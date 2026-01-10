import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface ThemeContextType {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

// Track if theme was set by user toggle (not URL)
let userToggledTheme = false

// Reset function for tests
export function resetThemeState() {
  userToggledTheme = false
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
    // Skip URL sync if user just toggled (prevents URL from overriding user choice)
    if (userToggledTheme) {
      userToggledTheme = false
      return
    }

    // Check URL parameter first, then fall back to system preference
    const urlParams = new URLSearchParams(location.search)
    const themeParam = urlParams.get('theme')

    let targetDark: boolean

    if (themeParam) {
      targetDark = themeParam === 'dark'
    } else {
      const mql = window.matchMedia?.('(prefers-color-scheme: dark)')
      targetDark = mql?.matches ?? false
    }

    if (targetDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    setIsDark(targetDark)
  }, [location.search])

  const toggleTheme = () => {
    const newIsDark = !isDark

    // Mark that user toggled, so URL sync effect doesn't override
    userToggledTheme = true

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
