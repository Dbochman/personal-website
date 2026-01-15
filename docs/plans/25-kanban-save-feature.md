# Plan: Kanban Board Save Feature

## Overview

Add a "Save Changes" button to the Kanban board that commits the current board state back to GitHub. Uses a Cloudflare Worker as a secure proxy to trigger a GitHub Action, keeping all sensitive tokens server-side.

## Architecture

```
┌─────────────┐     ┌────────────────────┐     ┌─────────────────┐     ┌────────────┐
│   Browser   │────▶│ Cloudflare Worker  │────▶│ GitHub Actions  │────▶│   Commit   │
│ (Save btn)  │     │ (validates secret) │     │ (writes file)   │     │ (to main)  │
└─────────────┘     └────────────────────┘     └─────────────────┘     └────────────┘
       │                     │                         │
       │                     │                         │
   SAVE_SECRET          GITHUB_PAT              GITHUB_TOKEN
   (safe to expose)     (server-side)           (built-in)
```

**Security model:**
- Browser only knows `SAVE_SECRET` (a random string, safe to expose)
- `GITHUB_PAT` stays in Cloudflare Worker environment (never in browser)
- GitHub Action uses built-in `GITHUB_TOKEN` for commits

## Implementation Phases

### Phase 1: Convert Board Data to JSON

Move `roadmapBoard` from TypeScript to JSON for runtime loading.

**Create `src/data/kanban-board.json`:**
```json
{
  "id": "roadmap",
  "title": "Site Roadmap",
  "columns": [...],
  "createdAt": "2026-01-13",
  "updatedAt": "2026-01-15"
}
```

**Update `src/types/kanban.ts`:**
- Keep type definitions (`KanbanCard`, `KanbanColumn`, etc.)
- Keep helper functions (`generateId()`, `COLUMN_COLORS`)
- Remove `roadmapBoard` data export

**Create `src/hooks/useKanbanBoard.ts`:**
```typescript
import { useState, useEffect } from 'react';
import type { KanbanBoard } from '@/types/kanban';

export function useKanbanBoard(boardId: string) {
  const [board, setBoard] = useState<KanbanBoard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    fetch(`/data/${boardId}-board.json`)
      .then(res => res.json())
      .then(data => {
        setBoard(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [boardId]);

  const updateBoard = (newBoard: KanbanBoard) => {
    setBoard(newBoard);
    setIsDirty(true);
  };

  return { board, isLoading, error, isDirty, updateBoard, setIsDirty };
}
```

### Phase 2: Create Cloudflare Worker

**Worker code (`kanban-save-worker/src/index.ts`):**
```typescript
export interface Env {
  GITHUB_PAT: string;
  SAVE_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': 'https://dylanbochman.com',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, X-Save-Secret',
        },
      });
    }

    // Validate secret
    const secret = request.headers.get('X-Save-Secret');
    if (secret !== env.SAVE_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse board data
    const { board, boardId } = await request.json();

    // Trigger GitHub Action
    const response = await fetch(
      'https://api.github.com/repos/Dbochman/personal-website/dispatches',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GITHUB_PAT}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'kanban-save-worker',
        },
        body: JSON.stringify({
          event_type: 'save-kanban',
          client_payload: { board, boardId },
        }),
      }
    );

    return new Response(
      response.ok ? JSON.stringify({ success: true }) : 'GitHub API error',
      {
        status: response.ok ? 200 : 502,
        headers: {
          'Access-Control-Allow-Origin': 'https://dylanbochman.com',
          'Content-Type': 'application/json',
        },
      }
    );
  },
};
```

**Deploy steps:**
1. Create Cloudflare account (free)
2. `npm create cloudflare@latest kanban-save-worker`
3. Add secrets: `wrangler secret put GITHUB_PAT` and `wrangler secret put SAVE_SECRET`
4. Deploy: `wrangler deploy`

### Phase 3: Create GitHub Action

**`.github/workflows/save-kanban.yml`:**
```yaml
name: Save Kanban Board

on:
  repository_dispatch:
    types: [save-kanban]

jobs:
  save:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Update board JSON
        run: |
          echo '${{ toJson(github.event.client_payload.board) }}' | jq '.' > src/data/${{ github.event.client_payload.boardId }}-board.json

      - name: Commit and push
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add src/data/*-board.json
          git diff --staged --quiet || git commit -m "kanban: save board state [skip ci]"
          git push
```

