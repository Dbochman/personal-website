# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

#Using Gemini CLI for Large Codebase Analysis

When analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive context window. Use gemini -p to leverage Google Gemini's large context capacity.
File and Directory Inclusion Syntax

Use the @ syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the gemini command:
Examples:

Single file analysis: gemini -p "@src/main.py Explain this file's purpose and structure"

Multiple files: gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"

Entire directory: gemini -p "@src/ Summarize the architecture of this codebase"

Multiple directories: gemini -p "@src/ @tests/ Analyze test coverage for the source code"

Current directory and subdirectories: gemini -p "@./ Give me an overview of this entire project"
Or use --all_files flag:

gemini --all_files -p "Analyze the project structure and dependencies"

Implementation Verification Examples

Check if a feature is implemented: gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"

Verify authentication implementation: gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"

Check for specific patterns: gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"

Verify error handling: gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"

Check for rate limiting: gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"

Verify caching strategy: gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"

Check for specific security measures: gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"

Verify test coverage for features: gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"

When to Use Gemini CLI

Use gemini -p when: - Analyzing entire codebases or large directories - Comparing multiple large files - Need to understand project-wide patterns or architecture - Current context window is insufficient for the task - Working with files totaling more than 100KB - Verifying if specific features, patterns, or security measures are implemented - Checking for the presence of certain coding patterns across the entire codebase

Important Notes

    Paths in @ syntax are relative to your current working directory when invoking gemini
    The CLI will include file contents directly in the context
    No need for --yolo flag for read-only analysis
    Gemini's context window can handle entire codebases that would overflow Claude's context
    When checking implementations, be specific about what you're looking for to get accurate results 

## Repository Overview

This is a single-project repository containing personal-websit: React/TypeScript personal portfolio (deployed to GitHub Pages)

## Common Development Commands

### React/TypeScript Projects (personal-website/, oncology-career-canvas/)
```bash
npm run dev          # Start development server
npm run build        # Production build  
npm run preview      # Preview production build
npm test             # Run tests (Vitest)
npm run lint         # ESLint
npm run type-check   # TypeScript checking
npm run deploy       # Deploy to GitHub Pages (oncology-career-canvas only)
```
## Architecture Patterns

### Frontend Projects Structure
- **React 18 + TypeScript**: Modern functional components with hooks
- **Vite Tooling**: Fast development and optimized builds
- **Tailwind CSS + Radix UI**: Utility-first styling with accessible components
- **Component Architecture**: 
  - `src/components/` - Reusable UI components
  - `src/pages/` - Page-level components
  - `src/hooks/` - Custom React hooks
  - `src/lib/` - Utility functions

### React Projects
- GitHub Pages deployment constraints (static hosting only)
- SEO considerations for portfolio sites
- Responsive design patterns with Tailwind CSS

## Git Workflow

**Always use feature branches and PRs.** Do not commit directly to main.

### For any code changes:

1. Create a feature branch: `git checkout -b feature/descriptive-name`
2. Make commits on the branch
3. Push and open a PR: `gh pr create`
4. Wait for review before merging
5. Merge via PR: `gh pr merge --squash --delete-branch`

### Why PRs matter:
- Code review catches issues before they reach main
- PR descriptions capture "The Journey" for blog material
- Easier to revert a single squashed commit than untangle direct pushes
- Main branch stays stable

### Exceptions:
- Documentation-only changes (CLAUDE.md, README) may go direct if trivial
- Emergency hotfixes, but open a PR immediately after

## Patterns to Avoid

- **localStorage**: Use URL params or other stateless approaches for persistence
- **Direct commits to main**: Always use feature branches and PRs

## Commit Message Style Guide

Commits in this repository are blog source material. Write them with future Claude in mind.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### The Body Matters

For non-trivial commits, add a body that captures context:

**Instead of:**
```
fix: Update CMS config to use git-gateway
```

