---
id: fix-quarantine-section-min-release-age-not-enforce
title: fix quarantine section — min-release-age not enforced in npm 11
column: changelog
createdAt: '2026-03-31T13:26:04.000Z'
updatedAt: '2026-03-31T13:26:04.000Z'
history:
  - type: column
    timestamp: '2026-03-31T13:26:04.000Z'
    columnId: changelog
    columnTitle: Change Log
---
npm warns "Unknown user config" for min-release-age, so it's not
actually protecting anything. Kept uv exclude-newer (which works)
and noted npm doesn't have an equivalent yet.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
