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
import { cn } from '@/lib/utils';
import type { KanbanColumn, ColumnColor } from '@/types/kanban';
import { COLUMN_COLORS } from '@/types/kanban';

interface ColumnEditorModalProps {
  column: KanbanColumn | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; description?: string; color?: ColumnColor }) => void;
  onDelete?: (columnId: string) => void;
}

const colorKeys = Object.keys(COLUMN_COLORS) as ColumnColor[];

export function ColumnEditorModal({
  column,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: ColumnEditorModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<ColumnColor>('default');

  useEffect(() => {
    if (column) {
      setTitle(column.title);
      setDescription(column.description || '');
      setColor(column.color || 'default');
    } else {
      setTitle('');
      setDescription('');
      setColor('default');
    }
  }, [column]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      color: color !== 'default' ? color : undefined,
    });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{column ? 'Edit Column' : 'New Column'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="column-title">Name</Label>
            <Input
              id="column-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Column name"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="column-description">Description (optional)</Label>
            <Textarea
              id="column-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What belongs in this column?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {colorKeys.map((colorKey) => {
                const config = COLUMN_COLORS[colorKey];
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
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {column && onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                onDelete(column.id);
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
            {column ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
