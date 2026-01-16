import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { X, History, Plus, FileText, ExternalLink, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KanbanCard, CardChange, ChecklistItem, CardColor } from '@/types/kanban';
import { generateId, CARD_COLORS } from '@/types/kanban';
import { CardComments } from './CardComments';

const colorKeys = Object.keys(CARD_COLORS) as CardColor[];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatChangeDescription(change: CardChange): string {
  switch (change.type) {
    case 'column':
      return `Moved to ${change.columnTitle}`;
    case 'title':
      return `Title: "${change.from}" → "${change.to}"`;
    case 'description':
      if (!change.from) return 'Description added';
      if (!change.to) return 'Description removed';
      return 'Description updated';
    case 'labels':
      return `Labels: ${change.from || '(none)'} → ${change.to || '(none)'}`;
    default:
      return 'Updated';
  }
}

interface CardEditorModalProps {
  card: KanbanCard | null;
  isOpen: boolean;
  scrollTo?: string;
  onClose: () => void;
  onSave: (card: KanbanCard) => void;
  onDelete?: (cardId: string) => void;
}

export function CardEditorModal({
  card,
  isOpen,
  scrollTo,
  onClose,
  onSave,
  onDelete,
}: CardEditorModalProps) {
  const checklistRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [color, setColor] = useState<CardColor | undefined>(undefined);

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || '');
      setLabels(card.labels || []);
      setChecklist(card.checklist || []);
      setColor(card.color);
    } else {
      setTitle('');
      setDescription('');
      setLabels([]);
      setChecklist([]);
      setColor(undefined);
    }
    setNewLabel('');
    setNewChecklistItem('');
  }, [card]);

  // Scroll to section when modal opens
  useEffect(() => {
    if (isOpen && scrollTo === 'checklist' && checklistRef.current) {
      // Small delay to ensure modal content is rendered
      setTimeout(() => {
        checklistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isOpen, scrollTo]);

  const handleSave = () => {
    if (!title.trim()) return;

    const now = new Date().toISOString();
    const newHistory: CardChange[] = [...(card?.history || [])];

    // Track changes for existing cards
    if (card) {
      const trimmedTitle = title.trim();
      const trimmedDesc = description.trim();
      const oldLabels = (card.labels || []).join(', ');
      const newLabels = labels.join(', ');

      if (trimmedTitle !== card.title) {
        newHistory.push({ type: 'title', timestamp: now, from: card.title, to: trimmedTitle });
      }
      if (trimmedDesc !== (card.description || '')) {
        newHistory.push({ type: 'description', timestamp: now, from: card.description || '', to: trimmedDesc });
      }
      if (newLabels !== oldLabels) {
        newHistory.push({ type: 'labels', timestamp: now, from: oldLabels, to: newLabels });
      }
    }

    onSave({
      id: card?.id || generateId(),
      title: title.trim(),
      description: description.trim() || undefined,
      labels: labels.length > 0 ? labels : undefined,
      checklist: checklist.length > 0 ? checklist : undefined,
      color,
      createdAt: card?.createdAt || now,
      history: newHistory.length > 0 ? newHistory : undefined,
    });
    onClose();
  };

  const handleAddLabel = () => {
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      setLabels([...labels, newLabel.trim()]);
      setNewLabel('');
    }
  };

  const handleRemoveLabel = (label: string) => {
    setLabels(labels.filter((l) => l !== label));
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddLabel();
    }
  };

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklist([...checklist, { id: generateId(), text: newChecklistItem.trim(), completed: false }]);
      setNewChecklistItem('');
    }
  };

  const handleToggleChecklistItem = (itemId: string) => {
    setChecklist(checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleRemoveChecklistItem = (itemId: string) => {
    setChecklist(checklist.filter((item) => item.id !== itemId));
  };

  const handleChecklistKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddChecklistItem();
    }
  };

  const completedCount = checklist.filter((item) => item.completed).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[475px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{card ? 'Edit Card' : 'New Card'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Card title"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="labels">Labels</Label>
            <div className="flex gap-2">
              <Input
                id="labels"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={handleLabelKeyDown}
                placeholder="Add a label"
                className="flex-1"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddLabel}>
                Add
              </Button>
            </div>
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {labels.map((label) => (
                  <Badge key={label} variant="secondary" className="pr-1">
                    {label}
                    <button
                      onClick={() => handleRemoveLabel(label)}
                      className="ml-1 hover:text-destructive"
                      aria-label={`Remove ${label} label`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <Label>Color (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {/* None button */}
              <button
                type="button"
                onClick={() => setColor(undefined)}
                title="None"
                className={cn(
                  'w-8 h-8 rounded-full border-2 transition-all bg-background',
                  !color
                    ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
                    : 'border-border hover:scale-110'
                )}
              >
                <span className="sr-only">None</span>
              </button>
              {colorKeys.filter(k => k !== 'default').map((colorKey) => {
                const config = CARD_COLORS[colorKey];
                const isSelected = color === colorKey;
                return (
                  <button
                    key={colorKey}
                    type="button"
                    onClick={() => setColor(colorKey)}
                    title={config.label}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all',
                      config.dot,
                      isSelected
                        ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : 'border-transparent hover:scale-110'
                    )}
                  >
                    <span className="sr-only">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Checklist / Subtasks */}
          <div ref={checklistRef} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Checklist</Label>
              {checklist.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {completedCount}/{checklist.length}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={handleChecklistKeyDown}
                placeholder="Add subtask..."
                className="flex-1"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddChecklistItem}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {checklist.length > 0 && (
              <div className="space-y-1 mt-2">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <Checkbox
                      id={item.id}
                      checked={item.completed}
                      onCheckedChange={() => handleToggleChecklistItem(item.id)}
                    />
                    <label
                      htmlFor={item.id}
                      className={`flex-1 text-sm cursor-pointer ${item.completed ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {item.text}
                    </label>
                    <button
                      onClick={() => handleRemoveChecklistItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      aria-label={`Remove ${item.text}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Plan file link */}
          {card?.planFile && (
            <div className="space-y-2">
              <Label>Plan Document</Label>
              <a
                href={`https://github.com/Dbochman/personal-website/blob/main/${card.planFile}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-md border bg-muted/50 hover:bg-muted transition-colors text-sm"
              >
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 truncate">{card.planFile.split('/').pop()}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </a>
            </div>
          )}

          {/* Card metadata & history */}
          {card && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Created: {formatDate(card.createdAt)}</span>
                {card.updatedAt && (
                  <>
                    <span>•</span>
                    <span>Updated: {formatDate(card.updatedAt)}</span>
                  </>
                )}
              </div>
              {card.history && card.history.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <History className="w-3 h-3" />
                    <span>History</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-2 max-h-32 overflow-y-auto">
                    {[...card.history].reverse().map((change, i) => (
                      <div key={i} className="flex flex-col gap-0.5">
                        <span className="break-words">{formatChangeDescription(change)}</span>
                        <span className="text-muted-foreground/70">{formatDate(change.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Comments section */}
          {card && (
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="w-3 h-3" />
                <span>Discussion</span>
              </div>
              <CardComments cardId={card.id} />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {card && onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                onDelete(card.id);
                onClose();
              }}
              className="mr-auto"
            >
              Delete
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!title.trim()}>
            {card ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
