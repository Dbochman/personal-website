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
