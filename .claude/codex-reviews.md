# Codex Code Reviews

Capturing feedback from Codex async code reviews to identify patterns and inform a future blog post.

---

## Template

```
### [Date] - [Feature/PR name]

- **What it flagged**:
- **Agreed?**: Yes / No / Partially
- **Fix applied**:
- **Category**: accessibility | type safety | UX | architecture | edge cases | performance | security | other
```

---

## Reviews

<!-- Add new reviews below this line -->

### 2026-01-13 - Analytics Dashboard PR #96

**Review 1:**

- **What it flagged**:
  1. (Medium) `sessionTrend` can divide by zero when previous period has 0 sessions, yielding Infinity/NaN
  2. (Low) Missing metrics files silently treated as empty - users see blank dashboards with no warning
  3. (Low) Metrics are copied to public/ and served to any visitor - "unlisted" + noindex doesn't prevent access
- **Agreed?**: Yes (1, 2), Acknowledged (3 - acceptable for personal site analytics)
- **Fix applied**:
  1. Added guard `previousGA4.summary.sessions > 0` before calculating trend
  2. Added yellow warning banner when metrics files are missing
- **Category**: edge cases | UX

**Review 2:**

- **What it flagged**: All fetch failures treated as "missing data" warnings; error UI unreachable because fetchJson swallows network/HTTP errors. Masks real outages (500s) as "missing files."
- **Agreed?**: Yes
- **Fix applied**: Distinguish 404 (missing) → yellow warning vs network/500 errors → red error state
- **Category**: edge cases | UX

---

### 2026-01-14 - Kanban Board PR #97

- **What it flagged**:
  1. (Medium) Sort/drag mismatch - Sorting cards by size is view-only, but drag-and-drop uses unsorted array indices. `SortableContext` uses `sortedCards` while `handleDragEnd` uses `col.cards`, causing unexpected reordering when sort is active.
  2. (Medium) Premature history logging - Column movement history recorded on `dragOver` instead of drop. Logs "Moved to X" even if user drags across columns without dropping, creating inaccurate history.
  3. (Low) Shallow spread fragility - URL-persisted board uses shallow spread of `roadmapBoard`. In-place mutations could affect shared seed across sessions/resets.
- **Agreed?**: Yes - all valid findings
- **Fix applied**: Documented in plan for future PR. Open questions:
  - Should sorting disable drag-and-drop (view-only) or reorder underlying data?
  - Should history reflect only committed moves (on drop)?
- **Category**: architecture | edge cases

---

### 2026-01-14 - CI Failures Fix PR #99

- **What it flagged**:
  1. (Medium) Console error test ignores ALL 404s from own domain/localhost, masking real regressions (missing assets, broken routes, API calls). Should whitelist only known SPA fallback paths.
  2. (Low) PR label linking matches `PR #88-92` and links to PR 88, which is misleading for ranges.
- **Agreed?**: Yes - both valid
- **Fix applied**:
  1. Tightened 404 ignore logic: only ignore HTML document 404s (SPA fallback), not asset 404s (.js, .css, .json, images, etc.)
  2. Changed regex from `/^PR #(\d+)/` to `/^PR #(\d+)$/` - only links single PRs, not ranges
- **Category**: edge cases | UX

---

### 2026-01-14 - ARIA Live Regions PR #102

- **What it flagged**:
  1. (Low) BlogList announcement fires on initial render - creates noise before user interacts
  2. (Low) On-Call model description with aria-live is verbose - full paragraph announced on every change
  3. (Low) Analytics loading state wraps large content in aria-live - can cause noisy announcements
- **Agreed?**: Yes - all valid accessibility UX concerns
- **Fix applied**:
  1. Added `hasInteracted` state - only announce after search/filter/author change
  2. Changed to dedicated sr-only live region with concise "Selected: {model.name}"
  3. Moved aria-live to dedicated sr-only div with just "Loading analytics data..."
- **Category**: accessibility | UX
