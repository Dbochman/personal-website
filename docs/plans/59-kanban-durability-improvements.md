# Kanban System Durability Improvements

## Overview

Address validation gaps and edge cases identified in the architecture health review. Current durability score: 7.5/10, target: 9/10.

## Current Issues

### 🔴 Critical

1. **YAML Boundary Vulnerability**: If a card description starts with `---`, gray-matter misinterprets it as a frontmatter boundary, corrupting the parse.

2. **No Schema Versioning**: Format changes would break all existing boards with no migration path.

### 🟠 High Priority

3. **Hardcoded Values**: `REPO_OWNER`, `REPO_NAME`, `ALLOWED_ORIGINS` are hardcoded in worker, breaking if repo moves.

4. **Missing Validation**: Labels, summary, and archiveReason fields lack length/count limits.

5. **Incomplete History Tracking**: Title changes and checklist modifications aren't recorded.

6. **deletedCardIds Not Persisted**: Page refresh loses pending deletions, causing user confusion.

## Implementation Plan

### Phase 1: Critical Fixes

#### 1.1 Fix YAML Boundary Vulnerability

**Problem**: Description content starting with `---` breaks YAML parsing.

**Solution**: Escape `---` at the start of lines in the description body.

```typescript
// kanban-save-worker/src/markdown.ts
function serializeCard(card: KanbanCard, columnId: string): string {
  // ... frontmatter ...

  let description = card.description || '';

  // Escape YAML document boundaries in description
  // Replace lines that are exactly "---" or start with "---" followed by whitespace
  description = description.replace(/^---(\s|$)/gm, '\\---$1');

  return `---\n${yaml}\n---\n\n${description}\n`;
}
```

**Deserialize side** (precompile-kanban.js):
```javascript
// After extracting description from gray-matter
let description = content.trim();
// Unescape YAML boundaries
description = description.replace(/^\\---/gm, '---');
```

**Test case**:
```markdown
---
id: test-yaml-boundary
title: Test Card
column: ideas
createdAt: "2026-01-23T00:00:00.000Z"
---

\---
This description starts with what looks like a YAML boundary.
\---
And has another one here.
```

#### 1.2 Add Schema Versioning

**Solution**: Add `schemaVersion` to `_board.md` frontmatter.

```typescript
// precompile-kanban.js - Update schema
const KanbanBoardMetaSchema = z.object({
  schemaVersion: z.number().int().min(1).default(1),
  id: z.string().min(1),
  title: z.string().min(1),
  // ... rest unchanged
});
```

**Migration**: Add `schemaVersion: 1` to existing boards:
```bash
# One-time migration script
for board in content/kanban/*/; do
  sed -i '' '2i\
schemaVersion: 1
' "${board}_board.md"
done
```

**Future-proofing**: When schema changes:
1. Increment version in new code
2. Add migration function for old → new
3. Precompile detects version mismatch, runs migration

### Phase 2: Environment Variable Extraction

#### 2.1 Worker Configuration

**Current**:
```typescript
const REPO_OWNER = 'Dbochman';
const REPO_NAME = 'personal-website';
const ALLOWED_ORIGINS = ['https://dylanbochman.com', ...];
```

**Updated**:
```typescript
// wrangler.toml
[vars]
REPO_OWNER = "Dbochman"
REPO_NAME = "personal-website"
ALLOWED_ORIGINS = "https://dylanbochman.com,https://www.dylanbochman.com,http://localhost:5173"

// index.ts
interface Env {
  REPO_OWNER: string;
  REPO_NAME: string;
  ALLOWED_ORIGINS: string;
  // ... existing secrets
}

function getAllowedOrigins(env: Env): string[] {
  return env.ALLOWED_ORIGINS.split(',').map(s => s.trim());
}
```

#### 2.2 Frontend Configuration

**Current**:
```typescript
const WORKER_URL = 'https://api.dylanbochman.com';
```

**Updated**:
```typescript
// Use Vite env vars
const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://api.dylanbochman.com';
```

Add to `.env.example`:
```
VITE_WORKER_URL=https://api.dylanbochman.com
```

### Phase 3: Validation Improvements

#### 3.1 Label Validation

```typescript
// precompile-kanban.js
const MAX_LABEL_LENGTH = 50;
const MAX_LABEL_COUNT = 20;

const KanbanCardFrontmatterSchema = z.object({
  // ... existing fields
  labels: z.array(z.string().max(MAX_LABEL_LENGTH))
    .max(MAX_LABEL_COUNT)
    .default([])
    .transform(labels => [...new Set(labels)]), // Deduplicate
});
```

