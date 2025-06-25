import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,           // ✅ enables describe/it/expect without imports
    environment: 'jsdom',    // ✅ for React and DOM-related hooks
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: './vitest-setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})