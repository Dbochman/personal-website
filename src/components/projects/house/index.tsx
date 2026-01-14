import { KanbanBoard } from '../kanban/KanbanBoard';
import { houseBoard } from './data';

export default function HouseKanban() {
  return <KanbanBoard initialBoard={houseBoard} />;
}
