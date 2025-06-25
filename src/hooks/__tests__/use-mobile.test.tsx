import { renderHook, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { useIsMobile } from '../use-mobile'

function mockMatchMedia(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: width < 768,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn()
  })) as any
}

describe('useIsMobile', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns true for mobile width', async () => {
    mockMatchMedia(500)
    const { result } = renderHook(() => useIsMobile())
    await waitFor(() => expect(result.current).toBe(true))
  })

  it('returns false for desktop width', async () => {
    mockMatchMedia(1200)
    const { result } = renderHook(() => useIsMobile())
    await waitFor(() => expect(result.current).toBe(false))
  })
})
