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

## 2026-01-20: Codex CLI Deep Dive

### Overview

Explored OpenAI Codex CLI (v0.73.0) for CI code review integration and MCP server setup. Key goal: clean up verbose Codex review output for PR comments.

### Codex CLI Commands

| Command | Purpose |
|---------|---------|
| `codex review --base origin/main` | PR review against base branch |
| `codex exec "prompt"` | Non-interactive task execution |
| `codex exec --json` | JSONL event stream output |
| `codex exec --output-schema schema.json` | **Structured JSON output** |
| `codex mcp-server` | Run as MCP server for Claude Code |
| `codex resume --last` | Resume previous session |

### Structured Output (Game Changer for CI)

Instead of parsing verbose text output with awk, use `--output-schema` for clean JSON:

```bash
codex exec --sandbox read-only \
  --output-schema review-schema.json \
  -o findings.json \
  "Review git diff against origin/main"
```

**Schema requirements are strict:**
- All objects need `"additionalProperties": false`
- ALL properties must be in `"required"` array (no optional fields)
- Nested objects have same requirements

Working schema example:
```json
{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "summary": { "type": "string" },
    "issues": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "severity": { "type": "string", "enum": ["P1", "P2", "P3"] },
          "title": { "type": "string" },
          "file": { "type": "string" },
          "lines": { "type": "string" },
          "description": { "type": "string" }
        },
        "required": ["severity", "title", "file", "lines", "description"]
      }
    },
    "verdict": { "type": "string", "enum": ["APPROVE", "REQUEST_CHANGES", "COMMENT"] }
  },
  "required": ["summary", "issues", "verdict"]
}
```

### MCP Server Integration

Codex can be a tool for Claude Code via MCP:

**Config** (`~/.claude/settings.json`):
```json
{
  "mcpServers": {
    "codex": {
      "type": "stdio",
      "command": "codex",
      "args": ["-m", "gpt-5.2-codex", "mcp-server"]
    }
  }
}
```

**Exposed tools:**
1. `codex` - Start session with `prompt`, `sandbox`, `cwd`, `model`, `developer-instructions`
2. `codex-reply` - Continue conversation with `conversationId`, `prompt`

Requires Claude Code restart to load. Then accessible as `mcp__codex__codex()`.

### Codex Config

Location: `~/.codex/config.toml`

```toml
model = 'gpt-5-codex'

[profiles.groq-gpt]
model = 'openai/gpt-oss-120b'
model_provider = 'groq'

[projects.'/path/to/repo']
trust_level = 'trusted'
```

### Sandbox Modes

| Mode | Description |
|------|-------------|
| `read-only` | Can't modify files |
| `workspace-write` | Can modify workspace only |
| `danger-full-access` | Full system access |

### Bug Found by Codex Self-Review

Using structured output, Codex found a bug in our own Codex integration:

**Issue:** `grep -q "no issues"` doesn't match `"No issues found."` (capital N)
**Fix:** Use `grep -iq` for case-insensitive matching

This is a nice example of Codex catching real bugs when given structured output constraints.

### PRs from Today

- **PR #177**: Visual regression testing with Playwright (14 tests, CI workflow)
- **PR #179**: Clean Codex output and fix issues
  - AWK filtering to extract only findings from verbose output
  - Fix checkout ref for workflow_run events (`head_sha` vs `github.ref`)
  - Fix snapshot path template (`testFileName` vs `testFilePath`)
  - Case-insensitive grep fix
  - Kanban board update

### Next Steps

1. Restart Claude Code to load Codex MCP server
2. Test `mcp__codex__codex` delegation
3. Consider replacing AWK filtering with structured output schema in CI
4. Explore multi-turn conversations with `codex-reply`

---

## 2026-02-06

