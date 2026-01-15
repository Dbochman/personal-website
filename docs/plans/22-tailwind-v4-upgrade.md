# Plan: Tailwind CSS v4 Upgrade

## Executive Summary

**Current Version:** Tailwind CSS v3.4.11
**Target Version:** Tailwind CSS v4.x
**Estimated Effort:** Medium-Large (~2-3 hours)
**Risk Level:** Medium - significant changes to color system and animation plugin

### Key Changes Required

- Replace `tailwindcss-animate` with `tw-animate-css`
- Migrate HSL color variables to new format
- Convert `tailwind.config.ts` to CSS-based `@theme` configuration
- Switch to Vite plugin (recommended) or update PostCSS config
- Update import syntax in `src/index.css`

## Current State

**Dependencies:**
- `tailwindcss` v3.4.11
- `tailwindcss-animate` plugin
- `@tailwindcss/container-queries` plugin (now built-in to v4)
- `autoprefixer` (now built-in to v4)

**Config files:**
- `tailwind.config.ts` - 130 lines of JS config
- `postcss.config.js` - using `tailwindcss` and `autoprefixer`
- `src/index.css` - uses `@tailwind base/components/utilities`

**Breaking changes impact:** ~116 occurrences of potentially affected utilities across 59 files

## Benefits of Upgrading

### Performance Improvements

| Metric | v3 | v4 | Improvement |
|--------|-----|-----|-------------|
| Full builds | ~378ms | ~100ms | **3.5x faster** |
| Incremental builds (new CSS) | 44ms | 5ms | **8.8x faster** |
| Incremental builds (no new CSS) | 35ms | 192μs | **182x faster** |

### Developer Experience

- **First-party Vite plugin** - tighter integration with our build system
- **CSS-first configuration** - all config in one CSS file
- **Automatic content detection** - no need to configure template paths
- **Built-in tooling** - no need for `autoprefixer` or `postcss-import`

### New Features

- Dynamic values without brackets (`h-100` instead of `h-[100px]`)
- Built-in container queries (no plugin needed)
- OKLCH color space with P3 display support
- Native CSS nesting support
- 3D transform utilities

## Browser Requirements

v4 requires modern CSS features (`@property`, `color-mix()`):
- Safari 16.4+ (released March 2023) ✓
- Chrome 111+ (released March 2023) ✓
- Firefox 128+ (released July 2024) ✓

This site already targets modern browsers (View Transitions API requires similar support).

## Breaking Changes Impact Analysis

### High Impact (Requires Manual Changes)

| Change | Current Usage | Migration Required |
|--------|---------------|-------------------|
| `tailwindcss-animate` deprecated | Used in `tailwind.config.ts` | Replace with `tw-animate-css` |
| HSL color format | `hsl(var(--color))` pattern | Wrap HSL in variable, use `@theme inline` |
| Container config (`center`, `padding`) | Used in `tailwind.config.ts` | Convert to `@utility container` |
| Import syntax | `@tailwind base/components/utilities` | Change to `@import "tailwindcss"` |

### Medium Impact (Auto-migrated or Simple Changes)

| Change | Current Usage | Notes |
|--------|---------------|-------|
| Default border color | Using `border-foreground/20` | Now defaults to `currentColor` - verify visual appearance |
| Ring width default | May use `ring` utility | Changed from 3px to 1px |
| Renamed utilities | `shadow-sm`, `rounded-sm`, etc. | Upgrade tool handles this |

### Low Impact (Likely No Changes Needed)

| Change | Notes |
|--------|-------|
| Dark mode (class-based) | Still supported in v4 |
| Custom keyframes | Should work as-is |
| `tailwind-merge` | v2.5.2 is compatible |
| CVA (class-variance-authority) | Compatible with v4 output |

## Migration Steps

### Phase 1: Run Upgrade Tool

```bash
# Create migration branch
git checkout -b feature/tailwind-v4

# Run official upgrade tool (Node 20+ required)
npx @tailwindcss/upgrade

# Review changes
git diff
```

The tool will:
- Update dependencies in `package.json`
- Attempt to migrate `tailwind.config.ts` to CSS
- Update template files with renamed utilities

### Phase 2: Install Vite Plugin

```bash
# Install the Vite plugin (recommended over PostCSS for Vite projects)
npm install -D @tailwindcss/vite
```

**Update vite.config.ts:**
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ... rest of config
});
```

### Phase 3: Replace Animation Plugin

```bash
# Remove old plugin
npm uninstall tailwindcss-animate

# Install replacement
npm install -D tw-animate-css
```

**Update src/index.css:**
```css
@import "tailwindcss";
@import "tw-animate-css";
```

### Phase 4: Migrate CSS Variables

**Current Format (v3):**
```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
  }
}
```
```typescript
// tailwind.config.ts
colors: {
  background: 'hsl(var(--background))',
}
```

**Target Format (v4):**
```css
@import "tailwindcss";

/* Move :root and .dark OUT of @layer base */
:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(222.2 84% 4.9%);
  /* ... all colors with hsl() wrapper */
}

.dark {
  --background: hsl(222.2 84% 4.9%);
  --foreground: hsl(210 40% 98%);
  /* ... */
}

