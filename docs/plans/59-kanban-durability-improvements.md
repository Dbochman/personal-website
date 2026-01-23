# Kanban System Durability Improvements

**Goal**: Improve durability score from 7.5/10 → 9.0/10

---

## Prioritized Task List

### 🔴 P0: Critical (Data Loss Risk)

#### 1. Move description into YAML frontmatter
**Why**: Descriptions in markdown body can corrupt parsing if they contain `---` or `...` (YAML document boundaries). Backslash escaping is lossy and ambiguous.

**Implementation**:
```yaml
# Before (vulnerable)
---
id: card-1
title: My Card
---
Description here could contain --- and break parsing

# After (safe)
---
id: card-1
title: My Card
description: |
  Description here can contain --- safely
  Because it's inside the frontmatter block
---
```

**Files**: `kanban-save-worker/src/markdown.ts`, `scripts/precompile-kanban.js`

---

#### 2. Add schema versioning with explicit detection
**Why**: Format changes would break all existing boards. Need migration path.

**Implementation**:
```typescript
// precompile-kanban.js
const KanbanBoardMetaSchema = z.object({
  schemaVersion: z.number().int().min(1).optional(), // No .default()
  // ...
}).superRefine((data, ctx) => {
  if (data.schemaVersion === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Missing schemaVersion - run migration',
      path: ['schemaVersion'],
    });
  }
});
```

**Migration** (use gray-matter, not sed):
```javascript
const matter = require('gray-matter');
const { data, content } = matter(fs.readFileSync(boardPath, 'utf-8'));
data.schemaVersion = 1;
fs.writeFileSync(boardPath, matter.stringify(content, data));
```

**Files**: `scripts/precompile-kanban.js`, `content/kanban/*/_board.md`

---

### 🟠 P1: High (Security/Reliability)

#### 3. Validate ALLOWED_ORIGINS parsing
**Why**: Comma-split without validation could yield empty strings, potentially allowing null origin in CORS.

**Implementation**:
```typescript
// kanban-save-worker/src/index.ts
function getAllowedOrigins(env: Env): string[] {
  return env.ALLOWED_ORIGINS
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.startsWith('http'));
}
```

**Files**: `kanban-save-worker/src/index.ts`

---

#### 4. Extract hardcoded values to environment variables
**Why**: Repo moves or domain changes would require code changes.

**Implementation**:
```toml
# wrangler.toml
# NOTE: Secrets (GITHUB_TOKEN, SESSION_SECRET, OAUTH_CLIENT_SECRET)
# must be set via `wrangler secret put`, NOT here.

[vars]
REPO_OWNER = "Dbochman"
REPO_NAME = "personal-website"
ALLOWED_ORIGINS = "https://dylanbochman.com,https://www.dylanbochman.com,http://localhost:5173"
```

```typescript
// Frontend: use Vite env vars
const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://api.dylanbochman.com';
```

**Files**: `kanban-save-worker/wrangler.toml`, `kanban-save-worker/src/index.ts`, `.env.example`

---

#### 5. Make history schema forward-compatible
**Why**: Adding new history types (title, checklist) would break older precompile versions.

**Implementation**:
```typescript
// Use string instead of enum, allow unknown fields
const CardChangeSchema = z.object({
  type: z.string(), // Not enum - allows future types
  timestamp: isoDateString,
  columnId: z.string().optional(),
  columnTitle: z.string().optional(),
  from: z.union([z.string(), z.array(z.string())]).optional(),
  to: z.union([z.string(), z.array(z.string())]).optional(),
  action: z.string().optional(),
  itemId: z.string().optional(),
  itemText: z.string().optional(),
}).passthrough();
```

**Files**: `scripts/precompile-kanban.js`

---

### 🟡 P2: Medium (Data Quality)

#### 6. Add field validation limits
**Why**: Unbounded strings could cause storage/display issues.

| Field | Limit |
|-------|-------|
| `labels[]` | max 50 chars each, max 20 labels |
| `summary` | max 200 chars |
| `archiveReason` | max 500 chars |

