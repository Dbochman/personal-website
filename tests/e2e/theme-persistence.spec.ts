import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Theme Toggle and Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing theme preference by going to page without params
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('desktop theme toggle changes icon and adds dark class', async ({ page }) => {
    // Find the desktop toggle (hidden on mobile, so we check the nav one)
    const desktopToggle = page.locator('nav.hidden.md\\:flex button[aria-label="Toggle dark mode"]');

    // Get initial state
    const initialIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    // Click toggle
    await desktopToggle.click();

    // Verify dark class toggled
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

    // Click toggle
    await desktopToggle.click();

    // Check URL has theme param
    const url = new URL(page.url());
    expect(url.searchParams.has('theme')).toBe(true);
    expect(['dark', 'light']).toContain(url.searchParams.get('theme'));
  });

  test('theme persists when navigating from home to blog', async ({ page }) => {
    // Set theme to dark
    const desktopToggle = page.locator('nav.hidden.md\\:flex button[aria-label="Toggle dark mode"]');

    // Get initial state and ensure we're in dark mode
    const initialIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    if (!initialIsDark) {
      await desktopToggle.click();
    }

    // Verify we're now in dark mode
    await expect(page.locator('[data-testid="icon-sun"]').first()).toBeVisible();

    // Navigate to blog using click (simulates real user behavior)
    const blogLink = page.locator('a[href="/blog"]').first();
    await blogLink.click();
    await page.waitForLoadState('networkidle');

    // Verify still in dark mode
    const blogIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(blogIsDark).toBe(true);

    // Verify icon still shows sun (indicating dark mode)
    await expect(page.locator('[data-testid="icon-sun"]').first()).toBeVisible();
  });

  test('theme persists when navigating to individual blog post', async ({ page }) => {
    // Navigate to blog first
    await page.goto(`${BASE_URL}/blog`);
    await page.waitForLoadState('networkidle');

    // Set theme to dark
    const desktopToggle = page.locator('nav.hidden.md\\:flex button[aria-label="Toggle dark mode"]');
    const initialIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    if (!initialIsDark) {
      await desktopToggle.click();
    }

    // Click first blog post link
    const firstPostLink = page.locator('a[href^="/blog/2"]').first();
    await firstPostLink.click();
    await page.waitForLoadState('networkidle');

    // Verify still in dark mode
    const postIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(postIsDark).toBe(true);
  });

  test('URL param ?theme=dark sets dark mode on page load', async ({ page }) => {
    await page.goto(`${BASE_URL}?theme=dark`);
    await page.waitForLoadState('networkidle');

    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(isDark).toBe(true);

    // Verify sun icon is shown (toggle to light)
    await expect(page.locator('[data-testid="icon-sun"]').first()).toBeVisible();
  });

  test('URL param ?theme=light sets light mode on page load', async ({ page }) => {
    await page.goto(`${BASE_URL}?theme=light`);
    await page.waitForLoadState('networkidle');

    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(isDark).toBe(false);

    // Verify moon icon is shown (toggle to dark)
    await expect(page.locator('[data-testid="icon-moon"]').first()).toBeVisible();
  });

  test('navigating back home preserves theme', async ({ page }) => {
    // Start on home, set to dark
    const desktopToggle = page.locator('nav.hidden.md\\:flex button[aria-label="Toggle dark mode"]');
    const initialIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    if (!initialIsDark) {
      await desktopToggle.click();
    }

    // Go to blog
    await page.locator('a[href="/blog"]').first().click();
    await page.waitForLoadState('networkidle');

    // Go back home
    await page.locator('a[href="/"]').first().click();
    await page.waitForLoadState('networkidle');

    // Should still be dark
    const finalIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(finalIsDark).toBe(true);
  });
});

test.describe('Mobile Theme Toggle', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test('mobile theme toggle works', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Mobile toggle should be visible
    const mobileToggle = page.locator('div.md\\:hidden button[aria-label="Toggle dark mode"]');
    await expect(mobileToggle).toBeVisible();

    const initialIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    // Click mobile toggle
    await mobileToggle.click();

    // Verify dark class toggled
    const afterClickIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(afterClickIsDark).toBe(!initialIsDark);
  });

  test('mobile theme persists across navigation', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Set to dark mode using mobile toggle
    const mobileToggle = page.locator('div.md\\:hidden button[aria-label="Toggle dark mode"]');
    const initialIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    if (!initialIsDark) {
      await mobileToggle.click();
    }

    // Open mobile nav and click blog
    const menuButton = page.locator('button:has([class*="lucide-menu"])');
    await menuButton.click();

    // Click blog link in mobile menu
    const blogLink = page.locator('[role="dialog"] a[href="/blog"]');
    await blogLink.click();
    await page.waitForLoadState('networkidle');

    // Should still be dark
    const blogIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(blogIsDark).toBe(true);
  });
});