/* Register colors with Tailwind using @theme inline */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  /* ... map all colors */

  /* Border radius */
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}
```

**Benefits of new format:**
1. VSCode color picker works - colors display correctly in editor
2. Chrome DevTools support - can see actual color values
3. Simpler mental model - HSL is in the variable, not wrapped at usage

### Phase 5: Migrate Config to CSS

**Container utility:**
```css
@utility container {
  margin-inline: auto;
  padding-inline: 2rem;
  max-width: 1400px;
}
```

**Font family:**
```css
@theme {
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
```

**Custom utilities:**
```css
/* v3 */
@layer utilities {
  .gauge-progress { ... }
}

/* v4 */
@utility gauge-progress {
  transform: rotate(-90deg);
}
```

### Phase 6: Fix Renamed Utilities

Search and replace in codebase:

| Find | Replace | Files affected |
|------|---------|----------------|
| `shadow-sm` | `shadow-xs` | ~30 |
| `shadow` (standalone) | `shadow-sm` | (check usage) |
| `rounded-sm` | `rounded-xs` | ~20 |
| `rounded` (standalone) | `rounded-sm` | (check usage) |
| `outline-none` | `outline-hidden` | ~10 |
| `ring` (standalone) | `ring-3` | (check usage) |
| `blur-sm` | `blur-xs` | ~5 |

### Phase 7: Update PostCSS (if not using Vite plugin)

```javascript
// postcss.config.js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

Remove `autoprefixer` and `postcss-import` from dependencies (built-in).

### Phase 8: Test and Verify

1. Run `npm run dev` and check for build errors
2. Visually inspect all pages
3. Test dark mode toggle
4. Verify animations work (accordion, Framer Motion)
5. Check responsive breakpoints
6. Run existing tests

## Checklist

- [ ] Run `npx @tailwindcss/upgrade` on feature branch
- [ ] Review and commit automated changes
- [ ] Install `@tailwindcss/vite` plugin
- [ ] Replace `tailwindcss-animate` with `tw-animate-css`
- [ ] Migrate CSS variables to new format (hsl in variable)
- [ ] Add `@theme inline` block for color registration
- [ ] Convert container config to `@utility`
- [ ] Fix shadow/blur/rounded utility renames
- [ ] Update `outline-none` → `outline-hidden`
- [ ] Review ring utility usage
- [ ] Verify border color defaults
- [ ] Remove @tailwindcss/container-queries (now built-in)
- [ ] Convert custom utilities to `@utility` syntax
- [ ] Delete `tailwind.config.ts` if all config in CSS
- [ ] Test dark mode toggle
- [ ] Test all animations (accordion, Framer Motion)
- [ ] Run Lighthouse audit before/after
- [ ] Visual regression check on key pages

## Testing Checklist

### Visual Regression Testing

- [ ] Homepage hero section
- [ ] Navigation (desktop and mobile)
- [ ] Experience section cards
- [ ] Blog listing page (card shadows, borders)
- [ ] Blog post pages
- [ ] Projects page
- [ ] Analytics dashboard (charts, cards)
- [ ] Kanban board (drag states, colors)
- [ ] Dark mode on all pages
- [ ] Mobile responsive views

### Functionality Testing

- [ ] Dark mode toggle works
- [ ] Accordion animations
- [ ] Framer Motion stagger animations
- [ ] Hover effects on cards
- [ ] Mobile menu open/close
- [ ] Tab transitions on Analytics

### Build Testing

- [ ] `npm run build` succeeds
- [ ] `npm run preview` shows correct output
- [ ] No console errors in browser
- [ ] Lighthouse scores maintained
- [ ] Bundle size comparison (v4 should be smaller)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Plugin incompatibility | Use `tw-animate-css` replacement, fallback to CSS |
| Subtle visual differences | Visual regression testing, side-by-side comparison |
| Build failures | Run upgrade on branch, thorough review before merge |
| CSS variable conflicts | Current vars use `--` prefix, v4 uses `--tw-` by default |
| Color picker issues | Wrap HSL values in variables per new format |

## Rollback Plan

If critical issues are found:

```bash
# Discard all changes and return to main
git checkout main

# Or reset to before migration
git reset --hard HEAD~N  # where N is number of commits to undo
```

Keep the migration branch for reference even if not merged immediately.

## Resources

### Official Documentation
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Tailwind CSS v4.0 Release Blog](https://tailwindcss.com/blog/tailwindcss-v4)
- Automated tool: `npx @tailwindcss/upgrade`

### shadcn/ui Migration
- [shadcn/ui Tailwind v4 Guide](https://ui.shadcn.com/docs/tailwind-v4)

### Community Guides
- [Migrating from Tailwind CSS v3 to v4: A Complete Developer's Guide](https://dev.to/elechipro/migrating-from-tailwind-css-v3-to-v4-a-complete-developers-guide-cjd)
- [Updating shadcn/ui to Tailwind 4 - Theming Guide](https://www.shadcnblocks.com/blog/tailwind4-shadcn-themeing/)

### npm Packages
- [tw-animate-css](https://www.npmjs.com/package/tw-animate-css) - Animation replacement
- [@tailwindcss/vite](https://www.npmjs.com/package/@tailwindcss/vite) - Vite plugin
- [@tailwindcss/postcss](https://www.npmjs.com/package/@tailwindcss/postcss) - PostCSS plugin
