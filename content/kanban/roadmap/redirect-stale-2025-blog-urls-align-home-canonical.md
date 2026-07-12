---
id: redirect-stale-2025-blog-urls-align-home-canonical
title: 'redirect stale 2025 blog URLs + align home canonical [skip-review]'
column: changelog
labels:
  - Bugfix
  - 'PR #302'
createdAt: '2026-05-25T22:37:40.000Z'
updatedAt: '2026-05-25T22:37:40.000Z'
history:
  - type: column
    timestamp: '2026-05-25T22:37:40.000Z'
    columnId: changelog
    columnTitle: Change Log
---
Search Console flagged real issues uncovered after PR #301 deployed:

- 5 blog posts with legacy 2025-MM-DD URLs were renamed to 2026-MM-DD
  without redirects, so Google was hitting genuine 404s. Add explicit
  static redirects to their canonical 2026 counterparts (or their
  custom-slug canonical for the two posts that have one).
- Home page <Seo> didn't pass a url prop, so the canonical rendered
  as https://dylanbochman.com (no trailing slash) while the sitemap
  advertises https://dylanbochman.com/. The mismatch likely triggered
  the Soft 404 classification on home-page URL variants. Pass url="/"
  so the canonical exactly matches the sitemap entry.

After deploy, the Not Found (404) bucket should validate cleanly and
the Soft 404 bucket should converge once Enforce HTTPS is also on in
the repo Pages settings.

Co-authored-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
