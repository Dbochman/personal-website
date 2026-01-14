import type { KanbanBoard } from '@/types/kanban';

export const houseBoard: KanbanBoard = {
  id: 'house',
  title: 'House Projects',
  columns: [
    {
      id: 'todo',
      title: 'To Do',
      description: 'Planned projects',
      cards: [
        {
          id: 'stairs',
          title: 'Install outdoor wood stairs',
          description: 'For sliding glass door. 2–3 steps, wood construction, simple railing.',
          createdAt: '2026-01-14',
        },
        {
          id: 'faucet',
          title: 'Bathroom faucet replacement',
          description: 'Centerset; black or antique brass with traditional styling.',
          createdAt: '2026-01-14',
        },
        {
          id: 'rugs',
          title: 'Custom rug runners',
          createdAt: '2026-01-14',
        },
        {
          id: 'kitchen',
          title: 'Rework kitchen',
          createdAt: '2026-01-14',
        },
        {
          id: 'irrigation',
          title: 'Install drip irrigation system',
          createdAt: '2026-01-14',
        },
        {
          id: 'compost',
          title: 'Set up bear-safe compost system',
          description: 'Yard waste only, for general soil improvement.',
          createdAt: '2026-01-14',
        },
        {
          id: 'laundry-line',
          title: 'Install laundry line',
          createdAt: '2026-01-14',
        },
        {
          id: 'fencing',
          title: 'Partial yard fencing',
          description: 'Wood picture-frame panels with hog/goat wire infill. Metal posts with removable wood sleeves.',
          createdAt: '2026-01-14',
        },
        {
          id: 'light-fixture',
          title: 'Antique light fixture rewire',
          description: 'Replace old wiring and socket to safely reuse antique lighting.',
          createdAt: '2026-01-14',
        },
      ],
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      description: 'Currently working on',
      color: 'yellow',
      cards: [
        {
          id: 'water-pressure',
          title: 'Improve shower water pressure',
          description: 'Private well system. Pressure gauge replacement, then pressure switch and tank checks as needed.',
          createdAt: '2026-01-14',
        },
      ],
    },
    {
      id: 'done',
      title: 'Done',
      description: 'Completed projects',
      color: 'green',
      cards: [
        {
          id: 'floors',
          title: 'Refinish hardwood floors',
          createdAt: '2026-01-14',
        },
        {
          id: 'bathroom-fan',
          title: 'Bathroom fan refresh',
          description: 'Painted/refreshed existing grille.',
          createdAt: '2026-01-14',
        },
      ],
    },
  ],
  createdAt: '2026-01-14',
  updatedAt: '2026-01-14',
};
