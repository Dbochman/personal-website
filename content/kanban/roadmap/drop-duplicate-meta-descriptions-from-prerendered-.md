---
id: drop-duplicate-meta-descriptions-from-prerendered-
title: 'drop duplicate meta descriptions from prerendered pages [blog]'
column: changelog
labels:
  - Bugfix
  - 'PR #309'
createdAt: '2026-06-11T03:17:24.000Z'
updatedAt: '2026-06-11T03:17:24.000Z'
history:
  - type: column
    timestamp: '2026-06-11T03:17:24.000Z'
    columnId: changelog
    columnTitle: Change Log
---
Every blog post shipped two meta description tags: the site-wide bio
hardcoded in index.html first, then the correct per-post one from
react-helmet. Crawlers take the first, so Google's snippet for every
post was an SRE bio — a direct CTR hit (0.42% at avg position 7.5,
where 2-4% is typical). Same duplication affected og:/twitter: tags.

The prerender step now removes static template tags whenever helmet
rendered the same key (data-rh), so exactly one value ships per tag.

Also: retargeted the Decap CMS post description toward the dominant
query cluster from Search Console data (build hooks + config.yml,
~98% of site impressions), and documented where unsanitized query
data lives (docs/metrics) vs the public copy that strips it.

Co-authored-by: Claude Fable 5 <noreply@anthropic.com>
