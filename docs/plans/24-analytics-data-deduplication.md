# Plan: Analytics Data Deduplication

## Problem

The analytics charts display duplicate data points for the same date. The `ga4-history.json` file contains multiple entries per day (from automated data collection running multiple times), causing charts to show repeated values.

**Example from `ga4-history.json`:**
```
2026-01-15T02:24:50.251Z  ← Entry 1 for Jan 15
2026-01-15T03:01:06.177Z  ← Entry 2 for Jan 15 (duplicate)
2026-01-15T03:01:35.561Z  ← Entry 3 for Jan 15 (duplicate)
2026-01-15T06:16:13.836Z  ← Entry 4 for Jan 15 (duplicate)
2026-01-15T06:16:40.729Z  ← Entry 5 for Jan 15 (duplicate)
```

**Impact:** SessionsTrendChart and other time-series visualizations show 5 points for Jan 15 instead of 1.

## Solution

Deduplicate data in `useAnalyticsData.ts` before returning to consumers. Keep the latest entry for each date.

## Implementation

### Update `src/hooks/useAnalyticsData.ts`

Add a deduplication helper function:

```typescript
/**
 * Deduplicate entries by date, keeping the latest timestamp for each date.
 */
function deduplicateByDate<T extends { date: string; timestamp: string }>(
  entries: T[]
): T[] {
  const byDate = new Map<string, T>();

  for (const entry of entries) {
    const existing = byDate.get(entry.date);
    if (!existing || new Date(entry.timestamp) > new Date(existing.timestamp)) {
      byDate.set(entry.date, entry);
    }
  }

  return Array.from(byDate.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}
```

Apply to GA4 and Search Console history:

```typescript
// In loadData(), after fetching:
const ga4Deduped = ga4Result.status === 'success'
  ? deduplicateByDate(ga4Result.data)
  : [];

const searchDeduped = searchResult.status === 'success'
  ? deduplicateByDate(searchResult.data)
  : [];
```

## Why Deduplicate in Hook vs Data Source

| Approach | Pros | Cons |
|----------|------|------|
| **Hook (chosen)** | Single fix, handles any data source | Slight runtime cost |
| **Data generation** | No runtime cost | Requires CI workflow changes |
| **Clean up JSON files** | Immediate fix | Doesn't prevent future duplicates |

The hook approach is most robust - it handles duplicates regardless of source.

## Checklist

- [ ] Add `deduplicateByDate` helper function to `useAnalyticsData.ts`
- [ ] Apply deduplication to `ga4History` data
- [ ] Apply deduplication to `searchHistory` data
- [ ] Verify charts show one point per date
- [ ] Add unit test for deduplication function

## Testing

1. Run `npm run dev` and navigate to `/analytics`
2. Verify SessionsTrendChart shows one point per date
3. Check browser DevTools console for any errors
4. Compare chart data points to unique dates in JSON files

## Effort

**Estimate:** Small (~30 minutes)

- Add helper function: 10 min
- Apply to data loading: 5 min
- Test and verify: 15 min
