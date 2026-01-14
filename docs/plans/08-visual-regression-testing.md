# Visual Regression Testing Plan

## Overview

Add visual regression testing using Playwright screenshots to catch unintended UI changes. Compares screenshots against baselines to detect visual differences.

## Current Testing Setup

- Playwright already installed and configured
- Smoke tests run on deployment (`@smoke` tag)
- Tests in `e2e/` directory
- CI runs tests with Chromium

## Implementation

### Phase 1: Screenshot Tests

Create `e2e/visual.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

const pages = [
  { name: 'home', path: '/' },
  { name: 'blog', path: '/blog' },
  { name: 'projects', path: '/projects' },
  { name: 'uptime-calculator', path: '/projects/slo-uptime-calculator' },
];

for (const page of pages) {
  test(`visual: ${page.name}`, async ({ page: p }) => {
    await p.goto(page.path);

    // Wait for fonts and images
    await p.waitForLoadState('networkidle');

    // Take full-page screenshot
    await expect(p).toHaveScreenshot(`${page.name}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });
}

// Component-level screenshots
test('visual: blog card hover', async ({ page }) => {
  await page.goto('/blog');
  const card = page.locator('article').first();
  await card.hover();
  await expect(card).toHaveScreenshot('blog-card-hover.png');
});

test('visual: dark mode', async ({ page }) => {
  await page.goto('/');

  // Toggle dark mode (assuming toggle exists)
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
  });

  await expect(page).toHaveScreenshot('home-dark.png', {
    fullPage: true,
  });
});
```

### Phase 2: Playwright Config Updates

**File:** `playwright.config.ts`

```ts
export default defineConfig({
  // ... existing config

  // Visual comparison settings
  expect: {
    toHaveScreenshot: {
      // Allow small differences (anti-aliasing, font rendering)
      maxDiffPixels: 100,
      // Or use percentage threshold
      maxDiffPixelRatio: 0.01,
    },
  },

  // Consistent viewport for screenshots
  use: {
    viewport: { width: 1280, height: 720 },
    // Disable animations for consistent screenshots
    launchOptions: {
      args: ['--disable-animations'],
    },
  },

  projects: [
    {
      name: 'visual-desktop',
      use: {
        viewport: { width: 1280, height: 720 },
      },
      testMatch: /visual\.spec\.ts/,
    },
    {
      name: 'visual-mobile',
      use: {
        viewport: { width: 375, height: 667 },
      },
      testMatch: /visual\.spec\.ts/,
    },
  ],
});
```

### Phase 3: CI Integration

Add to `.github/workflows/deploy.yml`:

```yaml
- name: Run visual regression tests
  run: npx playwright test visual.spec.ts --update-snapshots
  env:
    CI: true

- name: Upload visual diff artifacts
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: visual-diffs
    path: test-results/
    retention-days: 7
```

### Phase 4: Baseline Management

**Option A: Git LFS for baselines**

```bash
# Track screenshot baselines with LFS
git lfs track "e2e/**/*.png"
```

**Option B: Separate branch**

Store baselines on a dedicated branch (like lighthouse-metrics):

```yaml
- name: Update visual baselines
  if: github.event_name == 'workflow_dispatch'
  run: |
    git checkout -B visual-baselines
    git add e2e/**/*.png
    git commit -m "Update visual baselines"
    git push -f origin visual-baselines
```

**Option C: Playwright Report storage**

Use Playwright's built-in artifact storage and compare in CI.

## Handling Flakiness

```ts
// Mask dynamic content
await expect(page).toHaveScreenshot('home.png', {
  mask: [
    page.locator('.timestamp'),  // Dynamic dates
    page.locator('.analytics-chart'),  // Live data
  ],
});

// Wait for specific elements
await page.waitForSelector('.hero-image', { state: 'visible' });

// Disable animations globally
await page.addStyleTag({
  content: '*, *::before, *::after { animation: none !important; transition: none !important; }',
});
```

## Recommended Test Coverage

| Page/Component | Desktop | Mobile | Dark Mode |
|----------------|---------|--------|-----------|
| Homepage | ✅ | ✅ | ✅ |
| Blog listing | ✅ | ✅ | ✅ |
| Blog post | ✅ | ✅ | ✅ |
| Projects | ✅ | ✅ | ✅ |
| Project detail | ✅ | ✅ | - |
| Card hover states | ✅ | - | - |

## Files to Create/Modify

```
e2e/visual.spec.ts           # New: visual tests
playwright.config.ts         # Update: snapshot settings
.github/workflows/deploy.yml # Update: visual test step
.gitattributes               # If using Git LFS
```

## Verification

1. Run `npx playwright test visual.spec.ts` locally
2. Review generated screenshots in `e2e/visual.spec.ts-snapshots/`
3. Make intentional UI change, verify test fails
4. Update baselines with `--update-snapshots`
5. Verify CI catches visual regressions

## Effort

**Estimate**: Medium

- Basic screenshot tests: 1 hour
- Config updates: 30 min
- CI integration: 30 min
- Baseline management: 30 min
- Flakiness tuning: 1 hour (ongoing)

## Dependencies

- Playwright already installed ✅
- Consider running after other tests pass to save CI time
