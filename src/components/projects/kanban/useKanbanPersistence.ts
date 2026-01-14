import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { KanbanBoard } from '@/types/kanban';
import { defaultBoard } from '@/types/kanban';

export function useKanbanPersistence() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Load board - used as lazy initializer for useState
  const getInitialBoard = useCallback((): KanbanBoard => {
    const encoded = searchParams.get('board');
    if (encoded) {
      try {
        const json = decompressFromEncodedURIComponent(encoded);
        if (json) {
          return JSON.parse(json);
        }
      } catch (e) {
        console.warn('Failed to parse board from URL:', e);
      }
    }
    return { ...defaultBoard, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: searchParams intentionally excluded - only read once on mount

  const saveBoard = useCallback((board: KanbanBoard) => {
    const updatedBoard = { ...board, updatedAt: new Date().toISOString() };
    const json = JSON.stringify(updatedBoard);
    const encoded = compressToEncodedURIComponent(json);
    setSearchParams({ board: encoded }, { replace: true });
  }, [setSearchParams]);

  const clearBoard = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  return { getInitialBoard, saveBoard, clearBoard };
}
