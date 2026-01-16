import { test, expect } from '@playwright/test';

/**
 * Container Queries Visual Test
 *
 * Verifies that components using @container queries adapt to their container size,
 * not the viewport. Uses JavaScript to inject a constrained wrapper to prove
 * container queries respond to container width, not viewport.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Container Queries', () => {
  test('IncidentInput uses row layout in wide container', async ({ page }) => {
    // Use wide viewport to ensure container has room
    await page.setViewportSize({ width: 1200, height: 800 });

    await page.goto(`${BASE_URL}/projects/slo-tool`);
    await page.waitForLoadState('networkidle');

    // Find the @container card and check flex direction
    const flexDirection = await page.evaluate(() => {
      const card = document.querySelector('.\\@container');
      if (!card) return 'card-not-found';

      const flexDiv = card.querySelector('div.flex');
      if (!flexDiv) return 'flex-not-found';

      return window.getComputedStyle(flexDiv).flexDirection;
    });

    // Card container is wide enough for @sm (24rem = 384px), should be row
    expect(flexDirection).toBe('row');
  });

  test('IncidentInput adapts to constrained container (proves container query)', async ({ page }) => {
    // Keep viewport WIDE - we're testing container width, not viewport
    await page.setViewportSize({ width: 1200, height: 800 });

    await page.goto(`${BASE_URL}/projects/slo-tool`);
    await page.waitForLoadState('networkidle');

    // Find the @container card and constrain it via JavaScript
    // This proves container queries work independent of viewport
    const flexDirection = await page.evaluate(() => {
      // Find the card with @container
      const card = document.querySelector('.\\@container');
      if (!card) return 'card-not-found';

      // Force the card to be narrow (less than @sm breakpoint of 24rem/384px)
      (card as HTMLElement).style.width = '300px';

      // Force reflow
      void (card as HTMLElement).offsetHeight;

      // Find the flex container inside and check its computed style
      const flexDiv = card.querySelector('div.flex');
      if (!flexDiv) return 'flex-not-found';

      return window.getComputedStyle(flexDiv).flexDirection;
    });

    // Despite wide viewport, constrained container should force column layout
    expect(flexDirection).toBe('column');
  });
});
