import { test, expect } from '@playwright/test';

test.describe('@smoke Diagram dependency compatibility', () => {
  test('all incident diagrams render after switching tabs', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/projects/incident-command-diagrams');
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(3);
    for (let index = 0; index < 3; index++) {
      await tabs.nth(index).click();
      const svg = page.getByLabel('Animated Mermaid diagram').locator('svg');
      await expect(svg).toBeVisible();
      await expect(svg.locator('g.node').first()).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test('minified MDX still renders its embedded interactive diagram', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/blog/2026-01-24-retrospectives-that-actually-change-things');
    await expect(page.getByRole('heading', { name: 'Retrospectives That Actually Change Things', level: 1 })).toBeVisible();
    const svg = page.getByLabel('Animated Mermaid diagram').locator('svg');
    await expect(svg).toBeVisible();
    await expect(svg.locator('g.node').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});
