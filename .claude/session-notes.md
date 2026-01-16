# Session Notes

This file captures context that might not fit in commits or PRs—the "we tried X but realized Y" moments, observations about patterns, and other notes that could inform future blog posts.

Append to this file at the end of sessions when something notable happened. Keep entries brief. Date each entry.

---

## 2026-01-10

Built the auto-blog system today. The hook was the easy part—the harder insight was that good blog posts require good source material, which means capturing context at the moment it exists (in commits, PRs, and now here).

Dylan's instinct to add commit message guidance was right. The `[blog]` tag gives me a manual override when something is clearly worth writing about. The `[blog:tag-name]` grouping solves the multi-session problem.

Three pieces now feed into posts: commit messages (signals), PR descriptions (narrative), session notes (context). The hook ties them together.

---

## 2026-01-10 (continued)

Expanded the blog system with three features Dylan suggested:
- `[blog:tag-name]` for grouping commits across sessions
- Post interlinking guidance in the style guide
- This session notes file

Also fixed redundant `# Title` in all posts—title now comes only from frontmatter. Dylan picked "The Blog That Writes Itself" as the title for the auto-blog post.

The system feels complete now. We'll see how it performs when the hook actually fires.

---

## 2026-01-12

Big day for the projects page. Shipped the infrastructure (PR #88) plus two interactive SRE tools:

1. **SLO Uptime Calculator** (PR #89) - Helps engineers understand what SLA they can realistically achieve given their response times. Two modes: "What can I achieve?" and "Can I meet this target?" The visibility toggles for response phases were a nice addition—lets you exclude pre-diagnosis overhead from calculations.

2. **Status Page Update Generator** (PR #91) - Templates for professional incident communication. Four phases (Investigating → Identified → Monitoring → Resolved) with severity-aware wording. The insight here: most teams struggle with status page messaging because they don't have templates ready.

Also added author field to blog posts (PR #92). Now you can filter by Claude vs Dylan. All existing posts marked as Claude-authored.

Pattern worth noting: The projects page uses a registry pattern with lazy-loaded components—same architecture we used for blog posts. Cross-navigation between blog and projects pages makes the site feel more cohesive.

**Planning docs consolidation:** Merged `PLANNING_DOCS_INDEX.md` and `FUTURE_WORK_ROADMAP.md` into single `ROADMAP.md`. The two files had significant overlap (both tracked "what's done" and "what's next"). Now there's one place to update. Also moved `BLOG_FEATURE_PLAN.md` to `completed-projects/` since it was done but hadn't been archived.

**Meta-improvements to Claude collaboration:**
- Created `.claude/preferences.md` via interview - captures Dylan's working style (moderate verbosity, ask before changes, atomic commits, narrative PRs, full session handoffs)
- Added session start guidance to CLAUDE.md - read session-notes + git log, provide "where we left off" summary
- Removed unused Gemini CLI section from CLAUDE.md
- Created `docs/decisions/` for ADRs with 3 retrospective records (MDX precompilation, projects registry, docs consolidation)

The preferences file is an interesting experiment—persisting working style preferences across sessions so I don't have to relearn them.

Later moved preferences to `~/.claude/preferences.md` (global) to avoid cluttering repo history with meta-work. Key insight: working style preferences are universal, session notes are project-specific.

---

## 2026-01-13

**Lighthouse + Accessibility deep dive.** Started by adding project pages to Lighthouse audits—discovered accessibility issues we hadn't noticed before.

Three pages failed thresholds:
- Blog (94 a11y): Select dropdowns missing aria-labels
- Uptime Calculator (92 a11y): Sliders and progress bars missing aria-labels, heading order skipped h2
- On-Call Coverage (89 a11y): Same select issue, plus color contrast failure (emerald-500 with white text = 3.76:1, needs 4.5:1)

**Fixes applied:**
- Added `aria-label` to all Select, Slider, and Progress components
- Modified `CardTitle` to accept `as` prop for proper heading hierarchy (h1→h2→h3)
- Changed `bg-emerald-500` → `bg-emerald-700` across oncall components for WCAG AA contrast compliance

**Pattern worth noting:** The shadcn/ui CardTitle component hardcodes `<h3>`. Adding an `as` prop was a minimal change that enables proper document structure. Same pattern could apply to other heading components.

**Color contrast insight:** Tailwind's -500 shades often don't meet WCAG AA (4.5:1) for white text. The -700 shades generally do. Worth checking anytime white text appears on colored backgrounds.

Also merged the previous oncall-coverage improvements branch which included:
- Rich tooltips with UTC/local times across all heatmaps
- Intl API for proper DST handling in timezone conversions
- US Daytime model rebalancing and dedicated BusinessHoursTimeline component

---

## 2026-01-13 (continued)

**Analytics Dashboard shipped (PR #96).** Built an unlisted `/analytics` page that visualizes GA4, Search Console, and Lighthouse data from existing collection workflows.

Key features:
- Overview cards: Sessions (7d), Lighthouse Perf, Impressions, Bounce Rate
- Three tabs: Traffic (sessions trend, device breakdown, top pages), Performance (Lighthouse scores, Core Web Vitals), Search (clicks/impressions trend)
- Traffic sources tracking added to GA4 script (will populate on next run)
- Custom tooltips with Tailwind classes for dark mode support (Recharts inline styles don't resolve CSS variables)

**Codex code reviews captured two good catches:**
1. Divide-by-zero in session trend calculation when previous period has 0 sessions
2. Error states unreachable because fetchJson swallowed all failures as "missing data"

Fixed both—now 404s show yellow warnings, actual errors (500s, network) show red error state.

**Nav cleanup:** Removed Experience, Goals, Contact links. Nav now just shows Projects and Blog.

**Footer standardization:** Created reusable `Footer` component and applied to Blog, Projects, and Project detail pages. Kept custom footers for BlogPost (author info) and Runbook (maintainer info).

---

## 2026-01-16 (SLO Tools Polish)

**Slider magnetism pattern:** When using sliders for values with common presets (like SLO percentages), add snap points that pull the slider toward round numbers. Implementation in `src/lib/slo/presets.ts`:

```typescript
export function snapToPreset(value: number): number {
  for (const snapPoint of SNAP_POINTS) {
    const threshold = snapPoint >= 99.9 ? 0.015 : 0.1;
    if (Math.abs(value - snapPoint) <= threshold) {
      return snapPoint;
    }
  }
  return value;
}
```

Use adaptive thresholds - tighter for high-precision values where small differences matter. Call it in the slider's `onValueChange` handler.

**Flexible input ranges:** For SLO tools, the text input accepts 0-99.999% while sliders focus on realistic ranges (90-99.999% or 99-99.999%). This lets power users enter any value while keeping the slider UX focused.

---

## 2026-01-16

**Cloudflare Pages preview deployments.** Set up branch preview infrastructure so PRs get unique preview URLs automatically.

Key details:
- **Project:** `personal-website-adg.pages.dev`
- **Branch URLs:** `<branch>.personal-website-adg.pages.dev`
- **Build command:** `npm run build:preview` (new script that skips Playwright prerendering—CF environment doesn't have browsers installed)
- **Preview banner:** Yellow sticky banner appears on all preview builds via hostname detection (`*.pages.dev`)

Architecture decision: Dual hosting—GitHub Pages for production, Cloudflare Pages for previews. CF Pages has built-in GitHub PR comments, so we removed a redundant custom workflow.

**Environment detection pattern** (`src/lib/env.ts`):
```typescript
export const isPreview = window.location.hostname.endsWith('.pages.dev');
export const showPreviewBanner = isPreview;
```

**Documentation updates:** Updated both `src/data/runbook.ts` and `docs/OPERATIONS_MANUAL.md` with the new CF Pages infrastructure, troubleshooting for preview deployment issues, and MCP testing workflows for previews.

**New project idea:** Added "Error Budget Burndown" to kanban Ideas column—visualize error budget consumption over time. Complements existing SLO Calculator.

**Cleanup:** Disconnected kanban-save-worker from GitHub integration in Cloudflare—it was triggering failed builds on every commit since the worker code isn't in this repo.

---
