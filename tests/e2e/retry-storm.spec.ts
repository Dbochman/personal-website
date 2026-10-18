import { test, expect, type Page } from '@playwright/test';

const ROUTE = '/projects/retry-storm-simulator';

const verdict = (page: Page) => page.getByTestId('retry-storm-verdict');

test.describe('@smoke Retry Storm Simulator', () => {
  test('replaces the retired right-sizer in the project catalog', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: 'Retry Storm Simulator', level: 3 })).toBeVisible();
    await expect(page.getByText('K8s Resource Right-Sizer')).toHaveCount(0);
  });

  for (const legacy of ['/projects/k8s-rightsizer', '/projects/k8s-rightsizer/']) {
    test(`legacy link ${legacy} lands on the simulator`, async ({ page }) => {
      await page.goto(legacy);
      await expect(page).toHaveURL(new RegExp(`${ROUTE}$`));
      await expect(page.getByRole('heading', { name: 'Retry Storm Simulator', level: 1 })).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `https://dylanbochman.com${ROUTE}`
      );
    });
  }

  test('scenarios change the verdict and persist in the URL', async ({ page }) => {
    await page.goto(ROUTE);
    await expect(verdict(page)).toContainText('Not recovered by 120s');

    await page.getByRole('button', { name: 'Hardened failover' }).click();
    await expect(verdict(page)).toContainText('Recovered');
    await expect.poll(() => new URL(page.url()).searchParams.get('shed')).toBe('1');
    expect(new URL(page.url()).searchParams.get('budget')).toBe('10');

    await page.reload();
    await expect(page.getByRole('button', { name: 'Hardened failover' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('checkbox', { name: 'Server sheds abandoned work' })).toBeChecked();
  });

  test('policy controls work from the keyboard', async ({ page }) => {
    await page.goto(ROUTE);
    const attempts = page.getByRole('radiogroup', { name: 'Attempts per layer' });
    await attempts.getByRole('radio', { name: '3' }).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(attempts.getByRole('radio', { name: '2', exact: true })).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(attempts.getByRole('radio', { name: '1 (off)' })).toBeFocused();
    await page.keyboard.press('Space');
    await expect(attempts.getByRole('radio', { name: '1 (off)' })).toHaveAttribute('aria-checked', 'true');
    await expect(verdict(page)).toContainText('Recovered, but');

    const load = page.getByRole('slider', { name: 'Normal load' });
    await load.focus();
    await page.keyboard.press('Home');
    await expect(load).toHaveAttribute('aria-valuenow', '5');
    await expect.poll(() => new URL(page.url()).searchParams.get('load')).toBe('5');
  });
});

test.describe('@smoke Retry Storm Simulator on narrow screens', () => {
  test.use({ viewport: { width: 320, height: 900 }, hasTouch: true, reducedMotion: 'reduce' });

  test('fits 320px without horizontal overflow', async ({ page }) => {
    await page.goto(ROUTE);
    await expect(verdict(page)).toBeVisible();
    await page.getByRole('button', { name: /How the model works/ }).tap();
    await page.getByRole('button', { name: /Envoy starting point/ }).tap();
    await expect(page.getByText('retry_policy:')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });
});
