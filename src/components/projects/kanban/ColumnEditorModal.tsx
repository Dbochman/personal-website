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
import { Label } from '@/components/ui/label';

interface ColumnEditorModalProps {
  columnTitle: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string) => void;
}

export function ColumnEditorModal({
  columnTitle,
  isOpen,
  onClose,
  onSave,
}: ColumnEditorModalProps) {
  const [title, setTitle] = useState('');

  useEffect(() => {
    setTitle(columnTitle || '');
  }, [columnTitle]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave(title.trim());
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle>{columnTitle ? 'Rename Column' : 'New Column'}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="column-title">Column Name</Label>
          <Input
            id="column-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Column name"
            autoFocus
            className="mt-2"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!title.trim()}>
            {columnTitle ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