```typescript
// kanban-save-worker/src/index.ts - validateBoard()
function validateLabels(labels: string[]): string | null {
  if (labels.length > MAX_LABEL_COUNT) {
    return `Too many labels (max ${MAX_LABEL_COUNT})`;
  }
  for (const label of labels) {
    if (label.length > MAX_LABEL_LENGTH) {
      return `Label too long: "${label.slice(0, 20)}..." (max ${MAX_LABEL_LENGTH})`;
    }
  }
  const unique = new Set(labels);
  if (unique.size !== labels.length) {
    return 'Duplicate labels detected';
  }
  return null;
}
```

#### 3.2 Summary and ArchiveReason Validation

```typescript
// precompile-kanban.js
const MAX_SUMMARY_LENGTH = 200;
const MAX_ARCHIVE_REASON_LENGTH = 500;

const KanbanCardFrontmatterSchema = z.object({
  // ... existing
  summary: z.string().max(MAX_SUMMARY_LENGTH).optional(),
  archiveReason: z.string().max(MAX_ARCHIVE_REASON_LENGTH).optional(),
}).superRefine((data, ctx) => {
  // If archiveReason exists, archivedAt must also exist
  if (data.archiveReason && !data.archivedAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'archiveReason requires archivedAt to be set',
      path: ['archiveReason'],
    });
  }
});
```

### Phase 4: History Tracking Improvements

#### 4.1 Title Change Tracking

```typescript
// src/components/projects/kanban/CardEditorModal.tsx
function handleSave() {
  const changes: CardChange[] = [];

  if (editedCard.title !== originalCard.title) {
    changes.push({
      type: 'title',
      timestamp: new Date().toISOString(),
      from: originalCard.title,
      to: editedCard.title,
    });
  }

  // ... existing column change logic

  onSave({ ...editedCard, history: [...(editedCard.history || []), ...changes] });
}
```

Update schema to support title changes:
```typescript
const CardChangeSchema = z.object({
  type: z.enum(['column', 'title', 'description', 'labels', 'checklist']),
  timestamp: isoDateString,
  // For column changes
  columnId: z.string().optional(),
  columnTitle: z.string().optional(),
  // For field changes
  from: z.union([z.string(), z.array(z.string())]).optional(),
  to: z.union([z.string(), z.array(z.string())]).optional(),
  // For checklist changes
  action: z.enum(['add', 'remove', 'complete', 'uncomplete']).optional(),
  itemId: z.string().optional(),
  itemText: z.string().optional(),
});
```

#### 4.2 Checklist Change Tracking

```typescript
// Track checklist modifications
function trackChecklistChange(
  history: CardChange[],
  action: 'add' | 'remove' | 'complete' | 'uncomplete',
  item: ChecklistItem
): CardChange[] {
  return [
    ...history,
    {
      type: 'checklist',
      timestamp: new Date().toISOString(),
      action,
      itemId: item.id,
      itemText: item.text,
    },
  ];
}
```

### Phase 5: deletedCardIds Persistence

#### 5.1 LocalStorage Backup

```typescript
// src/components/projects/kanban/KanbanBoard.tsx

const DELETED_CARDS_KEY = 'kanban-deleted-cards';

// On component mount, restore any pending deletions
useEffect(() => {
  const stored = localStorage.getItem(`${DELETED_CARDS_KEY}-${boardId}`);
  if (stored) {
    try {
      const ids = JSON.parse(stored);
      setDeletedCardIds(ids);
    } catch {
      localStorage.removeItem(`${DELETED_CARDS_KEY}-${boardId}`);
    }
  }
}, [boardId]);

// When deleting a card, persist to localStorage
function handleDeleteCard(cardId: string) {
  setDeletedCardIds(prev => {
    const next = [...prev, cardId];
    localStorage.setItem(`${DELETED_CARDS_KEY}-${boardId}`, JSON.stringify(next));
    return next;
  });
  // ... rest of delete logic
}

// After successful save, clear localStorage
async function handleSave() {
  // ... save logic
  if (response.ok) {
    localStorage.removeItem(`${DELETED_CARDS_KEY}-${boardId}`);
    setDeletedCardIds([]);
  }
}
```

#### 5.2 Recovery UI

```typescript
// Show warning if there are unsaved deletions on mount
useEffect(() => {
  if (deletedCardIds.length > 0 && !isDirty) {
    toast.warning(
      `${deletedCardIds.length} card(s) were pending deletion. Save to complete.`,
      { duration: 5000 }
    );
  }
}, []);
```

