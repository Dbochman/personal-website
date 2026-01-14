# Kanban Page Plan

## Overview

Create an interactive Kanban board as a project/tool on the site. Demonstrates React drag-and-drop implementation and serves as a useful task visualization tool.

## Purpose Options

### Option A: Portfolio Demo Tool (Recommended)

A fully functional Kanban board visitors can use. Data persists in URL (shareable boards) or exported as JSON.

### Option B: Personal Task Tracker

Display actual project tasks from this roadmap in Kanban format. Read-only or editable.

### Option C: Template Generator

Generate Kanban board templates for different workflows (Sprint Planning, Personal Kanban, etc.).

## Core Features

| Feature | Priority | Description |
|---------|----------|-------------|
| Drag & drop cards | High | Move cards between columns |
| Add/edit cards | High | Create and modify tasks |
| Custom columns | Medium | Add/remove/rename columns |
| URL persistence | Medium | Share boards via URL |
| Card details | Medium | Description, labels, due dates |
| Export/Import | Low | JSON export for backup |
| Keyboard navigation | High | Full a11y support |

## Tech Stack

### Drag & Drop: @dnd-kit

Modern, accessible, performant drag-and-drop library.

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Why dnd-kit over alternatives:**
- Built for accessibility (keyboard, screen reader)
- Better performance than react-beautiful-dnd
- Smaller bundle (~15KB)
- Active maintenance

## Data Structure

```ts
// src/types/kanban.ts

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  labels?: string[];
  dueDate?: string;
  createdAt: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

export interface KanbanBoard {
  id: string;
  title: string;
  columns: KanbanColumn[];
  createdAt: string;
  updatedAt: string;
}

// Default board template
export const defaultBoard: KanbanBoard = {
  id: 'default',
  title: 'My Board',
  columns: [
    { id: 'todo', title: 'To Do', cards: [] },
    { id: 'in-progress', title: 'In Progress', cards: [] },
    { id: 'done', title: 'Done', cards: [] },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
```

## Implementation

### Phase 1: Basic Board Layout

**File:** `src/components/projects/kanban/KanbanBoard.tsx`

```tsx
import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import type { KanbanBoard as BoardType, KanbanCard as CardType } from '@/types/kanban';

export function KanbanBoard({ initialBoard }: { initialBoard: BoardType }) {
  const [board, setBoard] = useState(initialBoard);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = findCard(active.id as string);
    setActiveCard(card);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    // Move card logic
    moveCard(active.id as string, over.id as string);
    setActiveCard(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {board.columns.map((column) => (
          <KanbanColumn key={column.id} column={column} />
        ))}
        <AddColumnButton onAdd={addColumn} />
      </div>

      <DragOverlay>
        {activeCard && <KanbanCard card={activeCard} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
```

### Phase 2: Column Component

**File:** `src/components/projects/kanban/KanbanColumn.tsx`

```tsx
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal } from 'lucide-react';

export function KanbanColumn({ column, onAddCard, onEditColumn }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-shrink-0 w-72 bg-muted/50 rounded-lg p-3',
        isOver && 'ring-2 ring-primary'
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{column.title}</h3>
        <span className="text-muted-foreground text-sm">
          {column.cards.length}
        </span>
      </div>

      {/* Cards */}
      <SortableContext
        items={column.cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 min-h-[100px]">
          {column.cards.map((card) => (
            <KanbanCard key={card.id} card={card} />
          ))}
        </div>
      </SortableContext>

      {/* Add card button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full mt-2"
        onClick={() => onAddCard(column.id)}
      >
        <Plus className="w-4 h-4 mr-1" />
        Add card
      </Button>
    </div>
  );
}
```

### Phase 3: Card Component

**File:** `src/components/projects/kanban/KanbanCard.tsx`

```tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GripVertical } from 'lucide-react';

export function KanbanCard({ card, isDragging = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSorting,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'p-3 cursor-grab active:cursor-grabbing',
        (isDragging || isSorting) && 'opacity-50 shadow-lg'
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{card.title}</p>
          {card.labels && card.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {card.labels.map((label) => (
                <Badge key={label} variant="secondary" className="text-xs">
                  {label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
```

### Phase 4: URL Persistence

Store board state in URL for sharing (avoids localStorage):

```tsx
import { useSearchParams } from 'react-router-dom';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

function useKanbanPersistence() {
  const [searchParams, setSearchParams] = useSearchParams();

  const loadBoard = (): KanbanBoard => {
    const encoded = searchParams.get('board');
    if (encoded) {
      try {
        const json = decompressFromEncodedURIComponent(encoded);
        return JSON.parse(json);
      } catch {
        return defaultBoard;
      }
    }
    return defaultBoard;
  };

  const saveBoard = (board: KanbanBoard) => {
    const json = JSON.stringify(board);
    const encoded = compressToEncodedURIComponent(json);
    setSearchParams({ board: encoded }, { replace: true });
  };

  return { loadBoard, saveBoard };
}
```

**Note:** lz-string compresses JSON to ~30% of original size for URL-friendly encoding.

### Phase 5: Card Editor Modal

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

