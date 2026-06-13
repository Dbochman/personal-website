---
id: add-median-sampling-follow-up-to-the-gauge-post-bl
title: 'add median-sampling follow-up to the gauge post [blog:perf]'
column: changelog
createdAt: '2026-06-13T02:29:41.000Z'
updatedAt: '2026-06-13T02:29:41.000Z'
history:
  - type: column
    timestamp: '2026-06-13T02:29:41.000Z'
    columnId: changelog
    columnTitle: Change Log
---
The post diagnosed the dashboard's noise; #312 fixed it. Add a paragraph
to 'A gauge worth reading' covering the median-of-3 sampling and the
visible min-max spread now shown beneath each score. Updates the
run-to-run swing figure to ten-to-twenty points to match the landed
3-run data (spreads up to 21 points). slop-guard 100/100.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
