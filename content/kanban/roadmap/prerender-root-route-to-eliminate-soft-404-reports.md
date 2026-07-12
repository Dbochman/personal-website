---
id: prerender-root-route-to-eliminate-soft-404-reports
title: prerender root route to eliminate Soft 404 reports
column: changelog
labels:
  - Bugfix
  - 'PR #299'
createdAt: '2026-05-18T00:37:08.000Z'
updatedAt: '2026-05-18T00:37:08.000Z'
history:
  - type: column
    timestamp: '2026-05-18T00:37:08.000Z'
    columnId: changelog
    columnTitle: Change Log
---
Google Search Console flagged http://dylanbochman.com/index.html (and
www variant) as Soft 404. The prerender script generated content for
/blog, /projects, etc., but not for /, so dist/index.html shipped as
the empty Vite SPA shell. Googlebot's no-JS pass saw an empty body and
classified it as Soft 404.

Adding / to the prerender routes overwrites dist/index.html with the
fully rendered homepage (~120KB vs. 10KB shell), matching the pattern
used for every other route. Both / and /index.html serve the same
file on GitHub Pages, so this fixes both reported URLs.

Co-authored-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
