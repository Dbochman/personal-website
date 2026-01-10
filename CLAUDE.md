# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Gemini CLI for Large Codebase Analysis

Use Gemini CLI when analyzing large codebases or needing a second opinion. Use `@` syntax to include files:

```bash
gemini -p "@src/App.tsx Explain this file"
gemini -p "@src/ Summarize the architecture"
gemini -p "@src/ @tests/ Find all references to 'functionName'"
cat file.tsx | gemini -p "Review this for edge cases"
```

### When Claude Should Suggest Gemini

**Proactively ask the user if we should invoke a Gemini command when you spot these situations:**

1. **Before renaming files/functions** - Find all references first
2. **After completing a feature** - Second-opinion code review
3. **Architecture questions** - When holistic view needed
4. **Verifying complex changes** - Sanity check

When you spot a matching situation, ask: *"Should we run a Gemini command to check for references/verify this/get a second opinion?"*

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

## Patterns to Avoid

- **localStorage**: Use URL params or stateless approaches
- **Direct commits to main**: Always use feature branches and PRs

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
