# Kanban URL Simplification

## Overview

Remove URL state persistence from the kanban board. Now that authenticated users can save to GitHub, there's no need to compress board state into the URL. This results in clean, shareable URLs.

## Current State

```
/projects/kanban?board=roadmap&board=NoIgygLgpgJiBcIC...2000+ chars
```

The `useKanbanPersistence` hook uses lz-string to compress entire board state into URL on every change.

## Target State

```
/projects/kanban?board=roadmap
/projects/kanban?board=roadmap&card=error-budget-burndown
/projects/kanban?board=house&card=kitchen-reno
```

Clean URLs with optional deep linking to specific cards.

## Implementation

### 1. Delete useKanbanPersistence Hook

Remove `src/components/projects/kanban/useKanbanPersistence.ts` entirely.

### 2. Simplify KanbanBoard Component

```typescript
// Before
const { getInitialBoard, saveBoard: saveBoardToUrl, clearBoard } = useKanbanPersistence({
  defaultBoard: initialBoard,
  boardKey,
});
const [board, setBoard] = useState<BoardType>(() => getInitialBoard());

// After
const [board, setBoard] = useState<BoardType>(initialBoard);
```

Remove:
- `saveBoardToUrl` calls in `updateBoard`
- `clearBoard` in `handleReset`
- `boardKey` prop (no longer needed)

### 3. Add Deep Link Support

```typescript
// In KanbanBoard.tsx
interface KanbanBoardProps {
  initialBoard: BoardType;
  boardId: string;
  initialCardId?: string; // New: card to open on mount
}

// Read card param in index.tsx
const cardId = searchParams.get('card');

// Pass to KanbanBoard
<KanbanBoard
  initialBoard={board}
  boardId={boardId}
  initialCardId={cardId}
/>

// In KanbanBoard, open card editor on mount
useEffect(() => {
  if (initialCardId) {
    const card = findCard(initialCardId);
    if (card) {
      handleEditCard(card);
    }
  }
}, [initialCardId]);
```

### 4. Update Share Button

```typescript
// Before: copies full URL with compressed state
const handleShare = async () => {
  await navigator.clipboard.writeText(window.location.href);
};

// After: copies clean URL (just board param)
const handleShare = async () => {
  const url = new URL(window.location.href);
  url.search = `?board=${boardId}`;
  await navigator.clipboard.writeText(url.toString());
};
```

### 5. Add "Copy Card Link" to Card Context Menu

In `KanbanCard.tsx` or card dropdown menu:

```typescript
const handleCopyCardLink = () => {
  const url = new URL(window.location.href);
  url.search = `?board=${boardId}&card=${card.id}`;
  navigator.clipboard.writeText(url.toString());
};
```

### 6. Remove lz-string Dependency

```bash
npm uninstall lz-string
npm uninstall @types/lz-string  # if exists
```

## Files to Modify

| File | Action |
|------|--------|
| `useKanbanPersistence.ts` | Delete |
| `KanbanBoard.tsx` | Remove URL persistence, add deep link support |
| `index.tsx` | Pass `cardId` param to KanbanBoard |
| `KanbanCard.tsx` | Add "Copy Card Link" option |
| `package.json` | Remove lz-string |

## Implementation Checklist

- [ ] Delete useKanbanPersistence.ts
- [ ] Remove URL persistence from KanbanBoard.tsx
- [ ] Add `initialCardId` prop and auto-open logic
- [ ] Update index.tsx to read `card` param
- [ ] Update Share button to copy clean URL
- [ ] Add "Copy Card Link" to card menu
- [ ] Remove lz-string dependency
- [ ] Test board selection (`?board=roadmap` vs `?board=house`)
- [ ] Test deep linking (`?card=some-id`)
- [ ] Test unsaved changes warning still works

## Edge Cases

- **Invalid card ID**: If `?card=xyz` doesn't exist, silently ignore (don't show error)
- **Card in different board**: `?board=roadmap&card=kitchen-reno` - card won't be found, ignore
- **Reset button**: Now just reloads from server data, no URL to clear

## Future Enhancements

- Deep link to card with specific section open: `?card=xyz&section=comments`
- Toast notification when card link is copied
