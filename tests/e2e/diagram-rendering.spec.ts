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
      const svg = page.getByLabel('Animated Mermaid diagram').locator('svg.pele-flowchart');
      await expect(svg).toBeVisible();
      await expect(svg.locator('.pele-node').first()).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test('minified MDX still renders its embedded interactive diagram', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/blog/2026-01-24-retrospectives-that-actually-change-things');
    await expect(page.getByRole('heading', { name: 'Retrospectives That Actually Change Things', level: 1 })).toBeVisible();
    const svg = page.getByLabel('Animated Mermaid diagram').locator('svg.pele-flowchart');
    await expect(svg).toBeVisible();
    await expect(svg.locator('.pele-node').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('@smoke Pele walkthrough behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('play, pause, back, next, reset, decision branches and tab links', async ({ page }) => {
    await page.goto('/projects/incident-command-diagrams');
    const active = page.locator('.pele-node.node-active');
    await page.getByRole('button', { name: /Ready to Begin/ }).click();
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect(active).toHaveAttribute('data-id', 'A');
    await page.getByRole('button', { name: 'Next step', exact: true }).click();
    await expect(active).toHaveAttribute('data-id', 'B');
    await page.getByRole('button', { name: 'Previous step', exact: true }).click();
    await expect(active).toHaveAttribute('data-id', 'A');
    await page.getByRole('button', { name: 'Reset walkthrough' }).click();
    await expect(active).toHaveCount(0);
    await page.getByRole('button', { name: /Ready to Begin/ }).click();
    // Autoplay must stop on the decision, then remain there.
    await expect(active).toHaveAttribute('data-id', 'C', { timeout: 8000 });
    await expect(page.getByRole('button', { name: 'High Severity', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Low Severity', exact: true }).click();
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect(active).toHaveAttribute('data-id', 'F');
    await page.getByRole('button', { name: 'Next step', exact: true }).click();
    await expect(active).toHaveAttribute('data-id', 'G');
    await page.getByRole('button', { name: 'Escalate', exact: true }).click();
    await expect(active).toHaveAttribute('data-id', 'D');
    await page.getByRole('button', { name: 'View Details', exact: true }).click();
    await expect(page).toHaveURL(/#service-owner-paging$/);
    await expect(page.locator('.pele-node[data-id="A"]')).toContainText(/Issue identified in a specific\s*service/);
  });

  test('management continuation skips the other branch and supports the mitigation loop', async ({ page }) => {
    await page.goto('/projects/incident-command-diagrams#incident-management');
    const active = page.locator('.pele-node.node-active');
    await page.getByRole('button', { name: /Ready to Begin/ }).click();
    await expect(active).toHaveAttribute('data-id', 'C', { timeout: 8000 });
    await page.getByRole('button', { name: 'Page More', exact: true }).click();
    await expect(active).toHaveAttribute('data-id', 'D');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(active).toHaveAttribute('data-id', 'F');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByRole('button', { name: 'Next step', exact: true }).click();
    await page.getByRole('button', { name: 'Next step', exact: true }).click();
    await expect(active).toHaveAttribute('data-id', 'H');
    await page.getByRole('button', { name: 'No', exact: true }).click();
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByRole('button', { name: 'Next step', exact: true }).click();
    await expect(active).toHaveAttribute('data-id', 'K');
    await page.getByRole('button', { name: 'Not Stable', exact: true }).click();
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect(active).toHaveAttribute('data-id', 'F');
  });

  test('blog terminal branch completes and replays', async ({ page }) => {
    await page.goto('/blog/2026-01-24-retrospectives-that-actually-change-things');
    const active = page.locator('.pele-node.node-active');
    await page.getByRole('button', { name: /Ready to Begin/ }).click();
    await expect(active).toHaveAttribute('data-id', 'B');
    await page.getByRole('button', { name: 'Yes', exact: true }).click();
    await expect(active).toHaveAttribute('data-id', 'E');
    await page.getByRole('button', { name: 'Yes', exact: true }).click();
    await expect(active).toHaveAttribute('data-id', 'F');
    await page.getByRole('button', { name: 'Replay', exact: true }).click();
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect(active).toHaveAttribute('data-id', 'A');
  });

  test('resize preserves highlighting and theme colors update without replacing the SVG', async ({ page }) => {
    await page.goto('/projects/incident-command-diagrams?theme=light');
    await page.getByRole('button', { name: /Ready to Begin/ }).click();
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.setViewportSize({ width: 320, height: 800 });
    const active = page.locator('.pele-node.node-active');
    await expect(active).toHaveAttribute('data-id', 'A');
    const host = page.getByLabel('Animated Mermaid diagram');
    await expect(host.locator('svg.pele-flowchart')).toBeVisible();
    // Wait for the resize observer to replace and re-highlight the SVG.
    await expect.poll(() => host.locator('svg.pele-flowchart').evaluate(el => el.getBoundingClientRect().width))
      .toBeLessThanOrEqual(320);
    await expect(active).toHaveAttribute('data-id', 'A');
    const colors = await host.evaluate(el => {
      const svg = el.querySelector('svg')!;
      const label = svg.querySelector('.pele-label')!;
      const light = getComputedStyle(label).fill;
      document.documentElement.classList.add('dark');
      return { light, dark: getComputedStyle(label).fill, same: svg === el.querySelector('svg') };
    });
    expect(colors.dark).not.toBe(colors.light);
    expect(colors.same).toBe(true);
  });

  test('diagram assets stay lazy on the homepage', async ({ page }) => {
    const assets: string[] = [];
    page.on('request', request => assets.push(request.url()));
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(assets.filter(url => /\/(?:pele|flowchart-renderer|mermaid|katex)[^/]*\.js/.test(url))).toEqual([]);
  });

  test('paging decision completes and copied source remains Mermaid', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/projects/incident-command-diagrams#service-owner-paging');
    await page.getByText('View Mermaid source', { exact: true }).click();
    const source = await page.locator('[role="tabpanel"] pre').textContent();
    await page.getByRole('button', { name: 'Copy Mermaid', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Copied', exact: true })).toBeVisible();
    expect((await page.evaluate(() => navigator.clipboard.readText())).trim()).toBe(source?.trim());
    await page.getByRole('button', { name: /Ready to Begin/ }).click();
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    for (let step = 0; step < 6; step++) await page.getByRole('button', { name: 'Next step', exact: true }).click();
    await expect(page.locator('.node-active')).toHaveAttribute('data-id', 'G');
    await page.getByRole('button', { name: 'Not Found', exact: true }).click();
    await expect(page.locator('.node-active')).toHaveAttribute('data-id', 'J');
    await expect(page.getByRole('button', { name: 'Replay', exact: true })).toBeVisible();
  });

  test('all four diagrams support zoom and keyboard playback at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const id of ['incident-escalation', 'incident-management', 'service-owner-paging', 'blog']) {
      await page.goto(id === 'blog'
        ? '/blog/2026-01-24-retrospectives-that-actually-change-things'
        : `/projects/incident-command-diagrams#${id}`);
      const host = page.getByLabel('Animated Mermaid diagram');
      const svg = host.locator('svg.pele-flowchart');
      await expect(svg).toBeVisible();
      await host.getByRole('button', { name: 'Zoom in', exact: true }).click();
      await expect(host.getByRole('button', { name: 'Zoom out', exact: true })).toBeEnabled();
      await host.getByRole('button', { name: 'Reset zoom' }).click();
      await expect(host.getByRole('button', { name: 'Zoom out', exact: true })).toBeDisabled();
      await page.getByRole('button', { name: /Ready to Begin/ }).focus();
      await page.keyboard.press('Enter');
      await page.getByRole('button', { name: 'Pause', exact: true }).click();
      await expect(host.locator('.node-active')).toHaveAttribute('data-id', 'A');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    expect(errors).toEqual([]);
  });
});
