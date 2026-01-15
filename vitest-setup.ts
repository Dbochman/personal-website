
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock IntersectionObserver for tests
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
})) as unknown as typeof IntersectionObserver

// Mock requestAnimationFrame for tests using setTimeout to prevent infinite loops
// with animation libraries like framer-motion
let rafId = 0
global.requestAnimationFrame = vi.fn((cb) => {
  const id = ++rafId
  setTimeout(() => cb(performance.now()), 0)
  return id
})

global.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id)
})

// Extend global window with vi for tests
Object.defineProperty(globalThis, 'vi', {
  value: vi,
  writable: true,
})
