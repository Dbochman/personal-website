import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { BoardSelector } from './BoardSelector';
import { CreateBoardModal } from './CreateBoardModal';
import { Button } from '@/components/ui/button';
import { Plus, RotateCcw, Share2, Save, Loader2, Check, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import type { KanbanBoard as BoardType, KanbanCard as CardType, KanbanColumn as ColumnType, ColumnColor } from '@/types/kanban';
import { generateId } from '@/types/kanban';

const WORKER_URL = 'https://api.dylanbochman.com';

interface AuthStatus {
  authenticated: boolean;
  username: string | null;
}

interface SaveResponse {
  success?: boolean;
  newHeadSha?: string;
  error?: string;
  message?: string;
}

interface KanbanBoardProps {
  initialBoard: BoardType;
  boardId: string; // ID used for saving (e.g., 'roadmap')
  initialCardId?: string; // Card ID to open on mount (for deep linking)
  initialHeadCommitSha?: string | null; // Commit SHA for conflict detection
}

export function KanbanBoard({ initialBoard, boardId, initialCardId, initialHeadCommitSha }: KanbanBoardProps) {
  const [, setSearchParams] = useSearchParams();
  const [board, setBoard] = useState<BoardType>(initialBoard);
  // Track the commit SHA for conflict detection
  const [headCommitSha, setHeadCommitSha] = useState<string | null>(initialHeadCommitSha ?? null);
  // Track deleted card IDs for explicit deletion on save (persisted to localStorage)
  const deletedCardStorageKey = `kanban-deleted-cards-${boardId}`;
  const [deletedCardIds, setDeletedCardIds] = useState<string[]>(() => {
    // Guard for SSR/build/test environments without DOM
    if (typeof window === 'undefined') return [];
    // Initialize from localStorage, validating against current board
    try {
      const stored = localStorage.getItem(deletedCardStorageKey);
      if (!stored) return [];
      const parsed = JSON.parse(stored) as string[];
      // Only keep IDs that exist in the board (remove stale IDs)
      const existingCardIds = new Set(initialBoard.columns.flatMap(col => col.cards.map(c => c.id)));
      return parsed.filter(id => existingCardIds.has(id));
    } catch {
      return [];
    }
  });
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [conflictDetected, setConflictDetected] = useState(false);

  // Auth state
  const [auth, setAuth] = useState<AuthStatus>({ authenticated: false, username: null });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // External change detection state
  const [externalChangeDetected, setExternalChangeDetected] = useState(false);
  const externalChangeDetectedRef = useRef(false);

  // Track the original column when drag starts (for history deduplication)
  const dragStartColumnRef = useRef<string | null>(null);

  // Keep ref in sync with state (for use in callbacks without stale closures)
  useEffect(() => {
    externalChangeDetectedRef.current = externalChangeDetected;
  }, [externalChangeDetected]);

  // Check auth status on mount
  useEffect(() => {
    fetch(`${WORKER_URL}/auth/status`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data: AuthStatus) => setAuth(data))
      .catch(() => setAuth({ authenticated: false, username: null }))
      .finally(() => setIsCheckingAuth(false));
  }, []);

  // Persist deletedCardIds to localStorage and sync across tabs
  useEffect(() => {
    if (deletedCardIds.length > 0) {
      localStorage.setItem(deletedCardStorageKey, JSON.stringify(deletedCardIds));
    } else {
      localStorage.removeItem(deletedCardStorageKey);
    }
  }, [deletedCardIds, deletedCardStorageKey]);

  // Multi-tab sync for deletedCardIds
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === deletedCardStorageKey) {
        if (e.newValue === null) {
          // Another tab cleared the key (e.g., after successful save)
          setDeletedCardIds([]);
        } else {
          try {
            const newIds = JSON.parse(e.newValue) as string[];
            setDeletedCardIds(newIds);
          } catch {
            // Ignore parse errors
          }
        }
      }
    };
    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [deletedCardStorageKey]);

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

  // Deep linking: open card from URL param on mount
  useEffect(() => {
    if (initialCardId) {
      // Find card across all columns
      for (const column of board.columns) {
        const card = column.cards.find((c) => c.id === initialCardId);
        if (card) {
          setEditingCard(card);
          setIsCardModalOpen(true);
          break;
        }
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: only run on mount - initialCardId won't change

  // Column editor state
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);

  // Create board modal state
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);

  // Wrapper that updates board state
  const updateBoard = useCallback((updater: (prev: BoardType) => BoardType) => {
    setBoard((prev) => updater(prev));
    setIsDirty(true);
    setSaveSuccess(false);
  }, []);

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

  // Soft reload - fetch new data and update state in place
  const handleSoftReload = useCallback(async () => {
    try {
      // Try to load from worker API first (has commit SHA)
      let data: BoardType;
      let newSha: string | null = null;

      try {
        const apiRes = await fetch(`${WORKER_URL}/board/${boardId}`, {
          credentials: 'include',
        });

        if (apiRes.ok) {
          const apiData = await apiRes.json();
          data = apiData.board;
          newSha = apiData.headCommitSha;
        } else {
          throw new Error('API unavailable');
        }
      } catch {
        // Fallback to precompiled JS
        const module = await import(`@/generated/kanban/${boardId}.js`);
        data = module.board;
      }

      setBoard(data);
      setHeadCommitSha(newSha);
      setDeletedCardIds([]);
      setIsDirty(false);
      setExternalChangeDetected(false);
      setConflictDetected(false);

      toast.success('Board reloaded');
    } catch {
      toast.error('Failed to reload board');
    }
  }, [boardId]);

  // Check for external changes (uses commit SHA comparison)
  const checkForExternalChanges = useCallback(async () => {
    // Don't check if we've already detected a change or don't have a SHA to compare
    if (externalChangeDetectedRef.current || !headCommitSha) return;

    try {
      const res = await fetch(`${WORKER_URL}/board/${boardId}`, {
        credentials: 'include',
      });
      if (!res.ok) return;

      const data = await res.json();
      const remoteSha = data.headCommitSha;

      // If remote SHA differs from our local SHA, external change detected
      if (remoteSha && remoteSha !== headCommitSha) {
        setExternalChangeDetected(true);

        toast('Board was updated externally', {
          id: 'external-change', // Prevent duplicate toasts
          description: isDirty
            ? 'You have unsaved changes that may conflict.'
            : 'Click reload to get the latest version.',
          action: {
            label: 'Reload',
            onClick: handleSoftReload,
          },
          duration: Infinity, // Don't auto-dismiss
        });
      }
    } catch {
      // Silently fail - don't disrupt user
      console.debug('External change check failed');
    }
  }, [boardId, headCommitSha, isDirty, handleSoftReload]);

  // Set up polling and visibility detection for external changes
  useEffect(() => {
    // Poll every 15 seconds while visible
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (!intervalId) {
        intervalId = setInterval(checkForExternalChanges, 15000);
      }
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForExternalChanges(); // Check immediately on focus
        startPolling();
      } else {
        stopPolling();
      }
    };

    // Start polling if visible
    if (document.visibilityState === 'visible') {
      startPolling();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForExternalChanges]);

  // Save board to GitHub via Cloudflare Worker (requires auth)
  const handleSaveToGitHub = useCallback(async () => {
    if (!auth.authenticated) {
      toast.error('Not authenticated');
      return;
    }

    if (!headCommitSha) {
      toast.error('Cannot save: missing commit reference. Please reload the page.');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch(`${WORKER_URL}/save`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board,
          boardId,
          headCommitSha,
          deletedCardIds,
        }),
      });

      const data: SaveResponse = await response.json();

      if (response.ok && data.success) {
        setIsDirty(false);
        setSaveSuccess(true);
        setDeletedCardIds([]); // Clear deleted IDs after successful save
        // Update headCommitSha so consecutive saves work without reload
        if (data.newHeadSha) {
          setHeadCommitSha(data.newHeadSha);
        }
        // Update board's updatedAt to prevent false external-change detection
        // The worker sets this timestamp when saving, so we mirror it locally
        const now = new Date().toISOString();
        setBoard((prev) => ({ ...prev, updatedAt: now }));
        toast.success('Board saved! Changes will appear after precompile completes.');
        // Clear success indicator after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } else if (response.status === 409) {
        // Conflict detected
        setConflictDetected(true);
        toast.error('Board was modified externally. Please reload to see changes.', {
          id: 'save-conflict',
          action: {
            label: 'Reload',
            onClick: handleSoftReload,
          },
          duration: Infinity,
        });
      } else {
        toast.error(data.message || data.error || 'Save failed');
      }
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save board');
    } finally {
      setIsSaving(false);
    }
  }, [board, boardId, auth.authenticated, headCommitSha, deletedCardIds, handleSoftReload]);

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
    // Track starting column for history deduplication
    const startColumn = findColumnByCardId(active.id as string);
    dragStartColumnRef.current = startColumn?.id || null;
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

      // Don't add history during drag - only update position
      // History will be added in handleDragEnd

      // If dropping on a column (not a card), add to end
      const overIndex = overColumn.cards.findIndex((c) => c.id === overId);
      if (overIndex === -1) {
        overCards.push(movedCard);
      } else {
        overCards.splice(overIndex, 0, movedCard);
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
    const startColumnId = dragStartColumnRef.current;
    setActiveCard(null);
    dragStartColumnRef.current = null; // Reset for next drag

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumnByCardId(activeId);
    if (!activeColumn) return;

    // Check if card moved to a different column (compared to where drag started)
    const movedToNewColumn = startColumnId && startColumnId !== activeColumn.id;

    if (movedToNewColumn) {
      // Add history entry for the final column (only once, at drag end)
      updateBoard((prev) => ({
        ...prev,
        columns: prev.columns.map((col) => {
          if (col.id !== activeColumn.id) return col;

          return {
            ...col,
            cards: col.cards.map((card) => {
              if (card.id !== activeId) return card;

              const now = new Date().toISOString();
              // Deduplicate: don't add if last history entry is same column
              const lastEntry = card.history?.[card.history.length - 1];
              if (lastEntry?.type === 'column' && lastEntry?.columnId === activeColumn.id) {
                return { ...card, updatedAt: now };
              }

              return {
                ...card,
                updatedAt: now,
                history: [
                  ...(card.history || []),
                  { type: 'column' as const, timestamp: now, columnId: activeColumn.id, columnTitle: activeColumn.title },
                ],
              };
            }),
          };
        }),
      }));
    }

    if (activeId === overId) return;

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
    // Track deleted card ID for explicit deletion on save
    setDeletedCardIds((prev) => [...prev, cardId]);

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
    // Track all card IDs in the deleted column
    const column = board.columns.find((col) => col.id === columnId);
    if (column) {
      const cardIdsInColumn = column.cards.map((c) => c.id);
      setDeletedCardIds((prev) => [...prev, ...cardIdsInColumn]);
    }

    updateBoard((prev) => ({
      ...prev,
      columns: prev.columns.filter((col) => col.id !== columnId),
    }));
  };

  const handleReset = () => {
    setBoard(initialBoard);
    setDeletedCardIds([]);
    setIsDirty(false);
    setConflictDetected(false);
  };

  const handleShare = async () => {
    try {
      const url = new URL(window.location.href);
      url.search = `?board=${boardId}`;
      await navigator.clipboard.writeText(url.toString());
      toast.success('Link copied to clipboard');
    } catch (e) {
      console.error('Failed to copy URL:', e);
      toast.error('Failed to copy link');
    }
  };

  const handleBoardCreated = (newBoardId: string) => {
    // Navigate to the new board, preserving other params but clearing card (different board)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('board', newBoardId);
      next.delete('card'); // Card IDs are board-specific
      return next;
    });
    toast.success('Board created! It may take a moment to fully load.');
  };

  const editingColumn = editingColumnId
    ? board.columns.find((c) => c.id === editingColumnId)
    : null;

  // Determine if save should be disabled
  const canSave = auth.authenticated && headCommitSha && isDirty && !conflictDetected;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <BoardSelector
            currentBoardId={boardId}
            currentBoardTitle={board.title}
            onCreateNew={() => setIsCreateBoardModalOpen(true)}
            isAuthenticated={auth.authenticated}
          />
          <span className="text-sm text-muted-foreground">Drag cards between columns.</span>
          {isDirty && !conflictDetected && (
            <span className="text-yellow-600 dark:text-yellow-400">Unsaved changes</span>
          )}
          {conflictDetected && (
            <span className="text-red-600 dark:text-red-400">Conflict - reload required</span>
          )}
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
                {conflictDetected ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSoftReload}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Reload Board
                  </Button>
                ) : (
                  <Button
                    variant={isDirty ? 'default' : 'outline-solid'}
                    size="sm"
                    onClick={handleSaveToGitHub}
                    disabled={isSaving || !canSave}
                    title={!headCommitSha ? 'Cannot save: missing commit reference' : undefined}
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
              boardId={boardId}
              onAddCard={handleAddCard}
              onEditCard={handleEditCard}
              onEditColumn={handleEditColumn}
              onDeleteColumn={handleDeleteColumn}
            />
          ))}

          {/* Add column button */}
          <Button
            variant="outline"
            className="shrink-0 w-64 h-12 border-dashed self-start"
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

      {/* Create board modal */}
      <CreateBoardModal
        isOpen={isCreateBoardModalOpen}
        onClose={() => setIsCreateBoardModalOpen(false)}
        onCreated={handleBoardCreated}
      />
    </div>
  );
}
