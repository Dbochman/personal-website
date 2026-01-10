
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useTheme } from './useTheme'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock window.matchMedia
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('useTheme', () => {
  beforeEach(() => {
    // Reset document classes and localStorage
    document.documentElement.className = ''
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.documentElement.className = ''
    localStorage.clear()
  })

  it('should initialize with light theme when system preference is light', () => {
    mockMatchMedia(false)
    
    const { result } = renderHook(() => useTheme())
    
    expect(result.current.isDark).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should initialize with dark theme when system preference is dark', () => {
    mockMatchMedia(true)
    
    const { result } = renderHook(() => useTheme())
    
    expect(result.current.isDark).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should toggle theme from light to dark', () => {
    mockMatchMedia(false)
    
    const { result } = renderHook(() => useTheme())
    
    expect(result.current.isDark).toBe(false)
    
    act(() => {
      result.current.toggleTheme()
    })
    
    expect(result.current.isDark).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should toggle theme from dark to light', () => {
    mockMatchMedia(true)
    
    const { result } = renderHook(() => useTheme())
    
    expect(result.current.isDark).toBe(true)
    
    act(() => {
      result.current.toggleTheme()
    })
    
    expect(result.current.isDark).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should handle multiple theme toggles', () => {
    mockMatchMedia(false)
    
    const { result } = renderHook(() => useTheme())
    
    expect(result.current.isDark).toBe(false)
    
    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.isDark).toBe(true)
    
    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.isDark).toBe(false)
    
    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.isDark).toBe(true)
  })

  it('should handle missing matchMedia gracefully', () => {
    // Mock missing matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: undefined,
    })

    const { result } = renderHook(() => useTheme())

    expect(result.current.isDark).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should persist theme preference to localStorage', () => {
    mockMatchMedia(false)

    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.toggleTheme()
    })

    expect(localStorage.getItem('theme-preference')).toBe('dark')

    act(() => {
      result.current.toggleTheme()
    })

    expect(localStorage.getItem('theme-preference')).toBe('light')
  })

  it('should restore theme from localStorage on mount', () => {
    mockMatchMedia(false) // System prefers light
    localStorage.setItem('theme-preference', 'dark') // But user chose dark

    const { result } = renderHook(() => useTheme())

    expect(result.current.isDark).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should prefer localStorage over system preference', () => {
    mockMatchMedia(true) // System prefers dark
    localStorage.setItem('theme-preference', 'light') // But user chose light

    const { result } = renderHook(() => useTheme())

    expect(result.current.isDark).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
