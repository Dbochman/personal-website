import { useState, useCallback, useEffect } from 'react';
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
import { Plus, RotateCcw, Share2, Save, Loader2, Check, LogIn, LogOut } from 'lucide-react';
import type { KanbanBoard as BoardType, KanbanCard as CardType, KanbanColumn as ColumnType, ColumnColor } from '@/types/kanban';
import { generateId } from '@/types/kanban';

const WORKER_URL = 'https://api.dylanbochman.com';

interface AuthStatus {
  authenticated: boolean;
  username: string | null;
}

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
  // Use a ref to get the initial board once (may include URL overrides)
  const [board, setBoard] = useState<BoardType>(() => getInitialBoard());
  // Track the updatedAt for conflict detection - use actual loaded board, not initialBoard
  // This updates after successful saves to allow consecutive saves
  const [baseUpdatedAt, setBaseUpdatedAt] = useState(() => {
    const loadedBoard = getInitialBoard();
    return loadedBoard.updatedAt || new Date().toISOString();
  });
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Auth state
  const [auth, setAuth] = useState<AuthStatus>({ authenticated: false, username: null });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    fetch(`${WORKER_URL}/auth/status`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data: AuthStatus) => setAuth(data))
      .catch(() => setAuth({ authenticated: false, username: null }))
      .finally(() => setIsCheckingAuth(false));
  }, []);

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore custom messages, but this is still required
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

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

  // Auth handlers
  const handleLogin = useCallback(() => {
    const returnTo = encodeURIComponent(window.location.href);
    window.location.href = `${WORKER_URL}/auth/login?return_to=${returnTo}`;
  }, []);

  const handleLogout = useCallback(async () => {
    await fetch(`${WORKER_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    setAuth({ authenticated: false, username: null });
  }, []);

  // Save board to GitHub via Cloudflare Worker (requires auth)
  const handleSaveToGitHub = useCallback(async () => {
    if (!auth.authenticated) {
      console.error('Not authenticated');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const newUpdatedAt = new Date().toISOString();
      const response = await fetch(`${WORKER_URL}/save`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board: { ...board, updatedAt: newUpdatedAt },
          boardId,
          baseUpdatedAt, // Original timestamp for conflict detection
        }),
      });

      if (response.ok) {
        setIsDirty(false);
        setSaveSuccess(true);
        // Update baseUpdatedAt so consecutive saves work without reload
        setBaseUpdatedAt(newUpdatedAt);
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
  }, [board, boardId, auth.authenticated]);

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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Drag cards between columns.</span>
          {isDirty && <span className="text-yellow-600 dark:text-yellow-400">Unsaved changes</span>}
          {saveSuccess && <span className="text-green-600 dark:text-green-400">Saved!</span>}
          {auth.authenticated && (
            <span className="text-muted-foreground">
              Logged in as <span className="font-medium">{auth.username}</span>
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {/* Auth-gated save controls */}
          {!isCheckingAuth && (
            auth.authenticated ? (
              <>
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
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={handleLogin}>
                <LogIn className="w-4 h-4 mr-1" />
                Login to Save
              </Button>
            )
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
