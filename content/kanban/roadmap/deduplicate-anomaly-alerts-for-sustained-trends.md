---
id: deduplicate-anomaly-alerts-for-sustained-trends
title: deduplicate anomaly alerts for sustained trends
column: changelog
labels:
  - Bugfix
createdAt: '2026-03-28T15:57:22.000Z'
updatedAt: '2026-03-28T15:57:22.000Z'
history:
  - type: column
    timestamp: '2026-03-28T15:57:22.000Z'
    columnId: changelog
    columnTitle: Change Log
---
Instead of creating a new issue every day during a prolonged traffic
decline, append updates as comments on the most recent open anomaly
issue (within 3 days). New issues are still created for fresh incidents.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
