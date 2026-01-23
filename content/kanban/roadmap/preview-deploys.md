---
id: preview-deploys
title: Preview Deployments
column: changelog
labels:
  - Infrastructure
checklist:
  - id: pd-1
    text: Set up Cloudflare Pages with GitHub repo
    completed: true
  - id: pd-2
    text: Configure preview URL pattern
    completed: true
  - id: pd-3
    text: Create PR comment workflow with preview link
    completed: true
  - id: pd-4
    text: Configure environment variables (disable analytics in preview)
    completed: true
  - id: pd-5
    text: Add PreviewBanner component for visual indicator
    completed: true
planFile: docs/plans/10-preview-deployments.md
createdAt: "2026-01-13"
updatedAt: "2026-01-16T03:35:00.000Z"
history:
  - type: column
    timestamp: "2026-01-16T02:58:32.294Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-16T03:22:00.000Z"
    columnId: in-review
    columnTitle: In Review
  - type: column
    timestamp: "2026-01-16T03:35:00.000Z"
    columnId: changelog
    columnTitle: Change Log
---

Deploy PRs to unique preview URLs via Cloudflare Pages. Enables visual review before merge.

Preview URL: https://personal-website-adg.pages.dev
Branch pattern: <branch>.personal-website-adg.pages.dev
