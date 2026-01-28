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
  return posts[0]?.replace('.txt', '') || '2026-01-04-hello-world';
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
    test(`@smoke ${page.name} should have no critical console errors`, async ({ page: playwright }) => {
      const consoleMessages: ConsoleMessage[] = [];
      const failed404Urls = new Map<string, string>(); // url -> content-type

      // Listen for 404 responses to filter expected ones
      playwright.on('response', response => {
        if (response.status() === 404) {
          const contentType = response.headers()['content-type'] || '';
          failed404Urls.set(response.url(), contentType);
        }
      });

      // Listen for console messages
      playwright.on('console', msg => {
        const type = msg.type();
        if (type === 'error' || type === 'warning') {
          const text = msg.text();
          // Skip expected 404s:
          // - Giscus API 404s (no discussions yet)
          // - SPA routing 404s (HTML document 404s from GitHub Pages 404.html redirect)
          // NOTE: We do NOT ignore asset 404s (.js, .css, .json, images) as those indicate real issues
          if (text.includes('Failed to load resource') && text.includes('404')) {
            const isGiscus404 = Array.from(failed404Urls.keys()).some(url => /giscus\.app/.test(url));
            // Only ignore document/HTML 404s from our domain (SPA fallback), not asset 404s
            const isSpaFallback404 = Array.from(failed404Urls.entries()).some(([url, contentType]) => {
              const isOwnDomain = url.includes('dylanbochman.com') || url.includes('localhost');
              const isHtmlDocument = contentType.includes('text/html');
              // Also check URL doesn't look like an asset
              const isNotAsset = !/\.(js|css|json|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|ico)(\?|$)/i.test(url);
              return isOwnDomain && (isHtmlDocument || isNotAsset);
            });
            if (isGiscus404 || isSpaFallback404) {
              return; // Ignore expected 404s
            }
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

  test('@smoke Home page loads successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await expect(page).toHaveTitle(/Dylan Bochman/);
  });

  test('@smoke Blog list page loads successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog`);
    await expect(page).toHaveTitle(/Blog - Dylan Bochman/);
    await expect(page.locator('main h1').first()).toContainText('Blog');
  });

  test('@smoke Blog post page loads successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/${newestPost}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('article.prose')).toBeVisible();
  });

  test('@smoke Runbook page loads successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/runbook`);
    await expect(page.getByRole('heading', { name: 'Operational Runbook' })).toBeVisible();
  });

  test('@smoke 404 page renders for non-existent route', async ({ page }) => {
    await page.goto(`${BASE_URL}/this-page-does-not-exist`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=404')).toBeVisible();
  });
});
