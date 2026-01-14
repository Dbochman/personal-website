import { KanbanBoard } from '../kanban/KanbanBoard';
import { houseBoard } from './data';
import PageLayout from '@/components/layout/PageLayout';

// Unlisted utility route - no SEO metadata but uses standard layout
export default function HouseKanban() {
  return (
    <PageLayout>
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Phillipston Cabin Projects</h1>
          <KanbanBoard initialBoard={houseBoard} boardKey="board-house" />
        </div>
      </section>
    </PageLayout>
  );
}
