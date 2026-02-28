# CLAUDE.md

## Session Start

1. Read `.claude/session-notes.md` for recent context
2. Check `git log --oneline -10` for recent work

## Commands

```bash
npm run dev       # Dev server
npm run build     # Production build
npm test          # Vitest
npm run lint      # ESLint
```

## Stack

React 18, TypeScript, Vite, Tailwind CSS, Radix UI. Deployed to GitHub Pages.

## Git Workflow

**Use feature branches and PRs for code changes.** Blog post edits can be committed directly to main.

```bash
git checkout -b feature/name
# ... work ...
gh pr create
gh pr merge --squash --delete-branch
```

## Commit Messages

```
<type>(<scope>): <subject>

[optional body: what you tried, why, what failed]
```

### Flags

| Flag | Effect |
|------|--------|
| `[skip ci]` | Skip all GitHub Actions |
| `[skip-review]` | Skip Codex PR review |
| `[blog]` | Mark commit as blog-worthy |
| `[blog:tag]` | Group related commits |

## Kanban

```bash
npm run kanban:add -- --board=roadmap --column=ideas --title="Feature" --labels="Small"
npm run kanban:move -- --board=roadmap --card=my-feature --to=in-progress
npm run precompile-kanban  # Always run after changes
```

See `.claude/skills/kanban-card-management/SKILL.md` for details.

## Session Notes

Append to `.claude/session-notes.md`:
- "Tried X, realized Y" moments
- Unresolved questions
- Patterns worth noting

## Patterns to Avoid

- **localStorage**: Use URL params instead
- **Direct commits to main for code changes**: Use PRs (blog posts are fine)

## MCP Testing

When Chrome DevTools MCP is available:

| Trigger | Action |
|---------|--------|
| UI changes | Responsive check (320px, 768px) |
| New route | Console, network, a11y snapshot |
| Before PR | Quick smoke test |

## New Routes

When adding a new page/route:
1. Add to `vite.config.ts` → `prerender.routes` array
2. Without prerendering, direct URL access returns 404 on GitHub Pages (SPA limitation)