## Files to Modify

| File | Changes |
|------|---------|
| `kanban-save-worker/src/markdown.ts` | Escape YAML boundaries in description |
| `kanban-save-worker/src/index.ts` | Add validation, use env vars |
| `kanban-save-worker/wrangler.toml` | Add env var definitions |
| `scripts/precompile-kanban.js` | Unescape boundaries, add schema version, validation |
| `src/components/projects/kanban/KanbanBoard.tsx` | deletedCardIds persistence |
| `src/components/projects/kanban/CardEditorModal.tsx` | Title change tracking |
| `content/kanban/*/_board.md` | Add schemaVersion: 1 |
| `.env.example` | Document VITE_WORKER_URL |

## Testing Plan

### Unit Tests

- [ ] YAML boundary escaping/unescaping round-trips correctly
- [ ] Schema version validation rejects version 0 or missing
- [ ] Label validation catches duplicates, length, count violations
- [ ] History entries validate correctly for all types

### Integration Tests

- [ ] Create card with `---` in description → save → reload → description intact
- [ ] Change card title → history shows title change entry
- [ ] Delete card → refresh page → deletion persisted → save → card gone
- [ ] Deploy worker with env vars → all endpoints work

### E2E Tests

- [ ] Full workflow: create board → add cards → edit → delete → save → verify

## Rollout Plan

1. **Phase 1** (Critical): Fix YAML vulnerability + schema versioning
2. **Phase 2** (Config): Extract env vars, deploy worker
3. **Phase 3** (Validation): Add field validation, update precompile
4. **Phase 4** (History): Title + checklist tracking
5. **Phase 5** (Persistence): deletedCardIds localStorage

Each phase is independently deployable and testable.

## Success Metrics

- [ ] Durability score: 7.5 → 9.0
- [ ] Zero data loss from YAML parsing edge cases
- [ ] All validation errors caught before save
- [ ] Complete audit trail of card modifications
- [ ] Graceful recovery from interrupted sessions

---

## Critical Review & Strengthening

### Issue 1: YAML Boundary Escaping Approach

**Problem with proposed solution**: Backslash escaping (`\---`) is not a standard YAML escape sequence. gray-matter passes content through as-is after the second `---`, so the backslash would appear literally in the description.

**Better approach**: Use HTML entity or a custom marker that's unambiguous:

```typescript
// Option A: Use a zero-width space (invisible but breaks the pattern)
description = description.replace(/^---/gm, '\u200B---');

// Option B: Use a comment-style marker
description = description.replace(/^---/gm, '<!---ESCAPED--->---');

// Option C: Store description in frontmatter as multiline string (safest)
// This avoids the body entirely for descriptions with special content
```

**Recommended**: Option C - Move description into frontmatter using YAML multiline syntax:

```yaml
---
id: test-card
title: Test
description: |
  ---
  This is safe because it's inside the frontmatter block
  ---
  And gray-matter handles it correctly
createdAt: "2026-01-23T00:00:00.000Z"
---
```

This eliminates the body entirely for cards with descriptions, making parsing deterministic.

### Issue 2: localStorage Multi-Tab Race Condition

**Problem**: Two tabs open on same board:
1. Tab A deletes card-1, writes `["card-1"]` to localStorage
2. Tab B deletes card-2, writes `["card-2"]` to localStorage (overwrites!)
3. Tab A refreshes, sees only card-2 in deletedCardIds
4. User thinks card-1 deletion was saved, but it wasn't

**Solution**: Use `BroadcastChannel` API for cross-tab synchronization:

```typescript
const channel = new BroadcastChannel('kanban-sync');

// When deleting a card
function handleDeleteCard(cardId: string) {
  setDeletedCardIds(prev => {
    const next = [...prev, cardId];
    localStorage.setItem(key, JSON.stringify(next));
    channel.postMessage({ type: 'delete', boardId, cardId });
    return next;
  });
}

// Listen for changes from other tabs
useEffect(() => {
  const handler = (event: MessageEvent) => {
    if (event.data.type === 'delete' && event.data.boardId === boardId) {
      setDeletedCardIds(prev =>
        prev.includes(event.data.cardId) ? prev : [...prev, event.data.cardId]
      );
    }
  };
  channel.addEventListener('message', handler);
  return () => channel.removeEventListener('message', handler);
}, [boardId]);
```

**Alternative**: Use `storage` event listener (fires when another tab modifies localStorage):

