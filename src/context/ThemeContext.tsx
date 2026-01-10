import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ThemeContextType {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    // Initialize from DOM to match server-rendered state
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark')
    }
    return false
  })

  useEffect(() => {
    // Check URL parameter first, then fall back to system preference
    const urlParams = new URLSearchParams(window.location.search)
    const themeParam = urlParams.get('theme')

    let initialDark = false

    if (themeParam) {
      initialDark = themeParam === 'dark'
    } else {
      const mql = window.matchMedia?.('(prefers-color-scheme: dark)')
      initialDark = mql?.matches ?? false
    }

    if (initialDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    setIsDark(initialDark)
  }, [])

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
