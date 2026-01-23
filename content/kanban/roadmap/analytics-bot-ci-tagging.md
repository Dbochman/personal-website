---
id: analytics-bot-ci-tagging
title: Analytics Bot & CI Traffic Tagging
column: ideas
labels:
  - Small
  - Analytics
checklist:
  - id: abt-1
    text: Create traffic classification utility (bot, ci, human)
    completed: false
  - id: abt-2
    text: Detect CI via user agent (HeadlessChrome, Playwright)
    completed: false
  - id: abt-3
    text: Add custom dimension to GA4 config
    completed: false
  - id: abt-4
    text: Tag sessions on first pageview
    completed: false
  - id: abt-5
    text: Add traffic type filter to analytics dashboard
    completed: false
  - id: abt-6
    text: Document patterns discovered for future reference
    completed: false
createdAt: "2026-01-19T00:00:00.000Z"
---

Tag suspicious traffic with custom dimension instead of filtering. Enables analysis of bot patterns while keeping data.

Indicators to tag:
- Known bot user agents (Googlebot, Bingbot, HeadlessChrome, etc.)
- CI/automation user agents (GitHub Actions runners)
- Zero scroll/interaction events within session
- Datacenter IP ranges (if detectable client-side)
- Known probe paths (wp-admin, .env, xmlrpc.php, etc.)