**Implementation**:
```typescript
// Standardize on silent dedup (both precompile and worker)
labels: z.array(z.string().max(50))
  .max(20)
  .default([])
  .transform(labels => [...new Set(labels)]),

summary: z.string().max(200).optional(),
archiveReason: z.string().max(500).optional(),
```

**Files**: `scripts/precompile-kanban.js`, `kanban-save-worker/src/index.ts`

---

#### 7. Add history compaction
**Why**: History arrays grow unbounded, eventually causing performance issues.

**Implementation**:
```typescript
const MAX_HISTORY_ENTRIES = 100;

function compactHistory(history: CardChange[]): CardChange[] {
  if (history.length <= MAX_HISTORY_ENTRIES) return history;
  // Keep first (creation) + last N-1 entries
  return [history[0], ...history.slice(-(MAX_HISTORY_ENTRIES - 1))];
}
```

**Files**: `kanban-save-worker/src/markdown.ts`

---

#### 8. Track title changes in history
**Why**: No audit trail when card titles are modified.

**Implementation**:
```typescript
// CardEditorModal.tsx
if (editedCard.title !== originalCard.title) {
  changes.push({
    type: 'title',
    timestamp: new Date().toISOString(),
    from: originalCard.title,
    to: editedCard.title,
  });
}
```

**Files**: `src/components/projects/kanban/CardEditorModal.tsx`

---

### 🟢 P3: Low (UX Polish)

#### 9. Persist deletedCardIds with multi-tab sync
**Why**: Page refresh loses pending deletions; multiple tabs can overwrite each other.

**Implementation**:
```typescript
// Use storage event for cross-tab sync
useEffect(() => {
  const handler = (e: StorageEvent) => {
    if (e.key === `kanban-deleted-cards-${boardId}` && e.newValue) {
      setDeletedCardIds(JSON.parse(e.newValue));
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}, [boardId]);

// Validate against board on load (remove stale IDs)
const existingCardIds = new Set(board.columns.flatMap(col => col.cards.map(c => c.id)));
const validIds = storedIds.filter(id => existingCardIds.has(id));
```

**Files**: `src/components/projects/kanban/KanbanBoard.tsx`

---

#### 10. Return warning (not failure) on dispatch error
**Why**: If markdown commits but precompile dispatch fails, user sees error but data is safe.

**Implementation**:
```typescript
try {
  await triggerDispatch('precompile-content', env);
} catch (err) {
  console.error('Failed to trigger precompile:', err);
  return Response.json({
    success: true,
    newHeadSha,
    warning: 'Save succeeded but precompile may be delayed.',
  });
}
```

**Files**: `kanban-save-worker/src/index.ts`

---

## Files Summary

| File | Tasks |
|------|-------|
| `kanban-save-worker/src/markdown.ts` | 1, 7 |
| `kanban-save-worker/src/index.ts` | 3, 4, 6, 10 |
| `kanban-save-worker/wrangler.toml` | 4 |
| `scripts/precompile-kanban.js` | 1, 2, 5, 6 |
| `src/components/projects/kanban/KanbanBoard.tsx` | 9 |
| `src/components/projects/kanban/CardEditorModal.tsx` | 8 |
| `content/kanban/*/_board.md` | 2 |
| `.env.example` | 4 |

---

## Testing Checklist

- [ ] Card with `---` in description saves and loads correctly
- [ ] Card with `...` in description saves and loads correctly
- [ ] Missing schemaVersion triggers migration error
- [ ] Invalid ALLOWED_ORIGINS entry is rejected
- [ ] Labels are silently deduplicated (not rejected)
- [ ] History > 100 entries is compacted on save
- [ ] Title change creates history entry
- [ ] Deleted cards persist across page refresh
- [ ] Multi-tab deletion doesn't lose data
- [ ] Dispatch failure returns warning, not error

---

## Success Criteria

- [ ] Durability score: 7.5 → 9.0
- [ ] Zero data loss from YAML edge cases
- [ ] All validation errors caught before save
- [ ] Complete audit trail of modifications
- [ ] Graceful multi-tab and error recovery
