# New Board Creation Feature

## Overview

Enable authenticated users to create new kanban boards from the UI. This extends the Phase 2 markdown-based architecture to support dynamic board creation.

## Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (index.tsx)                                        │
│    VALID_BOARDS = ['roadmap', 'house']  ← hardcoded         │
│    GET /board/:boardId → worker                              │
│                                                              │
│  Worker (index.ts)                                           │
│    ALLOWED_BOARDS = ['roadmap', 'house'] ← hardcoded        │
│    Validates boardId against allowlist                       │
│                                                              │
│  Storage                                                     │
│    content/kanban/{boardId}/_board.md + {cardId}.md         │
│    src/generated/kanban/{boardId}.js (precompiled)          │
└─────────────────────────────────────────────────────────────┘
```

## Design Decision: Static vs Dynamic Board Discovery

### Option A: Dynamic Discovery (Recommended)
Worker discovers boards by scanning `content/kanban/` directory at runtime.

**Pros:**
- No deployment needed after creating a board
- Self-healing: add/remove boards by adding/removing directories
- Single source of truth (filesystem)

**Cons:**
- Extra GitHub API call on first request (can be cached)
- Need to handle case where precompiled JS doesn't exist yet

### Option B: Config File
Maintain a `content/kanban/boards.json` file listing allowed boards.

**Pros:**
- Explicit control over which boards are enabled
- Can add metadata (display order, visibility)

**Cons:**
- Another file to manage
- Still requires commit to add board

### Option C: Keep Static Allowlist (Current)
Boards require code deployment to add.

**Pros:**
- Simple, secure
- No additional API calls

**Cons:**
- Poor UX - can't create boards from UI
- Requires re-deploy for every new board

**Recommendation:** Option A with caching. Discover boards dynamically, cache for 5 minutes, fall back to known boards on error.

## Implementation Plan

### Phase 1: Dynamic Board Discovery (Worker)

#### 1.1 Add Board Discovery Endpoint

```typescript
// GET /boards - List all available boards
async function handleListBoards(request: Request, env: Env): Promise<Response> {
  try {
    const boards = await discoverBoards(env);
    return Response.json({ boards }, { headers: corsHeaders(request) });
  } catch (err) {
    // Fall back to known boards on error
    return Response.json(
      { boards: [{ id: 'roadmap', title: 'Site Roadmap' }, { id: 'house', title: 'House Projects' }] },
      { headers: corsHeaders(request) }
    );
  }
}
```

#### 1.2 Implement Board Discovery

```typescript
interface BoardSummary {
  id: string;
  title: string;
  cardCount: number;
}

async function discoverBoards(env: Env): Promise<BoardSummary[]> {
  // Get contents of content/kanban/ directory
  const contents = await getDirectoryContents('content/kanban', env);

  const boards: BoardSummary[] = [];

  for (const item of contents) {
    if (item.type !== 'dir') continue;
    if (!SAFE_ID.test(item.name)) continue;

    // Check for _board.md (required for valid board)
    const boardMeta = await getFileContent(`content/kanban/${item.name}/_board.md`, env);
    if (!boardMeta) continue;

    // Parse title from frontmatter
    const titleMatch = boardMeta.content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
    const title = titleMatch ? titleMatch[1] : item.name;

    boards.push({
      id: item.name,
      title,
      cardCount: contents.filter(c => c.name.endsWith('.md') && c.name !== '_board.md').length,
    });
  }

  return boards;
}
```

#### 1.3 Remove Static Allowlist

```typescript
// Before
const ALLOWED_BOARDS = ['roadmap', 'house'];
if (!ALLOWED_BOARDS.includes(boardId)) { ... }

// After
// Validate board exists by checking for _board.md
const boardMeta = await getFileContent(`content/kanban/${boardId}/_board.md`, env);
if (!boardMeta) {
  return Response.json({ error: 'board_not_found' }, { status: 404 });
}
```

### Phase 2: Board Creation (Worker)

#### 2.1 Add Create Board Endpoint

```typescript
interface CreateBoardRequest {
  id: string;           // kebab-case board ID
  title: string;        // Display title
  columns?: Array<{     // Optional initial columns (defaults provided)
    id: string;
    title: string;
    description?: string;
  }>;
}

