import { useState, useEffect } from 'react';
import { KanbanBoard } from '../kanban/KanbanBoard';
import type { KanbanBoard as BoardType } from '@/types/kanban';
import PageLayout from '@/components/layout/PageLayout';

const WORKER_URL = 'https://api.dylanbochman.com';

// Unlisted utility route - no SEO metadata but uses standard layout
export default function HouseKanban() {
  const [board, setBoard] = useState<BoardType | null>(null);
  const [headCommitSha, setHeadCommitSha] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBoard() {
      // Try worker API first (has commit SHA for conflict detection)
      try {
        const apiRes = await fetch(`${WORKER_URL}/board/house`, {
          credentials: 'include',
        });

        if (apiRes.ok) {
          const apiData = await apiRes.json();
          setBoard(apiData.board);
          setHeadCommitSha(apiData.headCommitSha);
          return;
        }
      } catch {
        // API unavailable, fall back to precompiled JS
        console.debug('Worker API unavailable, falling back to precompiled JS');
      }

      // Fallback: load from precompiled JS (no commit SHA - saves may not work)
      try {
        const module = await import('@/generated/kanban/house.js');
        setBoard(module.board);
        setHeadCommitSha(null); // No SHA available from static file
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load board');
      }
    }

    loadBoard();
  }, []);

  return (
    <PageLayout>
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8" style={{ viewTransitionName: 'page-title' }}>House Projects</h1>
          {error && <div className="text-red-500">Failed to load board: {error}</div>}
          {!board && !error && <div className="animate-pulse h-96 bg-muted rounded-lg" />}
          {board && (
            <KanbanBoard
              initialBoard={board}
              boardId="house"
              initialHeadCommitSha={headCommitSha}
            />
          )}
        </div>
      </section>
    </PageLayout>
  );
}
