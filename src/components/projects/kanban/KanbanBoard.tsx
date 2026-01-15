import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { CardEditorModal } from './CardEditorModal';
import { ColumnEditorModal } from './ColumnEditorModal';
import { useKanbanPersistence } from './useKanbanPersistence';
import { Button } from '@/components/ui/button';
import { Plus, RotateCcw, Share2, Save, Loader2, Check } from 'lucide-react';
import type { KanbanBoard as BoardType, KanbanCard as CardType, KanbanColumn as ColumnType, ColumnColor } from '@/types/kanban';
import { generateId } from '@/types/kanban';

const WORKER_URL = 'https://kanban-save-worker.dbochman.workers.dev';

// Note: This secret is exposed in client-side JS. It's not authentication - it only
// prevents casual/accidental triggers. The real protection is:
// 1. GitHub Action whitelists valid boardIds (prevents path traversal)
// 2. GitHub Action checks updatedAt to prevent overwriting newer data
// 3. Worst case: someone modifies the kanban board (low risk for personal site)
const SAVE_SECRET = import.meta.env.VITE_KANBAN_SAVE_SECRET;

interface KanbanBoardProps {
  initialBoard: BoardType;
  boardId: string; // ID used for saving (e.g., 'roadmap')
  boardKey?: string; // URL query param name for isolation between boards
}