function CardEditorModal({ card, isOpen, onClose, onSave }) {
  const [title, setTitle] = useState(card?.title || '');
  const [description, setDescription] = useState(card?.description || '');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{card ? 'Edit Card' : 'New Card'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Card title"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={4}
            />
          </div>

          <Button onClick={() => onSave({ ...card, title, description })}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Phase 6: Project Registration

Add to projects registry:

**File:** `src/data/projects.ts`

```ts
{
  slug: 'kanban',
  title: 'Kanban Board',
  description: 'Interactive task board with drag-and-drop. Create, organize, and share your boards.',
  icon: 'Columns',
  tags: ['React', 'dnd-kit', 'Productivity'],
  status: 'active',
  createdAt: '2026-01-XX',
  component: lazy(() => import('@/components/projects/kanban')),
}
```

## Accessibility

- Full keyboard support via dnd-kit sensors
- Arrow keys to move between cards/columns
- Space/Enter to pick up and drop
- Escape to cancel drag
- Screen reader announcements for drag operations
- Focus management after actions

```tsx
// Announce drag operations
const announcements = {
  onDragStart: ({ active }) => `Picked up ${active.data.current.title}`,
  onDragOver: ({ over }) => over ? `Over ${over.id} column` : 'Not over a droppable area',
  onDragEnd: ({ active, over }) => over
    ? `Dropped ${active.data.current.title} in ${over.id}`
    : `Cancelled dragging ${active.data.current.title}`,
};

<DndContext announcements={announcements}>
```

## Files to Create

```
src/types/kanban.ts
src/components/projects/kanban/index.tsx
src/components/projects/kanban/KanbanBoard.tsx
src/components/projects/kanban/KanbanColumn.tsx
src/components/projects/kanban/KanbanCard.tsx
src/components/projects/kanban/CardEditorModal.tsx
src/components/projects/kanban/hooks/useKanbanPersistence.ts
src/data/projects.ts  # Update registry
```

## Dependencies

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lz-string
```

| Package | Size | Purpose |
|---------|------|---------|
| @dnd-kit/core | ~10KB | Core drag-and-drop |
| @dnd-kit/sortable | ~5KB | Sortable lists |
| lz-string | ~5KB | URL compression |

## Verification

1. Create new board - default columns appear
2. Add card to column - card appears
3. Drag card between columns - moves correctly
4. Edit card - changes persist
5. Copy URL and open in new tab - board loads
6. Test keyboard: Tab to card, Space to pick up, Arrow keys to move, Space to drop
7. Test with screen reader - announcements work

## Effort

**Estimate**: Medium

- Types and data structure: 20 min
- Basic board layout: 45 min
- Drag-and-drop integration: 1 hour
- Column component: 30 min
- Card component: 30 min
- URL persistence: 30 min
- Card editor modal: 30 min
- Accessibility polish: 30 min
- Testing: 30 min

**Total**: ~5 hours

## Implemented Beyond Original Scope

These features were added during implementation based on user feedback:

### Card History Tracking
- Track when cards are created and updated
- Log column movements with timestamps
- Track title, description, and label changes
- Display full history in card editor modal with wrapping

### Column Customization
- Optional description field for columns
- Color themes pulled from StatusPage incident phases:
  - Investigating (yellow), Identified (orange), Fixing (purple)
  - Monitoring (blue), Resolved (green), Critical (red), Review (pink)
- Dot-style color picker with tooltips

### Checklist/Subtasks
- Cards can have checklists for epic-style task breakdown
- Add/toggle/remove checklist items in editor
- Progress indicator on cards (e.g., "2/5")
- `@radix-ui/react-checkbox` dependency added

### Roadmap Integration
- Renamed `defaultBoard` to `roadmapBoard`
- Pre-populated with actual site roadmap items
- Kanban serves as source of truth (not ROADMAP.md)
- Updates made via chat, board used as visual reference

### Layout & UX Improvements
- Full-width layout via `fullWidth` project option
- Cards fully draggable with small edit button (absolute positioned)
- Long titles/descriptions wrap instead of truncate
- Sort toggle in column headers (small/large labels)

### Updated Data Structure

```ts
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface CardChange {
  type: 'column' | 'title' | 'description' | 'labels';
  timestamp: string;
  columnId?: string;
  columnTitle?: string;
  from?: string;
  to?: string;
}

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  labels?: string[];
  checklist?: ChecklistItem[];
  createdAt: string;
  updatedAt?: string;
  history?: CardChange[];
}

export type ColumnColor = 'default' | 'yellow' | 'orange' | 'purple' | 'blue' | 'green' | 'red' | 'pink';

export interface KanbanColumn {
  id: string;
  title: string;
  description?: string;
  color?: ColumnColor;
  cards: KanbanCard[];
}
```

### Additional Files Created

```
src/components/projects/kanban/ColumnEditorModal.tsx
```

## Future Enhancements

- ~~Card colors/priorities~~ (done via labels)
- Due date tracking with visual indicators
- Card assignments
- Column WIP limits
- Board templates (Scrum, Personal, etc.)
- Export to Markdown/CSV
- Undo/redo support
