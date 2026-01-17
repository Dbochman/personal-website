import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RotateCcw, Share2, BookOpen, Terminal } from 'lucide-react';
import type { Tool, Mode, ToolPreset } from './types';
import { TOOL_CONFIGS } from './types';
import { toast } from 'sonner';

interface TopBarProps {
  tool: Tool;
  mode: Mode;
  onToolChange: (tool: Tool) => void;
  onModeChange: (mode: Mode) => void;
  onPresetSelect: (preset: ToolPreset) => void;
  onReset: () => void;
}

const TOOLS: Tool[] = ['jq', 'grep', 'sed', 'awk'];

export function TopBar({
  tool,
  mode,
  onToolChange,
  onModeChange,
  onPresetSelect,
  onReset,
}: TopBarProps) {
  const config = TOOL_CONFIGS[tool];

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Tool tabs + Examples */}
      <div className="flex items-center gap-3 flex-wrap">
        <ToggleGroup
          type="single"
          value={tool}
          onValueChange={(v) => v && onToolChange(v as Tool)}
          className="bg-muted/50 p-1 rounded-lg"
        >
          {TOOLS.map((t) => (
            <ToggleGroupItem
              key={t}
              value={t}
              aria-label={`Select ${t}`}
              className="font-mono text-sm px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm"
            >
              {t}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Select
          onValueChange={(value) => {
            const preset = config.presets.find((p) => p.name === value);
            if (preset) onPresetSelect(preset);
          }}
        >
          <SelectTrigger className="w-[160px] h-8 text-sm">
            <SelectValue placeholder="Examples..." />
          </SelectTrigger>
          <SelectContent>
            {config.presets.map((preset) => (
              <SelectItem key={preset.name} value={preset.name} className="text-sm">
                {preset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Right: Mode toggle + actions */}
      <div className="flex items-center gap-2">
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && onModeChange(v as Mode)}
          className="bg-muted/50 p-1 rounded-lg"
        >
          <ToggleGroupItem
            value="learn"
            aria-label="Learn mode"
            className="text-sm px-3 gap-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Learn</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="playground"
            aria-label="Playground mode"
            className="text-sm px-3 gap-1.5 data-[state=on]:bg-background data-[state=on]:shadow-sm"
          >
            <Terminal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Play</span>
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="flex items-center gap-1 border-l pl-2 ml-1">
          <Button variant="ghost" size="sm" onClick={onReset} className="h-8 px-2">
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:ml-1">Reset</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShare} className="h-8 px-2">
            <Share2 className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:ml-1">Share</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
