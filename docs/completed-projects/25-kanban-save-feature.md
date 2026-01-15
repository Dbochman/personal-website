# Plan: Kanban Board Save Feature

## Overview

Add a "Save Changes" button to the Kanban board that commits the current board state back to GitHub. Uses a Cloudflare Worker as a secure proxy to trigger a GitHub Action, keeping all sensitive tokens server-side.

**Current Status**: Initial implementation complete (PR #127) using shared secret. Security review recommended GitHub OAuth for proper authentication.

## Architecture

### Current (Shared Secret) - ⚠️ To Be Replaced

```
┌─────────────┐     ┌────────────────────┐     ┌─────────────────┐     ┌────────────┐
│   Browser   │────▶│ Cloudflare Worker  │────▶│ GitHub Actions  │────▶│   Commit   │
│ (Save btn)  │     │ (validates secret) │     │ (writes file)   │     │ (to main)  │
└─────────────┘     └────────────────────┘     └─────────────────┘     └────────────┘
       │                     │                         │
   SAVE_SECRET          GITHUB_PAT              GITHUB_TOKEN
   (client-exposed)     (server-side)           (built-in)
```

**Issues:**
- `SAVE_SECRET` is exposed in client-side JavaScript
- Anyone can extract it and trigger saves
- Mitigations (boardId whitelist, version check) reduce risk but don't eliminate it

### Target (GitHub OAuth) - ✅ Proper Authentication

```
┌─────────────┐     ┌────────────────────┐     ┌─────────────────┐     ┌────────────┐
│   Browser   │────▶│ Cloudflare Worker  │────▶│ GitHub Actions  │────▶│   Commit   │
│ (OAuth'd)   │     │ (validates token)  │     │ (writes file)   │     │ (to main)  │
└─────────────┘     └────────────────────┘     └─────────────────┘     └────────────┘
       │                     │                         │
   Session cookie     KV session store          GITHUB_TOKEN
   (httpOnly)         + GitHub API check        (built-in)
```

**Security model:**
- User authenticates via GitHub OAuth
- Session stored in Cloudflare KV (cookie references session ID)
- Worker verifies user is repo collaborator before allowing save
- No secrets exposed to browser

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

---

## GitHub OAuth Implementation (Phase 6)

This phase replaces the shared secret authentication with proper GitHub OAuth.

### 6.1: Create GitHub OAuth App

1. Go to **GitHub Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**
2. Fill in:
   - **Application name**: `Dylan's Kanban Save`
   - **Homepage URL**: `https://dylanbochman.com`
   - **Authorization callback URL**: `https://kanban-save-worker.dbochman.workers.dev/auth/callback`
3. After creation, note the **Client ID**
4. Generate a **Client Secret**

### 6.2: Add Cloudflare KV Namespace

```bash
# Create KV namespace for session storage
wrangler kv:namespace create "SESSIONS"

# Output will show the binding ID, add to wrangler.toml:
# [[kv_namespaces]]
# binding = "SESSIONS"
# id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 6.3: Add OAuth Secrets to Worker

```bash
cd kanban-save-worker
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
```

### 6.4: Update Worker Code

**Updated `kanban-save-worker/src/index.ts`:**

```typescript
export interface Env {
  GITHUB_PAT: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  SESSIONS: KVNamespace;
}

interface Session {
  githubUsername: string;
  accessToken: string;
  createdAt: number;
}

const REPO_OWNER = 'Dbochman';
const REPO_NAME = 'personal-website';
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://dylanbochman.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // OAuth routes
    if (url.pathname === '/auth/login') {
      return handleLogin(env);
    }
    if (url.pathname === '/auth/callback') {
      return handleCallback(request, env);
    }
    if (url.pathname === '/auth/status') {
      return handleStatus(request, env);
    }
    if (url.pathname === '/auth/logout') {
      return handleLogout(request, env);
    }

    // Save route (requires auth)
    if (request.method === 'POST' && url.pathname === '/save') {
      return handleSave(request, env);
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  },
};

