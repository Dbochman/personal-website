import { useState, useEffect } from 'react'

const THEME_STORAGE_KEY = 'theme-preference'

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    // Initialize from DOM to avoid flash
    return document.documentElement.classList.contains('dark')
  })

  useEffect(() => {
    // Check localStorage first, then URL parameter, then system preference
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    const urlParams = new URLSearchParams(window.location.search)
    const themeParam = urlParams.get('theme')

    let initialDark = false

    if (stored !== null) {
      // User has explicitly set a preference
      initialDark = stored === 'dark'
    } else if (themeParam) {
      initialDark = themeParam === 'dark'
    } else {
      const mql = window.matchMedia?.('(prefers-color-scheme: dark)')
      initialDark = mql?.matches ?? false
    }

    if (initialDark) {
      document.documentElement.classList.add('dark')
      setIsDark(true)
    } else {
      document.documentElement.classList.remove('dark')
      setIsDark(false)
    }
  }, [])

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
    setIsDark(prev => {
      const newIsDark = !prev
      // Persist to localStorage
      localStorage.setItem(THEME_STORAGE_KEY, newIsDark ? 'dark' : 'light')
      // Dispatch custom event for favicon update
      window.dispatchEvent(new CustomEvent('themeChange', { detail: { isDark: newIsDark } }))
      return newIsDark
    })
  }

  return { isDark, toggleTheme }
}