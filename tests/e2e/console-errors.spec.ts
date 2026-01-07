import { test, expect } from '@playwright/test';

/**
 * Console Error Monitoring Test
 *
 * This test suite monitors console warnings and errors on the deployed site.
 * It runs after each deployment to catch issues before they impact users.
 */

interface ConsoleMessage {
  type: 'error' | 'warning';
  text: string;
  url: string;
  timestamp: string;
}

// Patterns to ignore (known/acceptable warnings)
const IGNORED_PATTERNS = [
  // Google Analytics cookie warnings are expected
  /cookie/i,
  // Download the React DevTools extension warnings
  /react devtools/i,
  // React Fast Refresh (HMR) errors in development only
  /RefreshRuntime/i,
  /Failed to fetch dynamically imported module/i,
];

function shouldIgnoreMessage(message: string): boolean {
  return IGNORED_PATTERNS.some(pattern => pattern.test(message));
}

test.describe('Console Error Monitoring', () => {
  const pagesToTest = [
    { name: 'Home Page', url: '/' },
    { name: 'Blog List Page', url: '/blog' },
    { name: 'Blog Post Page', url: '/blog/2026-01-getting-started-with-sre' },
    { name: 'Runbook Page', url: '/runbook.html' },
  ];

  for (const page of pagesToTest) {
    test(`${page.name} should have no critical console errors`, async ({ page: playwright }) => {
      const consoleMessages: ConsoleMessage[] = [];

      // Listen for console messages
      playwright.on('console', msg => {
        const type = msg.type();
        if (type === 'error' || type === 'warning') {
          const text = msg.text();
          if (!shouldIgnoreMessage(text)) {
            consoleMessages.push({
              type: type as 'error' | 'warning',
              text,
              url: playwright.url(),
              timestamp: new Date().toISOString(),
            });
          }
        }
      });

      // Listen for page errors (uncaught exceptions)
      playwright.on('pageerror', error => {
        const text = error.message;
        if (!shouldIgnoreMessage(text)) {
          consoleMessages.push({
            type: 'error',
            text: `Uncaught Exception: ${text}`,
            url: playwright.url(),
            timestamp: new Date().toISOString(),
          });
        }
      });

      // Navigate to the page
      await playwright.goto(page.url);

      // Wait for page to be fully loaded
      await playwright.waitForLoadState('networkidle');

      // Additional wait to catch any lazy-loaded script errors
      await playwright.waitForTimeout(2000);

      // Log all collected messages for debugging
      if (consoleMessages.length > 0) {
        console.log(`\n🚨 Console messages found on ${page.name}:`);
        consoleMessages.forEach(msg => {
          const emoji = msg.type === 'error' ? '❌' : '⚠️';
          console.log(`${emoji} [${msg.type.toUpperCase()}] ${msg.text}`);
        });
        console.log(''); // Empty line for readability
      }

      // Separate errors from warnings
      const errors = consoleMessages.filter(m => m.type === 'error');
      const warnings = consoleMessages.filter(m => m.type === 'warning');

      // Fail test if there are console errors
      expect(errors, `Found ${errors.length} console error(s) on ${page.name}`).toHaveLength(0);

      // Log warnings but don't fail (informational only)
      if (warnings.length > 0) {
        console.log(`ℹ️  Found ${warnings.length} warning(s) on ${page.name} (non-critical)`);
      }
    });
  }

  test('Home page loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Dylan Bochman/);
  });

  test('Blog list page loads successfully', async ({ page }) => {
    await page.goto('/blog');
    await expect(page).toHaveTitle(/Blog - Dylan Bochman/);
    await expect(page.locator('h1')).toContainText('Blog');
  });

  test('Blog post page loads successfully', async ({ page }) => {
    await page.goto('/blog/2026-01-getting-started-with-sre');
    await expect(page).toHaveTitle(/Getting Started with SRE/);
  });

  test('Runbook page loads successfully', async ({ page }) => {
    await page.goto('/runbook.html');
    await expect(page.locator('h1.page-title')).toContainText('Operational Runbook');
  });
});
