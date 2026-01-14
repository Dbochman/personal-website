import type { KanbanBoard } from '@/types/kanban';

export const houseBoard: KanbanBoard = {
  id: 'house',
  title: 'House Projects',
  columns: [
    {
      id: 'todo',
      title: 'To Do',
      description: 'Projects to tackle',
      cards: [],
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      description: 'Currently working on',
      cards: [],
    },
    {
      id: 'done',
      title: 'Done',
      description: 'Completed projects',
      cards: [],
    },
  ],
  createdAt: '2026-01-14',
  updatedAt: '2026-01-14',
};
