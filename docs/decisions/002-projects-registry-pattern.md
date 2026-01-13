# ADR-002: Projects Registry Pattern

**Date:** 2026-01-12
**Status:** Accepted

## Context

Adding a `/projects` page to showcase interactive SRE tools. Needed a pattern for:
- Adding new projects without changing routing
- Code splitting (each project is a separate chunk)
- Consistent metadata (title, description, tags) across projects
- SEO-friendly individual project pages

Options considered:
1. **File-based routing** - Auto-generate routes from filesystem
2. **Hardcoded routes** - Simple but doesn't scale
3. **Registry pattern** - Central definition with lazy loading

## Decision

Implemented a registry pattern in `src/data/projects.ts`:

```typescript
const projects: ProjectDefinition[] = [
  {
    slug: 'uptime-calculator',
    meta: { title, description, tags },
    component: lazy(() => import('../components/projects/uptime-calculator'))
  }
]
```

Key implementation details:
- `ProjectDefinition` type with metadata and lazy-loaded component
- Helper functions: `getProjects()`, `getProject(slug)`
- Wrapper page (`src/pages/Project.tsx`) handles SEO, loading states
- Same pattern used for blog posts (consistency)

## Consequences

**Positive:**
- Adding a project = one registry entry + component folder
- Automatic code splitting via `React.lazy`
- Centralized metadata for listing page and SEO
- Consistent with blog architecture

**Negative:**
- Manual registry updates required (not automatic)
- Slightly more boilerplate than file-based routing

**Enables:**
- Easy addition of new interactive tools
- Per-project SEO optimization
- Future: project categories, filtering, search
