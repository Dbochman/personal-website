import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Theme Toggle and Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('theme toggle changes dark class and icon', async ({ page }) => {
    const desktopToggle = page.locator('nav.hidden.md\\:flex button[aria-label="Toggle dark mode"]');

    const initialIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    await desktopToggle.click();

    const afterClickIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(afterClickIsDark).toBe(!initialIsDark);

    // Verify icon changed
    if (afterClickIsDark) {
      await expect(page.locator('[data-testid="icon-sun"]').first()).toBeVisible();
    } else {
      await expect(page.locator('[data-testid="icon-moon"]').first()).toBeVisible();
    }
  });

  test('theme toggle updates URL parameter', async ({ page }) => {
    const desktopToggle = page.locator('nav.hidden.md\\:flex button[aria-label="Toggle dark mode"]');

    await desktopToggle.click();

    const url = new URL(page.url());
    expect(url.searchParams.has('theme')).toBe(true);
    expect(['dark', 'light']).toContain(url.searchParams.get('theme'));
  });

  test('URL params set theme on page load', async ({ page }) => {
    // Test dark param
    await page.goto(`${BASE_URL}?theme=dark`);
    await page.waitForLoadState('networkidle');

    let isDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(isDark).toBe(true);
    await expect(page.locator('[data-testid="icon-sun"]').first()).toBeVisible();

    // Test light param
    await page.goto(`${BASE_URL}?theme=light`);
    await page.waitForLoadState('networkidle');

    isDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(isDark).toBe(false);
    await expect(page.locator('[data-testid="icon-moon"]').first()).toBeVisible();
  });

  test('theme persists across multiple navigations', async ({ page }) => {
    const desktopToggle = page.locator('nav.hidden.md\\:flex button[aria-label="Toggle dark mode"]');

    // Ensure dark mode
    const initialIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    if (!initialIsDark) {
      await desktopToggle.click();
    }

    // Home → Blog
    await page.locator('a[href="/blog"]').first().click();
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);

    // Blog → Blog Post
    await page.locator('a[href^="/blog/2"]').first().click();
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);

    // Blog Post → Home
    await page.locator('a[href="/"]').first().click();
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);
  });
});

test.describe('Mobile Theme Toggle', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('mobile theme toggle works', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const mobileToggle = page.locator('div.md\\:hidden button[aria-label="Toggle dark mode"]');
    await expect(mobileToggle).toBeVisible();

    const initialIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    await mobileToggle.click();

    const afterClickIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(afterClickIsDark).toBe(!initialIsDark);
  });

  test('mobile theme persists via mobile nav', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Set to dark mode
    const mobileToggle = page.locator('div.md\\:hidden button[aria-label="Toggle dark mode"]');
    const initialIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    if (!initialIsDark) {
      await mobileToggle.click();
    }

    // Navigate via mobile menu
    await page.locator('button:has([class*="lucide-menu"])').click();
    await page.locator('[role="dialog"] a[href="/blog"]').click();
    await page.waitForLoadState('networkidle');

    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);
  });
});
