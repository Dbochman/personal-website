---
id: analytics-bot-ci-tagging
title: Analytics Bot & CI Traffic Tagging
column: changelog
labels:
  - Small
  - Analytics
checklist:
  - id: abt-1
    text: Create traffic classification utility (bot, ci, human)
    completed: true
  - id: abt-2
    text: Detect CI via user agent (HeadlessChrome, Playwright)
    completed: true
  - id: abt-3
    text: Add custom dimension to GA4 config
    completed: true
  - id: abt-4
    text: Tag sessions on first pageview
    completed: true
  - id: abt-5
    text: Add traffic type filter to analytics dashboard
    completed: true
  - id: abt-6
    text: Document patterns discovered for future reference
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

Tag suspicious traffic with custom dimension instead of filtering. Enables analysis of bot patterns while keeping data.

Implemented in `src/lib/analytics/clientTrafficClassifier.ts`:
- Known bot user agents (Googlebot, Bingbot, HeadlessChrome, etc.)
- CI/automation user agents (GitHub Actions runners, Playwright)
- Known probe paths (wp-admin, .env, xmlrpc.php, etc.)
- Sessions tagged on first pageview with GA4 custom dimension
