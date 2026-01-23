---
id: sentry-enhancement
title: Sentry Error Tracking Enhancement
column: changelog
labels:
  - "PR #130"
  - Observability
checklist:
  - id: se-1
    text: Install @sentry/cli and add auth token to GitHub secrets
    completed: true
  - id: se-2
    text: Add source map upload to deploy workflow
    completed: true
  - id: se-3
    text: Wrap App in Sentry.ErrorBoundary with fallback UI
    completed: true
  - id: se-4
    text: Add release tracking with commit SHA
    completed: true
  - id: se-5
    text: Verify source maps appear in Sentry dashboard
    completed: true
planFile: docs/plans/23-sentry-error-tracking.md
createdAt: "2026-01-15"
updatedAt: "2026-01-16T02:10:00.000Z"
history:
  - type: column
    timestamp: "2026-01-16T01:22:48.676Z"
    columnId: in-progress
    columnTitle: In Progress
  - type: column
    timestamp: "2026-01-16T01:41:18.527Z"
    columnId: in-review
    columnTitle: In Review
  - type: column
    timestamp: "2026-01-16T02:10:00.000Z"
    columnId: changelog
    columnTitle: Change Log
description: |
  Source maps for readable stack traces, React error boundaries, release tracking, and improved debugging context.
  
  Codex Review of PR #130:
  - High (fixed): Sentry lazy loading inconsistency - ErrorBoundary imported but Sentry.init deferred. Fixed: now initializes synchronously before render.
  - Medium (fixed): Source maps publicly served exposing source code. Fixed: using hidden sourcemaps + delete after Sentry upload.
---
