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
createdAt: "2026-01-15T00:00:00.000Z"
updatedAt: "2026-01-16T01:35:00.000Z"
history:
  - columnId: todo
    columnTitle: To Do
    timestamp: "2026-01-15T12:00:00.000Z"
    type: column
  - columnId: in-progress
    columnTitle: In Progress
    timestamp: "2026-01-16T01:22:46.568Z"
    type: column
  - columnId: in-review
    columnTitle: In Review
    timestamp: "2026-01-16T01:22:46.910Z"
    type: column
  - columnId: changelog
    columnTitle: Change Log
    timestamp: "2026-01-16T01:35:00.000Z"
    type: column
---

Deduplicate time-series data in useAnalyticsData hook. ga4-history.json has multiple entries per date from automated collection.
