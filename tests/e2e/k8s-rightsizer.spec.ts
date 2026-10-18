import { test, expect } from '@playwright/test';

const ROUTE = '/projects/k8s-rightsizer';

test.describe('@smoke K8s Right-Sizer', () => {
  test('recommends, rejects ambiguous units, and keeps shareable state', async ({ page }) => {
    await page.goto(`${ROUTE}?theme=dark`);
    const results = page.getByRole('table', { name: 'Current and recommended resources' });
    const cpuRequest = results.getByRole('row', { name: /^CPU request/ });
    const yaml = page.getByLabel('Recommended resources YAML');
    await expect(cpuRequest).toContainText('220m');
    await expect(yaml).toContainText('memory: "448Mi"');

    // Lowercase m is millibytes for memory in Kubernetes, so this must not pass
    const memP95 = page.locator('#rightsizer-memP95');
    await memP95.fill('400m');
    await expect(memP95).toHaveAttribute('aria-invalid', 'true');
    await expect(memP95).toHaveAccessibleDescription(/Did you mean 400Mi\?/);
    await expect(yaml).toHaveCount(0);
    await memP95.fill('400Mi');
    await expect(yaml).toContainText('memory: "448Mi"');

    const posture = page.getByRole('slider', { name: 'Sizing posture' });
    await posture.focus();
    await page.keyboard.press('ArrowRight');
    await expect(posture).toHaveAttribute('aria-valuetext', 'Conservative');
    await expect(cpuRequest).toContainText('240m');

    await page.getByRole('checkbox', { name: 'Set a CPU limit' }).click();
    await expect(yaml).not.toContainText('cpu: "600m"');

    await expect.poll(() => new URL(page.url()).searchParams.get('posture')).toBe('conservative');
    await expect.poll(() => new URL(page.url()).searchParams.get('cpuLimitPolicy')).toBe('omit');
    expect(new URL(page.url()).searchParams.get('theme')).toBe('dark');
    await page.reload();
    await expect(page.getByRole('slider', { name: 'Sizing posture' })).toHaveAttribute('aria-valuetext', 'Conservative');
    await expect(page.getByRole('checkbox', { name: 'Set a CPU limit' })).not.toBeChecked();
    await expect(page.getByLabel('Recommended resources YAML')).toContainText('cpu: "240m"');
  });
});

test.describe('@smoke K8s Right-Sizer on narrow screens', () => {
  test.use({ viewport: { width: 320, height: 900 }, hasTouch: true });

  test('fits 320px, including validation messages', async ({ page }) => {
    await page.goto(ROUTE);
    await expect(page.getByRole('heading', { name: 'Recommendation' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

    await page.locator('#rightsizer-cpuMax').fill('9'.repeat(32));
    await expect(page.getByRole('heading', { name: 'No recommendation yet' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });
});
