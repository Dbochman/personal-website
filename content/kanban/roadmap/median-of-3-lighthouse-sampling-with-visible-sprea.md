---
id: median-of-3-lighthouse-sampling-with-visible-sprea
title: median-of-3 Lighthouse sampling with visible spread
column: changelog
labels:
  - Performance
  - 'PR #312'
createdAt: '2026-06-13T02:21:55.000Z'
updatedAt: '2026-06-13T02:21:55.000Z'
history:
  - type: column
    timestamp: '2026-06-13T02:21:55.000Z'
    columnId: changelog
    columnTitle: Change Log
---
A single Lighthouse run on a shared CI runner swings 10-15 points
between back-to-back passes (CPU contention skews TBT and LCP most),
which is how one frozen score masqueraded as truth for five months.

- lighthouse-multi-page.mjs now audits each page RUNS times (default 3,
  LIGHTHOUSE_RUNS=1 for fast local) and keeps the representative median
  run: the run whose performance score is nearest the median, LCP as
  tie-break. Picks a real run rather than synthesizing per-metric medians
  (which would describe a run that never happened). Per-run temp reports
  are cleaned up; the median run's full report is kept under the
  canonical name.
- summary.json gains runs, performanceRange, and tbtRangeMs (additive;
  optional in the LighthousePageScore type so old files still parse).
- The scores table shows the min-max performance range under each score
  so the dashboard communicates noise instead of hiding it.
- lighthouse.yml timeout 10 -> 20 min for the ~3x audit time.

Verified: tsc/eslint/216 tests clean; median + tie-break + single-run
selection covered by synthetic cases; 2-run live pass produced correct
medians, spread fields, and temp-file cleanup across all 8 pages.

Co-authored-by: Claude Fable 5 <noreply@anthropic.com>
