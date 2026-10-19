import { test, expect } from '@playwright/test';

test.describe('@smoke Dependency migration', () => {
  test('the SLO chart renders its Recharts 3 tooltip on hover', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/projects/slo-tool?mode=burndown');
    const chart = page.locator('.recharts-wrapper').first();
    await expect(chart.locator('svg.recharts-surface')).toBeVisible();
    const bounds = await chart.boundingBox();
    if (!bounds) throw new Error('Chart has no bounds');
    await chart.hover({ position: { x: bounds.width / 3, y: bounds.height / 2 } });
    const tooltip = chart.locator('.recharts-tooltip-wrapper');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('Ideal:');
    expect(errors).toEqual([]);
  });

  test('custom blog typography remains styled without the unused plugin', async ({ page }) => {
    await page.goto('/blog/2026-03-31-axios-supply-chain-attack');
    const article = page.locator('article');
    await expect(article.locator('h2').first()).toHaveCSS('font-size', '30px');
    await expect(article.locator('p').first()).toHaveCSS('line-height', '28px');
    await expect(article.locator('ul').first()).toHaveCSS('list-style-type', 'disc');
    await expect(article.locator('a').first()).toHaveCSS('text-decoration-line', 'underline');
  });
});
