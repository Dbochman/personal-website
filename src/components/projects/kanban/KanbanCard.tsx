import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
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
        'p-3 bg-background border shadow-sm cursor-grab active:cursor-grabbing touch-none group',
        isDragging && 'opacity-50',
        isDragOverlay && 'shadow-lg rotate-3'
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm">{card.title}</p>
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(card);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity p-1 -m-1 rounded hover:bg-muted"
                aria-label={`Edit ${card.title}`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {card.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
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
        </div>
      </div>
    </Card>
  );
}
