/**
 * Synchronous kanban board loader using precompiled data
 * Pattern follows blog-loader-precompiled.ts
 */

import type { KanbanBoard, KanbanCard } from '@/types/kanban';

// Import precompiled kanban boards
const compiledModules = import.meta.glob('/src/generated/kanban/*.js', {
  eager: true,
}) as Record<string, { board: KanbanBoard }>;

// Warn if no modules found (likely forgot to run precompile)
if (Object.keys(compiledModules).length === 0) {
  console.warn(
    '[kanban-loader] No precompiled boards found in src/generated/kanban/. ' +
      'Run "npm run precompile-kanban" or restart dev server.'
  );
}

// Cache for quick lookups
const boardCache = new Map<string, KanbanBoard>();
const cardCache = new Map<string, Map<string, KanbanCard>>();

/**
 * Extract board ID from module path
 */
function extractBoardIdFromPath(path: string): string {
  // Path format: /src/generated/kanban/roadmap.js
  const match = path.match(/\/([^/]+)\.js$/);
  return match ? match[1] : '';
}

/**
 * Initialize caches from compiled modules
 */
function initCaches(): void {
  if (boardCache.size > 0) return; // Already initialized

  for (const [path, module] of Object.entries(compiledModules)) {
    if (path.includes('manifest.js')) continue;

    const boardId = extractBoardIdFromPath(path);
    if (!boardId || !module.board) continue;

    const board = module.board;
    boardCache.set(boardId, board);

    // Build card lookup for this board
    const cards = new Map<string, KanbanCard>();
    for (const column of board.columns) {
      for (const card of column.cards) {
        cards.set(card.id, card);
      }
    }
    cardCache.set(boardId, cards);
  }
}

// Initialize on module load
initCaches();

/**
 * Get all available board IDs
 */
export function getBoardIds(): string[] {
  initCaches();
  return Array.from(boardCache.keys());
}

/**
 * Get a board synchronously by ID
 * Returns null if board doesn't exist
 */
export function getBoardSync(boardId: string): KanbanBoard | null {
  initCaches();
  return boardCache.get(boardId) || null;
}

/**
 * Get a card synchronously by board ID and card ID
 * Returns null if board or card doesn't exist
 */
export function getCardSync(boardId: string, cardId: string): KanbanCard | null {
  initCaches();
  const cards = cardCache.get(boardId);
  if (!cards) return null;
  return cards.get(cardId) || null;
}

/**
 * Get all cards from a board (flat list, no column grouping)
 */
export function getAllCardsSync(boardId: string): KanbanCard[] {
  initCaches();
  const cards = cardCache.get(boardId);
  if (!cards) return [];
  return Array.from(cards.values());
}

/**
 * Find cards by column across a board
 */
export function getCardsByColumnSync(boardId: string, columnId: string): KanbanCard[] {
  const board = getBoardSync(boardId);
  if (!board) return [];

  const column = board.columns.find((c) => c.id === columnId);
  return column?.cards || [];
}

/**
 * Search cards by text (title or description)
 * Case-insensitive search
 */
export function searchCardsSync(boardId: string, query: string): KanbanCard[] {
  const allCards = getAllCardsSync(boardId);
  if (!query.trim()) return allCards;

  const lowerQuery = query.toLowerCase();
  return allCards.filter(
    (card) =>
      card.title.toLowerCase().includes(lowerQuery) ||
      (card.description && card.description.toLowerCase().includes(lowerQuery))
  );
}

// Async wrappers for compatibility with existing hooks

/**
 * Load a board (async wrapper for compatibility)
 */
export async function loadBoard(boardId: string): Promise<KanbanBoard | null> {
  return getBoardSync(boardId);
}

/**
 * Load a card (async wrapper for compatibility)
 */
export async function loadCard(
  boardId: string,
  cardId: string
): Promise<KanbanCard | null> {
  return getCardSync(boardId, cardId);
}
