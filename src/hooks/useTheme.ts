import { useState, useEffect } from 'react'

export function useTheme() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (mql?.matches) {
      document.documentElement.classList.add('dark')
      setIsDark(true)
    }
  }, [])

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
    setIsDark(prev => !prev)
  }

  return { isDark, toggleTheme }
}