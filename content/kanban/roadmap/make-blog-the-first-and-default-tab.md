---
id: make-blog-the-first-and-default-tab
title: make Blog the first and default tab
column: changelog
labels:
  - Feature
createdAt: '2026-04-26T01:39:01.000Z'
updatedAt: '2026-04-26T01:39:01.000Z'
history:
  - type: column
    timestamp: '2026-04-26T01:39:01.000Z'
    columnId: changelog
    columnTitle: Change Log
---
Reorders ANALYTICS_TABS so Blog is first and sets it as the initial
activeTab. Also fixes the Search CTR display (averageCTR is already a
percentage; the extra *100 was double-scaling it).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
