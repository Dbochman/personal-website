import { test, expect } from '@playwright/test';

/**
 * Container Queries Visual Test
 *
 * Verifies that components using @container queries adapt to their container size,
 * not the viewport. Tests the IncidentInput component in narrow vs wide contexts.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Container Queries', () => {
  test('IncidentInput adapts layout based on container width', async ({ page }) => {
    // Navigate to uptime calculator which uses IncidentInput
    await page.goto(`${BASE_URL}/projects/uptime-calculator`);
    await page.waitForLoadState('networkidle');

    // Find the incident input card
    const incidentCard = page.locator('text=Expected incidents per month').locator('..');

    // Verify the card exists
    await expect(incidentCard).toBeVisible();

    // Get the layout container (the flex div)
    const layoutContainer = incidentCard.locator('div.flex').first();

    // In a wide viewport, the container query should apply row layout
    // Check that flex-direction is row (from @sm:flex-row)
    const flexDirection = await layoutContainer.evaluate((el) => {
      return window.getComputedStyle(el).flexDirection;
    });

    // On a standard viewport, the card container should be wide enough
    // for @sm (24rem = 384px) to apply, resulting in row layout
    expect(flexDirection).toBe('row');
  });

  test('IncidentInput shows column layout in narrow container', async ({ page }) => {
    // Set a very narrow viewport to force column layout
    await page.setViewportSize({ width: 320, height: 600 });

    await page.goto(`${BASE_URL}/projects/uptime-calculator`);
    await page.waitForLoadState('networkidle');

    const incidentCard = page.locator('text=Expected incidents per month').locator('..');
    await expect(incidentCard).toBeVisible();

    const layoutContainer = incidentCard.locator('div.flex').first();

    const flexDirection = await layoutContainer.evaluate((el) => {
      return window.getComputedStyle(el).flexDirection;
    });

    // On narrow viewport, container is too small for @sm, should be column
    expect(flexDirection).toBe('column');
  });
});
