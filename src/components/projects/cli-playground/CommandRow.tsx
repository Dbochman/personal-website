import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Loader2 } from 'lucide-react';
import type { Tool } from './types';

interface CommandRowProps {
  tool: Tool;
  command: string;
  isLoading: boolean;
  onCommandChange: (command: string) => void;
  onRun: () => void;
}

export function CommandRow({
  tool,
  command,
  isLoading,
  onCommandChange,
  onRun,
}: CommandRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount and tool change
  useEffect(() => {
    inputRef.current?.focus();
  }, [tool]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onRun();
    }
  };

  return (
    <div className="flex items-center gap-2 bg-muted/30 border rounded-lg p-2">
      {/* Terminal prompt */}
      <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-sm shrink-0">
        <span className="text-green-500">$</span>
        <span className="text-primary">{tool}</span>
      </div>

      {/* Command input */}
      <input
        ref={inputRef}
        type="text"
        value={command}
        onChange={(e) => onCommandChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter command..."
        className="flex-1 bg-transparent border-none outline-hidden font-mono text-sm placeholder:text-muted-foreground/50"
        spellCheck={false}
        autoComplete="off"
      />

      {/* Run button */}
      <Button
        onClick={onRun}
        disabled={isLoading}
        size="sm"
        className="shrink-0 gap-1.5"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Run</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-1">
          <span className="text-xs">⌘</span>↵
        </kbd>
      </Button>
    </div>
  );
}