```typescript
useEffect(() => {
  const handler = (e: StorageEvent) => {
    if (e.key === `${DELETED_CARDS_KEY}-${boardId}` && e.newValue) {
      setDeletedCardIds(JSON.parse(e.newValue));
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}, [boardId]);
```

### Issue 3: Secrets vs Vars in wrangler.toml

**Verify these stay as secrets** (set via `wrangler secret put`, not in toml):
- `GITHUB_TOKEN` - PAT for repo access
- `SESSION_SECRET` - Cookie signing key
- `OAUTH_CLIENT_SECRET` - GitHub OAuth secret

**Safe for `[vars]`** (non-sensitive):
- `REPO_OWNER` - Public info
- `REPO_NAME` - Public info
- `ALLOWED_ORIGINS` - Public info (visible in CORS headers anyway)

**Add explicit documentation**:
```toml
# wrangler.toml
# NOTE: Sensitive values must be set via `wrangler secret put`:
#   - GITHUB_TOKEN
#   - SESSION_SECRET
#   - OAUTH_CLIENT_SECRET

[vars]
REPO_OWNER = "Dbochman"
REPO_NAME = "personal-website"
ALLOWED_ORIGINS = "https://dylanbochman.com,https://www.dylanbochman.com,http://localhost:5173"
```

### Issue 4: History Schema Backwards Compatibility

**Problem**: Adding new types to `CardChangeSchema.type` enum breaks old precompile reading new data.

**Solution**: Use `.passthrough()` or make type more permissive:

```typescript
// Option A: Allow unknown types (forward-compatible)
const CardChangeSchema = z.object({
  type: z.string(), // Not an enum - allows future types
  timestamp: isoDateString,
  // ... rest with .optional() for all fields
}).passthrough(); // Allow unknown fields

// Option B: Version the history entries themselves
const CardChangeSchema = z.discriminatedUnion('version', [
  z.object({ version: z.literal(1), type: z.enum(['column']), ... }),
  z.object({ version: z.literal(2), type: z.enum(['column', 'title', 'checklist']), ... }),
]);
```

**Recommended**: Option A with graceful degradation. Unknown history types are preserved but not rendered in UI until code is updated.

### Issue 5: Unbounded History Growth

**Problem**: History array grows forever with no pruning.

**Solution**: Add optional history compaction:

```typescript
const MAX_HISTORY_ENTRIES = 100;

function compactHistory(history: CardChange[]): CardChange[] {
  if (history.length <= MAX_HISTORY_ENTRIES) return history;

  // Keep first entry (creation), last N-1 entries
  return [history[0], ...history.slice(-(MAX_HISTORY_ENTRIES - 1))];
}
```

**Alternative**: Archive old history entries to a separate file when saving.

### Issue 6: Stale deletedCardIds in localStorage

**Problem**: If a card was already deleted (by another user or in another session), localStorage might contain stale IDs that no longer exist in the board.

**Solution**: Validate against current board state on load:

```typescript
useEffect(() => {
  const stored = localStorage.getItem(`${DELETED_CARDS_KEY}-${boardId}`);
  if (stored && board) {
    const storedIds = JSON.parse(stored);
    const existingCardIds = new Set(
      board.columns.flatMap(col => col.cards.map(c => c.id))
    );
    // Only keep IDs that still exist in the board
    const validIds = storedIds.filter((id: string) => existingCardIds.has(id));
    if (validIds.length !== storedIds.length) {
      // Some were already deleted, update localStorage
      localStorage.setItem(`${DELETED_CARDS_KEY}-${boardId}`, JSON.stringify(validIds));
    }
    setDeletedCardIds(validIds);
  }
}, [boardId, board]);
```

### Issue 7: Validation Inconsistency (Dedup in Transform vs Reject)

**Problem**: Precompile uses `.transform()` to deduplicate labels silently, but worker rejects duplicates with an error. Inconsistent behavior.

**Solution**: Standardize on one approach:

```typescript
// Option A: Both silently deduplicate (more lenient)
// Precompile: .transform(labels => [...new Set(labels)])
// Worker: deduplicate before validation

// Option B: Both reject duplicates (more strict)
// Precompile: .refine(labels => new Set(labels).size === labels.length, 'Duplicate labels')
// Worker: reject with error
```

**Recommended**: Option A (silent dedup) for labels specifically, since duplicates are a data quality issue, not a security issue.

### Issue 8: Missing Error Recovery for Partial Saves

**Problem**: If worker commits markdown but `triggerDispatch` fails, precompiled JS won't update.