// POST /boards - Create a new board
async function handleCreateBoard(request: Request, env: Env): Promise<Response> {
  const session = await getSession(request, env);
  if (!session) {
    return Response.json({ error: 'not_authenticated' }, { status: 401, headers: corsHeaders(request) });
  }

  const payload: CreateBoardRequest = await request.json();

  // Validate ID format
  if (!SAFE_ID.test(payload.id)) {
    return Response.json({ error: 'invalid_board_id' }, { status: 400, headers: corsHeaders(request) });
  }

  // Check board doesn't already exist
  const existing = await getFileContent(`content/kanban/${payload.id}/_board.md`, env);
  if (existing) {
    return Response.json({ error: 'board_exists' }, { status: 409, headers: corsHeaders(request) });
  }

  // Create board with default or custom columns
  const columns = payload.columns || DEFAULT_COLUMNS;
  const now = new Date().toISOString();

  const boardMarkdown = serializeBoardMeta({
    id: payload.id,
    title: payload.title,
    columns: columns.map(c => ({ ...c, cards: [] })),
    createdAt: now,
    updatedAt: now,
  });

  // Commit the new board
  const headSha = await getHeadSha(env);
  const newSha = await commitFilesAtomic(
    [{ path: `content/kanban/${payload.id}/_board.md`, content: boardMarkdown }],
    [],
    `kanban: create board ${payload.id} (by ${session.githubUsername})`,
    headSha,
    env
  );

  // Trigger precompile
  await triggerDispatch('precompile-content', env);

  return Response.json(
    { success: true, boardId: payload.id, newHeadSha: newSha },
    { status: 201, headers: corsHeaders(request) }
  );
}

