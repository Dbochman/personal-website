import { test, expect } from '@playwright/test';

test.describe('@smoke Blog discovery regressions', () => {
  test('featured posts participate in search without duplicate cards', async ({ page }) => {
    await page.goto('/blog');
    const title = await page.locator('article h2').first().innerText();
    await page.getByRole('searchbox', { name: 'Search posts' }).pressSequentially(title);
    await expect(page.getByRole('heading', { name: title, level: 3 })).toBeVisible();
    await expect(page.getByRole('link', { name: title, exact: true })).toHaveCount(1);
    await expect(page.getByText('No posts found matching your criteria.')).toHaveCount(0);
    await expect(page.getByText('Featured', { exact: true })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('searchbox')).toHaveValue(title);
    await expect(page.getByRole('heading', { name: title, level: 3 })).toBeVisible();
  });

  test('joint-author bylines filter to joint-authored articles', async ({ page }) => {
    await page.goto('/blog');
    await page.getByRole('link', { name: 'Dylan & Claude', exact: true }).first().click();
    await expect(page.getByRole('combobox', { name: 'Filter by author' })).toContainText('Dylan & Claude');
    expect(new URL(page.url()).searchParams.get('author')).toBe('Dylan & Claude');
    const bylines = page.locator('article a[href^="/blog?author="]');
    await expect(bylines.first()).toBeVisible();
    expect((await bylines.allTextContents()).every(author => author === 'Dylan & Claude')).toBe(true);
    await page.reload();
    await expect(page.getByRole('combobox', { name: 'Filter by author' })).toContainText('Dylan & Claude');
  });

  test('keyboard tags, sorting, history and clear preserve URL state', async ({ page }) => {
    await page.goto('/blog?theme=dark');
    const tag = page.getByRole('button', { name: 'SRE', exact: true });
    await tag.focus();
    await page.keyboard.press('Space');
    await expect(tag).toHaveAttribute('aria-pressed', 'true');
    expect(new URL(page.url()).searchParams.getAll('tag')).toEqual(['SRE']);

    await page.goBack();
    await expect(tag).toHaveAttribute('aria-pressed', 'false');
    await page.goForward();
    await expect(tag).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('combobox', { name: 'Sort posts by' }).click();
    await page.getByRole('option', { name: 'Oldest First' }).click();
    // Radix restores focus after the menu's exit animation. Finish that
    // interaction before focusing the search field for the next one.
    await expect(page.getByRole('combobox', { name: 'Sort posts by' })).toBeFocused();
    await page.getByRole('searchbox').pressSequentially('no-matching-article-123');
    await expect(page.getByRole('searchbox')).toHaveValue('no-matching-article-123');
    await page.reload();
    await expect(tag).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('combobox', { name: 'Sort posts by' })).toContainText('Oldest First');
    await expect(page.getByRole('searchbox')).toHaveValue('no-matching-article-123');
    await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
    await expect(page.getByRole('searchbox')).toHaveValue('');
    await expect(tag).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('combobox', { name: 'Sort posts by' })).toContainText('Newest First');
    expect(new URL(page.url()).search).toBe('?theme=dark');
  });
});

test.describe('@smoke Mobile accessibility regressions', () => {
  test.use({ viewport: { width: 320, height: 900 }, hasTouch: true, reducedMotion: 'reduce' });

  test('expertise details expand and collapse on touch', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    const button = page.getByRole('button', { name: 'Site Reliability Engineering', exact: true });
    const panel = page.locator(`#${await button.getAttribute('aria-controls')}`);
    await expect(panel).toHaveAttribute('aria-hidden', 'true');
    await button.tap();
    await expect(panel).toHaveAttribute('aria-hidden', 'false');
    await expect.poll(async () => (await panel.boundingBox())?.height ?? 0).toBeGreaterThan(0);
    await expect(panel.getByText(/Building and maintaining reliable/)).toBeVisible();
    await button.tap();
    await expect(panel).toHaveAttribute('aria-hidden', 'true');
    await expect.poll(async () => (await panel.boundingBox())?.height ?? 0).toBe(0);
  });

  test('SLO mode selector is named and changes the visible calculation', async ({ page }) => {
    await page.goto('/projects/slo-tool');
    const mode = page.getByRole('combobox', { name: 'Calculation mode' });
    await expect(mode).toBeVisible();
    await mode.tap();
    await page.getByRole('option', { name: 'Target', exact: true }).tap();
    await expect(mode).toContainText('Target');
    await expect(page.getByRole('tabpanel', { name: 'Can I meet this SLO?' })).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(0);
  });

  test('runbook fits narrow screens without document overflow', async ({ page }) => {
    await page.goto('/runbook');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    // Linux fallback font metrics make long documentation filenames wider.
    await page.addStyleTag({ content: "main { font-family: Arial, sans-serif; }" });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });
});
