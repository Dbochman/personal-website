import { useState, useEffect } from 'react';
import { KanbanBoard } from './KanbanBoard';
import type { KanbanBoard as BoardType } from '@/types/kanban';

export default function Kanban() {
  const [board, setBoard] = useState<BoardType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/roadmap-board.json')
      .then((res) => res.json())
      .then((data) => setBoard(data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div className="text-red-500">Failed to load board: {error}</div>;
  }

  if (!board) {
    return <div className="animate-pulse h-96 bg-muted rounded-lg" />;
  }

  return <KanbanBoard initialBoard={board} boardId="roadmap" />;
}