function handleLogin(env: Env): Response {
  const state = crypto.randomUUID();
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri',
    'https://kanban-save-worker.dbochman.workers.dev/auth/callback');
  authUrl.searchParams.set('scope', 'read:user');
  authUrl.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      'Location': authUrl.toString(),
      'Set-Cookie': `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}

async function handleCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  // Verify state matches cookie
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  if (state !== cookies.oauth_state) {
    return redirectWithError('State mismatch');
  }

  // Exchange code for access token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenResponse.json() as { access_token?: string; error?: string };
  if (!tokenData.access_token) {
    return redirectWithError('Token exchange failed');
  }

  // Get GitHub username
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'User-Agent': 'kanban-save-worker',
    },
  });
  const userData = await userResponse.json() as { login: string };

  // Check if user is a collaborator on the repo
  const collabResponse = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/collaborators/${userData.login}`,
    {
      headers: {
        'Authorization': `Bearer ${env.GITHUB_PAT}`,
        'User-Agent': 'kanban-save-worker',
      },
    }
  );

  if (collabResponse.status !== 204) {
    return redirectWithError('Not a collaborator');
  }

  // Create session
  const sessionId = crypto.randomUUID();
  const session: Session = {
    githubUsername: userData.login,
    accessToken: tokenData.access_token,
    createdAt: Date.now(),
  };

  await env.SESSIONS.put(sessionId, JSON.stringify(session), {
    expirationTtl: SESSION_TTL,
  });

  // Redirect back to kanban with session cookie
  return new Response(null, {
    status: 302,
    headers: {
      'Location': 'https://dylanbochman.com/roadmap',
      'Set-Cookie': `session=${sessionId}; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL}; Path=/`,
    },
  });
}

async function handleStatus(request: Request, env: Env): Promise<Response> {
  const session = await getSession(request, env);

  return new Response(
    JSON.stringify({
      authenticated: !!session,
      username: session?.githubUsername || null,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function handleLogout(request: Request, env: Env): Promise<Response> {
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  if (cookies.session) {
    await env.SESSIONS.delete(cookies.session);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Set-Cookie': 'session=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/',
    },
  });
}

async function handleSave(request: Request, env: Env): Promise<Response> {
  const session = await getSession(request, env);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { board, boardId } = await request.json() as { board: unknown; boardId: string };

  // Trigger GitHub Action
  const response = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/dispatches`,
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
        client_payload: { board, boardId, savedBy: session.githubUsername },
      }),
    }
  );

  if (response.ok) {
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'GitHub API error' }), {
    status: 502,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Helper functions
async function getSession(request: Request, env: Env): Promise<Session | null> {
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  if (!cookies.session) return null;

  const sessionData = await env.SESSIONS.get(cookies.session);
  if (!sessionData) return null;

  return JSON.parse(sessionData) as Session;
}

function parseCookies(cookieHeader: string): Record<string, string> {
  return Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [key, ...val] = c.trim().split('=');
      return [key, val.join('=')];
    })
  );
}

function redirectWithError(error: string): Response {
  const url = new URL('https://dylanbochman.com/roadmap');
  url.searchParams.set('auth_error', error);
  return new Response(null, { status: 302, headers: { 'Location': url.toString() } });
}
```

### 6.5: Update Frontend

**Update `KanbanBoard.tsx`:**

```typescript
// Remove SAVE_SECRET - no longer needed
const WORKER_URL = 'https://kanban-save-worker.dbochman.workers.dev';

interface AuthStatus {
  authenticated: boolean;
  username: string | null;
}

// In component:
const [auth, setAuth] = useState<AuthStatus>({ authenticated: false, username: null });

// Check auth status on mount
useEffect(() => {
  fetch(`${WORKER_URL}/auth/status`, { credentials: 'include' })
    .then(res => res.json())
    .then(setAuth)
    .catch(() => setAuth({ authenticated: false, username: null }));
}, []);

const handleLogin = () => {
  window.location.href = `${WORKER_URL}/auth/login`;
};

const handleLogout = async () => {
  await fetch(`${WORKER_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  });
  setAuth({ authenticated: false, username: null });
};

const handleSaveToGitHub = async () => {
  if (!auth.authenticated) return;

  setIsSaving(true);
  try {
    const response = await fetch(`${WORKER_URL}/save`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        board: { ...board, updatedAt: new Date().toISOString() },
        boardId,
      }),
    });

    if (response.ok) {
      setIsDirty(false);
      setSaveSuccess(true);
    }
  } finally {
    setIsSaving(false);
  }
};

