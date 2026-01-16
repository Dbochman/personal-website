import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KanbanBoard } from './KanbanBoard';
import type { KanbanBoard as BoardType } from '@/types/kanban';

// Valid board IDs (must match save-kanban.yml whitelist)
const VALID_BOARDS = ['roadmap', 'house'] as const;
type BoardId = (typeof VALID_BOARDS)[number];

export default function Kanban() {
  const [searchParams] = useSearchParams();
  const [board, setBoard] = useState<BoardType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get board ID from URL, default to 'roadmap'
  const boardId = useMemo<BoardId>(() => {
    const param = searchParams.get('board');
    if (param && VALID_BOARDS.includes(param as BoardId)) {
      return param as BoardId;
    }
    return 'roadmap';
  }, [searchParams]);

  // Get card ID from URL for deep linking
  const cardId = searchParams.get('card');

  useEffect(() => {
    setBoard(null);
    setError(null);
    fetch(`/data/${boardId}-board.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Board not found: ${boardId}`);
        return res.json();
      })
      .then((data) => setBoard(data))
      .catch((err) => setError(err.message));
  }, [boardId]);

  if (error) {
    return <div className="text-red-500">Failed to load board: {error}</div>;
  }

  if (!board) {
    return <div className="animate-pulse h-96 bg-muted rounded-lg" />;
  }

  return <KanbanBoard initialBoard={board} boardId={boardId} initialCardId={cardId || undefined} />;
}
