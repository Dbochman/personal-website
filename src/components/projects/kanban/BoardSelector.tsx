import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LayoutGrid, ChevronDown, Plus, Loader2 } from 'lucide-react';

const WORKER_URL = 'https://api.dylanbochman.com';

interface BoardSummary {
  id: string;
  title: string;
  cardCount: number;
}

interface BoardSelectorProps {
  currentBoardId: string;
  currentBoardTitle: string;
  onCreateNew: () => void;
  isAuthenticated: boolean;
}

export function BoardSelector({
  currentBoardId,
  currentBoardTitle,
  onCreateNew,
  isAuthenticated,
}: BoardSelectorProps) {
  const [, setSearchParams] = useSearchParams();
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function loadBoards() {
      try {
        const res = await fetch(`${WORKER_URL}/boards`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setBoards(data.boards || []);
        }
      } catch (err) {
        console.error('Failed to load boards:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadBoards();
  }, []);

  function handleBoardSelect(boardId: string) {
    setSearchParams({ board: boardId });
    setIsOpen(false);
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <LayoutGrid className="h-4 w-4" />
          <span className="max-w-[150px] truncate">{currentBoardTitle}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : boards.length === 0 ? (
          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
            No boards found
          </div>
        ) : (
          boards.map((board) => (
            <DropdownMenuItem
              key={board.id}
              onClick={() => handleBoardSelect(board.id)}
              className={board.id === currentBoardId ? 'bg-accent' : ''}
            >
              <span className="flex-1 truncate">{board.title}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {board.cardCount}
              </span>
            </DropdownMenuItem>
          ))
        )}
        {isAuthenticated && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              New Board...
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
