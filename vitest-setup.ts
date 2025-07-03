
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock IntersectionObserver for tests
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
})) as unknown as typeof IntersectionObserver

// Mock requestAnimationFrame for tests
global.requestAnimationFrame = vi.fn((cb) => {
  cb(0)
  return 0
})

global.cancelAnimationFrame = vi.fn()
