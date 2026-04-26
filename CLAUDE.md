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
| `[skip-changelog]` | Skip changelog sync for this commit |
| `[blog]` | Mark commit as blog-worthy |
| `[blog:tag]` | Group related commits |
| `[changelog]` | Force-include in changelog (overrides type filter) |

### Changelog sync

`.github/workflows/sync-changelog.yml` runs on every push to `main` and:

1. Skips noise (dependabot, daily analytics, `chore`/`deps`/`docs`/`ci`/`build`/`style`/`test`/`refactor` without `[changelog]`).
2. For each remaining commit, looks for an existing roadmap card by `PR #N` label or slug match. If found, moves it to the `changelog` column.
3. Otherwise, creates a new card directly in `changelog` (only for `feat`/`fix`/`perf`/freeform commits, or anything tagged `[changelog]`).
4. Bot commits without `[skip ci]` so deploy.yml's content-only fast path runs and the new card lands on the live site within ~2 minutes. The sync workflow itself doesn't re-trigger because of the `paths-ignore` filter on `content/kanban/**` and `src/generated/kanban/**`.

Backfill or test via `Actions → Sync Changelog → Run workflow` (supports `since` SHA and dry-run).

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

## Blog Quality

Blog posts are checked by [slop-guard](https://github.com/eric-tramel/slop-guard) in CI. All posts must score >= 80/100. Run locally:

```bash
uvx --from slop-guard sg -v content/blog/my-post.txt  # verbose violations
uvx --from slop-guard sg -s content/blog/my-post.txt  # score only
```

See `docs/BLOG_STYLE_GUIDE.md` for voice, tone, and conventions.

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
