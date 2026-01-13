# ADR-003: Planning Docs Consolidation

**Date:** 2026-01-12
**Status:** Accepted

## Context

Planning documentation had grown organically:
- `PLANNING_DOCS_INDEX.md` (~400 lines) - Started as navigation, became a changelog
- `FUTURE_WORK_ROADMAP.md` (~370 lines) - Backlog and completed work tracking

Both files tracked "what's done" and "what's next" with significant overlap. Updating completed work required editing 2-3 files, creating drift risk.

## Decision

Consolidated into single `docs/ROADMAP.md` (~180 lines):
- **Current State**: Active monitoring, performance baselines
- **What's Next**: Prioritized backlog with links to detailed plans
- **Recently Completed**: Last 30 days of work
- **Documentation Map**: Links to other docs

Also:
- Moved completed `BLOG_FEATURE_PLAN.md` to `docs/completed-projects/`
- Created `docs/decisions/` for ADRs
- Added `.claude/preferences.md` for working style preferences

## Consequences

**Positive:**
- Single source of truth for project status
- One file to update when work completes
- Clearer separation: ROADMAP = status, individual plans = details
- Consistent archival pattern

**Negative:**
- Less detail in the consolidated file (by design)
- Historical context from old files is lost (captured in session notes)

**Enables:**
- Faster session orientation
- Reduced documentation drift
- Cleaner mental model of where information lives
