---
id: migrate-to-lucide-react-1-x
title: migrate to lucide-react 1.x
column: changelog
labels:
  - Bugfix
  - 'PR #293'
createdAt: '2026-05-01T00:55:12.000Z'
updatedAt: '2026-05-01T00:55:12.000Z'
history:
  - type: column
    timestamp: '2026-05-01T00:55:12.000Z'
    columnId: changelog
    columnTitle: Change Log
---
* deps(deps): bump lucide-react from 0.563.0 to 1.8.0

Bumps [lucide-react](https://github.com/lucide-icons/lucide/tree/HEAD/packages/lucide-react) from 0.563.0 to 1.8.0.
- [Release notes](https://github.com/lucide-icons/lucide/releases)
- [Commits](https://github.com/lucide-icons/lucide/commits/1.8.0/packages/lucide-react)

---
updated-dependencies:
- dependency-name: lucide-react
  dependency-version: 1.8.0
  dependency-type: direct:production
  update-type: version-update:semver-major
...

Signed-off-by: dependabot[bot] <support@github.com>

* fix(deps): migrate to lucide-react 1.x

Lucide 1.x dropped brand icons (no Linkedin) and made LucideIcon
type-only. This bundles the major bump with the source-side fixes
so the dependabot PR #292 can be replaced cleanly.

- Add src/components/icons/LinkedinIcon.tsx as a small inline-SVG
  component matching the GitHubMark pattern. Uses currentColor so
  it inherits text color the same way the lucide icon did.
- Switch HeroSection and ContactSection to import LinkedinIcon
  instead of Linkedin from lucide-react.
- Fix the value-import of LucideIcon in MetricCard.tsx — it's a
  type now, not a runtime export.

All 215 tests pass; typecheck clean.

Closes #292

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>

---------

Signed-off-by: dependabot[bot] <support@github.com>
Co-authored-by: dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>
Co-authored-by: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
