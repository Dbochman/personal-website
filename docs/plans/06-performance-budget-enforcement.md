# Performance Budget Enforcement Plan

## Overview

Enforce strict performance budgets in CI to prevent regressions. Build on existing Lighthouse checks with bundle size limits and Core Web Vitals targets.

## Current State

- Lighthouse CI runs on every deployment
- Soft thresholds: Performance ≥50, Accessibility ≥95, SEO ≥90
- No bundle size limits
- No asset size tracking
- GitHub Issue created on threshold failure

## Proposed Budgets

### Bundle Size Budget

| Asset Type | Current | Budget | Action |
|------------|---------|--------|--------|
| Total JS | ~180KB | 200KB | Block PR |
| Total CSS | ~25KB | 35KB | Block PR |
| Largest chunk | ~90KB | 100KB | Warn |
| Vendor bundle | ~140KB | 150KB | Warn |

### Core Web Vitals Budget (Production)

| Metric | Target | Warning | Current |
|--------|--------|---------|---------|
| LCP | < 2.5s | < 3.5s | 3.1s |
| FCP | < 1.8s | < 2.5s | ~1.2s |
| CLS | < 0.1 | < 0.15 | ~0.02 |
| TBT | < 200ms | < 300ms | ~50ms |

### Lighthouse Score Budget

| Category | Target | Current Threshold |
|----------|--------|-------------------|
| Performance | ≥ 80 | ≥ 50 |
| Accessibility | ≥ 100 | ≥ 95 |
| Best Practices | ≥ 95 | ≥ 90 |
| SEO | ≥ 95 | ≥ 90 |

## Implementation

### Phase 1: Bundle Size Check in CI

Add to `deploy.yml` after build step:

```yaml
- name: Check bundle size
  run: |
    node -e "
    const fs = require('fs');
    const path = require('path');

    const BUDGETS = {
      totalJS: 200 * 1024,    // 200KB
      totalCSS: 35 * 1024,    // 35KB
      largestChunk: 100 * 1024,
    };

    const distAssets = path.join('dist', 'assets');
    const files = fs.readdirSync(distAssets);

    let totalJS = 0, totalCSS = 0, largestChunk = 0;

    files.forEach(file => {
      const size = fs.statSync(path.join(distAssets, file)).size;
      if (file.endsWith('.js')) {
        totalJS += size;
        largestChunk = Math.max(largestChunk, size);
      }
      if (file.endsWith('.css')) totalCSS += size;
    });

    console.log('📦 Bundle Size Report:');
    console.log(\`  JS Total: \${(totalJS/1024).toFixed(1)}KB / \${BUDGETS.totalJS/1024}KB\`);
    console.log(\`  CSS Total: \${(totalCSS/1024).toFixed(1)}KB / \${BUDGETS.totalCSS/1024}KB\`);
    console.log(\`  Largest Chunk: \${(largestChunk/1024).toFixed(1)}KB / \${BUDGETS.largestChunk/1024}KB\`);

    const failures = [];
    if (totalJS > BUDGETS.totalJS) failures.push(\`JS budget exceeded: \${(totalJS/1024).toFixed(1)}KB > \${BUDGETS.totalJS/1024}KB\`);
    if (totalCSS > BUDGETS.totalCSS) failures.push(\`CSS budget exceeded: \${(totalCSS/1024).toFixed(1)}KB > \${BUDGETS.totalCSS/1024}KB\`);

    if (failures.length > 0) {
      console.error('\\n❌ Budget exceeded:');
      failures.forEach(f => console.error(\`  - \${f}\`));
      process.exit(1);
    }
    console.log('\\n✅ All budgets within limits');
    "
```

### Phase 2: Stricter Lighthouse Thresholds

Update `lighthouse.yml` threshold check:

```js
// Stricter thresholds
if (page.performance < 70) failures.push(...);  // was 50
if (page.accessibility < 100) failures.push(...);  // was 95
if (page.seo < 95) failures.push(...);  // was 90
if (page.bestPractices < 95) failures.push(...);  // was 90
```

### Phase 3: Bundle Size Tracking

Create `scripts/track-bundle-size.mjs` to log bundle sizes over time:

```js
// Save to docs/metrics/bundle-history.json
// Track per-commit for trend analysis
```

### Phase 4: PR Comment with Budget Impact

Add workflow to comment on PRs with bundle size diff:

```yaml
- name: Comment bundle size on PR
  uses: actions/github-script@v7
  with:
    script: |
      // Compare current vs main branch bundle sizes
      // Post comment showing delta
```

## Files to Modify

```
.github/workflows/deploy.yml     # Add bundle size check
.github/workflows/lighthouse.yml # Stricter thresholds
scripts/track-bundle-size.mjs    # New: bundle tracking
docs/metrics/bundle-history.json # New: historical data
```

## Configuration File (Optional)

Create `performance-budget.json` for centralized config:

```json
{
  "bundles": {
    "totalJS": "200KB",
    "totalCSS": "35KB",
    "largestChunk": "100KB"
  },
  "lighthouse": {
    "performance": 70,
    "accessibility": 100,
    "seo": 95,
    "bestPractices": 95
  },
  "webVitals": {
    "LCP": "2500ms",
    "FCP": "1800ms",
    "CLS": "0.1",
    "TBT": "200ms"
  }
}
```

## Verification

1. Build locally - verify bundle sizes reported
2. Intentionally add large dependency - verify CI fails
3. Check Lighthouse runs use stricter thresholds
4. PR comments show bundle delta (if implemented)

## Effort

**Estimate**: Small

- Bundle size check: 30 min
- Stricter Lighthouse thresholds: 15 min
- Bundle tracking: 30 min (optional)
- PR comments: 45 min (optional)

## Dependencies

None. Can be implemented immediately.
