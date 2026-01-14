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
import { Plus, RotateCcw, Share2 } from 'lucide-react';
import type { KanbanBoard as BoardType, KanbanCard as CardType, KanbanColumn as ColumnType } from '@/types/kanban';
import { generateId, defaultBoard } from '@/types/kanban';

export function KanbanBoard() {
  const { getInitialBoard, saveBoard, clearBoard } = useKanbanPersistence();
  const [board, setBoard] = useState<BoardType>(() => getInitialBoard());
  const [activeCard, setActiveCard] = useState<CardType | null>(null);

  // Card editor state
  const [editingCard, setEditingCard] = useState<CardType | null>(null);
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Column editor state
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);

  // Wrapper that updates state and persists to URL
  const updateBoard = useCallback((updater: (prev: BoardType) => BoardType) => {
    setBoard((prev) => {
      const next = updater(prev);
      // Save asynchronously to avoid blocking
      setTimeout(() => saveBoard(next), 0);
      return next;
    });
  }, [saveBoard]);

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
        columnHistory: [
          ...(movedCard.columnHistory || []),
          { columnId: overColumn.id, columnTitle: overColumn.title, movedAt: now },
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

  const handleEditCard = (card: CardType) => {
    setEditingCard(card);
    setAddingToColumn(null);
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
          columnHistory: column
            ? [{ columnId: column.id, columnTitle: column.title, movedAt: now }]
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
        // Editing existing card - update timestamp
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

  const handleSaveColumn = (title: string) => {
    updateBoard((prev) => {
      if (isAddingColumn) {
        return {
          ...prev,
          columns: [
            ...prev.columns,
            { id: generateId(), title, cards: [] },
          ],
        };
      } else if (editingColumnId) {
        return {
          ...prev,
          columns: prev.columns.map((col) =>
            col.id === editingColumnId ? { ...col, title } : col
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
    const newBoard = { ...defaultBoard, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setBoard(newBoard);
    clearBoard();
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
          Drag cards between columns. Your board is saved in the URL.
        </p>
        <div className="flex gap-2">
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
        onClose={() => {
          setIsCardModalOpen(false);
          setEditingCard(null);
          setAddingToColumn(null);
        }}
        onSave={handleSaveCard}
        onDelete={editingCard ? handleDeleteCard : undefined}
      />

      {/* Column editor modal */}
      <ColumnEditorModal
        columnTitle={editingColumn?.title || null}
        isOpen={isColumnModalOpen}
        onClose={() => {
          setIsColumnModalOpen(false);
          setEditingColumnId(null);
          setIsAddingColumn(false);
        }}
        onSave={handleSaveColumn}
      />
    </div>
  );
}
