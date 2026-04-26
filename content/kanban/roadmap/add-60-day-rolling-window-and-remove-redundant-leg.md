---
id: add-60-day-rolling-window-and-remove-redundant-leg
title: add 60-day rolling window and remove redundant legend
column: changelog
labels:
  - Bugfix
  - 'PR #270'
createdAt: '2026-03-28T16:19:25.000Z'
updatedAt: '2026-03-28T16:19:25.000Z'
history:
  - type: column
    timestamp: '2026-03-28T16:19:25.000Z'
    columnId: changelog
    columnTitle: Change Log
---
* fix(analytics): add 60-day rolling window and remove redundant legend

- Filter Sessions Over Time, Search Performance, and Blog Traffic charts
  to show only the last 60 days instead of all historical data
- Remove redundant legend from Device Breakdown donut chart (labels
  already display device name and percentage)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>

* fix: bundle mermaid+dagre together and add missing react-is dep

- Add manualChunks rule to bundle mermaid and dagre into a single chunk,
  preventing stale hash errors when cached mermaid chunks reference
  old dagre chunk filenames after redeployment
- Add react-is as a direct dependency (required by recharts at build
  time but only present as a transitive dev dependency)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>

---------

Co-authored-by: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
