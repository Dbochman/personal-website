import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for console error monitoring
 *
 * This config is optimized for CI/CD deployment checks to catch
 * console warnings and errors before they reach production.
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run
  timeout: 30 * 1000,

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Reporter to use
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/console-errors.json' }],
    ['list']
  ],

  // Visual comparison settings
  expect: {
    toHaveScreenshot: {
      // Allow small differences for anti-aliasing and font rendering
      maxDiffPixelRatio: 0.01,
      // Threshold for color difference (0-1)
      threshold: 0.2,
    },
  },

  // Snapshot output directory
  snapshotDir: './tests/e2e/snapshots',
  snapshotPathTemplate: '{snapshotDir}/{testFileName}/{arg}{ext}',

  use: {
    // Base URL for tests
    baseURL: process.env.BASE_URL || 'http://localhost:8080',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Consistent viewport for visual tests
    viewport: { width: 1280, height: 720 },
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /visual\.spec\.ts/,
    },
    {
      name: 'visual-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      testMatch: /visual\.spec\.ts/,
    },
  ],

  // Run local dev server before starting tests (only in local dev)
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: true, // Always reuse existing server
  },
});
