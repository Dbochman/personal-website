import { useState, useEffect } from 'react'

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    // Initialize from DOM to avoid flash
    return document.documentElement.classList.contains('dark')
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
      // Update URL param without page reload
      const url = new URL(window.location.href)
      url.searchParams.set('theme', newIsDark ? 'dark' : 'light')
      window.history.replaceState({}, '', url.toString())
      // Dispatch custom event for favicon update
      window.dispatchEvent(new CustomEvent('themeChange', { detail: { isDark: newIsDark } }))
      return newIsDark
    })
  }

  return { isDark, toggleTheme }
}
