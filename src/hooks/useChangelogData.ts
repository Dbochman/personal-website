import { useMemo } from 'react';
import type { KanbanCard, ChecklistItem, CardChange } from '@/types/kanban';
import { getBoardSync } from '@/lib/kanban-loader';

export interface ChangelogEntry {
  id: string;
  title: string;
  description?: string;
  labels: string[];
  checklist?: ChecklistItem[];
  history?: CardChange[];
  planFile?: string;
  createdAt: string;
  completedAt: string; // Derived from last column history entry to 'changelog'
}

/**
 * Get the completion date from a card's history (last move to changelog column)
 * Falls back to createdAt if no history exists
 */
function getCompletedAt(card: KanbanCard): string {
  if (!card.history || card.history.length === 0) {
    return card.createdAt;
  }

  // Find the last move to changelog column
  const changelogMoves = card.history.filter(
    (h) => h.type === 'column' && h.columnId === 'changelog'
  );

  if (changelogMoves.length > 0) {
    return changelogMoves[changelogMoves.length - 1].timestamp;
  }

  // Fall back to last history entry or createdAt
  return card.history[card.history.length - 1].timestamp || card.createdAt;
}

/**
 * Convert a KanbanCard to a ChangelogEntry
 */
function cardToEntry(card: KanbanCard): ChangelogEntry {
  return {
    id: card.id,
    title: card.title,
    description: card.description,
    labels: card.labels || [],
    checklist: card.checklist,
    history: card.history,
    planFile: card.planFile,
    createdAt: card.createdAt,
    completedAt: getCompletedAt(card),
  };
}

interface LoadResult {
  entries: ChangelogEntry[];
  error: string | null;
}

/**
 * Load changelog entries from precompiled kanban data
 * Synchronous since data is precompiled at build time
 */
function loadChangelogEntries(boardId: string): LoadResult {
  const board = getBoardSync(boardId);
  if (!board) {
    return {
      entries: [],
      error: `Board "${boardId}" not found. Run "npm run precompile-kanban" to generate precompiled data.`,
    };
  }

  // Get changelog column cards (all completed work is now in a single column)
  const changelogColumn = board.columns.find((col) => col.id === 'changelog');
  const changelogCards = changelogColumn?.cards || [];

  // Convert to entries and sort by completedAt descending (newest first)
  const entries = changelogCards
    .map(cardToEntry)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  return { entries, error: null };
}

export function useChangelogData(boardId: string = 'roadmap') {
  // Load entries synchronously (data is precompiled)
  const { entries, error } = useMemo(() => loadChangelogEntries(boardId), [boardId]);

  // Derive unique labels for filtering
  const allLabels = useMemo(() => {
    const labelSet = new Set<string>();
    for (const entry of entries) {
      for (const label of entry.labels) {
        // Skip PR labels for filtering (they're references, not categories)
        if (!label.startsWith('PR #')) {
          labelSet.add(label);
        }
      }
    }
    return Array.from(labelSet).sort();
  }, [entries]);

  // isLoading is always false since data is precompiled
  return { entries, isLoading: false, error, allLabels };
}
