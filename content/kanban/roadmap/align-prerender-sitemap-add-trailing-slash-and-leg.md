---
id: align-prerender-sitemap-add-trailing-slash-and-leg
title: 'align prerender + sitemap, add trailing-slash and legacy redirects'
column: changelog
labels:
  - Bugfix
createdAt: '2026-05-25T22:14:22.000Z'
updatedAt: '2026-05-25T22:14:22.000Z'
history:
  - type: column
    timestamp: '2026-05-25T22:14:22.000Z'
    columnId: changelog
    columnTitle: Change Log
---
Fixes the route generation issues behind the Search Console indexing buckets by aligning sitemap URLs, prerendered artifacts, and canonical tags.

- prerender sitemap-facing routes as slashless `.html` files for GitHub Pages
- emit static meta-refresh artifacts for every trailing-slash variant and legacy slug (manifest-driven blog aliases + a small hardcoded list in `src/data/seo-redirects.json`)
- omit draft projects from the sitemap; use the generated blog manifest so custom slugs receive real prerendered pages
- move canonical URL generation into the React SEO component to avoid duplicate/root canonicals
- add `verify-seo-routes` as a pre-deploy gate (canonical artifacts + matching trailing-slash and legacy redirects, derived from sitemap and `seo-redirects.json`)
- add `smoke-live-routes` in a separate post-deploy job that polls `/build-info.json` for the new build's sha, then verifies live routes serve real content or the expected redirect — catches any GitHub Pages serving regression that pure dist checks can't see

🤖 Generated with [Claude Code](https://claude.com/claude-code)
