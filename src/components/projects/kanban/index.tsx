import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KanbanBoard } from './KanbanBoard';
import type { KanbanBoard as BoardType } from '@/types/kanban';

const WORKER_URL = 'https://api.dylanbochman.com';

// Board ID validation (matches worker SAFE_ID regex)
const isValidBoardId = (id: string) => /^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]?$/.test(id);

interface BoardData {
  board: BoardType;
  headCommitSha: string | null;
  precompiled?: boolean;
}

export default function Kanban() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<BoardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get board ID from URL, default to 'roadmap'
  const boardId = useMemo(() => {
    const param = searchParams.get('board');
    if (param && isValidBoardId(param)) {
      return param;
    }
    return 'roadmap';
  }, [searchParams]);

  // Get card ID from URL for deep linking
  const cardId = searchParams.get('card');

  useEffect(() => {
    setData(null);
    setError(null);

    async function loadBoard() {
      let apiNotFound = false;
      // Try to load from worker API first (has commit SHA for conflict detection)
      try {
        const apiRes = await fetch(`${WORKER_URL}/board/${boardId}`, {
          credentials: 'include',
        });

        if (apiRes.ok) {
          const apiData = await apiRes.json();
          setData({
            board: apiData.board,
            headCommitSha: apiData.headCommitSha,
            precompiled: apiData.precompiled,
          });
          return;
        }

        // Handle 404 - board not found
        if (apiRes.status === 404) {
          apiNotFound = true;
        }
      } catch {
        // API unavailable, fall back to precompiled JS
        console.debug('Worker API unavailable, falling back to precompiled JS');
      }

      // Fallback: load from precompiled JS (no commit SHA - saves may not work)
      try {
        const module = await import(`@/generated/kanban/${boardId}.js`);
        setData({
          board: module.board,
          headCommitSha: null, // No SHA available from static file
          precompiled: true,
        });
      } catch (err) {
        if (apiNotFound) {
          setError('Board not found. It may have been deleted or not yet created.');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load board');
        }
      }
    }

    loadBoard();
  }, [boardId]);

  if (error) {
    return <div className="text-red-500">Failed to load board: {error}</div>;
  }

  if (!data) {
    return <div className="animate-pulse h-96 bg-muted rounded-lg" />;
  }

  return (
    <KanbanBoard
      key={boardId} // Force remount when board changes to reset internal state
      initialBoard={data.board}
      boardId={boardId}
      initialCardId={cardId || undefined}
      initialHeadCommitSha={data.headCommitSha}
    />
  );
}