const DEFAULT_COLUMNS = [
  { id: 'ideas', title: 'Ideas', description: 'Draft plans and ideas' },
  { id: 'todo', title: 'To Do', description: 'Planned tasks ready to start' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];
```

### Phase 3: Frontend UI

#### 3.1 Board Selector Component

```tsx
// src/components/projects/kanban/BoardSelector.tsx
interface BoardSelectorProps {
  currentBoard: string;
  onBoardChange: (boardId: string) => void;
  onCreateNew: () => void;
}

export function BoardSelector({ currentBoard, onBoardChange, onCreateNew }: BoardSelectorProps) {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch(`${WORKER_URL}/boards`)
      .then(res => res.json())
      .then(data => setBoards(data.boards));
  }, []);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <LayoutGrid className="h-4 w-4" />
          {boards.find(b => b.id === currentBoard)?.title || currentBoard}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {boards.map(board => (
          <DropdownMenuItem
            key={board.id}
            onClick={() => onBoardChange(board.id)}
          >
            {board.title}
            <span className="ml-auto text-muted-foreground text-xs">
              {board.cardCount} cards
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Board...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

#### 3.2 Create Board Modal

```tsx
// src/components/projects/kanban/CreateBoardModal.tsx
interface CreateBoardModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (boardId: string) => void;
}

export function CreateBoardModal({ open, onClose, onCreated }: CreateBoardModalProps) {
  const [title, setTitle] = useState('');
  const [id, setId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate ID from title
  useEffect(() => {
    const generated = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
    setId(generated);
  }, [title]);

  async function handleCreate() {
    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch(`${WORKER_URL}/boards`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create board');
      }

      onCreated(id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Board</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Board Title</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="My Project Board"
            />
          </div>
          <div>
            <Label htmlFor="id">Board ID</Label>
            <Input
              id="id"
              value={id}
              onChange={e => setId(e.target.value)}
              placeholder="my-project-board"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Used in URLs: /projects/kanban?board={id || 'my-board'}
            </p>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!id || !title || isCreating}>
            {isCreating ? 'Creating...' : 'Create Board'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### 3.3 Integrate into KanbanBoard

```tsx
// In KanbanBoard.tsx or index.tsx
const [showCreateModal, setShowCreateModal] = useState(false);

function handleBoardChange(newBoardId: string) {
  // Update URL, which triggers reload via useEffect
  setSearchParams({ board: newBoardId });
}

function handleBoardCreated(newBoardId: string) {
  // Navigate to new board
  setSearchParams({ board: newBoardId });
  toast.success('Board created! It may take a moment to appear.');
}

// In render:
<div className="flex items-center gap-4 mb-4">
  <BoardSelector
    currentBoard={boardId}
    onBoardChange={handleBoardChange}
    onCreateNew={() => setShowCreateModal(true)}
  />
  {/* ... other toolbar items */}
</div>

<CreateBoardModal
  open={showCreateModal}
  onClose={() => setShowCreateModal(false)}
  onCreated={handleBoardCreated}
/>
```

### Phase 4: Frontend Allowlist Removal

#### 4.1 Remove Static Validation

```typescript
// Before
const VALID_BOARDS = ['roadmap', 'house'] as const;
type BoardId = (typeof VALID_BOARDS)[number];

// After
// Board ID is validated by the worker; frontend accepts any valid format
const isValidBoardId = (id: string) => /^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]?$/.test(id);
```

#### 4.2 Handle 404 for Unknown Boards

```tsx
// In loadBoard()
if (apiRes.status === 404) {
  setError('Board not found. It may have been deleted or not yet created.');
  return;
}
```

## Files to Modify

| File | Change |
|------|--------|
| `kanban-save-worker/src/index.ts` | Add `/boards` GET and POST endpoints, remove static allowlist |
| `kanban-save-worker/src/github.ts` | Ensure `getDirectoryContents` works for board discovery |
| `src/components/projects/kanban/index.tsx` | Remove `VALID_BOARDS`, add board selector integration |
| `src/components/projects/kanban/BoardSelector.tsx` | New component |
| `src/components/projects/kanban/CreateBoardModal.tsx` | New component |
| `src/components/projects/kanban/KanbanBoard.tsx` | Add board selector to toolbar |

## Security Considerations

1. **ID Validation**: Strict regex `SAFE_ID` prevents path traversal (`../`, etc.)
2. **Auth Required**: Board creation requires authenticated session (repo collaborator)
3. **Rate Limiting**: Consider adding rate limits to `/boards` POST
4. **No Delete**: Initially, boards cannot be deleted from UI (manual cleanup only)

## Precompile Timing

After board creation, there's a ~30s delay before the precompiled JS is available:

1. Worker creates `_board.md` → commit pushed
2. `repository_dispatch: precompile-content` triggered
3. GitHub Action runs `npm run precompile-kanban`
4. New `{boardId}.js` committed

**Mitigation**:
- Show "Board created, loading..." state
- Worker returns board data directly after creation (no precompile needed for first load)
- Client retries with exponential backoff if precompiled JS not found

## Testing Plan

1. **Unit Tests**
   - Board ID validation (valid, invalid, traversal attempts)
   - Board discovery parsing
   - Markdown serialization for new boards

2. **Integration Tests**
   - Create board → verify files created
   - List boards → verify discovery works
   - Access new board before/after precompile

3. **E2E Tests**
   - Full flow: login → create board → add card → save → reload

## Implementation Changes (Based on Codex Review)

### Worker: handleGetBoard - Add Markdown Fallback

```typescript
async function handleGetBoard(request: Request, boardId: string, env: Env): Promise<Response> {
  // ... validation ...

  const headCommitSha = await getHeadSha(env);

  // Try precompiled first
  const boardFile = await getFileContent(`src/generated/kanban/${boardId}.js`, env);
  if (boardFile) {
    const match = boardFile.content.match(/export const board = (\{[\s\S]*\});/);
    if (match) {
      const board = JSON.parse(match[1]) as KanbanBoard;
      return Response.json({ board, headCommitSha, precompiled: true }, { headers: corsHeaders(request) });
    }
  }

  // Fallback: parse _board.md directly (new boards before precompile)
  const boardMeta = await getFileContent(`content/kanban/${boardId}/_board.md`, env);
  if (!boardMeta) {
    return Response.json({ error: 'board_not_found' }, { status: 404, headers: corsHeaders(request) });
  }

  // Parse minimal board from markdown (columns only, no cards yet)
  const board = parseBoardMetaMarkdown(boardMeta.content);
  return Response.json({ board, headCommitSha, precompiled: false }, { headers: corsHeaders(request) });
}
```

### Worker: handleCreateBoard - Add Retry Logic

```typescript
async function handleCreateBoard(request: Request, env: Env): Promise<Response> {
  // ... auth + validation ...

  const MAX_RETRIES = 2;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    attempt++;

    // Check board doesn't already exist
    const existing = await getFileContent(`content/kanban/${payload.id}/_board.md`, env);
    if (existing) {
      return Response.json({ error: 'board_exists' }, { status: 409, headers: corsHeaders(request) });
    }

    const headSha = await getHeadSha(env);

    try {
      const newSha = await commitFilesAtomic(
        [{ path: `content/kanban/${payload.id}/_board.md`, content: boardMarkdown }],
        [],
        `kanban: create board ${payload.id} (by ${session.githubUsername})`,
        headSha,
        env
      );

      await triggerDispatch('precompile-content', env);
      return Response.json({ success: true, boardId: payload.id, newHeadSha: newSha }, { status: 201 });

    } catch (err) {
      if (err instanceof GitHubApiError && err.status === 409 && attempt < MAX_RETRIES) {
        // Race condition: another commit happened. Retry.
        continue;
      }
      throw err;
    }
  }

  return Response.json({ error: 'conflict', message: 'Too many concurrent modifications' }, { status: 409 });
}
```

### Worker: Add Column/Size Validation

```typescript
const MAX_COLUMNS = 10;
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 5000;

function validateBoard(board: KanbanBoard): string | null {
  // Validate column count
  if (board.columns.length > MAX_COLUMNS) {
    return `Too many columns (max ${MAX_COLUMNS})`;
  }

  // Validate column IDs
  const columnIds = new Set<string>();
  for (const col of board.columns) {
    if (!SAFE_ID.test(col.id)) {
      return `Invalid column ID: ${col.id}`;
    }
    if (columnIds.has(col.id)) {
      return `Duplicate column ID: ${col.id}`;
    }
    columnIds.add(col.id);

    if (col.title.length > MAX_TITLE_LENGTH) {
      return `Column title too long: ${col.id}`;
    }
  }

  // Validate card fields
  for (const col of board.columns) {
    for (const card of col.cards) {
      if (card.title.length > MAX_TITLE_LENGTH) {
        return `Card title too long: ${card.id}`;
      }
      if (card.description && card.description.length > MAX_DESCRIPTION_LENGTH) {
        return `Card description too long: ${card.id}`;
      }
    }
  }

  return null;
}
```

## Rollout Strategy

1. **Phase 1**: Deploy discovery endpoint, keep static allowlist as fallback
2. **Phase 2**: Add create endpoint (feature-flagged)
3. **Phase 3**: Add UI components behind feature flag
4. **Phase 4**: Enable for all authenticated users
5. **Phase 5**: Remove fallback allowlist

## Codex Review Findings (2026-01-23)

### Race Conditions

1. **False 409 on board creation**: `commitFilesAtomic` does compare-and-swap on HEAD, so unrelated concurrent commits cause false conflicts.
   - **Fix**: On 409, re-fetch HEAD, re-check `_board.md` existence, retry once. If board now exists, return `board_exists`.

2. **New boards 404 until precompile**: `GET /board/:id` only reads precompiled JS.
   - **Fix**: Fallback to parsing `content/kanban/${id}/_board.md` directly when precompiled file missing. Return `{ board, precompiled: false }`.

### Validation Gaps

3. **Missing column ID validation**: Worker validates board/card IDs but not column IDs.
   - **Fix**: Validate `columns[].id` with `SAFE_ID`, ensure unique column IDs, enforce max columns (~10).

4. **No size limits**: No max lengths on title, description, etc.
   - **Fix**: Enforce max lengths (title: 100, description: 5000, column count: 10).

### Discovery Bug (in Plan)

5. **cardCount bug**: Plan's `cardCount` uses root `content/kanban` listing, giving same count for all boards.
   - **Fix**: List `content/kanban/${boardId}` per board and count `*.md` files (excluding `_board.md`).

### API Design

6. **Response consistency**: `/boards` and POST `/boards` should include `headCommitSha`, timestamps, and `precompiled` status.

### Security

7. **Visibility for private boards**: Current design makes all boards public.
   - **Future**: Add `visibility` field to `_board.md`, filter in discovery, require auth for private board reads.

## Open Questions - Codex Recommendations

| Question | Recommendation |
|----------|----------------|
| Custom columns in modal? | **Start with defaults only.** Add "Edit columns after creation" flow later. If custom, enforce `SAFE_ID`, unique IDs, max 8-10 columns. |
| Board deletion? | **Not in v1.** Later: soft-delete to `content/kanban/_archived/{id}` with `archivedAt` timestamp. Server-side only until audit/undo exists. |
| Board admin separate from collaborator? | **No.** Collaborator is strong gate. Later: add `owners: []` to `_board.md` if needed. Avoid OAuth scope expansion. |
| Precompile delay UX? | **Optimistic UI with server fallback.** Return board metadata immediately, poll `/board/:id` with exponential backoff until `precompiled: true`. Avoid hard 404s. |
| Visibility settings? | **Only if willing to gate GETs.** Add `visibility` to `_board.md`, filter `/boards`, require session for `visibility=private`. |
