# Spec: Tailwind CSS v4 Upgrade

## Overview

Upgrade Tailwind CSS from v3.4.11 to v4.x with minimal visual regressions. The site targets modern browsers; Firefox 128+ is acceptable (owner confirmed). The upgrade improves build performance, simplifies config, and enables CSS-first theming.

## Goals

- Upgrade to Tailwind v4.x and remove deprecated tooling.
- Migrate configuration to CSS (`@theme`, `@utility`).
- Preserve visual parity across all pages and key components.
- Keep the upgrade isolated, reviewable, and reversible.

## Non-Goals

- Redesigning existing UI or changing visual style.
- Refactoring unrelated CSS or component logic.
- Introducing new features beyond v4-required changes.

## Success Criteria

- `npm run build` and `npm run preview` succeed without errors.
- No visual regressions on the QA checklist (desktop + mobile).
- Animations and dark mode behave identically to v3.
- No unexpected bundle size regressions (v4 expected to be equal or smaller).

## Constraints & Assumptions

- Browser support: Safari 16.4+, Chrome 111+, Firefox 128+.
- Vite is the build system; prefer the official Vite plugin.
- Only the site owner uses Firefox, already on 128+.
- Use ASCII in edits unless the file already contains non-ASCII.

## Workstreams (Parallelizable)

Each workstream is independently assignable with its own deliverables and acceptance criteria.

### Workstream A: Preflight & Baseline

**Owner:** Agent A

**Tasks**
- Create upgrade branch: `feature/tailwind-v4`.
- Capture baseline Lighthouse (Performance/Accessibility/Best Practices/SEO).
- Capture baseline visual snapshots: homepage, blog list, blog post, projects, analytics dashboard, kanban.
- Record current package versions for Tailwind-related dependencies.

**Deliverables**
- Baseline metrics + notes in the PR description or a `docs/upgrade-notes/tw-v4-baseline.md` file.

**Acceptance**
- Baseline recorded and shareable.

### Workstream B: Dependency + Tooling Upgrade

**Owner:** Agent B

**Tasks**
- Run `npx @tailwindcss/upgrade` on the branch.
- Install `@tailwindcss/vite` and integrate into `vite.config.ts`.
- Remove `autoprefixer` and `postcss-import` if no longer required.
- Remove `@tailwindcss/container-queries` (built-in in v4).

**Deliverables**
- Updated `package.json`/lockfile.
- Updated `vite.config.ts`.

**Acceptance**
- `npm run dev` starts without Tailwind-related errors.

| Change | Current Usage | Notes |
|--------|---------------|-------|
| Default border color | Using `border-foreground/20` | Now defaults to `currentColor` - verify visual appearance |
| Ring width default | May use `ring-3` utility | Changed from 3px to 1px |
| Renamed utilities | `shadow-xs`, `rounded-sm`, etc. | Upgrade tool handles this |

### Workstream C: Config Migration to CSS

**Owner:** Agent C

**Tasks**
- Migrate `tailwind.config.ts` to CSS `@theme` and `@utility` blocks.
- Implement container settings via `@utility container`.
- Convert custom utilities from `@layer utilities` to `@utility`.
- Remove `tailwind.config.ts` if all config is moved.

**Deliverables**
- Updated `src/index.css` (or relevant global CSS).
- `tailwind.config.ts` removed or minimized (only if required).

**Acceptance**
- Tailwind builds without config errors.

### Workstream D: Theme Variables & Color System

**Owner:** Agent D

**Tasks**
- Move `:root` and `.dark` out of `@layer base`.
- Wrap HSL values inside the variables (e.g., `--background: hsl(...)`).
- Add `@theme inline` mappings for `--color-*` and radius tokens.

**Deliverables**
- Updated theme tokens in CSS.

**Acceptance**
- Color variables resolve correctly in devtools and in the editor.

### Workstream E: Animation Plugin Migration

**Owner:** Agent E

**Tasks**
- Remove `tailwindcss-animate`.
- Install `tw-animate-css`.
- Update `src/index.css` imports (`@import "tailwindcss";` then `@import "tw-animate-css";`).
- Verify class name compatibility with existing animation utility usage.

**Deliverables**
- Updated dependencies and CSS imports.

**Acceptance**
- Animation classes compile and animate as before.

### Workstream F: Utility Renames & Defaults

**Owner:** Agent F

**Tasks**
- Replace renamed utilities:
  - `shadow-sm` → `shadow-xs`
  - `shadow` → `shadow-sm` (only when intended)
  - `rounded-sm` → `rounded-xs`
  - `rounded` → `rounded-sm` (only when intended)
  - `outline-none` → `outline-hidden`
  - `ring` → `ring-3`
  - `blur-sm` → `blur-xs`
- Audit border color defaults and ring width changes on key components.

**Deliverables**
- Updated component classes.

