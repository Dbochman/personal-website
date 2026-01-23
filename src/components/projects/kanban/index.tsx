import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KanbanBoard } from './KanbanBoard';
import type { KanbanBoard as BoardType } from '@/types/kanban';

const WORKER_URL = 'https://api.dylanbochman.com';

// Valid board IDs (must match worker whitelist)
const VALID_BOARDS = ['roadmap', 'house'] as const;
type BoardId = (typeof VALID_BOARDS)[number];

interface BoardData {
  board: BoardType;
  headCommitSha: string | null;
}

export default function Kanban() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<BoardData | null>(null);
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
    setData(null);
    setError(null);

    async function loadBoard() {
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
          });
          return;
        }
      } catch {
        // API unavailable, fall back to static JSON
        console.debug('Worker API unavailable, falling back to static JSON');
      }

      // Fallback: load from static JSON (no commit SHA - saves may not work)
      try {
        const res = await fetch(`/data/${boardId}-board.json`);
        if (!res.ok) throw new Error(`Board not found: ${boardId}`);
        const board = await res.json();
        setData({
          board,
          headCommitSha: null, // No SHA available from static file
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load board');
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
      initialBoard={data.board}
      boardId={boardId}
      initialCardId={cardId || undefined}
      initialHeadCommitSha={data.headCommitSha}
    />
  );
}
