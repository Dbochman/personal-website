import { test, expect } from '@playwright/test';
import { build } from 'esbuild';

test.describe('@smoke Dependency migration', () => {
  test('Mermaid renders math labels with its upgraded KaTeX dependency', async ({ page }) => {
    // An isolated test-only entry exercises the installed Mermaid/KaTeX pair
    // without adding a public diagnostic route or math fixture to the website.
    // The regular diagram smoke tests separately cover Vite's production output.
    const bundle = await build({
      stdin: { contents: 'export { default } from "mermaid";', resolveDir: process.cwd() },
      bundle: true, write: false, format: 'esm', platform: 'browser', target: 'es2020',
    });
    await page.route('**/__dependency-test/mermaid.js', route => route.fulfill({
      contentType: 'text/javascript', body: bundle.outputFiles[0].text,
    }));
    await page.goto('/projects/incident-command-diagrams');
    const result = await page.evaluate(async () => {
      const moduleUrl = '/__dependency-test/mermaid.js';
      const { default: mermaid } = await import(/* @vite-ignore */ moduleUrl);
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'base' });
      const { svg } = await mermaid.render('dependency-math', String.raw`flowchart LR
        A["$$\frac{a^2}{b}$$"] --> B["Done"]`);
      const host = document.createElement('div');
      host.id = 'dependency-math-result';
      host.innerHTML = svg;
      document.body.append(host);
      return { math: !!host.querySelector('math'), fraction: !!host.querySelector('mfrac'),
        superscript: !!host.querySelector('msup'), error: !!host.querySelector('.katex-error') };
    });
    expect(result).toEqual({ math: true, fraction: true, superscript: true, error: false });
    await expect(page.locator('#dependency-math-result svg')).toBeVisible();
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
