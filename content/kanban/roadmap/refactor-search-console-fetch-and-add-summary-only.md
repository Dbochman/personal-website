---
id: refactor-search-console-fetch-and-add-summary-only
title: refactor Search Console fetch and add summary-only mode
column: changelog
labels:
  - Feature
createdAt: '2026-04-26T01:46:01.000Z'
updatedAt: '2026-04-26T01:46:01.000Z'
history:
  - type: column
    timestamp: '2026-04-26T01:46:01.000Z'
    columnId: changelog
    columnTitle: Change Log
---
- Split Search Console query into two calls: an authoritative
  no-dimension summary and a dimensional rows fetch. Previously the
  summary was derived by summing rows, which under-counted clicks/
  impressions because the row response is capped and aggregated by
  (query, page) — a single page can split across many rows.
- Replace ad-hoc reductions with summarizeRows / aggregateRows /
  weightedAveragePosition helpers; impression-weighted positions
  replace simple averages.
- Make the daily history write idempotent (update existing date entry
  instead of appending a duplicate).
- Add --update-summary-only mode that re-reads the latest history
  entry and rewrites docs/metrics/latest.json, preserving the original
  timestamp. The daily workflow now invokes this after fetch-ga4-data.js
  so the GA4 step's latest.json overwrite doesn't drop fresh Search
  Console numbers.
- updateMetricsSummary now takes a lastCheck override so the summary-
  only path doesn't bump the timestamp to "now".

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
