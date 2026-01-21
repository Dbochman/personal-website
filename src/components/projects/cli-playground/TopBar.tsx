import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RotateCcw, Share2, BookOpen, Terminal, ChevronDown } from 'lucide-react';
import type { Tool, Mode, ToolPreset } from './types';
import { TOOL_CONFIGS } from './types';
import { toast } from 'sonner';
import { trackToolEvent } from '@/lib/trackToolEvent';

interface TopBarProps {
  tool: Tool;
  mode: Mode;
  currentPreset: ToolPreset | null;
  onToolChange: (tool: Tool) => void;
  onModeChange: (mode: Mode) => void;
  onPresetSelect: (preset: ToolPreset) => void;
  onReset: () => void;
}

const TOOLS: Tool[] = ['kubectl', 'jq', 'grep', 'sed', 'awk'];

export function TopBar({
  tool,
  mode,
  currentPreset,
  onToolChange,
  onModeChange,
  onPresetSelect,
  onReset,
}: TopBarProps) {
  const config = TOOL_CONFIGS[tool];

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    trackToolEvent({ tool_name: 'cli_playground', action: 'share_copy', event_label: tool });
    toast.success('Link copied to clipboard');
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Tool tabs + Lesson selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <ToggleGroup
          type="single"
          value={tool}
          onValueChange={(v) => v && onToolChange(v as Tool)}
          className="bg-zinc-200 dark:bg-zinc-800 p-1 rounded-lg"
        >
          {TOOLS.map((t) => (
            <ToggleGroupItem
              key={t}
              value={t}
              aria-label={`Select ${t}`}
              className="font-mono text-sm px-3 data-[state=on]:bg-background data-[state=on]:shadow-xs"
            >
              {t}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {/* Lesson dropdown - shows current lesson name */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-sm font-normal">
              <span className="max-w-[140px] truncate">
                {currentPreset?.name || 'Select lesson'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {config.presets.map((preset) => (
              <DropdownMenuItem
                key={preset.name}
                onClick={() => onPresetSelect(preset)}
                className="flex flex-col items-start gap-0.5 py-2"
              >
                <span className="font-medium">{preset.name}</span>
                <span className="text-xs text-muted-foreground">{preset.description}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right: Mode toggle + actions */}
      <div className="flex items-center gap-2">
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && onModeChange(v as Mode)}
          className="bg-zinc-200 dark:bg-zinc-800 p-1 rounded-lg"
        >
          <ToggleGroupItem
            value="learn"
            aria-label="Learn mode"
            className="text-sm px-3 gap-1.5 data-[state=on]:bg-background data-[state=on]:shadow-xs"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Learn</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="playground"
            aria-label="Playground mode"
            className="text-sm px-3 gap-1.5 data-[state=on]:bg-background data-[state=on]:shadow-xs"
          >
            <Terminal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Play</span>
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Icon-only actions with tooltips */}
        <div className="flex items-center gap-0.5 border-l pl-2 ml-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onReset} className="h-8 w-8">
                <RotateCcw className="h-4 w-4" />
                <span className="sr-only">Reset</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset to default</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleShare} className="h-8 w-8">
                <Share2 className="h-4 w-4" />
                <span className="sr-only">Share</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy link</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
