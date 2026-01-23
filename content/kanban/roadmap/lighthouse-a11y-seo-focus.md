---
id: lighthouse-a11y-seo-focus
title: "Lighthouse: A11y & SEO Focus"
column: changelog
labels:
  - Small
  - Analytics
  - Accessibility
checklist:
  - id: las-1
    text: Review current Lighthouse workflow frequency and categories
    completed: true
  - id: las-2
    text: Configure Lighthouse to focus on a11y and SEO categories
    completed: true
  - id: las-3
    text: Reduce run frequency (weekly or on significant changes)
    completed: true
  - id: las-4
    text: Add a11y score to analytics dashboard
    completed: true
createdAt: "2026-01-19T00:00:00.000Z"
updatedAt: "2026-01-23T00:00:00.000Z"
history:
  - type: column
    timestamp: "2026-01-19T00:00:00.000Z"
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: "2026-01-21T00:00:00.000Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-23T00:00:00.000Z"
    columnId: changelog
    columnTitle: Change Log
---

Lab Lighthouse provides unique value for accessibility audits and SEO checks that field CWV data can't capture. Reframed the workflow to focus on these strengths.

Implemented in `.github/workflows/lighthouse.yml`:
- Path-based triggers (only runs on UI changes to src/pages, components, CSS)
- Multi-page testing with thresholds: A11y ≥95, SEO ≥90, Best Practices ≥90
- Results stored in lighthouse-metrics branch for historical tracking
