---
id: use-7-day-rolling-average-for-analytics-anomaly-de
title: use 7-day rolling average for analytics anomaly detection
column: changelog
labels:
  - Bugfix
  - 'PR #258'
createdAt: '2026-03-07T00:50:55.000Z'
updatedAt: '2026-03-07T00:50:55.000Z'
history:
  - type: column
    timestamp: '2026-03-07T00:50:55.000Z'
    columnId: changelog
    columnTitle: Change Log
---
The previous day-over-day comparison triggered false positives when traffic
returned to baseline after a spike (e.g. 573→318 = -45%, but 318 is normal).

Now compares against the 7-day rolling average with a -40% threshold, which
is more resilient to natural traffic fluctuations.

Closes #256

Co-authored-by: Claude Opus 4.6 <noreply@anthropic.com>
