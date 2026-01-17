import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Tool, ToolPreset } from './types';

interface LearnHeaderProps {
  tool: Tool;
  preset: ToolPreset | null;
  onTryCommand: (command: string) => void;
}

// Command hints for each tool - concepts to explore
const COMMAND_HINTS: Record<Tool, { label: string; command: string; tip: string }[]> = {
  jq: [
    { label: '.field', command: '.name', tip: 'Access a field' },
    { label: 'keys', command: 'keys', tip: 'Get object keys' },
    { label: '.[]', command: '.[]', tip: 'Iterate array' },
    { label: 'select()', command: '.[] | select(.age > 25)', tip: 'Filter items' },
  ],
  grep: [
    { label: 'pattern', command: 'error', tip: 'Match text' },
    { label: '-i', command: '-i error', tip: 'Case insensitive' },
    { label: '-v', command: '-v error', tip: 'Invert match' },
    { label: '-n', command: '-n error', tip: 'Line numbers' },
  ],
  sed: [
    { label: 's/a/b/', command: 's/old/new/', tip: 'Replace first' },
    { label: 's/a/b/g', command: 's/old/new/g', tip: 'Replace all' },
    { label: '/p/d', command: '/^#/d', tip: 'Delete lines' },
  ],
  awk: [
    { label: '$1', command: '{print $1}', tip: 'First column' },
    { label: '$1,$2', command: '{print $1, $2}', tip: 'Multiple columns' },
    { label: 'sum', command: '{sum += $2} END {print sum}', tip: 'Sum values' },
  ],
};

export function LearnHeader({ tool, preset, onTryCommand }: LearnHeaderProps) {
  if (!preset) return null;

  const hints = COMMAND_HINTS[tool];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
      {/* Goal */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Target className="h-4 w-4 text-blue-500 shrink-0" />
        <span className="text-sm truncate">{preset.description}</span>
      </div>

      {/* Command chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">Try:</span>
        {hints.map((hint) => (
          <Button
            key={hint.label}
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs font-mono"
            onClick={() => onTryCommand(hint.command)}
            title={hint.tip}
          >
            {hint.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
