import { test, expect } from '@playwright/test';

/**
 * Visual regression tests using Playwright screenshots.
 * Compares against baseline screenshots to detect unintended UI changes.
 *
 * Run with: npx playwright test visual.spec.ts
 * Update baselines: npx playwright test visual.spec.ts --update-snapshots
 */

const pages = [
  { name: 'home', path: '/' },
  { name: 'blog', path: '/blog' },
  { name: 'projects', path: '/projects' },
  { name: 'slo-calculator', path: '/projects/slo-calculator' },
];

// Disable animations for consistent screenshots
async function disableAnimations(page: import('@playwright/test').Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });
}

test.describe('Visual Regression - Light Mode', () => {
  for (const pageConfig of pages) {
    test(`${pageConfig.name} page`, async ({ page }) => {
      await page.goto(pageConfig.path);
      await page.waitForLoadState('networkidle');
      await disableAnimations(page);

      await expect(page).toHaveScreenshot(`${pageConfig.name}-light.png`, {
        fullPage: true,
        animations: 'disabled',
        mask: [
          // Mask any dynamic content that changes between runs
          page.locator('[data-testid="current-time"]'),
          page.locator('[data-testid="dynamic-content"]'),
        ],
      });
    });
  }
});

test.describe('Visual Regression - Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Set dark mode before navigating
    await page.addInitScript(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
  });

  for (const pageConfig of pages) {
    test(`${pageConfig.name} page`, async ({ page }) => {
      await page.goto(pageConfig.path);
      await page.waitForLoadState('networkidle');
      await disableAnimations(page);

      // Ensure dark mode is applied
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      await expect(page).toHaveScreenshot(`${pageConfig.name}-dark.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
});

test.describe('Visual Regression - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  for (const pageConfig of pages) {
    test(`${pageConfig.name} page`, async ({ page }) => {
      await page.goto(pageConfig.path);
      await page.waitForLoadState('networkidle');
      await disableAnimations(page);

      await expect(page).toHaveScreenshot(`${pageConfig.name}-mobile.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });
  }
});

test.describe('Visual Regression - Components', () => {
  test('blog card hover state', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    await disableAnimations(page);

    const card = page.locator('article').first();
    await card.hover();

    // Small delay for hover effects to apply
    await page.waitForTimeout(100);

    await expect(card).toHaveScreenshot('blog-card-hover.png');
  });

  test('expertise card expanded', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await disableAnimations(page);

    // Click to expand first expertise card
    const expertiseButton = page.locator('button[aria-controls^="expertise-panel-"]').first();
    if (await expertiseButton.isVisible()) {
      await expertiseButton.click();
      await page.waitForTimeout(100);

      const sidebar = page.locator('.lg\\:sticky').first();
      await expect(sidebar).toHaveScreenshot('expertise-expanded.png');
    }
  });
});
