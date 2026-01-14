export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  labels?: string[];
  createdAt: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

export interface KanbanBoard {
  id: string;
  title: string;
  columns: KanbanColumn[];
  createdAt: string;
  updatedAt: string;
}

export const defaultBoard: KanbanBoard = {
  id: 'default',
  title: 'My Board',
  columns: [
    { id: 'todo', title: 'To Do', cards: [] },
    { id: 'in-progress', title: 'In Progress', cards: [] },
    { id: 'done', title: 'Done', cards: [] },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