### Phase 4: Add Save Button UI

**Update `src/pages/Kanban.tsx`:**
```typescript
import { useKanbanBoard } from '@/hooks/useKanbanBoard';

const SAVE_SECRET = import.meta.env.VITE_KANBAN_SAVE_SECRET;
const WORKER_URL = 'https://kanban-save.your-subdomain.workers.dev';

function KanbanPage() {
  const { board, isLoading, isDirty, updateBoard, setIsDirty } = useKanbanBoard('roadmap');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!board || !isDirty) return;

    setIsSaving(true);
    try {
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Save-Secret': SAVE_SECRET,
        },
        body: JSON.stringify({ board, boardId: 'roadmap' }),
      });

      if (response.ok) {
        setIsDirty(false);
        // Show success toast
      }
    } catch (err) {
      // Show error toast
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {isDirty && (
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      )}
      {/* Board content */}
    </div>
  );
}
```

### Phase 5: Environment Variables

**`.env` (local development):**
```
VITE_KANBAN_SAVE_SECRET=your-random-secret-here
```

**GitHub Repository Settings:**
- Add `KANBAN_SAVE_SECRET` to Actions secrets (for reference)

**Cloudflare Worker:**
```bash
wrangler secret put GITHUB_PAT    # Fine-grained PAT with repo scope
wrangler secret put SAVE_SECRET   # Same random string as VITE_KANBAN_SAVE_SECRET
```

## Checklist

### Phase 1: JSON Migration
- [ ] Create `src/data/kanban-board.json` with roadmap data
- [ ] Create `src/data/house-projects-board.json` (if applicable)
- [ ] Create `useKanbanBoard` hook with loading/dirty state
- [ ] Update Kanban page to use hook instead of imported data
- [ ] Add loading skeleton while fetching
- [ ] Test board renders correctly from JSON

### Phase 2: Cloudflare Worker
- [ ] Create Cloudflare account
- [ ] Create worker project with wrangler
- [ ] Implement save endpoint with CORS
- [ ] Add `GITHUB_PAT` secret (fine-grained, repo scope)
- [ ] Add `SAVE_SECRET` secret
- [ ] Deploy worker
- [ ] Test with curl

### Phase 3: GitHub Action
- [ ] Create `.github/workflows/save-kanban.yml`
- [ ] Test with manual `repository_dispatch` trigger
- [ ] Verify commit appears in repo

### Phase 4: Frontend Integration
- [ ] Add `VITE_KANBAN_SAVE_SECRET` to `.env`
- [ ] Add Save button component
- [ ] Wire up save handler to worker
- [ ] Add saving state indicator
- [ ] Add success/error toast notifications
- [ ] Only show button when `isDirty`

### Phase 5: Polish
- [ ] Add unsaved changes warning on page leave
- [ ] Handle merge conflicts (board changed while editing)
- [ ] Add to `.env.example`
- [ ] Document in OPERATIONS_MANUAL.md

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Token exposure | PAT stored only in Cloudflare Worker env |
| Unauthorized saves | SAVE_SECRET required (can be rotated) |
| CORS attacks | Worker only accepts requests from dylanbochman.com |
| Injection attacks | JSON validated by GitHub Action with `jq` |

## Cost

| Service | Tier | Limit |
|---------|------|-------|
| Cloudflare Workers | Free | 100k requests/day |
| GitHub Actions | Free | 2,000 minutes/month |

**Total: $0/month** (well within free tiers)

## Rollback Plan

If issues arise:
1. Revert to TypeScript-based board data
2. Delete Cloudflare Worker
3. Remove GitHub Action

The feature is additive - removing it restores previous behavior.

## Future Enhancements

- **Optimistic updates**: Show saved state immediately, revert on failure
- **Conflict resolution**: Detect if board changed since page load
- **Multiple boards**: Support saving any board (roadmap, house-projects)
- **Audit log**: Track who saved and when (via commit history)
- **Branch mode**: Option to save to a PR instead of main

## Effort Estimate

| Phase | Time |
|-------|------|
| Phase 1: JSON Migration | 1 hour |
| Phase 2: Cloudflare Worker | 30 min |
| Phase 3: GitHub Action | 20 min |
| Phase 4: Frontend Integration | 1 hour |
| Phase 5: Polish | 30 min |
| **Total** | **~3 hours** |
