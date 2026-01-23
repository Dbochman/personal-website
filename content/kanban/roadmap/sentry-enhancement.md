---
id: sentry-enhancement
title: Sentry Error Tracking Enhancement
column: changelog
labels:
  - 'PR #130'
  - Observability
checklist:
  - completed: true
    id: se-1
    text: Install @sentry/cli and add auth token to GitHub secrets
  - completed: true
    id: se-2
    text: Add source map upload to deploy workflow
  - completed: true
    id: se-3
    text: Wrap App in Sentry.ErrorBoundary with fallback UI
  - completed: true
    id: se-4
    text: Add release tracking with commit SHA
  - completed: true
    id: se-5
    text: Verify source maps appear in Sentry dashboard
createdAt: '2026-01-15'
updatedAt: '2026-01-16T02:10:00.000Z'
history:
  - columnId: in-progress
    columnTitle: In Progress
    timestamp: '2026-01-16T01:22:48.676Z'
    type: column
  - columnId: in-review
    columnTitle: In Review
    timestamp: '2026-01-16T01:41:18.527Z'
    type: column
  - columnId: changelog
    columnTitle: Change Log
    timestamp: '2026-01-16T02:10:00.000Z'
    type: column
---
Source maps for readable stack traces, React error boundaries, release tracking, and improved debugging context.

Codex Review of PR #130:
- High (fixed): Sentry lazy loading inconsistency - ErrorBoundary imported but Sentry.init deferred. Fixed: now initializes synchronously before render.
- Medium (fixed): Source maps publicly served exposing source code. Fixed: using hidden sourcemaps + delete after Sentry upload.
