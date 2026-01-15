# Plan: Tailwind CSS v4 Upgrade

## Summary
Migrate from Tailwind CSS v3 to v4, converting JS config to CSS-based configuration and updating deprecated utilities.

## Current State

**Dependencies:**
- `tailwindcss` v3.x
- `tailwindcss-animate` plugin
- `@tailwindcss/container-queries` plugin
- `autoprefixer`

**Config files:**
- `tailwind.config.ts` - 130 lines of JS config
- `postcss.config.js` - using `tailwindcss` and `autoprefixer`
- `src/index.css` - uses `@tailwind base/components/utilities`

**Breaking changes impact:** ~116 occurrences of potentially affected utilities across 59 files

## Browser Support

v4 requires modern CSS features (`@property`, `color-mix()`):
- Safari 16.4+ ✓
- Chrome 111+ ✓
- Firefox 128+ ✓

This site already targets modern browsers (View Transitions API requires similar support).

## Migration Steps

### Phase 1: Automated Migration

```bash
# Create migration branch
git checkout -b feature/tailwind-v4

# Run official upgrade tool (Node 20+ required)
npx @tailwindcss/upgrade

# Review changes
git diff
```

The tool will:
- Update dependencies
- Convert `tailwind.config.ts` → CSS `@theme` block
- Update `postcss.config.js` → `@tailwindcss/postcss`
- Replace `@tailwind` directives → `@import "tailwindcss"`
- Update deprecated class names in templates

### Phase 2: Manual Review & Fixes

#### 2.1 PostCSS Config
```javascript
// postcss.config.js (after migration)
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

Note: `autoprefixer` is now built-in, remove explicit dependency.

#### 2.2 Vite Plugin (Recommended)
Consider switching to Vite plugin for better performance:
```typescript
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

#### 2.3 CSS Entry Point
```css
/* src/index.css */
@import "tailwindcss";

/* If JS config needed for plugins */
@config "../../tailwind.config.ts";

@theme {
  /* Theme customizations migrate here */
}
```

### Phase 3: Utility Class Updates

#### Shadow/Blur/Radius Renames
| v3 | v4 | Files affected |
|----|----|----|
| `shadow-sm` | `shadow-xs` | ~30 |
| `shadow` | `shadow-sm` | (check usage) |
| `rounded-sm` | `rounded-xs` | ~20 |
| `blur-sm` | `blur-xs` | ~5 |

#### Outline Changes
```html
<!-- v3 -->
<input class="focus:outline-none focus:ring-2" />

<!-- v4 -->
<input class="focus:outline-hidden focus:ring-2" />
```

#### Ring Default Changed
v3: `ring` = 3px blue
v4: `ring` = 1px currentColor

```html
<!-- If using ring for focus states, may need ring-3 -->
<button class="focus:ring-3 focus:ring-primary" />
```

#### Border Default Changed
v4 defaults to `currentColor` instead of `gray-200`:
```html
<!-- May need explicit color -->
<div class="border border-border" />
```

### Phase 4: Plugin Migration

#### tailwindcss-animate
Check for v4 compatible version or migrate animations to CSS:
```css
@theme {
  --animate-accordion-down: accordion-down 0.2s ease-out;
  --animate-accordion-up: accordion-up 0.2s ease-out;
}

@keyframes accordion-down {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}
```

#### @tailwindcss/container-queries
Built into v4 core - remove plugin, syntax unchanged.

### Phase 5: Custom Utilities

Current `@layer utilities` blocks need migration:
```css
/* v3 */
@layer utilities {
  .gauge-progress { ... }
}

/* v4 */
@utility gauge-progress {
  transform: rotate(-90deg);
  /* ... */
}
```

### Phase 6: Theme Migration

Convert JS theme to CSS variables:
```css
@theme {
  /* Colors - already using CSS vars, minimal change */
  --color-border: hsl(var(--border));
  --color-background: hsl(var(--background));

  /* Font family */
  --font-sans: ui-sans-serif, system-ui, -apple-system, /* ... */;

  /* Border radius */
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);

  /* Container */
  --container-2xl: 1400px;

  /* Custom grid */
  --grid-cols-24: repeat(24, minmax(0, 1fr));
}
```

## Checklist

- [ ] Run `npx @tailwindcss/upgrade` on feature branch
- [ ] Review and commit automated changes
- [ ] Update PostCSS config (remove autoprefixer)
- [ ] Consider Vite plugin migration
- [ ] Fix shadow/blur/rounded utility renames
- [ ] Update `outline-none` → `outline-hidden`
- [ ] Review ring utility usage
- [ ] Verify border color defaults
- [ ] Migrate tailwindcss-animate or replace
- [ ] Remove @tailwindcss/container-queries (now built-in)
- [ ] Convert custom utilities to `@utility` syntax
- [ ] Test dark mode toggle
- [ ] Test all animations
- [ ] Run Lighthouse audit
- [ ] Visual regression check on key pages

## Testing Strategy

1. **Automated:**
   - `npm run build` - verify no compilation errors
   - `npm test` - all tests pass
   - `npm run lint` - no new warnings

2. **Visual:**
   - Homepage hero section
   - Blog cards (shadows, borders)
   - Analytics dashboard (charts, cards)
   - Kanban board (drag states, colors)
   - Dark mode throughout

3. **Performance:**
   - Lighthouse before/after
   - Bundle size comparison (v4 should be smaller)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Plugin incompatibility | Check tailwindcss-animate releases, fallback to CSS |
| Subtle visual differences | Visual regression testing, side-by-side comparison |
| Build failures | Run upgrade on branch, thorough review before merge |
| CSS variable conflicts | Current vars use `--` prefix, v4 uses `--tw-` by default |

## Effort Estimate
Medium-Large (~2-3 hours)
- 30 min: Automated migration + review
- 60 min: Manual utility fixes (116 occurrences)
- 30 min: Plugin migration
- 30 min: Testing and fixes

## Resources
- [Official Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [v4 Documentation](https://tailwindcss.com/docs)
- Automated tool: `npx @tailwindcss/upgrade`