export function KanbanBoard({ initialBoard, boardId, boardKey = 'board' }: KanbanBoardProps) {
  const { getInitialBoard, saveBoard: saveBoardToUrl, clearBoard } = useKanbanPersistence({
    defaultBoard: initialBoard,
    boardKey,
  });
  const [board, setBoard] = useState<BoardType>(() => getInitialBoard());
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Card editor state
  const [editingCard, setEditingCard] = useState<CardType | null>(null);
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [scrollToSection, setScrollToSection] = useState<string | undefined>(undefined);

  // Column editor state
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);

  // Wrapper that updates state and persists to URL
  const updateBoard = useCallback((updater: (prev: BoardType) => BoardType) => {
    setBoard((prev) => {
      const next = updater(prev);
      // Save to URL asynchronously to avoid blocking
      setTimeout(() => saveBoardToUrl(next), 0);
      return next;
    });
    setIsDirty(true);
    setSaveSuccess(false);
  }, [saveBoardToUrl]);

  // Save board to GitHub via Cloudflare Worker
  const handleSaveToGitHub = useCallback(async () => {
    if (!SAVE_SECRET) {
      console.error('Save secret not configured');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Save-Secret': SAVE_SECRET,
        },
        body: JSON.stringify({
          board: { ...board, updatedAt: new Date().toISOString().split('T')[0] },
          boardId,
        }),
      });

      if (response.ok) {
        setIsDirty(false);
        setSaveSuccess(true);
        // Clear success indicator after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        console.error('Save failed:', await response.text());
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  }, [board, boardId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findCard = (cardId: string): CardType | null => {
    for (const column of board.columns) {
      const card = column.cards.find((c) => c.id === cardId);
      if (card) return card;
    }
    return null;
  };

  const findColumnByCardId = (cardId: string): ColumnType | null => {
    return board.columns.find((col) => col.cards.some((c) => c.id === cardId)) || null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = findCard(active.id as string);
    setActiveCard(card);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumnByCardId(activeId);
    const overColumn = board.columns.find((col) => col.id === overId) || findColumnByCardId(overId);

    if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) return;

    updateBoard((prev) => {
      const activeCards = [...activeColumn.cards];
      const overCards = activeColumn.id === overColumn.id ? activeCards : [...overColumn.cards];

      const activeIndex = activeCards.findIndex((c) => c.id === activeId);
      const [movedCard] = activeCards.splice(activeIndex, 1);

      // Track column movement
      const now = new Date().toISOString();
      const updatedCard = {
        ...movedCard,
        updatedAt: now,
        history: [
          ...(movedCard.history || []),
          { type: 'column' as const, timestamp: now, columnId: overColumn.id, columnTitle: overColumn.title },
        ],
      };

      // If dropping on a column (not a card), add to end
      const overIndex = overColumn.cards.findIndex((c) => c.id === overId);
      if (overIndex === -1) {
        overCards.push(updatedCard);
      } else {
        overCards.splice(overIndex, 0, updatedCard);
      }

      return {
        ...prev,
        columns: prev.columns.map((col) => {
          if (col.id === activeColumn.id) {
            return { ...col, cards: activeCards };
          }
          if (col.id === overColumn.id) {
            return { ...col, cards: overCards };
          }
          return col;
        }),
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeColumn = findColumnByCardId(activeId);
    if (!activeColumn) return;

    // Same column reordering
    const overCardInSameColumn = activeColumn.cards.find((c) => c.id === overId);
    if (overCardInSameColumn) {
      updateBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((col) => {
          if (col.id !== activeColumn.id) return col;

          const oldIndex = col.cards.findIndex((c) => c.id === activeId);
          const newIndex = col.cards.findIndex((c) => c.id === overId);

          return {
            ...col,
            cards: arrayMove(col.cards, oldIndex, newIndex),
          };
        }),
      }));
    }
  };

  // Card operations
  const handleAddCard = (columnId: string) => {
    setAddingToColumn(columnId);
    setEditingCard(null);
    setIsCardModalOpen(true);
  };

  const handleEditCard = (card: CardType, scrollTo?: string) => {
    setEditingCard(card);
    setAddingToColumn(null);
    setScrollToSection(scrollTo);
    setIsCardModalOpen(true);
  };

  const handleSaveCard = (card: CardType) => {
    const now = new Date().toISOString();
    updateBoard((prev) => {
      if (addingToColumn) {
        // Adding new card - set initial column history
        const column = prev.columns.find((c) => c.id === addingToColumn);
        const newCard: CardType = {
          ...card,
          createdAt: now,
          updatedAt: now,
          history: column
            ? [{ type: 'column' as const, timestamp: now, columnId: column.id, columnTitle: column.title }]
            : [],
        };
        return {
          ...prev,
          columns: prev.columns.map((col) =>
            col.id === addingToColumn
              ? { ...col, cards: [...col.cards, newCard] }
              : col
          ),
        };
      } else {
        // Editing existing card - history changes are tracked in the modal
        const updatedCard: CardType = {
          ...card,
          updatedAt: now,
        };
        return {
          ...prev,
          columns: prev.columns.map((col) => ({
            ...col,
            cards: col.cards.map((c) => (c.id === card.id ? updatedCard : c)),
          })),
        };
      }
    });
  };

  const handleDeleteCard = (cardId: string) => {
    updateBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id !== cardId),
      })),
    }));
  };

  // Column operations
  const handleEditColumn = (columnId: string) => {
    setEditingColumnId(columnId);
    setIsAddingColumn(false);
    setIsColumnModalOpen(true);
  };

  const handleAddColumn = () => {
    setEditingColumnId(null);
    setIsAddingColumn(true);
    setIsColumnModalOpen(true);
  };

  const handleSaveColumn = (data: { title: string; description?: string; color?: ColumnColor }) => {
    updateBoard((prev) => {
      if (isAddingColumn) {
        return {
          ...prev,
          columns: [
            ...prev.columns,
            { id: generateId(), title: data.title, description: data.description, color: data.color, cards: [] },
          ],
        };
      } else if (editingColumnId) {
        return {
          ...prev,
          columns: prev.columns.map((col) =>
            col.id === editingColumnId
              ? { ...col, title: data.title, description: data.description, color: data.color }
              : col
          ),
        };
      }
      return prev;
    });
  };

  const handleDeleteColumn = (columnId: string) => {
    updateBoard((prev) => ({
      ...prev,
      columns: prev.columns.filter((col) => col.id !== columnId),
    }));
  };

  const handleReset = () => {
    const newBoard = { ...initialBoard, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setBoard(newBoard);
    clearBoard();
    setIsDirty(false);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch (e) {
      console.error('Failed to copy URL:', e);
    }
  };

  const editingColumn = editingColumnId
    ? board.columns.find((c) => c.id === editingColumnId)
    : null;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          Drag cards between columns.{' '}
          {isDirty && <span className="text-yellow-600 dark:text-yellow-400">Unsaved changes</span>}
          {saveSuccess && <span className="text-green-600 dark:text-green-400">Saved!</span>}
        </p>
        <div className="flex gap-2">
          {SAVE_SECRET && (
            <Button
              variant={isDirty ? 'default' : 'outline'}
              size="sm"
              onClick={handleSaveToGitHub}
              disabled={isSaving || !isDirty}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : saveSuccess ? (
                <Check className="w-4 h-4 mr-1" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              {isSaving ? 'Saving...' : saveSuccess ? 'Saved' : 'Save'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-1" />
            Copy Link
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 items-start">
          {board.columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onAddCard={handleAddCard}
              onEditCard={handleEditCard}
              onEditColumn={handleEditColumn}
              onDeleteColumn={handleDeleteColumn}
            />
          ))}

          {/* Add column button */}
          <Button
            variant="outline"
            className="flex-shrink-0 w-64 h-12 border-dashed self-start"
            onClick={handleAddColumn}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Column
          </Button>
        </div>

        <DragOverlay>
          {activeCard && <KanbanCard card={activeCard} isDragOverlay />}
        </DragOverlay>
      </DndContext>

      {/* Card editor modal */}
      <CardEditorModal
        card={editingCard}
        isOpen={isCardModalOpen}
        scrollTo={scrollToSection}
        onClose={() => {
          setIsCardModalOpen(false);
          setEditingCard(null);
          setAddingToColumn(null);
          setScrollToSection(undefined);
        }}
        onSave={handleSaveCard}
        onDelete={editingCard ? handleDeleteCard : undefined}
      />

      {/* Column editor modal */}
      <ColumnEditorModal
        column={editingColumn || null}
        isOpen={isColumnModalOpen}
        onClose={() => {
          setIsColumnModalOpen(false);
          setEditingColumnId(null);
          setIsAddingColumn(false);
        }}
        onSave={handleSaveColumn}
        onDelete={editingColumn ? handleDeleteColumn : undefined}
      />
    </div>
  );
}
