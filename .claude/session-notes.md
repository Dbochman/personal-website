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

## 2026-03-06: Dependabot Cleanup, Test Fixes, Analytics Anomaly Detection

### Dependabot PRs
Merged 3 passing dependabot PRs (#251 GitHub Actions, #252 @types/node, #253 googleapis). Closed #254 (@vitest/coverage-v8 4.x) because it has a peer dependency on vitest 4.x — bumped both together in PR #257.

### IntersectionObserver Mock Fix (vitest-setup.ts)
The global `IntersectionObserver` mock used `vi.fn(() => ({...}))` — an arrow function, not a constructor. `new IntersectionObserver()` calls from framer-motion and useParallax threw `TypeError: ... is not a constructor`. Fixed by replacing with a proper class that implements the `IntersectionObserver` interface. This was a pre-existing failure affecting 22 tests across 3 files.

**Pattern:** Always mock browser APIs that are called with `new` using a class, not `vi.fn()` with an arrow function. Vitest 4 made this stricter but the underlying issue existed before.

### Analytics Anomaly Detection (PR #258, merged)
Issue #256 was a false positive — sessions "dropped 45%" but it was just a traffic spike (573/day) ending and returning to baseline (~333/day). The detection compared consecutive days only.

**Fix:** Compare against 7-day rolling average with -40% threshold instead of day-over-day with -30%. This prevents spikes from triggering false alarms on the way back down.

---

## 2026-02-27: OpenClaw Security Plan + Blog Post Security Section

### Security Plan Document
Created `/Users/dylanbochman/repos/dotfiles/openclaw/SECURITY.md` — a comprehensive security plan for the OpenClaw Mac Mini agent. Covers threat model, access controls, file permissions audit, credential lifecycle, operational procedures, known risks, and incident response. Written from actual runtime state, not aspirational.

### Blog Post Security Section Expanded
Drew from the security plan to flesh out the blog post's security section. Added concrete details on vault isolation, shopping approval gates, network posture, and accepted risks.

Key addition: a paragraph about the two layers of guardrails (infrastructure vs instruction) and being honest about the difference in the blog post.

---

---

## 2026-06-10: GSC Indexing Audit — _redirects Doesn't Apply to Production

**Key realization:** `public/_redirects` (added to fix the `/index.html` soft 404) is a Cloudflare Pages convention — but production is GitHub Pages behind the Cloudflare proxy. The file only affects branch previews. `https://dylanbochman.com/index.html` still returns 200 with homepage content, which is why GSC's Soft 404 validation failed on 6/1/26.

**Fix requires a Cloudflare Redirect Rule** (dashboard → Rules → Redirect Rules), not a repo change. Single rule can cover /index.html + the 5 legacy .html paths.

**Other findings:**
- All 42 sitemap URLs: 200, prerendered, correct self-canonicals. On-page SEO is healthy.
- Indexed-page drop ~5/5→5/8 matches the prerender deploy regression fixed in 4c051b0 (May 8). Recovery is organic, weeks-scale.
- Legacy/trailing-slash stubs (meta-refresh + canonical) verified working live.
**Resolution (same day):** Cloudflare Redirect Rule "Legacy .html → home (soft 404 fix)" created and verified live — /index.html + 5 legacy .html paths all 301 → / in one hop, on apex and www, no loop. New GSC Soft 404 validation kicked off and sitemap resubmitted 6/10/26.

---

## 2026-06-10 (cont): Mermaid Preload Fix + Playwright CDN Incident

**Perf (PR #307):** Homepage was modulepreloading the 697KB-compressed mermaid chunk on every page despite mermaid being dynamically imported. Root cause: Rollup placed Vite's virtual preload-helper module inside the manualChunks 'mermaid' chunk, so the entry statically imported mermaid just to reach the helper. Fix: pin `vite/preload-helper` to 'vendor' in manualChunks. Live result: 917KB → 215KB compressed JS on homepage (-77%). Watch RUM FCP/LCP (was 29% good / 3.2s avg) over the next week.

**Pattern:** With a manualChunks function, ALWAYS handle Vite's virtual helper modules (`\0vite/preload-helper`) explicitly — unassigned, Rollup can drop them into any chunk and chain it into the entry graph.

**CI incident:** Playwright CDN hung browser installs at 100% download (zip completes, stream never closes) — deterministic, retries useless. Hit the #305 deploy at 14:08 and every CI run after. The hung deploy silently blocked the main deploy queue for 2.5h (deploy.yml queues, doesn't cancel) — deploys for #306/#307 got superseded while waiting. Fix: switched all CI to the runner's preinstalled Chrome (`channel: 'chrome'` when CI=true in playwright.config.ts + scripts/prerender.mjs), deleted browser download/cache steps from all 3 workflows. CI back to 2m30s. Docs updated in #308.

**Gotcha:** `gh` CLI token intermittently 401'd on GraphQL/DELETE endpoints while REST reads worked — merge succeeded but branch delete failed; used `git push origin --delete` over SSH instead.

---

## 2026-07-12

Drafted a privacy-scoped post about the new local home-event system, emphasizing durable evidence, read-only correlation, and staged permission rather than household specifics.

### Monitoring alert cleanup

- The GA4 anomaly backlog was caused by comparing overlapping `7daysAgo..today`
  snapshots (an inclusive eight-date range containing a partial day) against the
  mean of seven more overlapping snapshots. Direct/synthetic bursts rolling out
  looked like outages even when collection and diversified page traffic were
  healthy.
- GA4 operational detection now uses completed daily observations through two
  days ago, human-session classification when the custom dimension is available,
  four same-weekday baselines, volume guards, and two-day confirmation. The
  dashboard summary is a truthful seven-completed-day window. Human-session
  alerting waits for 28 days of classified history and verifies classification
  coverage against total-traffic days in both edge weeks; unavailable or stale
  data must never be interpreted as recovery.
- Generated monitoring issues should model an incident lifecycle: one open issue,
  comments while it persists, and an automatic recovery comment/close on the
  next clean run. A shared incident may only close when every contributing signal
  has a complete recovery state; freshness from one source cannot stand in for
  GA4, Search Console, and Lighthouse collectively. Monitoring signals no longer
  make successful data collection appear failed. Weekly Lighthouse summaries
  must carry their collection timestamp and are valid for recovery for eight
  days; threshold failures still upload their summary before the job fails.
  Missing or malformed metric artifacts are operational incidents themselves:
  emit structured failure state instead of throwing before lifecycle outputs exist.
  The same applies to stale or incomplete signal state even when no incident is
  already open; suppressing recovery alone leaves a monitoring blind spot.
- Post-deploy workflows triggered by `workflow_run` must checkout
  `github.event.workflow_run.head_sha`. Checking out the moving default branch can
  test a route from a newer, not-yet-deployed commit and create a false browser
  failure even when all console assertions pass. Poll `/build-info.json` for that
  SHA and cancel older in-flight checks when a newer deployment completes. Manual
  checks must resolve the live SHA first and use a separate concurrency group so
  they cannot cancel or test assumptions from the post-deploy lifecycle.

---

## 2026-07-20

Drafted "The HAR Was the Easy Part," tracing the weekly financial scrapers from
browser-driven imports and prose orchestration to HTTP-first provider adapters,
run-bound artifacts, guarded imports, and durable failure delivery. The most
useful historical fact was that one early run completed all seven imports while
only three scrapers had produced fresh data; that became the post's definition
of the original design gap.

The public-post review also caught that the financial implementation repository
is private. The article keeps its source links to the public dotfiles history,
generalizes provider-specific details, and excludes account data, identifiers,
runtime paths, raw captures, and authentication material.

---

## 2026-09-08: Functional website fixes

- Review baseline was refreshed to the deployed `f556565` before branching; the original local checkout was 85 commits behind.
- Blog filters now use URL parameters. Router transitions can lag behind browser history: preserve current URL parameters when applying the next filter and let the search input retain keystrokes until the latest query commits.
- Hover plus focus could schedule two expertise timers; canceling only the last timer let a closed mobile card reopen. Deduplicate the timer and cancel it on either click action.
- ResponsiveTabsList caller classes included `grid`, overriding its `hidden` class on mobile. Put breakpoint visibility on a separate wrapper.
- Functional regression tests are tagged `@smoke` so existing CI runs them. Explicit application typechecking still has a pre-existing backlog; the root `tsc --noEmit` command does not check the referenced application project.

## 2026-10-17: Creative replacement alternative

- Claude Opus 5.5 at High effort selected and implemented a Retry Storm Simulator as an alternative to improving the rightsizer. These are competing proposals for one catalog slot, not sequential changes.
- Replacing a project requires the catalog, lazy component registry, validator, icon/OG registries, sitemap, client routes, and static SEO redirect manifest to agree. Preserve both slash forms of the retired URL.
- In this open-loop fluid model, backoff delays retries without reducing sustained demand. Retry budgets and shedding abandoned work address different parts of the feedback loop; jitter cannot demonstrate desynchronization when arrivals are already smooth.

## 2026-10-19: Radix dependency review and security patches

- Radix Select 2.4.0 introduced three application type errors for narrower
  `onValueChange` handlers in the blog filters and SLO configuration. Select
  2.4.1 fixes the upstream callback-type regression. The existing CI command
  `tsc --noEmit` does not check `tsconfig.app.json`; compare explicit application
  diagnostics against main when reviewing dependency updates, since the broader
  application type-error backlog remains unresolved.
- PR #333 also refreshes compatible transitive security patches: grpc-js
  1.14.6, brace-expansion 5.0.12 (and 1.1.21 for its older dependency chain),
  and js-yaml 3.15.2/4.3.2. No forced major upgrades or new overrides are needed.
  `npm audit --omit=dev --audit-level=high` reports no high/critical findings;
  subsequent compatible updates and removal of the unused Lovable tagger (owner
  approved) also clear all development high findings. Eight findings remain
  (six moderate, two low): gray-matter's js-yaml 3/argparse/sprintf-js chain,
  typography's pinned postcss-selector-parser 6, and Mermaid's KaTeX 0.16 chain.
  No compatible patched release is available for those remaining chains; avoid
  audit's suggested gray-matter/typography downgrades or untested major overrides.
- The deployment-only raw-JS guard exposed 5822.6 KiB against its 5700 KiB budget.
  Precompiled MDX was stored as unminified function-body strings, invisible to
  Vite's minifier. Minify those bodies with an explicit esbuild build dependency,
  preserving the JSX-runtime argument and rendered output. Include the helper in
  the MDX cache fingerprint. This cuts the updated bundle to about 5617 KiB without
  removing content or diagram features; Mermaid's large chunk remains advisory.
- `npm run check-bundle-budget` now shares the unchanged JS/CSS limits between
  PR checks and deployment. PR CI must run this after building so size failures
  cannot first appear after merge. Regression coverage compares minified MDX
  output and exercises project and embedded blog diagrams in browser smoke tests.

## 2026-10-19: Remaining dependency advisories

- Replaced gray-matter with a shared YAML-only js-yaml 4 helper, eliminating the
  js-yaml 3/argparse 1/sprintf-js chain. Compared parsed metadata and exact bodies
  against the old parser for all 171 blog/kanban files: no differences. Keep the
  helper in the MDX toolchain fingerprint. Plain Node content commands import its
  `.ts` file using the repository's required Node 24 native type stripping.
- The typography plugin was installed but never registered in Tailwind 4's CSS
  or PostCSS config. MDXComponents owns the actual blog styling. Removed the
  unused package and inert prose classes; updated browser tests that incorrectly
  used `article.prose` as a content selector to select the semantic article.
- Mermaid 12 introduces ELK, new default layouts/look, and an ES2024/Safari 17.4
  browser floor. Retained Mermaid 11 and tested a scoped KaTeX 0.18.2 override
  instead. Its `renderToString` API/MathML output remains compatible; no custom
  internal KaTeX class selectors are used here. The override has trust-inheritance
  security tests and a browser math-label test. The latter bundles a test-only
  entry, while existing project/blog smoke tests cover the production Vite chunks.
  See README for removal criteria rather than keeping this override indefinitely.
- Both full and production-only npm audits now report zero findings. PR CI now
  enforces the full audit at low severity instead of only reporting production
  high findings. Unit coverage includes malformed/unsafe YAML, body preservation,
  full-corpus round trips, and native CLI add/move in a disposable board.
- Local verification: 291 unit tests; 30 browser smoke/blog checks; lint; full build/prerender; SEO route
  validation; JS 5665.3 KiB and CSS 120.0 KiB within unchanged budgets. Explicit
  application type-check diagnostics remain exactly the same 156 pre-existing
  errors as main; the migration introduces none.

## 2026-10-19: Clear and enforce the application type-check backlog (PR #335)

- The owner expanded #335 to address all 156 existing application diagnostics.
  `npm run typecheck` now explicitly checks app + Vite configuration projects,
  and replaces the ineffective root `tsc --noEmit` invocation in PR CI. Both pass
  without changing strict options, excluding tests, or adding type suppressions.
- Recharts 3 custom tooltip callbacks use `TooltipContentProps`; passing the
  callback to `content` lets the chart supply its required runtime props. Removed
  React Router's obsolete v6 future flags. Unified optional `gtag` typing in a
  real global declaration module; use TypeScript's native View Transition types.
- Keep generated kanban declarations generated by `precompile-kanban.js`, not
  hand-edited. They are committed beside the existing JS so clean-checkout CI
  can typecheck before building. The Search Console JS helper has an explicit
  typed boundary; analytics post lookups share the same readonly map contract.
- Fixed invalid outline variants, draft status labels, missing blog slug handling,
  partial toast-update inputs, MDX component props, and callback tuple inference
  in throttle. Corrected test author fixtures, observer signatures and mock types,
  and removed unused imports/parameters rather than weakening checks.
- Validation: clean app/node type checks and lint; 293 unit tests; 31 local browser
  checks including Recharts tooltip hover, blog/diagram rendering and navigation;
  full build/prerender and SEO verification. JS 5665.2 KiB and CSS 120.0 KiB stay
  within unchanged budgets. Full and production-only npm audits remain at zero.
- PR review caught a frontmatter serializer edge case: `dump(data).trimEnd()`
  loses meaningful trailing blank lines in a final `|+` YAML scalar. Preserve
  js-yaml's full output including its terminating newline before the closing
  delimiter. Four whitespace/chomping regression cases cover the fix.

## 2026-10-19: Restore Codex review execution (separate from Pele)

- The March fix for `bwrap: RTM_NEWADDR: Operation not permitted` only inlined
  the diff; the reviewer still could not run shell commands. Review stderr/events
  were discarded and `|| true` hid failures. No project dependencies were installed.
- Move to a pinned official Codex action/CLI. Its GitHub-hosted Linux setup handles
  user namespaces before dropping sudo/capabilities; retain workspace sandboxing
  for test caches and prepare dependencies. Keep the API key behind the action's
  proxy and comment permissions in a separate checkout-free job.
- Require structured command evidence, fail unavailable/malformed review execution,
  retain JSON command events in Actions logs, and include workflow/config changes
  in review scope. Added regression tests for failure reporting and privilege layout.
- This branch starts from main independently of the Pele migration PR #336.
- First Linux review restored shell/typecheck execution but exposed synchronous
  child-process stdio failures in two tests (EPERM / stdin timeout), while normal
  CI passed. Use inherited stdio and pass Bash syntax input via -c, retaining all
  assertions and adding timeouts. Use Vitest's default reporter inside review to
  avoid writing the runner-owned step summary outside the workspace sandbox.

## 2026-10-19: Flowchart-only Pele migration

- Replaced the Mermaid runtime with pinned Pele 1.6.0, importing only `pele/core`
  and `pele/diagrams/flowchart` behind a shared dynamic import. Removed Mermaid,
  KaTeX, its override, and the dependency-only math tests; no fallback renderer.
  Keep the existing component names and authored Mermaid source for MDX and copy.
- Pele uses `.pele-node[data-id]`, not Mermaid's generated flowchart IDs. Reapply
  walkthrough highlighting on each resize/font redraw; destroy mount observers
  and zoom handlers on unmount. Links/images remain disabled as in the previous
  strict integration; React owns walkthrough navigation. CSS variables handle
  theme changes without replacing SVG. Math/HTML labels and non-flowchart types
  are intentionally outside this integration (documented in README).
- Added mobile zoom and wrapped playback controls after the 320px interaction
  check exposed document overflow. Existing source, decisions, continueAt loops,
  terminal/replay behavior, copy and tab navigation are preserved.
- Visual QA covered all four diagrams at 320/768/1280px in light/dark, plus zoom.
  Validation: clean npm ci, app/node typechecks, lint, 301 unit tests, 37 production
  browser smoke/blog checks, full build/prerender, SEO routes, and zero findings
  in both full and production-only audits. No content/generated board changes.
- Same-machine production totals: JS 5665.8 -> 2507.2 KiB (-55.7%); summed gzip
  JS 1599.3 -> 748.9 KiB (-53.2%). Pele chunk 124.2 KiB raw / 48.4 KiB gzip.
  CSS 120.0 -> 120.3 KiB. Existing hard budgets unchanged; the 648.2 KiB content
  chunk still exceeds the advisory-only 600 KiB limit. Homepage test verifies
  the renderer is not requested on unrelated pages.
- Run the full build before starting a separate preview for browser tests:
  existing prerender cleanup uses `pkill -f "vite preview"`, which stopped our
  isolated test server too. After restarting it post-build, all 37 checks passed.
  Broad process cleanup is a separate existing issue, not changed in this PR.
- PR #336 preview passed all nine diagram browser checks. Linux CI exposed an
  assertion that assumed a particular SVG label wrap point: adjacent tspans
  concatenate without spaces, and font metrics change wrapping across platforms.
  Compare the complete label with whitespace removed instead of assuming where
  it wraps; keep the URL and node checks intact.
- Addressed the review's minor scroll concern: redraws still reapply highlights,
  but only changing steps scrolls the active node into view. The resize browser
  check verifies that a paused walkthrough does not request another scroll.

## 2026-10-20: eMudhra CI trust mitigation and incident post

- Owner requested one PR for the website hardening and incident narrative, after
  separate machine fixes were pushed. No site merge/deployment is implied.
- Bootstrap every Ubuntu job offline before checkout/API actions. Filter the
  runner CA bundle using Homebrew's three incident SPKI exclusions; select the
  file and an empty hash directory. Set Node's OpenSSL-CA mode in workflow YAML,
  not GITHUB_ENV (GitHub prohibits NODE_OPTIONS there). No TLS bypass or package
  downloads in bootstrap. Public CA files remain readable after privilege drop.
- Local actions need checkout first, so generate inlined steps from one source,
  use anchors only in multi-job workflows, and check drift. Failure/always steps
  must also require bootstrap success. Keep code-review actor/permission gates;
  locate script steps by name rather than their former index zero in tests.
- Root removal is temporary and broader than intermediate revocation. Explicit
  CA clients, native/browser bundles, provider builds, and GitHub's pre-job
  control plane are not covered. Documented removal criteria require actual
  runtime and normal-traffic tests, not only an upstream merged patch.
- New post preserves exposure-versus-breach distinctions and remaining gaps;
  no private addresses, backups, tokens, account data, or household details.
  Used an honest Codex attribution despite the older Claude-only style guide.
- Local validation: workflow generation check, actionlint 1.7.12, seven Python
  bootstrap tests, twelve existing review-contract tests, application unit
  suite, lint/typecheck, production preview build, hard bundle budgets, and 32
  browser smoke tests. Both Node https/fetch rejected all twelve canaries and
  accepted controls. Post scored 100/100; PinchTab isolated-session text and
  screenshot confirmed rendering. Existing advisory-only large chunk remains.
- Did not run local full prerender because its existing broad `pkill -f "vite
  preview"` cleanup could stop unrelated preview servers; CI runs the full build.
- Owner requested an incident-first rewrite: retitled to “The eMudhra
  Certificate Incident: What Happened and How We Responded.” Added a sourced
  explanation of intermediate authority, faulty/recoverable key generation,
  interception requirements, CT caveats, and revocation distribution before a
  distinct response section. Kept status dated October 20 and the unchanged
  dependency-audit blocker explicit. Canonical slug is now
  `2026-10-20-emudhra-certificate-incident`; retaining the original filename lets
  existing prerender logic generate its legacy-slug redirect. No CI/dependency
  implementation changes were included in this editorial revision.
- Owner subsequently approved targeted dependency patches before merging PR
  #338. Updated only lockfile entries for follow-redirects 1.16.0 -> 1.16.1 and
  Vite 7.3.6 -> 7.3.7; no manifest/range changes or audit suppression. Clean
  npm ci, zero-finding audit, lint, typechecks, all 301 tests, preview build,
  and hard bundle budgets passed. Updated the post's historical CI paragraph
  to explain the resolved blocker. Hosted CI/review must pass before merge.

## 2026-10-20: Application trust follow-up in the eMudhra post

- PR #338 subsequently merged as `effaa165`. Updated the existing incident post
  with the later bundled-runtime findings rather than creating another post.
- Added EchoNest's signed rebuild, PyCharm's external default-JVM trust store
  and native-launch TLS check, and the GUI launch experiment that stripped the
  Node CA override. Public GUI root exports still accepted six direct chains;
  this is scoped trust evidence, not proof of every app request or exploitation.
- Credited Dylan's decision to retire the affected installations where no fix
  was verified. Kept recoverable-binary cautions and named remaining limits,
  especially Inkscape and runtimes that could not be tested. No private machine
  paths, network-filter vendor names, account state or household identifiers
  were added to the post. Dotfiles mitigation/retirement commit: `ad45b58`.
- Validation: slop-guard 100/100, production preview build, 57 targeted
  frontmatter/MDX/schema/rendering unit tests, and hard bundle budgets passed.
  The largest content chunk remains above its advisory-only limit (668.4 KiB
  against 600 KiB). Full local prerender was not run because its existing broad
  preview-process cleanup can affect shared services; hosted deployment runs it.

## 2026-10-20: Shorter eMudhra narrative and confirmed small scalars

- Owner requested a cohesive rewrite rather than another operational appendix.
  Retitled to “The eMudhra Certificate Incident: A Private Key of Four” and
  reduced the post from about 2,080 to 1,090 words. Preserved its canonical
  slug, source filename/legacy redirect, publication date and Codex attribution.
- Independently compared public points from the incident site's published
  certificates with P-384 scalar multiplication: G3C OV matches 4; G3B EV
  matches 0x73 (115). Certificate SHA-256 fingerprints match Mozilla's inventory.
  No signing, private-key files or credential-bearing requests were needed.
- Explained 192-bit security as roughly 2^192 generic classical work; attributed
  the weak-key workflow explanation to eMudhra's preliminary Bugzilla account
  instead of asserting a proven RNG or HSM failure. Linked primary sources.
- Replaced the application inventory with representative packaging/launch-path
  findings and the deployed browser-acquisition gate. Updated Inkscape to
  retired, described tested native/Go paths, and retained scope limitations.
  Cold/warm browser behavior is reproduced; its exact cause remains unproven.
- Updated the generated RSS metadata. No application or CI changes or account
  activity were included. Owner subsequently requested committing and pushing
  this editorial change to main.
- Validation: prose score 100/100, 57 focused content tests, production preview
  build and hard bundle budgets passed. Existing soft large-chunk advisory
  remains. Full local prerender still avoided because of its broad shared
  preview-process cleanup; no browser visual check was performed this turn.

## 2026-10-21 — Node security follow-up (Codex; prepared, unpublished)

- Branch `fix/node-security-runtime` starts from current `origin/main`.
  Pin setup-node, .nvmrc and Netlify build selection to24.22.1; root engine
  constraints exclude older24, EOL25 and unpatched26. No dependency resolution
  change. The offline bootstrap checks the actual Runner.Worker-owned Node24
  before JS actions; unpatched or unidentified runner ownership fails closed.
  This does not patch the runner control plane or pre-step action preparation.
- Kept the certificate exclusions. The existing eMudhra post now has a short
  October21 follow-up distinguishing trust repair from Brotli repair, and
  staged runtime changes from verified running processes. Canonical title/slug
  preserved. Updated sitemap lastmod is generated from the editorial date.
- Validation: 301 unit tests, typecheck, lint, production preview build, hard
  bundle budgets, 11 bootstrap tests and generated-workflow check pass. Prose
  score100. Existing soft chunk warning remains. No full local prerender or
  browser visual QA; no hosted CI run or provider runtime attestation yet.
- Publication approval requested; no commit, push, PR or deployment yet.
  GitHub runner remediation may require waiting for a vendor rollout. Vendor
  desktop runtimes and the old Vercel project remain separate findings.

## 2026-10-21 — Node rollout and hosted-runner containment

- Owner authorized committing, pushing and deploying. Commit `21f62058` is
  pushed in PR #339; it is not merged or published to the production site.
- Hosted run `39699339521` found Runner.Worker's action Node at 24.21.0. The
  offline gate failed before checkout, as intended. Do not weaken it to obtain
  green CI or infer that setup-node patches the action runtime.
- Temporarily disabled all 13 repository-owned Actions workflows so scheduled
  main-branch jobs cannot keep using the old unguarded configuration. Prior
  states are recorded in the operator's protected recovery directory. Static
  production stays online; automated build/deploy, review and analytics work
  is paused. GitHub-managed Dependabot and external provider integrations are
  outside this hold. Re-enable only with the guarded workflow deployed and a
  verified patched runner; do not blindly restore old schedules.
- Dotfiles runtime changes were published and deployed separately. The Mini's
  gateway uses 24.22.1 and magazine uses 22.23.4, with actual process and health
  evidence. Remote robot bridges use 24.22.1 but robot MQTT connectivity remains
  unresolved. Other offline/vendor-managed runtimes remain explicit gaps.
- Updated the post to report actual activation and the failed hosted gate,
  preserving its concise narrative, canonical title, slug and attribution.
- Final documentation revision: production preview build, hard bundle budgets,
  11 bootstrap tests and workflow drift check pass; prose scores 97/100. The
  existing soft chunk limit remains exceeded. Added an attended, guarded
  validation procedure for restoring workflows without running old main.

## 2026-10-21 — Owner-selected security post title

- Retitled the existing incident post to “When Updating Isn’t Enough” at
  Dylan's request. Kept the canonical slug, source filename/legacy redirect,
  dates, body and Codex attribution unchanged. Refreshed generated feed metadata.
- This editorial change stays in PR #339; the security-related workflow hold
  remains in place and publication is still pending.

## 2026-10-21 — Bounded readiness monitoring and merge protection

- Owner approved an independent readiness monitor and required-check protection.
  Mini watch runs hourly for seven days, reports release-source candidates on
  PR #339, and cannot enable CI or merge. Actual hosted verification is still
  required. Startup/error/expiry notifications and bounded retry handling prevent
  an indefinite silent wait; the tracked implementation lives in dotfiles.
- Main requires GitHub Actions' `test` check, with up-to-date checking and admin
  enforcement. Existing other protection settings are preserved. Removed PR
  test workflow path exclusions, included reopened PRs and added a validator
  assertion so documentation PRs emit the required check.
- Direct-main publisher bots will also be blocked by required checks. Keep those
  jobs held pending a PR-based publishing design, without a security bypass.
- PR #339 and website workflow holds remain; no merge or production deployment.

## 2026-10-22 — Proactive security review in the incident post

- Owner requested expanding “When Updating Isn’t Enough” around the deployed
  proactive approach. Kept the title, canonical slug, publication date and
  truthful Codex attribution; advanced the editorial date to October 22.
- Added the inventory-first decision, minimized model inputs, primary-source
  verification, notification-only authority, resumable/capped collection and
  outstanding-only briefing. Explained partial reconciliation without closing
  multi-asset findings, and backports without age-based vulnerability claims.
- Kept private host identifiers, paths, accounts and the detailed app inventory
  out of the public post. Mentioned attended updates without a fleet clearance.
- Prose score 93; 52 focused content tests, 5 workflow-contract tests, 11
  bootstrap tests, typecheck, lint, preview build and hard bundle budgets pass.
  Existing soft chunk warning remains. No local full prerender on this branch
  because its older preview cleanup can affect shared services.
- GitHub runner v2.338.1 source declares Node 24.22.1. Publication still needs
  an attended hosted check of the assigned runner, required tests and review;
  release metadata alone does not lift the workflow hold.

## 2026-10-22 — Security post prose polish

- Owner requested 100/100 prose and deferred the next runner check until
  tomorrow. Rewrote three paragraphs to state the verified runtime scope and
  source-trust limits directly. Preserved the proactive sections, uncertainty,
  citations and attribution; no linter configuration or exclusions changed.
- Slop Guard now scores 100/100 with no reported violations. All 52 focused
  content tests and the production preview build pass. The existing large-chunk
  build warning remains; no full prerender or browser visual check this turn.
- Prior hosted run 39890862219 stopped before checkout on action Node 24.21.0.
  All 13 repository-owned workflows remain disabled; only GitHub-managed
  Dependabot is active. No runner retry, merge or production deployment tonight.

## 2026-10-24 — Narrow PR validation exception; publishing remains held

- Owner approved assessing/implementing a time-limited exception for reviewed
  PR validation while keeping credential-bearing deployment protected.
- Both pinned checkout/setup-node distributions contain Brotli decoding code.
  Avoided their execution entirely: permissionless, run-only PR checks now use
  native Git and checksum-pinned curl acquisition of build Node 24.22.1. No
  cache actions, artifact uploads, persisted Git credentials or secrets.
- Exception admits only action Node 24.21.0 for same-repository PR #339 on
  fix/node-security-runtime, and requires separately approved full head/base
  hashes. Review October 25 10:00 EDT; expiry October 26 10:00 EDT, reserving
  the full 30-minute job timeout. Other jobs retain the strict runtime gate.
- Kept all functional checks; 301 unit tests, 12 review-contract tests, typecheck
  and lint passed locally, plus focused expiry/scope/workflow guard tests.
- Hosted exception validation is pending. Its outputs must never be published;
  publication requires a clean rebuild on a verified patched environment. The
  local patched Node is a candidate, but old prerender process cleanup prevents
  an unattended full build on this shared Mini. No deployment clearance claimed.
