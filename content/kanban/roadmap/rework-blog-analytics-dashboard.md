---
id: rework-blog-analytics-dashboard
title: rework blog analytics dashboard
column: changelog
labels:
  - Feature
  - 'PR #246'
createdAt: '2026-02-24T21:33:28.000Z'
updatedAt: '2026-02-24T21:33:28.000Z'
history:
  - type: column
    timestamp: '2026-02-24T21:33:28.000Z'
    columnId: changelog
    columnTitle: Change Log
---
* feat(analytics): rework blog analytics dashboard

- Add all-time leaderboard aggregating GA4 history across all entries
- Fix slug matching for renamed posts via alias map + year normalization
- Replace single-line blog traffic chart with stacked area (top 5 posts)
- Replace avg reading time metric with all-time views; add WoW trend
- Switch tag breakdown to all-time data; remove sparse category pie chart
- Trim 7d table to top 5, streamline columns

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>

* fix(analytics): address Codex review feedback

- Remove risky partial substring matching in slug resolver to prevent
  silent data misattribution; add min key length guard (>=10 chars)
- Use Date.getTime() for firstSeen/lastSeen comparisons instead of
  string comparison to handle non-ISO date formats safely

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>

---------

Co-authored-by: Claude Opus 4.6 <noreply@anthropic.com>