**Solution**: Add retry logic and monitoring:

```typescript
// In worker save handler
try {
  await triggerDispatch('precompile-content', env);
} catch (err) {
  // Log error but don't fail the save
  console.error('Failed to trigger precompile:', err);
  // Return warning in response
  return Response.json({
    success: true,
    newHeadSha,
    warning: 'Save succeeded but precompile trigger failed. Board may take longer to update.',
  });
}
```

---

## Updated Implementation Order

Based on review findings, recommended order:

1. **Phase 1a**: Move description into frontmatter (avoids YAML boundary issue entirely)
2. **Phase 1b**: Add schemaVersion with forward-compatible history schema
3. **Phase 2**: Environment variables (straightforward)
4. **Phase 3**: Validation with consistent dedup approach
5. **Phase 4**: History tracking with compaction limit
6. **Phase 5**: localStorage with multi-tab sync and stale ID cleanup

## Risk Mitigations Added

| Risk | Original Plan | Strengthened |
|------|---------------|--------------|
| YAML parsing | Backslash escape | Move to frontmatter |
| Multi-tab conflict | Not addressed | BroadcastChannel sync |
| Secret exposure | Implicit | Explicit documentation |
| Schema evolution | Breaking change | Forward-compatible |
| History growth | Unbounded | Compaction at 100 entries |
| Stale deletions | Not addressed | Validate against board |
| Partial save | Not addressed | Warning on dispatch failure |

---

## Codex AI Review (2026-01-23)

Automated review via `codex exec` identified additional issues:

### 🔴 Critical

**Backslash escaping is lossy**
> "Escaping `---` in descriptions creates an ambiguous encoding layer; any user-entered line that legitimately begins with `\---` will be silently altered on deserialize, corrupting content."

**Recommendation**: Use base64 encoding, CDATA-style blocks, or length-delimited encoding instead of backslash escaping. Or move description entirely into frontmatter (already proposed in strengthening section).

### 🟠 High

**1. ALLOWED_ORIGINS parsing vulnerability**
> "Comma-split with no validation could yield empty strings; a trailing comma yields `""` and may accidentally allow the `null` origin if CORS check does loose comparisons."

**Fix**:
```typescript
function getAllowedOrigins(env: Env): string[] {
  return env.ALLOWED_ORIGINS
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.startsWith('http')); // Validate format
}
```

**2. sed migration is fragile**
> "Assumes file structure (no BOM, frontmatter at line 1). Use parser-based migration instead of line insertion."

**Fix**: Use gray-matter to read, modify, and rewrite:
```javascript
const matter = require('gray-matter');
const content = fs.readFileSync(boardPath, 'utf-8');
const { data, content: body } = matter(content);
data.schemaVersion = 1;
fs.writeFileSync(boardPath, matter.stringify(body, data));
```

**3. `...` is also a YAML document boundary**
> "gray-matter/js-yaml may treat `...` as end-of-document. If description begins with `...`, similar corruption could occur."

**Fix**: Handle both `---` and `...` in boundary escaping/detection, or use frontmatter-only approach.

### 🟡 Medium

**1. Validation divergence (labels)**
> "Precompile silently removes duplicates while worker rejects them. Creates client/server inconsistency."

**Decision**: Standardize on silent dedup in both places (already noted in strengthening).

**2. schemaVersion default masks missing field**
> "`.default(1)` means old files without the field parse as version 1, skipping migration detection."

**Fix**: Don't use default, detect explicitly:
```typescript
const KanbanBoardMetaSchema = z.object({
  schemaVersion: z.number().int().min(1).optional(), // No default
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

### Open Questions from Codex

1. Does gray-matter/js-yaml treat `...` as document end? **→ Test and confirm**
2. How does CORS checking handle empty/invalid origins today? **→ Audit current implementation**

---

## Final Implementation Checklist

Based on all reviews (manual + Codex), the implementation must:

- [ ] Use frontmatter for description (avoids all YAML boundary issues)
- [ ] Handle both `---` AND `...` if keeping body content
- [ ] Validate ALLOWED_ORIGINS entries (no empty strings, must start with http)
- [ ] Use gray-matter for schema migration (not sed)
- [ ] Detect missing schemaVersion explicitly (no default)
- [ ] Standardize on silent label dedup (both precompile and worker)
- [ ] Add BroadcastChannel for multi-tab deletedCardIds sync
- [ ] Validate deletedCardIds against current board on load
- [ ] Add history compaction at 100 entries
- [ ] Return warning (not failure) if dispatch fails after save
