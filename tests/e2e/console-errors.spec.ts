import { test, expect } from '@playwright/test';
import { readdirSync } from 'fs';
import { join } from 'path';

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

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

// Get newest blog post slug dynamically
function getNewestBlogSlug(): string {
  const blogDir = join(process.cwd(), 'content/blog');
  const posts = readdirSync(blogDir)
    .filter(f => f.endsWith('.txt'))
    .sort()
    .reverse();
  return posts[0]?.replace('.txt', '') || '2025-01-04-hello-world';
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
  // Giscus API 404s are expected when no discussions exist yet
  /giscus\.app\/api\/discussions/i,
  // Giscus comment widget warnings are expected
  /\[giscus\]/i,
];

function shouldIgnoreMessage(message: string): boolean {
  return IGNORED_PATTERNS.some(pattern => pattern.test(message));
}

test.describe('Console Error Monitoring', () => {
  const newestPost = getNewestBlogSlug();
  const pagesToTest = [
    { name: 'Home Page', url: '/' },
    { name: 'Blog List Page', url: '/blog' },
    { name: 'Blog Post Page', url: `/blog/${newestPost}` },
    { name: 'Runbook Page', url: '/runbook' },
  ];

  for (const page of pagesToTest) {
    test(`${page.name} should have no critical console errors`, async ({ page: playwright }) => {
      const consoleMessages: ConsoleMessage[] = [];
      const failed404Urls = new Set<string>();

      // Listen for 404 responses to filter Giscus
      playwright.on('response', response => {
        if (response.status() === 404) {
          failed404Urls.add(response.url());
        }
      });

      // Listen for console messages
      playwright.on('console', msg => {
        const type = msg.type();
        if (type === 'error' || type === 'warning') {
          const text = msg.text();
          // Skip if the error is about a Giscus 404 (which we already tracked)
          if (text.includes('Failed to load resource') && Array.from(failed404Urls).some(url => /giscus\.app/.test(url))) {
            return; // Ignore Giscus 404s
          }
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
      await playwright.goto(`${BASE_URL}${page.url}`);

      // Wait for page to be fully loaded
      await playwright.waitForLoadState('networkidle');

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
    await page.goto(`${BASE_URL}/`);
    await expect(page).toHaveTitle(/Dylan Bochman/);
  });

  test('Blog list page loads successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog`);
    await expect(page).toHaveTitle(/Blog - Dylan Bochman/);
    // Use more specific selector to avoid matching multiple h1 elements
    await expect(page.locator('main h1').first()).toContainText('Blog');
  });

  test('Blog post page loads successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/${newestPost}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('article.prose')).toBeVisible();
  });

  test('Runbook page loads successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/runbook`);
    await expect(page.getByRole('heading', { name: 'Operational Runbook' })).toBeVisible();
  });

  test('404 page renders for non-existent route', async ({ page }) => {
    await page.goto(`${BASE_URL}/this-page-does-not-exist`);
    await page.waitForLoadState('networkidle');
    // Verify 404 page renders with expected content
    await expect(page.locator('text=404')).toBeVisible();
  });
});