**Write:**
```
fix: Update CMS config to use git-gateway

GitHub OAuth was returning 404. Hypothesis: git-gateway with Netlify
Identity might work since the site is hosted on Netlify.

This is attempt #3. Previous tries: explicit GitHub backend, adding
repo/branch config. None worked.
```

### When to Add Context

Add a body when:
- The commit is one of several attempts at the same problem
- The "why" isn't obvious from the subject line
- You're trying something that might not work
- The change has non-obvious implications

Skip the body for:
- Truly trivial changes (typos, formatting)
- Changes where the subject says it all

### Marking Blog-Worthy Commits

Add `[blog]` to commits that have a story:

```
feat: Switch blog content from .mdx to .txt files [blog]

The MDX plugin was transforming files before we could load them raw.
Dylan suggested using a file type no plugin would touch. .txt files
bypass the entire processing pipeline.

This is a workaround that became architecture.
```

The `[blog]` tag helps the hook identify commits worth expanding on, even if the count threshold hasn't been reached.

### Grouping Commits Across Sessions

For features that span multiple sessions, use `[blog:tag-name]` to group related commits:

```
fix: Update CMS config to use git-gateway [blog:cms-auth]

Attempt #3. GitHub OAuth returned 404, trying Netlify Identity instead.
```

```
fix: Add redirect for /editor to Netlify subdomain [blog:cms-auth]

The actual fix. Cloudflare was intercepting identity requests.
Dylan noticed it worked on the .netlify.app domain.
```

When drafting a post, I can search for all commits with the same tag (`git log --grep="\[blog:cms-auth\]"`) to find the full story even if it happened across days or weeks.

---

## Session Notes

At the end of sessions where notable work happened, append a brief entry to `.claude/session-notes.md`. This captures context that doesn't fit in commits:

- Observations about patterns we noticed
- The "we tried X but realized Y" moments
- Questions that came up but weren't resolved
- Anything that might inform a future blog post

Keep entries brief. Date each one. This is less formal than a blog post, more durable than conversation memory.

---

## Pull Request Style Guide

PRs in this repository serve dual purposes: code review and blog source material. Write PR descriptions with future Claude in mind—the one who will be drafting blog posts from commit history.

### PR Description Template

```markdown
## Summary
[1-2 sentences: what this PR accomplishes]

## The Journey
[This is the blog material. Capture:]
- What problem we were trying to solve
- What we tried first (especially if it didn't work)
- The pivot moment—what question or reframe led to the solution
- Why the final approach works

## Changes
- [Bullet list of technical changes]

## What I Learned
[Optional: patterns worth noting, surprises, things that might apply elsewhere]

## Test Plan
- [ ] [How to verify this works]
```

### Why "The Journey" Matters

The interesting parts of blog posts are:
- **Dead ends**: "We tried X, but it failed because Y"
- **Pivots**: "Dylan asked whether we could Z instead"
- **Surprises**: "This broke in production but not locally because..."

These details exist in the moment but evaporate from commit messages. Capture them in the PR while context is fresh.

### Example

**Instead of:**
```markdown
## Summary
Fix CMS authentication

## Changes
- Updated config to use git-gateway
- Added redirect for /editor route
```

**Write:**
```markdown
## Summary
Fix CMS authentication by redirecting to Netlify subdomain

## The Journey
CMS login was returning 405 on the custom domain. We tried:
1. Switching to git-gateway backend (didn't help)
2. Adding Netlify Identity widget explicitly (didn't help)
3. Various API URL configurations (didn't help)

Six commits, each a hypothesis, each wrong. The actual problem was
infrastructure: Cloudflare proxies the custom domain, intercepting
/.netlify/identity/* requests before they reach Netlify.

Dylan noticed it worked on the .netlify.app subdomain. The fix was
accepting the constraint: add a redirect so /editor goes to the
subdomain where auth actually works.

## Changes
- Added redirect rule in netlify.toml
- Updated CMS docs with correct URL

## What I Learned
When iterating on config changes isn't converging, the problem might
be outside the code entirely. Should have tested the subdomain earlier.
```

This PR description becomes a blog post outline with minimal additional work.