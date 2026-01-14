import { KanbanBoard } from '../kanban/KanbanBoard';
import { houseBoard } from './data';

// Unlisted utility route - intentionally minimal without PageLayout
export default function HouseKanban() {
  return <KanbanBoard initialBoard={houseBoard} boardKey="board-house" />;
}
