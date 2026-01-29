---
id: jan-27-seo-prerender
title: "Jan 27: SEO Pre-render All Routes"
column: changelog
summary: Fixed Googlebot crawlability by pre-rendering all routes
labels:
  - SEO
  - Infrastructure
createdAt: "2026-01-27T00:00:00.000Z"
updatedAt: "2026-01-27T00:00:00.000Z"
history:
  - type: column
    timestamp: "2026-01-27T00:00:00.000Z"
    columnId: changelog
    columnTitle: Change Log
---

Pre-rendered all routes at build time to ensure Googlebot can crawl them without JavaScript execution. SPAs on GitHub Pages return 404 for direct URL access without pre-rendering.

Commit: 4eee9a8
