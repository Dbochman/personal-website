---
id: serve-fresh-lighthouse-scores-on-projects-analytic
title: serve fresh Lighthouse scores on /projects/analytics
column: changelog
labels:
  - Bugfix
  - 'PR #311'
createdAt: '2026-06-13T01:56:03.000Z'
updatedAt: '2026-06-13T01:56:03.000Z'
history:
  - type: column
    timestamp: '2026-06-13T01:56:03.000Z'
    columnId: changelog
    columnTitle: Change Log
---
* fix(analytics): pull fresh Lighthouse summary from lighthouse-metrics branch at build time

The /projects/analytics dashboard served lighthouse-reports/summary.json
from main, last updated 2026-01-13 (home perf 95 vs ~52-75 measured now).
Lighthouse CI commits fresh results only to the lighthouse-metrics branch,
so the deployed copy never updated.

copy-metrics-to-public.js now fetches summary.json from the
lighthouse-metrics branch via raw.githubusercontent.com during
build:content, falling back to the tracked copy when offline. Also
refreshes the tracked fallback to the 2026-06-11 run (project-uptime
page replaced by project-slo in the audit set).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

* perf: stop shipping mermaid to chartless pages, defer gtag.js [blog:perf]

Three compounding fixes for the Lighthouse regressions surfaced by the
fresh dashboard data:

1. vite.config.ts: d3 modules (shared by recharts via victory-vendor and
   by mermaid) had no manualChunks assignment, so Rollup inlined them
   into the mermaid chunk — every chart chunk then statically imported
   ~700KB of mermaid. Pin d3/victory-vendor to their own 'd3' chunk so
   the mermaid chunk is reachable only via dynamic import again.

2. prerender.mjs: DOM snapshots captured the modulepreload links Vite's
   runtime preload helper inserted for lazy chunks, baking them into the
   static HTML. Keep only the template's own preloads.

3. index.html: load gtag.js (152KB, 470ms script eval) after window load
   + idle instead of at startup; gtag() calls queue in dataLayer
   meanwhile. Prerender strips the runtime-injected tag from snapshots.

Local Lighthouse (throttled, preview server):
  blog-post-404: perf 57 -> 79 (FCP 8.0s -> 2.6s, LCP 9.0s -> 4.7s)
  home:          perf 52 -> 92 (TBT 690ms -> 20ms)
Verified mermaid still renders on /projects/incident-command-diagrams.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

---------

Co-authored-by: Claude Fable 5 <noreply@anthropic.com>
