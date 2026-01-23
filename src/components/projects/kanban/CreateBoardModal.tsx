import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const WORKER_URL = 'https://api.dylanbochman.com';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (boardId: string) => void;
}

export function CreateBoardModal({ isOpen, onClose, onCreated }: CreateBoardModalProps) {
  const [title, setTitle] = useState('');
  const [id, setId] = useState('');
  const [idManuallyEdited, setIdManuallyEdited] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate ID from title (unless manually edited)
  useEffect(() => {
    if (!idManuallyEdited) {
      const generated = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
      setId(generated);
    }
  }, [title, idManuallyEdited]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setId('');
      setIdManuallyEdited(false);
      setError(null);
    }
  }, [isOpen]);

  function handleIdChange(value: string) {
    setId(value);
    setIdManuallyEdited(true);
  }

  async function handleCreate() {
    if (!id || !title) {
      setError('Title and ID are required');
      return;
    }

    // Validate ID format
    if (!/^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]?$/.test(id)) {
      setError('ID must be lowercase letters, numbers, and hyphens only');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch(`${WORKER_URL}/boards`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'board_exists') {
          setError('A board with this ID already exists');
        } else if (data.error === 'not_authenticated') {
          setError('You must be logged in to create boards');
        } else {
          setError(data.message || data.error || 'Failed to create board');
        }
        return;
      }

      onCreated(data.boardId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Board</DialogTitle>
          <DialogDescription>
            Create a new kanban board to organize your tasks.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="board-title">Board Title</Label>
            <Input
              id="board-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Project Board"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="board-id">Board ID</Label>
            <Input
              id="board-id"
              value={id}
              onChange={(e) => handleIdChange(e.target.value)}
              placeholder="my-project-board"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Used in URLs: /projects/kanban?board=<span className="font-mono">{id || 'my-board'}</span>
            </p>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!id || !title || isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Board'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
