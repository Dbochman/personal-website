import { useState, useEffect, useMemo } from 'react';
import type { KanbanCard, ChecklistItem, CardChange } from '@/types/kanban';

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

interface ArchiveData {
  archivedAt: string;
  cards: KanbanCard[];
}

interface BoardData {
  columns: { id: string; title: string; cards: KanbanCard[] }[];
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

export function useChangelogData(boardId: string = 'roadmap') {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch board data (required)
        const boardRes = await fetch(`/data/${boardId}-board.json`);
        if (!boardRes.ok) throw new Error('Failed to load board data');
        const boardData: BoardData = await boardRes.json();

        // Fetch archive data (optional - may not exist for all boards)
        let archiveData: ArchiveData = { archivedAt: '', cards: [] };
        try {
          const archiveRes = await fetch(`/data/${boardId}-archive.json`);
          if (archiveRes.ok) {
            archiveData = await archiveRes.json();
          }
        } catch {
          // Archive doesn't exist, continue without it
        }

        // Get changelog column cards
        const changelogColumn = boardData.columns.find((col) => col.id === 'changelog');
        const changelogCards = changelogColumn?.cards || [];

        // Convert to entries
        const changelogEntries = changelogCards.map(cardToEntry);
        const archiveEntries = archiveData.cards.map(cardToEntry);

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
        const allEntries = Array.from(entryMap.values()).sort(
          (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        );

        setEntries(allEntries);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load changelog data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [boardId]);

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

  return { entries, isLoading, error, allLabels };
}
