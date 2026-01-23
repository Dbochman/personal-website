import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil, CheckSquare, FileText, ExternalLink, CheckCircle, XCircle, Clock, Loader2, GitMerge, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KanbanCard as KanbanCardType } from '@/types/kanban';
import { CARD_COLORS } from '@/types/kanban';
import { usePrStatus } from '@/hooks/usePrStatus';

const REPO_URL = 'https://github.com/Dbochman/personal-website';

// Check if label is a single PR reference (not a range) and extract PR number
function parsePrLabel(label: string): number | null {
  // Only match single PRs like "PR #123", not ranges like "PR #88-92"
  const match = label.match(/^PR #(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

// Get the first PR number from labels
function getFirstPrNumber(labels?: string[]): number | null {
  if (!labels) return null;
  for (const label of labels) {
    const prNumber = parsePrLabel(label);
    if (prNumber) return prNumber;
  }
  return null;
}

// Check if any label contains a PR reference (single or range)
function hasPrLabel(labels?: string[]): boolean {
  if (!labels) return false;
  return labels.some((label) => label.startsWith('PR #'));
}

interface KanbanCardProps {
  card: KanbanCardType;
  columnId?: string;
  onEdit?: (card: KanbanCardType, scrollTo?: string) => void;
  isDragOverlay?: boolean;
}

export function KanbanCard({ card, columnId, onEdit, isDragOverlay = false }: KanbanCardProps) {
  // Disable sortable for drag overlay to prevent duplicate draggable registration
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, disabled: isDragOverlay });

  const isChangelog = columnId === 'changelog';
  const isInReview = columnId === 'in-review';

  // Only fetch dynamic status for cards in "In Review" column without hardcoded prStatus
  // Skip fetching for drag overlay to avoid duplicate requests
  const prNumber = isInReview && !card.prStatus && !isDragOverlay ? getFirstPrNumber(card.labels) : null;
  const { status: dynamicStatus, loading: statusLoading } = usePrStatus(prNumber);
  const displayStatus = card.prStatus ?? dynamicStatus;

  const style = isDragOverlay ? undefined : {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const colorConfig = card.color ? CARD_COLORS[card.color] : null;

  // Don't apply sortable props to drag overlay - it's just a visual clone
  const sortableProps = isDragOverlay ? {} : { ref: setNodeRef, ...attributes, ...listeners };

  return (
    <Card
      style={style}
      className={cn(
        'p-3 border shadow-xs cursor-grab active:cursor-grabbing touch-none group relative',
        colorConfig ? colorConfig.bg : 'bg-background',
        colorConfig && colorConfig.border,
        isDragging && 'opacity-50',
        isDragOverlay && 'shadow-lg rotate-3'
      )}
      {...sortableProps}
    >
      {/* Action buttons - top right */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            const url = new URL(window.location.href);
            const boardId = url.searchParams.get('board') || 'roadmap';
            url.search = `?board=${boardId}&card=${card.id}`;
            navigator.clipboard.writeText(url.toString());
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
          aria-label={`Copy link to ${card.title}`}
          title="Copy card link"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(card);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
            aria-label={`Edit ${card.title}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="pr-6">
        <p className="font-medium text-sm wrap-break-word">{card.title}</p>
        {(card.summary || card.description) && (
          <p className="text-xs text-muted-foreground mt-1 wrap-break-word">
            {card.summary || card.description}
          </p>
        )}
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {card.labels.map((label) => {
              const prNumber = parsePrLabel(label);
              if (prNumber) {
                return (
                  <a
                    key={label}
                    href={`${REPO_URL}/pull/${prNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="inline-flex"
                  >
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 hover:bg-primary/20 transition-colors cursor-pointer">
                      {label}
                      <ExternalLink className="w-2.5 h-2.5 ml-1 opacity-60" />
                    </Badge>
                  </a>
                );
              }
              return (
                <Badge key={label} variant="secondary" className="text-xs px-1.5 py-0">
                  {label}
                </Badge>
              );
            })}
          </div>
        )}
        {(card.checklist?.length || card.planFile || displayStatus || statusLoading || (isChangelog && hasPrLabel(card.labels))) && (
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {isChangelog && hasPrLabel(card.labels) && (
              <div className="flex items-center gap-1" title="Merged">
                <GitMerge className="w-3.5 h-3.5 text-purple-500" />
              </div>
            )}
            {!isChangelog && statusLoading && (
              <div className="flex items-center gap-1" title="Checking CI status...">
                <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
              </div>
            )}
            {!isChangelog && !statusLoading && displayStatus && (
              <div className="flex items-center gap-1" title={`CI: ${displayStatus}`}>
                {displayStatus === 'passing' && (
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                )}
                {displayStatus === 'failing' && (
                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                )}
                {displayStatus === 'pending' && (
                  <Clock className="w-3.5 h-3.5 text-yellow-500" />
                )}
              </div>
            )}
            {card.checklist && card.checklist.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(card, 'checklist');
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="flex items-center gap-1 hover:text-primary transition-colors"
                title="View checklist"
              >
                <CheckSquare className="w-3 h-3" />
                <span>
                  {card.checklist.filter((item) => item.completed).length}/{card.checklist.length}
                </span>
              </button>
            )}
            {card.planFile && (
              <a
                href={`${REPO_URL}/blob/main/${card.planFile}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="flex items-center gap-1 hover:text-primary transition-colors"
                title="View plan document"
              >
                <FileText className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
