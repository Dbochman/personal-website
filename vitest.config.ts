import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,           // ✅ enables describe/it/expect without imports
    environment: 'jsdom',    // ✅ for React and DOM-related hooks
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})