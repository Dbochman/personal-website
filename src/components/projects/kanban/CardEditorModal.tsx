import { useState, useEffect } from 'react';
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
import { X } from 'lucide-react';
import type { KanbanCard } from '@/types/kanban';
import { generateId } from '@/types/kanban';

interface CardEditorModalProps {
  card: KanbanCard | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: KanbanCard) => void;
  onDelete?: (cardId: string) => void;
}

export function CardEditorModal({
  card,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: CardEditorModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || '');
      setLabels(card.labels || []);
    } else {
      setTitle('');
      setDescription('');
      setLabels([]);
    }
  }, [card]);

  const handleSave = () => {
    if (!title.trim()) return;

    onSave({
      id: card?.id || generateId(),
      title: title.trim(),
      description: description.trim() || undefined,
      labels: labels.length > 0 ? labels : undefined,
      createdAt: card?.createdAt || new Date().toISOString(),
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddLabel();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
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
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="labels">Labels</Label>
            <div className="flex gap-2">
              <Input
                id="labels"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a label"
                className="flex-1"
              />
              <Button type="button" variant="secondary" onClick={handleAddLabel}>
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
