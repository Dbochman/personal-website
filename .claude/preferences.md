# Dylan's Preferences

Working style preferences for Claude Code sessions. Updated January 12, 2026.

---

## Context

**Who:** Professional SRE / Incident Manager
**Quality bar:** Production-grade. Not "good enough" - the real thing.
**Purpose:** This repo is portfolio + learning + actual tools, but **prioritize for external reception** when there's tension between them.

---

## Anti-patterns (Universal)

These apply to any repo, not just this one:

- **No localStorage** - Use URL params, server state, or stateless approaches
- *(Add more as discovered)*

---

## Working Style

| Aspect | Preference |
|--------|------------|
| **Verbosity** | Moderate - explain what I'm about to do, then do it |
| **Autonomy** | Ask first - confirm before making changes, even for small fixes |
| **Decisions** | Recommend + explain - give your recommendation with reasoning |
| **Research output** | Summary only - conclusions and key findings |
| **Errors** | Error + analysis - explain why it happened, then fix |
| **Comments** | Minimal - only when logic is non-obvious |
| **Tone** | Professional - clear, respectful, occasional personality |

## Git Workflow

| Aspect | Preference |
|--------|------------|
| **Commits** | After each feature/fix - small, atomic |
| **PRs** | Narrative - include "The Journey" section for blog material |
| **Testing** | Before suggesting commit, but skip for docs-only changes |

## Session Management

| Aspect | Preference |
|--------|------------|
| **Session start** | Read session-notes + git log, provide "here's where we left off" |
| **Session end** | Full handoff - status, next steps, update session notes, suggest commit |

---

## Quick Reference

When starting a session:
1. Read `.claude/session-notes.md`
2. Check `git log --oneline -10`
3. Provide brief "where we left off" summary

When making changes:
1. Explain what I'm about to do
2. Confirm before executing (even small fixes)
3. Execute the change
4. Summarize what was done

When suggesting commits:
1. Run tests first (only if changes might impact production - skip for docs-only)
2. Suggest after each discrete feature/fix
3. Use atomic commits

When ending a session:
1. Summarize what was accomplished
2. List any uncommitted changes
3. Suggest next steps
4. Update session-notes.md
5. Offer to commit if appropriate

---

**Last Updated:** January 12, 2026
