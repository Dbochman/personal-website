import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KanbanColumn as KanbanColumnType, KanbanCard as KanbanCardType } from '@/types/kanban';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface KanbanColumnProps {
  column: KanbanColumnType;
  onAddCard: (columnId: string) => void;
  onEditCard: (card: KanbanCardType) => void;
  onEditColumn: (columnId: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

export function KanbanColumn({
  column,
  onAddCard,
  onEditCard,
  onEditColumn,
  onDeleteColumn,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      className={cn(
        'flex-shrink-0 w-64 bg-muted/50 rounded-lg p-3',
        isOver && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <span className="text-muted-foreground text-xs bg-muted px-1.5 py-0.5 rounded">
            {column.cards.length}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-4 h-4" />
              <span className="sr-only">Column options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditColumn(column.id)}>
              <Pencil className="w-4 h-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDeleteColumn(column.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cards */}
      <div ref={setNodeRef} className="min-h-[50px]">
        <SortableContext
          items={column.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {column.cards.map((card) => (
              <KanbanCard key={card.id} card={card} onEdit={onEditCard} />
            ))}
          </div>
        </SortableContext>
      </div>

      {/* Add card button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full mt-3 justify-start text-muted-foreground hover:text-foreground"
        onClick={() => onAddCard(column.id)}
      >
        <Plus className="w-4 h-4 mr-1" />
        Add card
      </Button>
    </div>
  );
}