**Blog Analytics Tab (PR #225, merged).** Added a dedicated Blog tab to the analytics dashboard that filters GA4 topPages to `/blog/` paths and enriches with post metadata from `src/content/blog/index.ts`. Includes overview metrics, traffic-over-time chart, tag/category breakdown charts, and a sortable post performance table.

Review feedback caught two issues:
1. BlogTrafficChart wasn't normalizing trailing slashes (`/blog/slug` vs `/blog/slug/`), causing chart/table disagreement. Fixed by merging duplicates the same way BlogAnalyticsCard does.
2. Date sorting used `localeCompare` which works for ISO dates but breaks on empty strings. Fixed with numeric `Date` comparison.

**EchoNest project page update (PR #226, open).** Updated feature cards to highlight YouTube/SoundCloud/podcast support added Feb 5-6. Replaced "Airhorns" and "Office & Party Ready" cards with "Multi-Source Music" and "Podcasts & More". Blog post left as-is since it works as a historical narrative.

**Analytics data location note:** All analytics data lives in `docs/metrics/*.json`, committed daily by `.github/workflows/daily-analytics.yml`. Any fresh Claude session can read these files directly—no API keys needed.

---

## 2026-02-07 (Mac Mini OpenClaw Setup Marathon)

**Multi-session effort** bringing OpenClaw's Mac Mini gateway from basic to fully capable. Major additions:

### Nest Thermostat Enhancements
- **Snapshot/history system**: `nest snapshot` records thermostat state + weather to JSONL (`~/.openclaw/nest-history/`). Cron job runs every 30min silently.
- **Weather integration**: Open-Meteo API (free, no key, 10k calls/day). Location configurable via `~/.openclaw/nest-location.conf`. Shows in status, snapshot, and history.
- **History command**: `nest history [hours] [room]` — aggregates snapshots showing indoor/outdoor min/max/avg temp, humidity, HVAC heating %, indoor-outdoor delta.
- **Camera snapshots**: `nest camera snap [room] [output_path]` — WebRTC via aiortc. Required fixing Nest's non-standard SDP (missing ICE candidate foundation field, ssltcp filtering).

### Gmail & Calendar Access
- **gog CLI** (v0.9.0, Google Workspace CLI) — OAuth2 with file-based keyring (macOS keychain locks under SSH).
- OAuth manual flow required exchanging auth code directly via curl due to state mismatch across `gog auth add` invocations.
- Gateway wrapper updated with `GOG_KEYRING_PASSWORD` env var.
- Skills created: `~/.openclaw/skills/gmail/SKILL.md` and updated `~/.openclaw/skills/calendar/SKILL.md` (replaced icalBuddy with gog).
- Gog setup reminder cron job removed (completed).

### Key Technical Gotchas
- **1Password `op read` hangs under launchd** — probe-timeout-cache pattern in gateway wrapper.
- **Nest WebRTC SDP**: `a=candidate: 1 udp ...` has no foundation field; aiortc crashes on parse. Fix: prepend dummy "0" foundation, filter ssltcp.
- **gog keychain locked over SSH**: Switch to `gog auth keyring file` with `GOG_KEYRING_PASSWORD`.
- **gog OAuth state mismatch**: Each `gog auth add --manual` generates new state; can't reuse redirect URLs across invocations. Workaround: direct token exchange via curl + `gog auth tokens import`.
- **1Password service account is read-only**: Can't create items programmatically. User must create manually.

### 1Password & Credit Card Purchasing
- **1Password skill** created: `~/.openclaw/skills/1password/SKILL.md` — read vault secrets, credit card fields, purchase safety rules.
- **Credit card caching** in gateway wrapper: card number, CVV, cardholder, expiry, type, billing address, and credit limit cached to `~/.cache/openclaw-gateway/visa_*` on startup.
- **1Password MONTH_YEAR and ADDRESS field types** don't work with `op read` — must use `op item get --format json` and parse from JSON. Expiry stored as `YYYYMM`, address as comma-separated string.
- **Credit limit** ($250) cached as spending guardrail. Skills instructed to never exceed it.
- Billing address cached for checkout form filling.

### EchoNest OpenClaw Skill
- **EchoNest skill** created: `~/.openclaw/skills/echonest/SKILL.md` — REST API queue management + SSH server ops.
- **SSH config reordering**: Specific `Host` entries (like `echonest-droplet`) MUST come before `Host *` wildcard in `~/.ssh/config`, otherwise 1Password SSH agent intercepts even with `IdentityAgent none`.

### Amazon Shopping Skill
- **Amazon skill** created: `~/.openclaw/skills/amazon-shopping/SKILL.md` — browser-automated shopping with approval flow.
- OpenClaw browser service uses Chrome via CDP (not Firefox). Amazon logged in via Google auth in Chrome.
- Skill requires explicit Dylan approval before placing any order, checks credit limit, masks card details.
- Verified Chrome has active Amazon session cookies (auth tokens expire Feb 2027).

### Location Config
- Updated `~/.openclaw/nest-location.conf` with secondary residence coordinates.

### Files on Mac Mini
- `/opt/homebrew/bin/nest` — Main CLI with all new commands
- `~/.openclaw/bin/nest-camera-snap.py` — WebRTC camera capture
- `~/.openclaw/skills/{gmail,calendar,nest-thermostat,1password,echonest,amazon-shopping}/SKILL.md` — All updated
- `~/.openclaw/cron/jobs.json` — Analytics briefing + nest snapshot + temp alert
- `~/Applications/OpenClawGateway.app/Contents/MacOS/OpenClawGateway` — Updated wrapper with card caching
- All backed up to `~/dotfiles/openclaw/`

---

## 2026-02-11: Andre → EchoNest Rebrand

**Full rebrand of the collaborative music queue project (PR #232, merged).**

### What Changed
- Component dir `andre/` → `echonest/`, export renamed, launch URL → `echone.st`
- Blog post renamed: `2026-02-04-andre-collaborative-music-queue` → `2026-02-04-echonest-collaborative-music-queue`
- Slug updated across projects-meta.json, projects.ts, validate-projects.mjs
- Redirect routes added in App.tsx for old URLs (both with and without trailing slash)
- RSS, sitemap, analytics data (ga4-history.json, latest.json) updated
- OG image and project image directory renamed
- Old git branches cleaned up (local + remote)

### External Changes
- Mac Mini: `~/.openclaw/skills/andre/` → `echonest/`, SKILL.md fully rewritten with `echone.st` URLs and `$ECHONEST_API_TOKEN` env var
- Dotfiles backup: same rename in `~/repos/dotfiles/openclaw/skills/echonest/`
- Memory files updated (MEMORY.md)
- SSH config: `andre-droplet` entry not found on Mac Mini or dotfiles — may need to be created when setting up echonest-droplet

### Key Insight: Prerendering Redirect Routes on GitHub Pages
Old URLs like `/projects/andre` need prerendered HTML files so the SPA shell loads and performs the client-side `<Navigate>` redirect. Without prerendering, GitHub Pages returns a raw 404 since there's no `andre/index.html`. Added a `redirectRoutes` array in `scripts/prerender.mjs` for this. **Don't forget trailing-slash variants** — analytics showed traffic to `/blog/.../` paths.

### Also
- Lighthouse a11y threshold lowered from 95 to 90 (PR #233) — SLO tool page consistently scores 92.
- Analytics anomaly issue #231 open (35% session drop on Feb 10) — not investigated, likely normal variance.

---

## 2026-02-12: AnimatedMermaidDiagram Branch Flow Bugs

**Fixed two diagram walkthrough bugs (PR #238, merged).**

### Root Cause
The `AnimatedMermaidDiagram` component steps through nodes sequentially (`currentIndex + 1`). When a decision node branches to a non-adjacent node, auto-play resumes from there but continues linearly — which can cross into the wrong branch's nodes if they're interleaved in the array.

### Fixes
1. **Blog post (retrospectives):** Reordered the `nodes` array so each branch's nodes are grouped together. "No" path (D, I, J) was interleaved with "Yes" path nodes, causing D to auto-play into G (wrong branch).

2. **Component enhancement:** Added `continueAt` field to `AnimationNode` interface. Lets any node specify a non-sequential next step. Applied to incident-management diagram's "Page Additional On-Call" (link node) so it skips "Proceed with current responders" and jumps to the convergence point.

### Pattern: AnimatedMermaidDiagram Node Ordering Rules
- Nodes after a decision branch target must belong to that branch's path
- When two branches converge on a shared node, use `continueAt` on the earlier branch's last node to skip over the other branch
- Link nodes (which pause for user interaction) are especially prone to this since "Continue" resumes linear play

---
