import { Target, Lightbulb } from 'lucide-react';
import type { ToolPreset } from './types';

interface LearnHeaderProps {
  preset: ToolPreset | null;
}

export function LearnHeader({ preset }: LearnHeaderProps) {
  if (!preset) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
      <div className="flex items-start gap-2 flex-1">
        <Target className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
        <div>
          <span className="text-xs font-medium text-blue-500 uppercase tracking-wide">Goal</span>
          <p className="text-sm mt-0.5">{preset.description}</p>
        </div>
      </div>
      <div className="flex items-start gap-2 flex-1">
        <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
        <div>
          <span className="text-xs font-medium text-yellow-500 uppercase tracking-wide">Hint</span>
          <p className="text-sm text-muted-foreground mt-0.5">
            Try the command: <code className="bg-muted px-1 rounded text-xs">{preset.command}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
