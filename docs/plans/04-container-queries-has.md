# Container Queries & :has() Selector Plan

## Overview

Explore modern CSS features: container queries for component-based responsive design and `:has()` for parent selection. This is a learning/experimentation initiative.

## Browser Support

| Feature | Chrome | Firefox | Safari | Status |
|---------|--------|---------|--------|--------|
| Container queries | 105+ | 110+ | 16+ | ✅ Production ready |
| `:has()` | 105+ | 121+ | 15.4+ | ✅ Production ready |

Both features have excellent support (95%+ global coverage).

## Use Cases in This Codebase

### Container Queries

Replace viewport-based responsive design with container-based for reusable components.

**1. BlogCard / ProjectCard**

Cards currently use viewport breakpoints (`md:`, `lg:`) but could adapt to their container:

```css
/* Current: viewport-based */
.card-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3;
}

/* New: container-based */
.card-container {
  container-type: inline-size;
}

@container (min-width: 300px) {
  .card-title { font-size: 1.25rem; }
}

@container (min-width: 500px) {
  .card-layout { flex-direction: row; }
}
```

**2. Analytics Dashboard Cards**

Dashboard cards appear in different grid contexts. Container queries would let each card adapt independently.

**3. IncidentInput (Uptime Calculator)**

Mobile/desktop layout switch at `md:` could be container-based for better component reusability.

### :has() Selector

Style parents based on their children without JavaScript state.

**1. Form validation styling**

```css
/* Style form group when input is invalid */
.form-group:has(input:invalid) {
  border-color: red;
}

/* Style label when sibling input is focused */
.form-group:has(input:focus) label {
  color: var(--primary);
}
```

**2. Card hover effects**

```css
/* Highlight related items when link is focused */
.card:has(a:focus) .card-icon {
  transform: scale(1.1);
}
```

**3. Empty state detection**

```css
/* Hide container when it has no visible children */
.tag-list:not(:has(.tag:not([hidden]))) {
  display: none;
}
```

## Implementation Approach

### Phase 1: Setup Tailwind Container Queries

Add container query support to Tailwind config:

```js
// tailwind.config.js (Tailwind v3)
module.exports = {
  theme: {
    containers: {
      xs: '20rem',
      sm: '24rem',
      md: '28rem',
      lg: '32rem',
      xl: '36rem',
    }
  },
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
}
```

With Tailwind v4, container queries are built-in:
```css
@container (width >= 20rem) { ... }
```

### Phase 2: Refactor One Component

Start with `ProjectCard` as proof of concept:

```tsx
// Parent grid
<div className="@container">
  <ProjectCard />
</div>

// Card adapts to container
<Card className="@sm:flex-row @lg:p-6">
```

### Phase 3: Add :has() Utilities

Create custom utilities if needed:

```css
/* globals.css */
.card:has(a:focus-visible) {
  @apply ring-2 ring-primary;
}

.form-field:has(:invalid) {
  @apply border-destructive;
}
```

## Files to Modify

```
tailwind.config.js         # Add container queries plugin (v3) or use built-in (v4)
src/components/blog/BlogCard.tsx
src/components/projects/ProjectCard.tsx
src/components/analytics/cards/*.tsx  # Overview cards
src/styles/globals.css     # :has() utilities
```

## Verification

1. Cards render correctly at all container sizes
2. :has() styles apply correctly (check with DevTools)
3. No layout shifts when containers resize
4. Fallback behavior in older browsers (graceful degradation)

## Implementation Notes

**Container queries:**
- Always set container context (`@container` class or `container-type: inline-size`) on the wrapper element, otherwise `@md:` won't apply
- Limit to cards and grids — avoid "every component becomes a container" sprawl

**:has() selector:**
- Firefox support is partial — use progressive enhancement (keep existing JS/state for critical UX, `:has()` as enhancement)
- Performance: `:has()` can be expensive on large DOMs — keep selectors scoped (e.g., `.card:has(.field:focus-visible)` not global)

**Testing:**
- Add Playwright visual check showing same card in narrow vs wide container

**Docs:**
- Document which components are safe for container queries
- Capture gotchas discovered during implementation

## Learning Goals

- Understand when container queries are better than viewport queries
- Practice :has() selector patterns
- Document gotchas and best practices for future reference

## Effort

**Estimate**: Small-Medium

- Setup: 15 min
- First component refactor: 30 min
- Additional components: 15 min each
- Documentation: 15 min

## Dependencies

- Consider doing **Tailwind v4 upgrade** first (container queries built-in)
- Or install `@tailwindcss/container-queries` plugin for v3
