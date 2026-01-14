import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { KanbanBoard } from '@/types/kanban';
import { defaultBoard } from '@/types/kanban';

export function useKanbanPersistence() {
  const [searchParams, setSearchParams] = useSearchParams();

  const loadBoard = useMemo((): KanbanBoard => {
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
  }, [searchParams]);

  const saveBoard = useCallback((board: KanbanBoard) => {
    const updatedBoard = { ...board, updatedAt: new Date().toISOString() };
    const json = JSON.stringify(updatedBoard);
    const encoded = compressToEncodedURIComponent(json);
    setSearchParams({ board: encoded }, { replace: true });
  }, [setSearchParams]);

  const clearBoard = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const hasPersistedBoard = searchParams.has('board');

  return { loadBoard, saveBoard, clearBoard, hasPersistedBoard };
}
