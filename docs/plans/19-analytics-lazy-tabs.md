# Plan: Lazy Load Analytics Tab Content

## Summary
Defer loading of Analytics Dashboard chart components until their tab is selected, reducing initial render work.

## Problem
`AnalyticsDashboard.tsx` renders 15+ components across 5 tabs on initial load, including heavy chart components:
- `SessionsTrendChart`
- `DeviceBreakdownChart`
- `TopPagesChart`
- `SearchPerformanceChart`
- `CoreWebVitalsCard`
- etc.

Users typically only view 1-2 tabs per visit, so rendering all content upfront is wasteful.

## Solution
Use `React.lazy()` and `Suspense` to load tab content on-demand.

## Implementation

### Option A: Lazy load individual charts (Recommended)
```typescript
// src/components/analytics/AnalyticsDashboard.tsx
import { lazy, Suspense } from 'react';

const SessionsTrendChart = lazy(() => import('./charts/SessionsTrendChart'));
const DeviceBreakdownChart = lazy(() => import('./charts/DeviceBreakdownChart'));
const TopPagesChart = lazy(() => import('./charts/TopPagesChart'));

// In render:
<TabsContent value="traffic">
  <Suspense fallback={<ChartSkeleton />}>
    <SessionsTrendChart data={ga4History} />
  </Suspense>
</TabsContent>
```

### Option B: Lazy load entire tab panels
```typescript
const TrafficTab = lazy(() => import('./tabs/TrafficTab'));
const SearchTab = lazy(() => import('./tabs/SearchTab'));
const PerformanceTab = lazy(() => import('./tabs/PerformanceTab'));
```

### Required: Create ChartSkeleton component
```typescript
// src/components/analytics/ChartSkeleton.tsx
export function ChartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3 mb-4" />
      <div className="h-64 bg-muted rounded" />
    </div>
  );
}
```

## File Structure (Option A)
```
src/components/analytics/
├── AnalyticsDashboard.tsx  (main component with lazy imports)
├── charts/
│   ├── SessionsTrendChart.tsx
│   ├── DeviceBreakdownChart.tsx
│   ├── TopPagesChart.tsx
│   └── index.ts  (barrel export, optional)
├── ChartSkeleton.tsx
└── MetricCard.tsx
```

## Current Chart Components to Extract
Looking at current structure, these may already be separate files or inline. Steps:
1. Audit which chart components exist
2. Ensure each is in its own file (required for lazy loading)
3. Add lazy imports in main dashboard

## Impact
- **Initial render**: Fewer components mounted
- **Tab switch**: ~50-100ms to load chart component (acceptable)
- **Memory**: Only active tab content in memory

## Considerations
- Keep `MetricCard` eager (small, used in header)
- Keep `CoreWebVitalsCard` eager (first tab content)
- Lazy load charts that require Recharts (heaviest)

## Files Changed
- `src/components/analytics/AnalyticsDashboard.tsx`
- `src/components/analytics/ChartSkeleton.tsx` (new)
- Potentially reorganize chart components into `charts/` subfolder

## Testing
1. Open Analytics page with Network tab open
2. Verify initial load doesn't fetch all chart bundles
3. Click different tabs - observe chunk loading
4. Verify charts render correctly after lazy load

## Effort
Medium (~45 minutes)
