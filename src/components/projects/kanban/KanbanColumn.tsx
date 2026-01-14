import { useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal, Trash2, Pencil, ArrowUpDown, ArrowUp, ArrowDown, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KanbanColumn as KanbanColumnType, KanbanCard as KanbanCardType } from '@/types/kanban';
import { COLUMN_COLORS } from '@/types/kanban';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SortDirection = 'none' | 'asc' | 'desc';

const CHANGELOG_MAX_CARDS = 7;
const REPO_URL = 'https://github.com/Dbochman/personal-website';

// Map size labels to numeric values for sorting
function getSizeValue(labels?: string[]): number {
  if (!labels) return 50;
  for (const label of labels) {
    const lower = label.toLowerCase();
    if (lower === 'small') return 10;
    if (lower === 'small-medium') return 25;
    if (lower === 'medium') return 50;
    if (lower === 'medium-large') return 75;
    if (lower === 'large') return 100;
  }
  return 50; // default to medium
}

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
  const [sortDirection, setSortDirection] = useState<SortDirection>('none');

  const isChangelog = column.id === 'changelog';
  const hasMoreCards = isChangelog && column.cards.length > CHANGELOG_MAX_CARDS;

  const sortedCards = useMemo(() => {
    let cards = column.cards;

    // Limit changelog to max cards
    if (isChangelog && cards.length > CHANGELOG_MAX_CARDS) {
      cards = cards.slice(0, CHANGELOG_MAX_CARDS);
    }

    if (sortDirection === 'none') return cards;
    return [...cards].sort((a, b) => {
      const aVal = getSizeValue(a.labels);
      const bVal = getSizeValue(b.labels);
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [column.cards, sortDirection, isChangelog]);

  const toggleSort = () => {
    setSortDirection((prev) => {
      if (prev === 'none') return 'asc';
      if (prev === 'asc') return 'desc';
      return 'none';
    });
  };

  const SortIcon = sortDirection === 'asc' ? ArrowUp : sortDirection === 'desc' ? ArrowDown : ArrowUpDown;
  const colorConfig = COLUMN_COLORS[column.color || 'default'];

  return (
    <div
      className={cn(
        'flex-shrink-0 w-64 rounded-lg p-3 border',
        colorConfig.bg,
        colorConfig.border,
        isOver && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <span className="text-muted-foreground text-xs bg-background/50 px-1.5 py-0.5 rounded">
            {column.cards.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7', sortDirection !== 'none' && 'text-primary')}
            onClick={toggleSort}
            title={sortDirection === 'none' ? 'Sort by size' : sortDirection === 'asc' ? 'Sorted: small first' : 'Sorted: large first'}
          >
            <SortIcon className="w-4 h-4" />
            <span className="sr-only">Sort by size</span>
          </Button>
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
                Edit
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
      </div>

      {/* Column description */}
      {column.description && (
        <p className="text-xs text-muted-foreground mb-3">{column.description}</p>
      )}
      {!column.description && <div className="mb-2" />}

      {/* Cards */}
      <div ref={setNodeRef} className="min-h-[50px]">
        <SortableContext
          items={sortedCards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sortedCards.map((card) => (
              <KanbanCard key={card.id} card={card} onEdit={onEditCard} />
            ))}
          </div>
        </SortableContext>

        {/* Show link to git history if changelog has more cards */}
        {hasMoreCards && (
          <a
            href={`${REPO_URL}/commits/main`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 mt-3 px-3 py-2 text-xs text-muted-foreground hover:text-foreground bg-background/50 rounded border border-dashed border-border hover:border-primary/50 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            <span>View full history on GitHub</span>
          </a>
        )}
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
