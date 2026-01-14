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
