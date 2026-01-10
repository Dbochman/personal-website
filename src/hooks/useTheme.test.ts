import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useTheme } from './useTheme'

// Save original window properties
const originalHistory = window.history
const originalLocation = window.location

// Mock window.matchMedia
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
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

// Mock history.replaceState
const mockReplaceState = vi.fn()

// Helper to set URL search params
const setUrlParams = (params: string) => {
  Object.defineProperty(window, 'location', {
    writable: true,
    configurable: true,
    value: {
      search: params,
      href: `http://localhost${params}`,
    },
  })
}

describe('useTheme', () => {
  beforeEach(() => {
    document.documentElement.className = ''
    setUrlParams('')
    // Mock history with full API structure
    Object.defineProperty(window, 'history', {
      writable: true,
      configurable: true,
      value: {
        ...originalHistory,
        replaceState: mockReplaceState,
      },
    })
    mockReplaceState.mockClear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.documentElement.className = ''
    // Restore original window properties
    Object.defineProperty(window, 'history', {
      writable: true,
      configurable: true,
      value: originalHistory,
    })
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: originalLocation,
    })
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

  it('should use URL param over system preference', () => {
    mockMatchMedia(true) // System prefers dark
    setUrlParams('?theme=light') // But URL says light

    const { result } = renderHook(() => useTheme())

    expect(result.current.isDark).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should use dark theme from URL param', () => {
    mockMatchMedia(false) // System prefers light
    setUrlParams('?theme=dark') // But URL says dark

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

  it('should update URL param when toggling theme', () => {
    mockMatchMedia(false)

    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.toggleTheme()
    })

    expect(mockReplaceState).toHaveBeenCalled()
  })

  it('should handle missing matchMedia gracefully', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: undefined,
    })

    const { result } = renderHook(() => useTheme())

    expect(result.current.isDark).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
