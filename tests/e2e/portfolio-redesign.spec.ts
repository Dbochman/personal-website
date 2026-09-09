import { test, expect } from '@playwright/test';

test.describe('@smoke portfolio redesign', () => {
  test('home exposes tools and experience without hidden article downloads', async ({ page }) => {
    const articleRequests: string[] = [];
    page.on('request', request => {
      if (/\/assets\/20\d{2}-.*\.js/.test(request.url())) articleRequests.push(request.url());
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'NVIDIA', exact: true })).toBeVisible();
    await expect(page.locator('#selected-work img')).toHaveCount(3);
    expect(articleRequests).toEqual([]);
    const profile = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(profile.map(value => JSON.parse(value)).find(value => value['@type'] === 'ProfilePage').mainEntity.worksFor.name).toBe('NVIDIA');
    await page.getByRole('link', { name: 'Browse the blog ↗' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Blog' })).toBeVisible();
    expect(articleRequests).toEqual([]);
    await page.locator('article h2 a').first().click();
    await expect(page.locator('article.prose p').first()).toBeVisible();
    expect(articleRequests.length).toBeGreaterThan(0);
  });

  test('navigation and layout work at narrow widths in both themes', async ({ page }) => {
    for (const width of [320, 768]) {
      await page.setViewportSize({ width, height: 900 });
      for (const theme of ['light', 'dark']) {
        for (const route of ['/', '/blog', '/projects']) {
          await page.goto(`${route}?theme=${theme}`);
          await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
          expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
          if (width === 320) {
            await page.getByRole('button', { name: 'Open navigation menu' }).click();
            await expect(page.getByRole('dialog').getByRole('link', { name: route === '/' ? 'Home' : route === '/blog' ? 'Blog' : 'Projects', exact: true })).toHaveAttribute('aria-current', 'page');
            await page.keyboard.press('Escape');
          }
        }
      }
    }
  });
});

test('@smoke article attribution and prerendered bodies match their authors', async ({ page, request }) => {
  for (const author of ['Dylan', 'Claude', 'Dylan & Claude']) {
    await page.goto(`/blog?author=${encodeURIComponent(author)}`);
    await page.locator('article h3 a').first().click();
    await expect(page.locator('article.prose p').first()).toBeVisible();
    const schema = await page.locator('script[type="application/ld+json"]').allTextContents();
    const article = schema.map(value => JSON.parse(value)).find(value => value['@type'] === 'BlogPosting');
    if (author === 'Claude') {
      expect(article.author).toBeUndefined();
      expect(article.creditText).toBe('Written by Claude, an AI assistant');
    } else {
      expect(article.author.name).toBe('Dylan Bochman');
      expect(article.creditText.includes('Claude')).toBe(author.includes('Claude'));
    }
    const html = await (await request.get(page.url())).text();
    const body = await page.evaluate(source => new DOMParser().parseFromString(source, 'text/html').querySelector('article.prose')?.textContent, html);
    expect(body?.length).toBeGreaterThan(100);
    expect(body).not.toContain('Loading article');
  }
});

test('@smoke heading links work after a delayed article load', async ({ page }) => {
  const path = '/blog/2026-01-13-slo-uptime-calculator';
  await page.goto(path);
  const heading = page.locator('article.prose h2').nth(1);
  await expect(heading).toBeVisible();
  const id = await heading.getAttribute('id');
  expect(id).toBeTruthy();
  const link = heading.locator('a');
  await expect(link).toHaveAttribute('href', `#${id}`);
  await expect(link).not.toHaveAttribute('target', '_blank');
  await link.click();
  await expect(heading).toBeInViewport();

  // Force a slow, uncached body request on a fresh document navigation.
  await page.route('**/assets/2026-01-13-slo-uptime-calculator-*.js', async route => {
    await new Promise(resolve => setTimeout(resolve, 500));
    await route.continue();
  });
  await page.goto(`${path}#${id}`);
  await expect(heading).toBeVisible();
  await expect.poll(async () => (await heading.boundingBox())?.y).toBeLessThan(150);
  await expect.poll(async () => (await heading.boundingBox())?.y).toBeGreaterThanOrEqual(0);
});
