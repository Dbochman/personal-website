export type CardChangeType = 'column' | 'title' | 'description' | 'labels';

export interface CardChange {
  type: CardChangeType;
  timestamp: string;
  // For column changes
  columnId?: string;
  columnTitle?: string;
  // For field changes
  from?: string;
  to?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export type ColumnColor = 'default' | 'yellow' | 'orange' | 'purple' | 'blue' | 'green' | 'red' | 'pink';

// Card colors reuse the same palette as columns
export type CardColor = ColumnColor;

export type PrStatus = 'passing' | 'failing' | 'pending';

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  labels?: string[];
  checklist?: ChecklistItem[];
  planFile?: string; // Path to plan file, e.g., 'docs/plans/11-framer-motion.md'
  color?: CardColor;
  prStatus?: PrStatus; // CI status for cards in "In Review" column
  createdAt: string;
  updatedAt?: string;
  history?: CardChange[];
}

export const COLUMN_COLORS: Record<ColumnColor, { label: string; bg: string; border: string; dot: string }> = {
  default: { label: 'Default', bg: 'bg-muted/50', border: 'border-border', dot: 'bg-gray-400' },
  yellow: { label: 'Investigating', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', dot: 'bg-yellow-500' },
  orange: { label: 'Identified', bg: 'bg-orange-500/10', border: 'border-orange-500/30', dot: 'bg-orange-500' },
  purple: { label: 'Fixing', bg: 'bg-purple-500/10', border: 'border-purple-500/30', dot: 'bg-purple-500' },
  blue: { label: 'Monitoring', bg: 'bg-blue-500/10', border: 'border-blue-500/30', dot: 'bg-blue-500' },
  green: { label: 'Resolved', bg: 'bg-green-500/10', border: 'border-green-500/30', dot: 'bg-green-500' },
  red: { label: 'Critical', bg: 'bg-red-500/10', border: 'border-red-500/30', dot: 'bg-red-500' },
  pink: { label: 'Review', bg: 'bg-pink-500/10', border: 'border-pink-500/30', dot: 'bg-pink-500' },
};

// Card colors use the same config as columns
export const CARD_COLORS = COLUMN_COLORS;

export interface KanbanColumn {
  id: string;
  title: string;
  description?: string;
  color?: ColumnColor;
  cards: KanbanCard[];
}

export interface KanbanBoard {
  id: string;
  title: string;
  columns: KanbanColumn[];
  createdAt: string;
  updatedAt: string;
}

// Board data is now loaded from JSON at runtime
// See src/data/roadmap-board.json

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
