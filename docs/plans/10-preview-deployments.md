# Preview Deployments Plan

## Overview

Deploy pull requests to unique preview URLs for testing before merge. Enables visual review and stakeholder feedback without merging to main.

## Current State

- Production deploys to GitHub Pages via `dbochman.github.io`
- No preview environment exists
- PRs can only be tested locally

## Options

### Option A: Cloudflare Pages (Recommended)

Free, automatic PR previews, good performance.

### Option B: Netlify

Similar features, already using for CMS subdomain.

### Option C: GitHub Pages + Custom Workflow

Manual setup, more complex but keeps everything on GitHub.

### Option D: Surge.sh

Lightweight, free for public projects.

## Implementation (Option A: Cloudflare Pages)

### Phase 1: Cloudflare Pages Setup

1. Go to Cloudflare Dashboard → Pages
2. Connect GitHub repository
3. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Node version: 24

4. Set production branch: `main`
5. Enable branch deployments for all branches

### Phase 2: Preview URL Pattern

Cloudflare generates URLs like:
- Production: `project-name.pages.dev` (or custom domain)
- Preview: `<branch>.<project-name>.pages.dev`
- PR: `<commit-hash>.<project-name>.pages.dev`

### Phase 3: PR Comment with Preview Link

Create `.github/workflows/preview-comment.yml`:

```yaml
name: Preview Comment

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  comment:
    runs-on: ubuntu-latest
    steps:
      - name: Wait for Cloudflare deployment
        run: sleep 60  # Allow time for CF to build

      - name: Comment preview URL
        uses: actions/github-script@v7
        with:
          script: |
            const branch = context.payload.pull_request.head.ref;
            const sanitized = branch.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
            const previewUrl = `https://${sanitized}.personal-website-xxx.pages.dev`;

            const body = `## 🔍 Preview Deployment

            Preview URL: ${previewUrl}

            This preview will be updated with each push to this PR.

            ---
            _Deployed via Cloudflare Pages_`;

            // Find existing comment
            const { data: comments } = await github.rest.issues.listComments({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
            });

            const existing = comments.find(c =>
              c.user.login === 'github-actions[bot]' &&
              c.body.includes('Preview Deployment')
            );

            if (existing) {
              await github.rest.issues.updateComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                comment_id: existing.id,
                body,
              });
            } else {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                body,
              });
            }
```

### Phase 4: Environment Variables

Configure in Cloudflare Pages settings:

| Variable | Production | Preview |
|----------|------------|---------|
| `VITE_GA_ID` | Real ID | None (disable tracking) |
| `VITE_SENTRY_DSN` | Real DSN | None (disable errors) |
| `VITE_ENV` | `production` | `preview` |

### Phase 5: Preview-Specific Behavior

**File:** `src/lib/env.ts`

```ts
export const isPreview = import.meta.env.VITE_ENV === 'preview';

// Disable analytics in preview
export const shouldTrackAnalytics = !isPreview;

// Show preview banner
export const showPreviewBanner = isPreview;
```

**File:** `src/components/PreviewBanner.tsx`

```tsx
import { showPreviewBanner } from '@/lib/env';

export function PreviewBanner() {
  if (!showPreviewBanner) return null;

  return (
    <div className="bg-yellow-500 text-black text-center py-1 text-sm">
      🔍 Preview Deployment - Not production
    </div>
  );
}
```

## Alternative: GitHub Actions + Surge

For a GitHub-only solution:

```yaml
name: Preview Deploy

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'

      - run: npm ci
      - run: npm run build

      - name: Deploy to Surge
        run: npx surge ./dist pr-${{ github.event.number }}.dylanbochman.surge.sh --token ${{ secrets.SURGE_TOKEN }}

      - name: Comment URL
        uses: actions/github-script@v7
        with:
          script: |
            const url = `https://pr-${context.issue.number}.dylanbochman.surge.sh`;
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `## Preview: ${url}`,
            });
```

## Verification

1. Create test PR
2. Wait for preview deployment
3. Verify preview URL accessible
4. Verify analytics disabled in preview
5. Verify preview banner shows
6. Merge PR, verify preview cleaned up

## Cleanup

Cloudflare Pages automatically removes preview deployments after configurable time (default 30 days).

For Surge:
```yaml
# On PR close
- name: Delete preview
  if: github.event.action == 'closed'
  run: npx surge teardown pr-${{ github.event.number }}.dylanbochman.surge.sh
```

## Files to Create/Modify

```
.github/workflows/preview-comment.yml  # New: PR comment
src/lib/env.ts                         # New: environment helpers
src/components/PreviewBanner.tsx       # New: preview indicator
src/App.tsx                            # Add PreviewBanner
```

## Effort

**Estimate**: Small-Medium

- Cloudflare Pages setup: 30 min
- PR comment workflow: 30 min
- Preview banner: 15 min
- Environment config: 15 min
- Testing: 30 min

## Dependencies

- Cloudflare account (free tier works)
- Or: Surge.sh account (free for public)
