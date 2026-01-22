# Lighthouse: A11y & SEO Focus

## Goal
Reframe Lighthouse automation to emphasize accessibility and SEO insights while preserving performance score continuity for comparison.

**Effort:** Short (1-4h)

## Non-Goals
- Replace or expand GA4 performance instrumentation.
- Remove Lighthouse performance data from stored results.
- Introduce new third-party services or dashboards.

## Users & Use Cases
- Engineers monitoring regressions in accessibility and SEO.
- Product/marketing reviewing search readiness and inclusive design health.
- Site maintainers validating major releases before publishing.

## Functional Requirements
- Configure Lighthouse CI GitHub Action to retain existing workflow but introduce a weekly `schedule` trigger focused on a11y/SEO scoring, keeping performance category enabled for stored output.
- Add conditional triggers for significant changes (e.g., `/pages/**`, `/components/**`, `/public/**`, `/next.config.js`) so Lighthouse runs on demand when relevant files change, plus a documented manual dispatch.
- Limit Lighthouse categories collected during scheduled runs to accessibility, SEO, best-practices, and performance (for continuity) while skipping unused ones to shorten runtime.
- Ensure generated Lighthouse artifacts remain in the current format/location so downstream history ingestion continues unchanged.
- Document the tradeoffs of reduced frequency (slower defect detection vs. less CI noise, more stable metrics) in project docs and communicate manual run expectations.
- Store run metadata (timestamp, trigger type) alongside scores for dashboard context without altering schema shape.

## UX Requirements
- Extend `/analytics` page with an accessibility & SEO card showing latest scores, deltas versus previous run, timestamp, and trigger source.
- Provide inline guidance on how to launch a manual Lighthouse run from GitHub Actions.
- Preserve existing layout and styling conventions; align new card components with current analytics design system.

## Data Model
```typescript
interface LighthouseSummary {
  runId: string;
  collectedAt: string; // ISO timestamp
  trigger: 'scheduled' | 'path-change' | 'manual';
  categories: {
    accessibility: number; // 0-1 normalized
    seo: number; // 0-1 normalized
    performance: number; // retained for comparison
    bestPractices: number;
  };
}
```

## Error Handling & Empty States
- Show a clear empty state on `/analytics` when no Lighthouse run data exists yet.
- If the latest run fails, surface last successful scores with a warning banner referencing the failed workflow run.
- Guard against missing category values by defaulting to "N/A" while logging the anomaly.

## Test Plan
- Dry-run the updated GitHub Action workflow to confirm scheduled, path-based, and manual triggers execute and publish artifacts.
- Validate analytics dashboard rendering with mocked data covering normal, empty, and error states.
- Spot-check Lighthouse history ingestion to ensure format compatibility and continuity.

## Dependencies
- Existing Lighthouse CI GitHub Action workflow and artifact storage.
- GA4 analytics pipeline (unchanged, reference only).
- Current `/analytics` page components and styling groundwork.
