
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock IntersectionObserver for tests (must be a class, not arrow function,
// because framer-motion and other libraries call it with `new`)
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] { return [] }
}
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver

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
