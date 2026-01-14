import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KanbanCard as KanbanCardType } from '@/types/kanban';

interface KanbanCardProps {
  card: KanbanCardType;
  onEdit?: (card: KanbanCardType) => void;
  isDragOverlay?: boolean;
}

export function KanbanCard({ card, onEdit, isDragOverlay = false }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'p-3 bg-background border shadow-sm cursor-grab active:cursor-grabbing touch-none group relative',
        isDragging && 'opacity-50',
        isDragOverlay && 'shadow-lg rotate-3'
      )}
      {...attributes}
      {...listeners}
    >
      {/* Edit button - always accessible in top right */}
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(card);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity p-1 rounded hover:bg-muted z-10"
          aria-label={`Edit ${card.title}`}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="pr-6">
        <p className="font-medium text-sm break-words">{card.title}</p>
        {card.description && (
          <p className="text-xs text-muted-foreground mt-1 break-words">
            {card.description}
          </p>
        )}
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {card.labels.map((label) => (
              <Badge key={label} variant="secondary" className="text-xs px-1.5 py-0">
                {label}
              </Badge>
            ))}
          </div>
        )}
        {card.checklist && card.checklist.length > 0 && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <CheckSquare className="w-3 h-3" />
            <span>
              {card.checklist.filter((item) => item.completed).length}/{card.checklist.length}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