// In JSX toolbar:
{auth.authenticated ? (
  <>
    <span className="text-sm text-muted-foreground">
      Logged in as {auth.username}
    </span>
    <Button variant="outline" size="sm" onClick={handleLogout}>
      Logout
    </Button>
    <Button
      variant={isDirty ? 'default' : 'outline'}
      size="sm"
      onClick={handleSaveToGitHub}
      disabled={isSaving || !isDirty}
    >
      {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
      {isSaving ? 'Saving...' : 'Save'}
    </Button>
  </>
) : (
  <Button variant="outline" size="sm" onClick={handleLogin}>
    <Github className="w-4 h-4 mr-1" />
    Login to Save
  </Button>
)}
```

### 6.6: Cleanup

1. Remove `VITE_KANBAN_SAVE_SECRET` from `.env`
2. Remove `SAVE_SECRET` from Cloudflare Worker secrets
3. Remove `X-Save-Secret` header handling from worker

---

## Checklist

### Phase 1: JSON Migration
- [x] Create `public/data/roadmap-board.json` with roadmap data
- [x] Update Kanban page to load from JSON at runtime
- [x] Add dirty state tracking to KanbanBoard
- [x] Test board renders correctly from JSON

### Phase 2: Cloudflare Worker
- [x] Create Cloudflare account
- [x] Create worker project with wrangler
- [x] Implement save endpoint with CORS
- [x] Add `GITHUB_PAT` secret (fine-grained, repo scope)
- [x] Deploy worker

### Phase 3: GitHub Action
- [x] Create `.github/workflows/save-kanban.yml`
- [x] Add boardId whitelist validation
- [x] Add baseUpdatedAt conflict detection
- [x] Verify commit appears in repo

### Phase 4: Frontend Integration
- [x] Add Save button component
- [x] Wire up save handler to worker
- [x] Add saving state indicator (loading spinner, success checkmark)
- [x] Only show button when `isDirty`

### Phase 5: Polish
- [x] Add unsaved changes warning on page leave (beforeunload)
- [x] Handle merge conflicts (baseUpdatedAt comparison)
- [x] Update `.env.example`
- [x] Document in OPERATIONS_MANUAL.md

### Phase 6: GitHub OAuth (Security Enhancement)
- [x] Create GitHub OAuth App in Developer Settings
- [x] Create Cloudflare KV namespace for sessions
- [x] Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to worker
- [x] Update worker code with OAuth endpoints (`/auth/login`, `/auth/callback`, `/auth/status`, `/auth/logout`)
- [x] Add collaborator check in callback handler
- [x] Update KanbanBoard.tsx with auth state and login UI
- [x] Add dynamic `return_to` for localhost testing
- [x] Remove `SAVE_SECRET` from worker secrets
- [x] Test full OAuth flow end-to-end

**Status: COMPLETED** - Merged in PR #127 on 2026-01-15

## Security Considerations

### Current Implementation (GitHub OAuth) ✅

| Concern | Mitigation |
|---------|------------|
| Token exposure | All tokens server-side (PAT, OAuth secrets, session tokens) |
| Unauthorized saves | GitHub OAuth + collaborator check |
| Session hijacking | HttpOnly cookies, Secure flag, SameSite=Lax |
| CSRF | OAuth state parameter validation |
| Path traversal | boardId whitelist in GitHub Action |
| Race conditions | updatedAt timestamp comparison |
| Session expiry | 7-day TTL in Cloudflare KV |

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
