import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Tool, ToolPreset } from './types';

interface LearnHeaderProps {
  tool: Tool;
  preset: ToolPreset | null;
  onTryCommand: (command: string) => void;
}

// Command hints for each tool - concepts to explore
const COMMAND_HINTS: Record<Tool, { label: string; command: string }[]> = {
  jq: [
    { label: 'Get field', command: '.name' },
    { label: 'List keys', command: 'keys' },
    { label: 'Iterate array', command: '.[]' },
    { label: 'Filter items', command: '.[] | select(.level == "error")' },
  ],
  grep: [
    { label: 'Match text', command: 'error' },
    { label: 'Ignore case', command: '-i error' },
    { label: 'Extended regex', command: '-E "(ERROR|FATAL)"' },
    { label: 'Line numbers', command: '-n error' },
  ],
  sed: [
    { label: 'Replace first', command: 's/old/new/' },
    { label: 'Replace all', command: 's/old/new/g' },
    { label: 'Delete lines', command: '/^#/d' },
  ],
  awk: [
    { label: 'First column', command: '{print $1}' },
    { label: 'Multiple cols', command: '{print $1, $2}' },
    { label: 'Sum values', command: '{sum += $2} END {print sum}' },
  ],
  kubectl: [
    { label: 'Get pods', command: 'get pods' },
    { label: 'Describe pod', command: 'describe pod' },
    { label: 'Tail logs', command: 'logs' },
    { label: 'Get events', command: 'get events' },
  ],
};

export function LearnHeader({ tool, preset, onTryCommand }: LearnHeaderProps) {
  if (!preset) return null;

  const baseHints = COMMAND_HINTS[tool];

  // For kubectl, add namespace to commands
  const hints = tool === 'kubectl' && preset.namespace
    ? baseHints.map(hint => ({
        ...hint,
        command: hint.command.includes('-n ')
          ? hint.command
          : `${hint.command} -n ${preset.namespace}`,
      }))
    : baseHints;

  // Use objective for kubectl, description for others
  const goalText = (tool === 'kubectl' && preset.objective) || preset.description;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
      {/* Goal */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Target className="h-4 w-4 text-blue-500 shrink-0" />
        <span className="text-sm">{goalText}</span>
      </div>

      {/* Command chips with tooltips showing exact command */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">Try:</span>
        {hints.map((hint) => (
          <Tooltip key={hint.label}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => onTryCommand(hint.command)}
              >
                {hint.label}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <code className="font-mono text-xs">{hint.command}</code>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
