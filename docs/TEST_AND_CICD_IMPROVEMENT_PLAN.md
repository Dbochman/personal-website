# Test & CI/CD Improvement Plan

**Created:** January 2026
**Status:** ✅ Complete (January 10, 2026)

---

## Completion Summary

All three phases have been implemented:

| Phase | Status | Highlights |
|-------|--------|------------|
| Phase 1 | ✅ | Dynamic blog slugs, Playwright caching, 404 test |
| Phase 2 | ✅ | Theme tests consolidated (10→6), blog functionality tests added |
| Phase 3 | ✅ | @smoke tags for pre-deploy, `npm ci`, polling, artifact cleanup |

**Key outcomes:**
- Blog renames no longer break tests (dynamic slug discovery)
- Pre-deploy smoke tests run ~9 tests in ~2.5s vs full suite
- CI uses Playwright browser caching (saves ~90s per run)
- Removed 30s sleep in favor of polling for deployment verification

---

## Executive Summary

This plan addresses two areas:
1. **Test Quality** - Reduce fragility, add missing coverage
2. **CI/CD Efficiency** - Eliminate redundancy, speed up pipelines

Estimated impact: **~40% faster CI runs**, **fewer false failures**, **better coverage**.

---

## Part 1: Test Improvements

### 1.1 Fragile Tests (High Priority)

#### Problem: Hardcoded Blog Slugs

**Files affected:**
- `tests/e2e/blog-rendering.spec.ts` (lines 7-10)
- `tests/e2e/console-errors.spec.ts` (lines 42, 138)

**Current state:**
```typescript
const blogPosts = [
  { slug: '2025-01-04-hello-world', title: 'Hello, World' },
  { slug: '2025-01-05-notes-on-building-this-site-together', ... },
  ...
];
```

**Problem:** Every blog rename breaks tests. Already broke twice today.

**Solution:** Dynamic blog post discovery.

```typescript
// Option A: Read from content/blog/ at test time
import { readdirSync } from 'fs';
const blogPosts = readdirSync('content/blog/')
  .filter(f => f.endsWith('.txt') && !f.includes('draft'))
  .map(f => f.replace('.txt', ''));

// Option B: Test only newest N posts (less maintenance)
const blogPosts = readdirSync('content/blog/')
  .sort().reverse().slice(0, 3);
```

**Effort:** 30 minutes

---

#### Problem: 2000ms Hard Wait

**File:** `tests/e2e/console-errors.spec.ts` (line 98)

**Current:**
```typescript
await playwright.waitForTimeout(2000);
```

**Problem:** Arbitrary, slow, doesn't guarantee content loaded.

**Solution:** Wait for specific condition.

```typescript
// Wait for React to finish rendering
await playwright.waitForSelector('main', { state: 'visible' });
// Or wait for network to settle
await playwright.waitForLoadState('networkidle');
```

**Effort:** 15 minutes

---

### 1.2 Redundant Tests (Medium Priority)

#### Problem: Theme Test Overlap

**File:** `tests/e2e/theme-persistence.spec.ts`

**Current:** 10 tests, several overlapping:
- Test 3: "theme persists when navigating from home to blog"
- Test 4: "theme persists when navigating to individual blog post"
- Test 7: "navigating back home preserves theme"

All test the same thing: theme persists on navigation.

**Solution:** Consolidate to 5-6 tests.

| Keep | Remove/Merge |
|------|--------------|
| Desktop toggle works | - |
| URL param sets theme | - |
| Theme persists across navigation (one comprehensive test) | Merge tests 3, 4, 7 |
| Mobile toggle works | - |
| Mobile theme persists | - |

**Effort:** 45 minutes

---

### 1.3 Missing Coverage (Medium Priority)

| Gap | Test to Add | Priority |
|-----|-------------|----------|
| 404 page | Verify NotFound renders for `/nonexistent` | High |
| Blog sort selector | Verify dropdown changes post order | High |
| Blog search | Type in search, verify filtering | Medium |
| Blog tag filter | Click tag, verify filtered results | Medium |
| Mobile nav links | Open menu, click link, verify navigation | Medium |
| Homepage sections | Verify key sections render (#experience, #contact) | Low |

**Suggested new test file:** `tests/e2e/blog-functionality.spec.ts`

```typescript
test.describe('Blog Functionality', () => {
  test('sort selector changes post order', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog`);
    await page.selectOption('select', 'oldest');
    // Verify first post is oldest
  });

  test('search filters posts', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog`);
    await page.fill('input[type="search"]', 'monitoring');
    // Verify filtered results
  });

  test('tag filter works', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog`);
    await page.click('text=Reliability');
    // Verify only Reliability posts shown
  });
});
```

**Effort:** 1-2 hours

---

## Part 2: CI/CD Improvements

### 2.1 Redundant Work (High Priority)

#### Problem: Duplicate Playwright Installation

**Current flow:**
```
build job:
  - npm install
  - npx playwright install chromium --with-deps  ← First install
  - npm test
  - npm run build

smoke-tests job:
  - npm install                                   ← Redundant
  - npx playwright install chromium --with-deps  ← Second install (same thing!)
  - run tests
```

**Solution:** Cache Playwright browsers.

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}

- name: Install Playwright browsers
  run: npx playwright install chromium --with-deps
  if: steps.playwright-cache.outputs.cache-hit != 'true'
```

**Impact:** Save ~45 seconds per job, ~90 seconds total per run.

---

#### Problem: Duplicate npm Install

**smoke-tests** and **deploy** jobs both run `npm install` despite not needing node_modules for deploy.

