import { test, expect } from '@playwright/test';
import { readdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

// Dynamically discover blog posts from content/blog/
function getBlogSlugs(): string[] {
  const blogDir = join(process.cwd(), 'content/blog');
  return readdirSync(blogDir)
    .filter(f => f.endsWith('.txt'))
    .map(f => f.replace('.txt', ''))
    .sort()
    .reverse()
    .slice(0, 5); // Test newest 5 posts
}

test.describe('Blog Post Smoke Tests', () => {
  const blogSlugs = getBlogSlugs();

  for (const slug of blogSlugs) {
    test(`should render ${slug} without errors`, async ({ page }) => {
      await page.goto(`${BASE_URL}/blog/${slug}`);
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
