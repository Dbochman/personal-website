import { useState, useEffect } from 'react';
import { KanbanBoard } from '../kanban/KanbanBoard';
import type { KanbanBoard as BoardType } from '@/types/kanban';
import PageLayout from '@/components/layout/PageLayout';

// Unlisted utility route - no SEO metadata but uses standard layout
export default function HouseKanban() {
  const [board, setBoard] = useState<BoardType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/house-board.json')
      .then((res) => {
        if (!res.ok) throw new Error('Board not found');
        return res.json();
      })
      .then((data) => setBoard(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <PageLayout>
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8" style={{ viewTransitionName: 'page-title' }}>House Projects</h1>
          {error && <div className="text-red-500">Failed to load board: {error}</div>}
          {!board && !error && <div className="animate-pulse h-96 bg-muted rounded-lg" />}
          {board && <KanbanBoard initialBoard={board} boardId="house" boardKey="board-house" />}
        </div>
      </section>
    </PageLayout>
  );
}
