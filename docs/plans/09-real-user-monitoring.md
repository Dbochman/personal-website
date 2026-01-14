# Real User Monitoring (RUM) Plan

## Overview

Collect Core Web Vitals and performance metrics from real user sessions. Complements synthetic Lighthouse testing with actual user experience data.

## Why RUM

| Metric Source | Lab (Lighthouse) | Field (RUM) |
|---------------|------------------|-------------|
| Environment | Controlled CI | Real devices, networks |
| Data | Synthetic | Actual user experience |
| Coverage | Key pages | All pages, all users |
| Variations | None | Geography, device, network |

## Options

### Option A: web-vitals + GA4 (Recommended)

Send Web Vitals to existing GA4 setup. Free, minimal code.

### Option B: Vercel Speed Insights

Turnkey solution, but requires Vercel hosting.

### Option C: Sentry Performance

Already using Sentry for errors. Performance addon available.

### Option D: Self-hosted (SpeedCurve, etc.)

More control, but costs money.

## Implementation (Option A)

### Phase 1: Install web-vitals

```bash
npm install web-vitals
```

### Phase 2: Create Reporting Hook

**File:** `src/lib/web-vitals.ts`

```ts
import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';
import type { Metric } from 'web-vitals';

function sendToGA4(metric: Metric) {
  if (typeof gtag === 'undefined') return;

  gtag('event', metric.name, {
    event_category: 'Web Vitals',
    event_label: metric.id,
    // GA4 custom metrics must be integers
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    // Send delta for debugging
    metric_delta: Math.round(metric.delta),
    // Rating: good, needs-improvement, poor
    metric_rating: metric.rating,
    // Non-interaction event
    non_interaction: true,
  });
}

export function initWebVitals() {
  // Core Web Vitals
  onCLS(sendToGA4);
  onLCP(sendToGA4);
  onINP(sendToGA4);  // Replaced FID

  // Supplemental metrics
  onFCP(sendToGA4);
  onTTFB(sendToGA4);
}
```

### Phase 3: Initialize in App

**File:** `src/main.tsx`

```tsx
import { initWebVitals } from '@/lib/web-vitals';

// Initialize after hydration
if (typeof window !== 'undefined') {
  // Delay to not block initial render
  requestIdleCallback(() => {
    initWebVitals();
  });
}
```

### Phase 4: GA4 Custom Dimensions

In GA4 Admin → Custom definitions, create:

| Name | Scope | Type |
|------|-------|------|
| metric_rating | Event | Text |
| metric_delta | Event | Number |

### Phase 5: GA4 Export Update

Update `scripts/ga4-export.mjs` to include Web Vitals:

```js
// Add Web Vitals to export query
const webVitalsQuery = {
  dimensions: [
    { name: 'eventName' },
    { name: 'customEvent:metric_rating' },
  ],
  metrics: [
    { name: 'eventCount' },
    { name: 'customEvent:value' },
  ],
  dimensionFilter: {
    filter: {
      fieldName: 'eventName',
      inListFilter: {
        values: ['LCP', 'CLS', 'INP', 'FCP', 'TTFB'],
      },
    },
  },
};
```

## Dashboard Integration

Add to Analytics Dashboard:

```tsx
// New tab or section for RUM data
<TabsContent value="rum">
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <WebVitalCard name="LCP" value={rumData.lcp} unit="s" target={2.5} />
    <WebVitalCard name="INP" value={rumData.inp} unit="ms" target={200} />
    <WebVitalCard name="CLS" value={rumData.cls} unit="" target={0.1} />
    <WebVitalCard name="TTFB" value={rumData.ttfb} unit="ms" target={800} />
  </div>
  <WebVitalsDistribution data={rumData.distribution} />
</TabsContent>
```

## Metrics to Track

| Metric | Target | Description |
|--------|--------|-------------|
| LCP | < 2.5s | Largest Contentful Paint |
| INP | < 200ms | Interaction to Next Paint |
| CLS | < 0.1 | Cumulative Layout Shift |
| FCP | < 1.8s | First Contentful Paint |
| TTFB | < 800ms | Time to First Byte |

## Files to Create/Modify

```
src/lib/web-vitals.ts           # New: vitals reporting
src/main.tsx                    # Initialize web-vitals
scripts/ga4-export.mjs          # Add vitals to export
src/components/analytics/       # Dashboard updates
package.json                    # Add web-vitals dep
```

## Verification

1. Deploy with web-vitals integration
2. Visit site, check GA4 Real-time → Events
3. Verify LCP, CLS, INP events appear
4. Wait 24h, run GA4 export, verify data collected
5. Check dashboard shows RUM data

## Privacy Considerations

- No PII collected
- Uses existing GA4 consent
- Aggregated metrics only
- User cannot be identified from vitals

## Effort

**Estimate**: Small-Medium

- web-vitals setup: 30 min
- GA4 custom dimensions: 15 min
- Export script updates: 30 min
- Dashboard integration: 1 hour
- Testing: 30 min

## Dependencies

- GA4 already configured ✅
- Sentry for error tracking ✅ (alternative path)