**Solution:**
- smoke-tests: Use cached node_modules from build via artifact
- deploy: Remove npm install entirely (only needs dist/)

**Impact:** Save ~20 seconds per job.

---

### 2.2 Redundant Workflows (Medium Priority)

#### Problem: console-check.yml Duplicates smoke-tests

**Current:**
- `deploy.yml` runs smoke tests against preview server before deploy
- `console-check.yml` runs **same tests** against production after deploy

**Analysis:**
| Aspect | smoke-tests (pre-deploy) | console-check (post-deploy) |
|--------|--------------------------|----------------------------|
| Tests run | All E2E tests | All E2E tests |
| Environment | Preview server | Production |
| Purpose | Gate deployment | Verify production |

**Options:**

**Option A: Keep both, differentiate tests**
- smoke-tests: Quick sanity checks only
- console-check: Full E2E suite on production

**Option B: Remove console-check**
- smoke-tests already catches issues before deploy
- If deploy succeeds, production should match preview

**Recommendation:** Option A - Create a "quick smoke" subset for pre-deploy, full suite post-deploy.

---

### 2.3 Hard-coded Waits (Medium Priority)

#### Problem: 30-second Sleep for Deployment Propagation

**Files:**
- `console-check.yml` (line 39)
- `lighthouse.yml` (line 41)

```yaml
- name: Wait for deployment to be live
  run: |
    echo "Waiting 30 seconds for GitHub Pages deployment to propagate..."
    sleep 30
```

**Problem:** 30 seconds may not be enough, or may be too much.

**Solution:** Poll for actual deployment.

```yaml
- name: Wait for deployment to be live
  run: |
    for i in {1..30}; do
      if curl -s https://dylanbochman.com | grep -q "Dylan Bochman"; then
        echo "Site is live!"
        exit 0
      fi
      echo "Attempt $i: waiting..."
      sleep 5
    done
    echo "Timeout waiting for deployment"
    exit 1
```

**Impact:** Faster on quick deploys, more reliable on slow ones.

---

### 2.4 Workflow Consolidation (Low Priority)

#### Current State: 6 Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| deploy.yml | Push to main | Build, test, deploy |
| console-check.yml | After deploy | Production E2E |
| lighthouse.yml | After deploy + weekly | Performance audit |
| seo-check.yml | Weekly | SEO metrics |
| ga4-export.yml | Weekly | Analytics backup |
| search-console.yml | Weekly | Search metrics |

**Observation:** The 4 weekly workflows could be consolidated into one "Weekly Metrics" workflow with matrix strategy.

**Benefit:** Single workflow to maintain, single run to monitor.

**Trade-off:** One failure affects all metrics collection.

**Recommendation:** Leave separate for now. Consolidate only if maintenance becomes burdensome.

---

## Implementation Roadmap

### Phase 1: Quick Wins (1-2 hours)

| Task | Impact | Effort |
|------|--------|--------|
| Dynamic blog slug discovery | Eliminates recurring test breaks | 30 min |
| Remove 2000ms wait | Faster, more reliable tests | 15 min |
| Cache Playwright browsers | ~90 sec faster CI | 30 min |
| Add 404 page test | Coverage gap | 15 min |

### Phase 2: Test Improvements (2-3 hours)

| Task | Impact | Effort |
|------|--------|--------|
| Consolidate theme tests | Fewer tests to maintain | 45 min |
| Add blog functionality tests | Cover sort, search, tags | 1 hour |
| Replace 30s sleep with polling | More reliable post-deploy checks | 30 min |

### Phase 3: CI/CD Optimization (1-2 hours)

| Task | Impact | Effort |
|------|--------|--------|
| Split smoke tests (quick vs full) | Faster pre-deploy gate | 45 min |
| Remove redundant npm installs | ~40 sec faster | 30 min |
| Audit artifact retention | Storage savings | 15 min |

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| CI run time (deploy.yml) | ~4 min | ~2.5 min |
| Test false failure rate | ~1/week | ~1/month |
| E2E test count | 20 | 25-28 |
| Blog rename = test break | Yes | No |

---

## Files to Modify

| File | Changes |
|------|---------|
| `tests/e2e/blog-rendering.spec.ts` | Dynamic slug discovery |
| `tests/e2e/console-errors.spec.ts` | Dynamic slug, remove wait |
| `tests/e2e/theme-persistence.spec.ts` | Consolidate tests |
| `tests/e2e/blog-functionality.spec.ts` | **New file** - sort, search, tags |
| `tests/e2e/navigation.spec.ts` | **New file** - 404, mobile nav |
| `.github/workflows/deploy.yml` | Cache Playwright, optimize jobs |
| `.github/workflows/console-check.yml` | Polling instead of sleep |
| `.github/workflows/lighthouse.yml` | Polling instead of sleep |

---

## Appendix: Current Test Inventory

### E2E Tests (20 total)

**theme-persistence.spec.ts** (10 tests)
- Desktop theme toggle
- URL param updates
- Navigation persistence (3 overlapping tests)
- URL param ?theme=dark/light
- Mobile toggle
- Mobile persistence

**blog-rendering.spec.ts** (3 tests)
- Hardcoded posts render

**console-errors.spec.ts** (7 tests)
- 4 console error checks (one per page)
- 4 load success checks (overlapping with above)

### Missing Coverage
- 404 page
- Blog sort selector
- Blog search
- Blog tag filter
- Mobile navigation
- Homepage sections

---

**Status:** All phases complete. Plan retained for reference.
