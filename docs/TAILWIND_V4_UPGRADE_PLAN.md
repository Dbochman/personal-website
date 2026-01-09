# Tailwind CSS v4 Upgrade Plan

This document outlines the migration strategy from Tailwind CSS v3.4.11 to v4.x for the personal-website project.

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Benefits of Upgrading](#benefits-of-upgrading)
3. [Browser Requirements](#browser-requirements)
4. [Breaking Changes Impact Analysis](#breaking-changes-impact-analysis)
5. [Plugin Migration](#plugin-migration)
6. [CSS Variable Color Migration](#css-variable-color-migration)
7. [Configuration Migration](#configuration-migration)
8. [Step-by-Step Migration Guide](#step-by-step-migration-guide)
9. [Testing Checklist](#testing-checklist)
10. [Rollback Plan](#rollback-plan)
11. [Resources](#resources)

---

## Executive Summary

**Current Version:** Tailwind CSS v3.4.11
**Target Version:** Tailwind CSS v4.x
**Estimated Effort:** Medium complexity - requires CSS restructuring and plugin replacement
**Risk Level:** Medium - significant changes to color system and animation plugin

### Key Changes Required

- Replace `tailwindcss-animate` with `tw-animate-css`
- Migrate HSL color variables to new format
- Convert `tailwind.config.ts` to CSS-based `@theme` configuration
- Update PostCSS config or switch to Vite plugin
- Update import syntax in `src/index.css`

---

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

---

## Browser Requirements

**Tailwind v4 requires:**
- Safari 16.4+ (released March 2023)
- Chrome 111+ (released March 2023)
- Firefox 128+ (released July 2024)

**Assessment:** These requirements should be acceptable for a personal portfolio site. Most visitors will have modern browsers.

**If older browser support is needed:** Stay on v3.4 until browser requirements change.

---

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

---

## Plugin Migration

### tailwindcss-animate → tw-animate-css

The `tailwindcss-animate` plugin is deprecated for v4. shadcn/ui recommends `tw-animate-css` as the replacement.

**Current setup:**
```typescript
// tailwind.config.ts
import tailwindcssAnimate from "tailwindcss-animate";
// ...
plugins: [tailwindcssAnimate],
```

**After migration:**
```css
/* src/index.css */
@import "tailwindcss";
@import "tw-animate-css";
```

**Migration steps:**
1. Remove `tailwindcss-animate` from dependencies
2. Install `tw-animate-css` as dev dependency
3. Add `@import "tw-animate-css"` to CSS file
4. Remove plugin reference from config (config file may be deleted entirely)

### @tailwindcss/typography

Current version: `^0.5.15`

This plugin should continue to work with v4 but verify compatibility. May need to update to a v4-compatible version.

### PostCSS Plugins (Can Be Removed)

These are built into Tailwind v4:
- `autoprefixer` - built-in vendor prefixing
- `postcss-import` - built-in import handling

---

## CSS Variable Color Migration

### Current Format (v3)

**src/index.css:**
```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... */
  }
  .dark {
    --background: 222.2 84% 4.9%;
    /* ... */
  }
}
```

**tailwind.config.ts:**
```typescript
colors: {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  // ...
}
```

### Target Format (v4)

**src/index.css:**
```css
@import "tailwindcss";

/* Move :root and .dark OUT of @layer base */
:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(222.2 84% 4.9%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(222.2 84% 4.9%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(222.2 84% 4.9%);
  --primary: hsl(222.2 47.4% 11.2%);
  --primary-foreground: hsl(210 40% 98%);
  --secondary: hsl(210 40% 96.1%);
  --secondary-foreground: hsl(222.2 47.4% 11.2%);
  --muted: hsl(210 40% 96.1%);
  --muted-foreground: hsl(215.4 16.3% 46.9%);
  --accent: hsl(210 40% 96.1%);
  --accent-foreground: hsl(222.2 47.4% 11.2%);
  --destructive: hsl(0 84.2% 60.2%);
  --destructive-foreground: hsl(210 40% 98%);
  --border: hsl(214.3 31.8% 91.4%);
  --input: hsl(214.3 31.8% 91.4%);
  --ring: hsl(222.2 84% 4.9%);
  --radius: 0.5rem;

  /* Animation timing variables unchanged */
  --timing-instant: 0.15s;
  --timing-fast: 0.3s;
  /* ... */

  /* Sidebar colors */
  --sidebar-background: hsl(0 0% 98%);
  --sidebar-foreground: hsl(240 5.3% 26.1%);
  /* ... */
}

.dark {
  --background: hsl(222.2 84% 4.9%);
  --foreground: hsl(210 40% 98%);
  /* ... all dark mode colors with hsl() wrapper */
}

/* Register colors with Tailwind using @theme inline */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-sidebar: var(--sidebar-background);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  /* Border radius */
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}
```

### Benefits of New Format

1. **VSCode color picker works** - colors display correctly in editor
2. **Chrome DevTools support** - can see actual color values
3. **Simpler mental model** - HSL is in the variable, not wrapped at usage
4. **Better theming** - CSS variables are the actual colors

---

## Configuration Migration

### Current: tailwind.config.ts

The current config has these customizations that need migration:

1. **Dark mode** - `darkMode: 'class'` (still supported, handled automatically)
2. **Content paths** - Auto-detected in v4, can be removed
3. **Container config** - Needs `@utility` migration
4. **Font family** - Move to `@theme`
5. **Colors** - Move to `@theme inline` (see above)
6. **Border radius** - Move to `@theme`
7. **Keyframes/animations** - Keep in CSS, verify accordion animations work
8. **Plugin** - Replace with `tw-animate-css` import

### Container Utility Migration

**Current (v3):**
```typescript
container: {
  center: true,
  padding: '2rem',
  screens: {
    '2xl': '1400px'
  }
}
```

**After (v4):**
```css
@utility container {
  margin-inline: auto;
  padding-inline: 2rem;
  max-width: 1400px;
}
```

### Font Family Migration

**Current (v3):**
```typescript
fontFamily: {
  sans: ['ui-sans-serif', 'system-ui', '-apple-system', /* ... */],
}
```

**After (v4):**
```css
@theme {
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif,
    "Apple Color Emoji", "Segoe UI Emoji";
}
```

---

## Step-by-Step Migration Guide

### Prerequisites

- [ ] Node.js 20 or higher installed
- [ ] Create a new git branch for the migration
- [ ] Ensure all tests pass on current version

### Phase 1: Run Upgrade Tool

```bash
# Create migration branch
git checkout -b chore/tailwind-v4-upgrade

# Run the official upgrade tool
npx @tailwindcss/upgrade
```

The upgrade tool will:
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

1. Move `:root` and `.dark` blocks **outside** of `@layer base`
2. Wrap all HSL values in `hsl()` function
3. Add `@theme inline` block to register colors with Tailwind
4. Remove the `@tailwind base/components/utilities` directives
5. Replace with single `@import "tailwindcss"`

### Phase 5: Migrate Remaining Config

1. Convert container config to `@utility container`
2. Move font family to `@theme`
3. Verify keyframes still work (accordion animations)
4. Delete `tailwind.config.ts` if all config is in CSS

### Phase 6: Update PostCSS (if not using Vite plugin)

**postcss.config.js:**
```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

Remove `autoprefixer` and `postcss-import` from dependencies.

### Phase 7: Fix Renamed Utilities

Search and replace in codebase:

| Find | Replace |
|------|---------|
| `shadow-sm` | `shadow-xs` |
| `shadow` (standalone) | `shadow-sm` |
| `rounded-sm` | `rounded-xs` |
| `rounded` (standalone) | `rounded-sm` |
| `outline-none` | `outline-hidden` |
| `ring` (standalone) | `ring-3` |
| `blur-sm` | `blur-xs` |

### Phase 8: Test and Verify

1. Run `npm run dev` and check for build errors
2. Visually inspect all pages
3. Test dark mode toggle
4. Verify animations work
5. Check responsive breakpoints
6. Run existing tests

---

## Testing Checklist

### Visual Regression Testing

- [ ] Homepage hero section
- [ ] Navigation (desktop and mobile)
- [ ] Experience section cards
- [ ] Goals section
- [ ] Contact section
- [ ] Blog listing page
- [ ] Blog post pages
- [ ] Dark mode on all pages
- [ ] Mobile responsive views

### Functionality Testing

- [ ] Dark mode toggle works
- [ ] Accordion animations (if used)
- [ ] Fade-in animations on scroll
- [ ] Hero floating animation
- [ ] Hover effects on cards
- [ ] Mobile menu open/close
- [ ] Smooth scroll to sections

### Build Testing

- [ ] `npm run build` succeeds
- [ ] `npm run preview` shows correct output
- [ ] No console errors in browser
- [ ] Lighthouse scores maintained

---

## Rollback Plan

If critical issues are found:

```bash
# Discard all changes and return to main
git checkout main

# Or reset to before migration
git reset --hard HEAD~N  # where N is number of commits to undo
```

Keep the migration branch for reference even if not merged immediately.

---

## Resources

### Official Documentation

- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Tailwind CSS v4.0 Release Blog](https://tailwindcss.com/blog/tailwindcss-v4)

### shadcn/ui Migration

- [shadcn/ui Tailwind v4 Guide](https://ui.shadcn.com/docs/tailwind-v4)

### Community Guides

- [Migrating from Tailwind CSS v3 to v4: A Complete Developer's Guide](https://dev.to/elechipro/migrating-from-tailwind-css-v3-to-v4-a-complete-developers-guide-cjd)
- [Upgrading to Tailwind CSS v4: A Migration Guide](https://typescript.tv/hands-on/upgrading-to-tailwind-css-v4-a-migration-guide/)
- [Updating shadcn/ui to Tailwind 4 - Theming Guide](https://www.shadcnblocks.com/blog/tailwind4-shadcn-themeing/)

### npm Packages

- [tw-animate-css](https://www.npmjs.com/package/tw-animate-css) - Animation replacement
- [@tailwindcss/vite](https://www.npmjs.com/package/@tailwindcss/vite) - Vite plugin
- [@tailwindcss/postcss](https://www.npmjs.com/package/@tailwindcss/postcss) - PostCSS plugin

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| TBD | Proceed with upgrade | Performance benefits, modern CSS features |
| TBD | Use Vite plugin | Better integration with existing Vite setup |
| TBD | Replace tailwindcss-animate | Required for v4 compatibility |

---

*Document created: January 2026*
*Last updated: January 2026*