**Acceptance**
- No visual regressions on buttons, inputs, cards, and navigation.

### Workstream G: QA & Regression Verification

**Owner:** Agent G

**Tasks**
- Run `npm run build` and `npm run preview`.
- Execute the QA checklist (below) on desktop and mobile.
- Compare Lighthouse to baseline.

**Deliverables**
- Completed QA checklist template in `docs/upgrade-notes/tw-v4-qa-template.md`.
- Lighthouse comparison notes.

**Acceptance**
- All QA items pass or have documented, approved deltas.

## Implementation Details

### Vite Plugin (preferred)

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

### CSS Import Changes

```css
@import "tailwindcss";
@import "tw-animate-css";
```

### Theme Example (HSL in variables)

```css
:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(222.2 84% 4.9%);
}

.dark {
  --background: hsl(222.2 84% 4.9%);
  --foreground: hsl(210 40% 98%);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}
```

### Container Utility

```css
@utility container {
  margin-inline: auto;
  padding-inline: 2rem;
  max-width: 1400px;
}
```

## QA Checklist (Tightened)

Run on desktop and mobile. Confirm both light and dark mode.

### Global UI

- No console errors or warnings related to Tailwind or CSS.
- Typography scale and line-heights match baseline.
- Border colors and ring focus styles match baseline.
- Shadows and blur effects visually match baseline.
- Hover and focus states match baseline.

### Navigation & Layout

| Find | Replace | Files affected |
|------|---------|----------------|
| `shadow-xs` | `shadow-2xs` | ~30 |
| `shadow-sm` (standalone) | `shadow-xs` | (check usage) |
| `rounded-sm` | `rounded-xs` | ~20 |
| `rounded` (standalone) | `rounded-sm` | (check usage) |
| `outline-hidden` | `outline-hidden` | ~10 |
| `ring-3` (standalone) | `ring-3` | (check usage) |
| `blur-xs` | `blur-xs` | ~5 |

- Header layout (logo, nav, CTA) matches baseline.
- Mobile menu open/close works; overlay and transitions match baseline.
- Footer spacing and links match baseline.

### Homepage

- Hero spacing, gradient/background, and CTA buttons match baseline.
- Experience cards: shadows, borders, and hover states match baseline.
- Section spacing and typography scale match baseline.

### Blog

- Blog list cards: border, shadow, and hover states match baseline.
- Blog post page: headings, code blocks, and links match baseline.

### Projects

- Project cards: hover and focus styles match baseline.
- Tag pills: background and text colors match baseline.

## Upgrade Checklist

- [ ] Run `npx @tailwindcss/upgrade` on feature branch
- [ ] Review and commit automated changes
- [ ] Install `@tailwindcss/vite` plugin
- [ ] Replace `tailwindcss-animate` with `tw-animate-css`
- [ ] Migrate CSS variables to new format (hsl in variable)
- [ ] Add `@theme inline` block for color registration
- [ ] Convert container config to `@utility`
- [ ] Fix shadow/blur/rounded utility renames
- [ ] Update `outline-hidden` → `outline-hidden`
- [ ] Review ring utility usage
- [ ] Verify border color defaults
- [ ] Remove @tailwindcss/container-queries (now built-in)
- [ ] Convert custom utilities to `@utility` syntax
- [ ] Delete `tailwind.config.ts` if all config in CSS
- [ ] Test dark mode toggle
- [ ] Test all animations (accordion, Framer Motion)
- [ ] Run Lighthouse audit before/after
- [ ] Visual regression check on key pages

### Analytics Dashboard

- Tabs and transitions behave correctly.
- Cards and charts render without spacing regressions.

### Kanban Board

- Column layout and scroll behavior match baseline.
- Card drag states and hover styles match baseline.

### Animations

- Accordion open/close animation works.
- Framer Motion stagger animations render correctly.

### Responsiveness

- Layout at 375px, 768px, 1024px matches baseline.
- No overflow or clipping in sections or cards.

### Build & Performance

- `npm run build` succeeds.
- `npm run preview` renders correct UI.
- Lighthouse scores within acceptable range of baseline.

## Risks & Mitigations

- **Plugin mismatch:** Verify class name parity between `tailwindcss-animate` and `tw-animate-css` before merge.
- **Default style shifts:** Focus on borders, ring widths, shadows, and rounded utilities during QA.
- **Config migration gaps:** Keep `tailwind.config.ts` only if needed for unsupported features.

## Rollback Plan

- Revert the merge commit or PR if critical regressions are found.
- Keep the upgrade branch for reference and future retries.

## References

- Tailwind CSS v4 Upgrade Guide: https://tailwindcss.com/docs/upgrade-guide
- Tailwind CSS v4 Release Blog: https://tailwindcss.com/blog/tailwindcss-v4
- shadcn/ui Tailwind v4 Guide: https://ui.shadcn.com/docs/tailwind-v4
