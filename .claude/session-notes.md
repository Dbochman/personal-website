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

---
