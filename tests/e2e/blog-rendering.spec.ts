import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Blog Post Smoke Tests', () => {
  const blogPosts = [
    { slug: '2025-01-04-hello-world', title: 'Hello, World' },
    { slug: '2025-01-05-notes-on-building-this-site-together', title: 'Notes on Building This Site Together' },
    { slug: '2025-01-07-uptime-monitoring-for-a-personal-site', title: 'Why We Monitor a Site Nobody Depends On' },
  ];

  for (const post of blogPosts) {
    test(`should render ${post.slug} without errors`, async ({ page }) => {
      await page.goto(`${BASE_URL}/blog/${post.slug}`);
      await page.waitForLoadState('networkidle');

      // Verify article content exists
      const article = page.locator('article.prose');
      await expect(article).toBeVisible();

      // Verify has content
      const paragraphs = page.locator('article p');
      const count = await paragraphs.count();
      expect(count).toBeGreaterThan(0);

      // Verify title renders
      await expect(page.locator('main h1').first()).toBeVisible();

      // Verify metadata exists
      await expect(page.locator('time[datetime]').first()).toBeVisible();
    });
  }
});
