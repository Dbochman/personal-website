---
id: analytics-dedupe
title: Analytics Data Deduplication
column: changelog
labels:
  - Small
  - Bug Fix
checklist:
  - id: ad-1
    text: Add deduplicateByDate helper function
    completed: true
  - id: ad-2
    text: Apply to ga4History and searchHistory data
    completed: true
  - id: ad-3
    text: Verify charts show one point per date
    completed: true
planFile: docs/plans/24-analytics-data-deduplication.md
createdAt: "2026-01-15"
updatedAt: "2026-01-16T01:35:00.000Z"
history:
  - type: column
    timestamp: "2026-01-15T12:00:00.000Z"
    columnId: todo
    columnTitle: To Do
  - type: column
    timestamp: "2026-01-16T01:22:46.568Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-16T01:22:46.910Z"
    columnId: in-review
    columnTitle: In Review
  - type: column
    timestamp: "2026-01-16T01:35:00.000Z"
    columnId: changelog
    columnTitle: Change Log
description: |
  Deduplicate time-series data in useAnalyticsData hook. ga4-history.json has multiple entries per date from automated collection.
---
