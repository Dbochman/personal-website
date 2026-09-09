// Capture example output from the real tools. Start a local dev server first.
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
const previews = [
  { slug: 'slo-tool', heading: 'Per-incident MTTR', ancestors: 3, width: 900 },
  { slug: 'oncall-coverage', heading: 'Daily Coverage (24 Hours UTC)', ancestors: 2, width: 1280 },
  { slug: 'statuspage-update', heading: 'Generated Status Update', ancestors: 2, width: 1280 },
];

await mkdir('public/project-previews', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage({ colorScheme: 'light' });
  for (const { slug, heading, ancestors, width } of previews) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${baseUrl}/projects/${slug}?theme=light`);
    let target = page.getByRole('heading', { name: heading, exact: true });
    await target.waitFor();
    // Capture the containing card, or summary grid for the SLO tool.
    for (let i = 0; i < ancestors; i++) target = target.locator('..');
    await target.screenshot({
      path: `public/project-previews/${slug}.jpg`,
      type: 'jpeg',
      quality: 85,
    });
    console.log(`Captured ${slug}`);
  }
} finally {
  await browser.close();
}
