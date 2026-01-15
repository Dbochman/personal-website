# Dynamic PR Status Indicator

## Overview

Fetch PR check status from GitHub API at runtime so the kanban "In Review" column shows live CI status without manual updates.

## Approach

Client-side fetch using GitHub's public API (no auth required for public repos).

### Rate Limits
- Unauthenticated: 60 requests/hour per IP
- For a personal site with low traffic, this is sufficient
- Cache responses to minimize API calls

## Implementation

### 1. Create `usePrStatus` Hook

```typescript
// src/hooks/usePrStatus.ts
interface PrCheckStatus {
  status: 'passing' | 'failing' | 'pending' | 'unknown';
  loading: boolean;
}

function usePrStatus(prNumber: number | null): PrCheckStatus
```

**Logic:**
- If no PR number, return `unknown`
- Fetch PR to get head SHA: `GET /repos/Dbochman/personal-website/pulls/{pr}`
- Fetch check runs: `GET /repos/Dbochman/personal-website/commits/{sha}/check-runs`
- Determine status:
  - All checks `conclusion: 'success'` → `passing`
  - Any check `conclusion: 'failure'` → `failing`
  - Any check `status: 'in_progress'` or `'queued'` → `pending`

### 2. Add Caching Layer

```typescript
// Simple in-memory cache with 2-minute TTL
const cache = new Map<number, { status: PrStatus; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes
```

- Prevents redundant fetches when re-rendering
- Short TTL ensures reasonably fresh data
- Consider localStorage for persistence across page loads

### 3. Update KanbanCard Component

```typescript
// Only fetch for cards with PR labels and no hardcoded prStatus
const prNumber = card.labels?.map(parsePrLabel).find(Boolean) ?? null;
const { status, loading } = usePrStatus(card.prStatus ? null : prNumber);
const displayStatus = card.prStatus ?? status;
```

- Hardcoded `prStatus` takes precedence (for testing/override)
- Only fetches for cards that have PR labels
- Shows loading state while fetching

### 4. Add Loading State

Show a subtle spinner or pulse animation while fetching:

```typescript
{loading && (
  <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
)}
```

## API Endpoints

```
GET https://api.github.com/repos/Dbochman/personal-website/pulls/{pr_number}
→ Response includes `head.sha`

GET https://api.github.com/repos/Dbochman/personal-website/commits/{sha}/check-runs
→ Response includes `check_runs[].status` and `check_runs[].conclusion`
```

## Edge Cases

1. **PR not found (404)** → Show `unknown`, don't retry
2. **Rate limited (403)** → Show `unknown`, log warning
3. **No check runs** → Show `unknown` (repo may not have CI)
4. **Mixed results** → `failing` takes precedence over `pending`

## Testing

1. Add a card with `PR #124` label to In Review
2. Verify status updates when checks complete
3. Test with failing PR to verify red X
4. Verify caching reduces API calls (check Network tab)

## Future Enhancements

- Add refresh button to manually refetch
- Show individual check names on hover
- Add GitHub auth token via env var for higher rate limits
