---
id: streamline-blog-post-build-deploy-pipeline
title: Streamline blog post build/deploy pipeline
column: changelog
labels:
  - Medium
createdAt: '2026-02-24T23:10:07.895Z'
updatedAt: '2026-02-24T23:23:14.565Z'
history:
  - type: column
    timestamp: '2026-02-24T23:10:07.895Z'
    columnId: ideas
    columnTitle: Ideas
  - type: column
    timestamp: '2026-02-24T23:23:14.565Z'
    columnId: changelog
    columnTitle: Change Log
---
Added a `detect-changes` job to `deploy.yml` that classifies pushes as content-only or full-build. Content-only deploys skip Playwright tests, unit tests, Sentry source maps, security audit, and bundle size checks. Deployed in PR #249. Full pipeline: ~10min → Content-only: ~2min.
