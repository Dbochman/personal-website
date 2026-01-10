import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Blog Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/blog`);
    await page.waitForLoadState('networkidle');
    // Wait for blog posts to render
    await page.waitForSelector('[class*="card"], a[href^="/blog/2"]', { timeout: 10000 });
  });

  test('sort selector changes post order', async ({ page }) => {
    // Get initial first post title
    const getFirstTitle = () => page.locator('a[href^="/blog/2"] h3, a[href^="/blog/2"] [class*="CardTitle"]').first().textContent();
    const firstPostBefore = await getFirstTitle();

    // Click sort trigger to open dropdown
    await page.locator('button:has-text("Newest First")').click();
    // Click "Oldest First" option
    await page.locator('[role="option"]:has-text("Oldest First")').click();
    await page.waitForTimeout(300);

    const firstPostAfter = await getFirstTitle();
    expect(firstPostAfter).not.toBe(firstPostBefore);
  });

  test('sort selector has all options', async ({ page }) => {
    // Open sort dropdown
    await page.locator('button:has-text("Newest First")').click();
    await page.waitForSelector('[role="listbox"]');

    // Verify all options exist
    await expect(page.locator('[role="option"]:has-text("Newest First")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("Oldest First")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("Longest First")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("Shortest First")')).toBeVisible();
  });

  test('search filters posts', async ({ page }) => {
    // Get initial post count
    const initialCount = await page.locator('a[href^="/blog/2"]').count();
    expect(initialCount).toBeGreaterThan(1);

    // Search for a specific term that exists in some posts
    await page.locator('input[placeholder*="earch"]').fill('architecture');
    await page.waitForTimeout(500);

    // Should have fewer or equal posts
    const filteredCount = await page.locator('a[href^="/blog/2"]').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('search with no results shows empty state', async ({ page }) => {
    await page.locator('input[placeholder*="earch"]').fill('xyznonexistent123');
    await page.waitForTimeout(500);

    // Should show "No posts found" message
    await expect(page.locator('text=No posts found')).toBeVisible();
  });

  test('tag filter shows matching posts', async ({ page }) => {
    // Get initial count
    const initialCount = await page.locator('a[href^="/blog/2"]').count();

    // Find a tag badge and click it (using the filter section badges)
    const filterSection = page.locator('text=Filter by tag:').locator('..');
    const tagBadge = filterSection.locator('[class*="badge"], button').first();

    if (await tagBadge.count() === 0) {
      test.skip();
      return;
    }

    await tagBadge.click();
    await page.waitForTimeout(300);

    const filteredCount = await page.locator('a[href^="/blog/2"]').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('clear filters button works', async ({ page }) => {
    // Apply search filter
    await page.locator('input[placeholder*="earch"]').fill('xyznonexistent123');
    await page.waitForTimeout(300);

    // Verify empty state
    await expect(page.locator('text=No posts found')).toBeVisible();

    // Click clear filters
    await page.locator('text=Clear filters').click();
    await page.waitForTimeout(300);

    // Posts should be visible again
    const count = await page.locator('a[href^="/blog/2"]').count();
    expect(count).toBeGreaterThan(0);
  });
});
