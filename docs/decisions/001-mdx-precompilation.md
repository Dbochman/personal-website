# ADR-001: MDX Precompilation

**Date:** 2026-01-11
**Status:** Accepted

## Context

Blog post pages had poor Lighthouse scores (~65%) due to runtime MDX compilation. The MDX runtime bundle was 1.1MB, split into 3 chunks but still loaded on every blog page visit. LCP was 5.6s on blog posts.

Options considered:
1. **Runtime compilation** (status quo) - Simple, but slow
2. **Build-time precompilation** - Faster runtime, more build complexity
3. **Static site generator** (Astro) - Would require rewrite

## Decision

Implemented build-time MDX precompilation via `scripts/precompile-mdx.js`. MDX files are compiled to JavaScript at build time and stored in `src/generated/`. Blog pages use synchronous loaders that import precompiled content.

Key implementation details:
- Synchronous loaders (`getPostsSync`, `getPostSync`) for SSR/pre-rendering compatibility
- Slugs derived from filenames (e.g., `2026-01-10-title.txt` → `title`)
- Precompiled output excluded from git via `.gitignore`

## Consequences

**Positive:**
- Blog LCP improved 5.6s → 3.1s (45% faster)
- Lighthouse score improved ~65% → 89%
- No MDX runtime bundle on client
- SSR/pre-rendering now works correctly

**Negative:**
- Build step required (`npm run precompile-mdx`)
- Generated files add to build complexity
- Hot reload requires rebuild for MDX changes

**Enables:**
- Further performance optimizations
- Better SEO (faster page loads)
- Pre-rendering for static hosting
