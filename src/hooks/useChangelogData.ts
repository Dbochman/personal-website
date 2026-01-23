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

/**
 * Load changelog entries from precompiled kanban data
 * Synchronous since data is precompiled at build time
 */
function loadChangelogEntries(boardId: string): ChangelogEntry[] {
  const board = getBoardSync(boardId);
  if (!board) return [];

  // Get changelog column cards
  const changelogColumn = board.columns.find((col) => col.id === 'changelog');
  const changelogCards = changelogColumn?.cards || [];

  // Get archived column cards (previously in separate archive.json)
  const archivedColumn = board.columns.find((col) => col.id === 'archived');
  const archivedCards = archivedColumn?.cards || [];

  // Convert to entries
  const changelogEntries = changelogCards.map(cardToEntry);
  const archiveEntries = archivedCards.map(cardToEntry);

  // Merge and deduplicate by ID (changelog takes priority)
  const entryMap = new Map<string, ChangelogEntry>();

  // Add archive entries first (lower priority)
  for (const entry of archiveEntries) {
    entryMap.set(entry.id, entry);
  }

  // Add changelog entries (higher priority, overwrites)
  for (const entry of changelogEntries) {
    entryMap.set(entry.id, entry);
  }

  // Sort by completedAt descending (newest first)
  return Array.from(entryMap.values()).sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
}

export function useChangelogData(boardId: string = 'roadmap') {
  // Load entries synchronously (data is precompiled)
  const entries = useMemo(() => loadChangelogEntries(boardId), [boardId]);

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
  // error is always null since we don't have async loading
  return { entries, isLoading: false, error: null, allLabels };
}
