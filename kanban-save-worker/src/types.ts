/**
 * Kanban types for the worker
 * Mirrors src/types/kanban.ts in the main app
 */

// Forward-compatible: string type allows future history types
// Common types: 'column', 'title', 'description', 'labels', 'checklist'
export type CardChangeType = string;

export interface CardChange {
  type: CardChangeType;
  timestamp: string;
  // For column changes
  columnId?: string;
  columnTitle?: string;
  // For field changes (string or array for multi-value fields like labels)
  from?: string | string[];
  to?: string | string[];
  // For checklist changes
  action?: string; // 'add', 'remove', 'toggle'
  itemId?: string;
  itemText?: string;
  // Allow any additional fields for forward compatibility
  [key: string]: unknown;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export type ColumnColor =
  | 'default'
  | 'yellow'
  | 'orange'
  | 'purple'
  | 'blue'
  | 'green'
  | 'red'
  | 'pink';

export type CardColor = ColumnColor;

export type PrStatus = 'passing' | 'failing' | 'pending';

export interface KanbanCard {
  id: string;
  title: string;
  summary?: string;
  description?: string;
  labels?: string[];
  checklist?: ChecklistItem[];
  planFile?: string;
  color?: CardColor;
  prStatus?: PrStatus;
  createdAt: string;
  updatedAt?: string;
  archivedAt?: string;
  archiveReason?: string;
  history?: CardChange[];
}

export interface KanbanColumn {
  id: string;
  title: string;
  description?: string;
  color?: ColumnColor;
  cards: KanbanCard[];
}

export interface KanbanBoard {
  schemaVersion: number;
  id: string;
  title: string;
  columns: KanbanColumn[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Save request payload from client
 */
export interface SaveRequest {
  board: KanbanBoard;
  boardId: string;
  headCommitSha: string;
  deletedCardIds: string[];
}

/**
 * Save response from worker
 */
export interface SaveResponse {
  success: boolean;
  newHeadSha?: string;
  error?: string;
  message?: string;
}

/**
 * Board response from GET /board/:boardId
 */
export interface BoardResponse {
  board: KanbanBoard;
  headCommitSha: string;
  precompiled?: boolean;
}

/**
 * Board summary for listing
 */
export interface BoardSummary {
  id: string;
  title: string;
  cardCount: number;
}

/**
 * Create board request payload
 */
export interface CreateBoardRequest {
  id: string;
  title: string;
  columns?: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

/**
 * Create board response
 */
export interface CreateBoardResponse {
  success: boolean;
  boardId?: string;
  newHeadSha?: string;
  error?: string;
  message?: string;
}
