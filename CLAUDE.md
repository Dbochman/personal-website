# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Session Start

At the beginning of each session:
1. Read `.claude/session-notes.md` for recent context
2. Check `git log --oneline -10` for recent work
3. Provide a brief "here's where we left off" summary

## Preferences

See `~/.claude/preferences.md` for Dylan's working style preferences (global, not in repo).

## Repository Overview

React/TypeScript personal portfolio deployed to GitHub Pages.

## Common Development Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm test             # Run tests (Vitest)
npm run lint         # ESLint
```

## Architecture

- **Stack**: React 18, TypeScript, Vite, Tailwind CSS, Radix UI
- **Structure**: `src/components/`, `src/pages/`, `src/hooks/`, `src/lib/`
- **Hosting**: GitHub Pages (static only)

## Git Workflow

**Always use feature branches and PRs.** Do not commit directly to main.

1. Create branch: `git checkout -b feature/descriptive-name`
2. Make commits, push, open PR: `gh pr create`
3. Merge via PR: `gh pr merge --squash --delete-branch`

**Exceptions:** Trivial docs changes may go direct.

## Pre-commit Hooks

Husky + lint-staged runs ESLint on staged files before every commit. Commits with lint errors are blocked automatically. This is especially useful for AI-assisted development - failed hooks trigger retries.

## Patterns to Avoid

- **localStorage**: Use URL params or stateless approaches
- **Direct commits to main**: Always use feature branches and PRs

## Kanban Board Updates

When updating cards in `src/types/kanban.ts`:

### Column Flow

Cards progress through: **Backlog → To Do → In Progress → In Review → Change Log**

- **In Review**: For PRs that are opened but not yet merged (add `prStatus` field)
- **Change Log**: Summarized entries of completed work (not individual cards)

### PR Status Indicator

Cards in "In Review" should include a `prStatus` field to show CI status:

```typescript
{
  id: 'react-perf',
  title: 'React Performance Optimizations',
  labels: ['PR #124'],
  prStatus: 'passing', // Shows green check ✓
  // prStatus: 'failing', // Shows red X ✗
  // prStatus: 'pending', // Shows yellow clock ⏳
  createdAt: '2026-01-15'
}
```

### Card Movements

- **Moving cards between columns**: Add a `history` entry with `type: 'column'`, `timestamp`, `columnId`, and `columnTitle`
- **Updating card fields**: Add a `history` entry with `type: 'title'|'description'|'labels'`, `timestamp`, `from`, and `to`
- **Adding PR labels**: Use format `PR #123` (single PRs auto-link to GitHub)

Example history entry for column move:
```typescript
history: [
  { type: 'column', timestamp: '2026-01-14T14:00:00.000Z', columnId: 'in-review', columnTitle: 'In Review' },
],
```

### Change Log Pattern

When work is merged, don't move individual cards to Change Log. Instead, create summary entries grouped by date:

```typescript
{
  id: 'jan-15',
  title: 'Jan 15: React Performance',
  description: 'Analytics CLS fix, scroll throttling, React.memo for list components',
  labels: ['Performance', 'PR #120'],
  createdAt: '2026-01-15'
}
```

- **Title**: `Mon DD: Theme` (e.g., "Jan 15: React Performance")
- **Description**: Brief summary of what was accomplished
- **Labels**: Include relevant PR numbers and categories
- **Remove the original card** from In Review once summarized

## Commit Message Style Guide

Commits are blog source material. Write them with future Claude in mind.

### Format

```
<type>(<scope>): <subject>

[optional body with context: what you tried, why, what failed]
```

### When to Add Context

Add a body when the commit is one of several attempts, the "why" isn't obvious, or the change has non-obvious implications.

### Blog Tags

- Add `[blog]` to commits with a story worth expanding
- Use `[blog:tag-name]` to group related commits across sessions

```
fix: Add redirect for /editor to Netlify subdomain [blog:cms-auth]

The actual fix. Cloudflare was intercepting identity requests.
Dylan noticed it worked on the .netlify.app domain.
```

## Session Notes

At session end, append notable observations to `.claude/session-notes.md`:
- "We tried X but realized Y" moments
- Unresolved questions
- Patterns worth noting

## Pull Request Style Guide

PRs serve dual purposes: code review and blog source material.

### Template

```markdown
## Summary
[1-2 sentences: what this PR accomplishes]

## The Journey
- What problem we were solving
- What we tried first (especially failures)
- The pivot moment that led to the solution

## Changes
- [Bullet list of technical changes]

## Test Plan
- [ ] [How to verify this works]
```

### Why "The Journey" Matters

Capture dead ends, pivots, and surprises while context is fresh—these details evaporate from commit messages but make blog posts interesting.

## MCP Testing Triggers

When Chrome DevTools MCP is available, run interactive tests at these moments:

| Trigger | Action |
|---------|--------|
| After implementing UI changes | Quick responsive check (320px, 768px) |
| After adding a new page/route | Full page audit: console, network, a11y snapshot |
| After performance-sensitive changes | `performance_start_trace` with reload |
| Before marking PR ready | Quick smoke test on affected pages |
| After deploy to production | Post-deploy verification on dylanbochman.com |

**Quick smoke test:**
```
1. list_console_messages → no errors
2. take_snapshot → check accessibility tree
3. resize_page 320 → no layout breaks
```

**Proactive testing:** If you notice the user is about to open a PR or has just finished a feature, offer to run MCP tests before they ask.

See `docs/plans/16-mcp-interactive-testing.md` for detailed workflows.
