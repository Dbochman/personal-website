import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Tool, ToolPreset } from './types';
import { TOOL_CONFIGS } from './types';

interface PresetSelectorProps {
  tool: Tool;
  onSelect: (preset: ToolPreset) => void;
}

export function PresetSelector({ tool, onSelect }: PresetSelectorProps) {
  const config = TOOL_CONFIGS[tool];

  return (
    <Select
      onValueChange={(value) => {
        const preset = config.presets.find((p) => p.name === value);
        if (preset) onSelect(preset);
      }}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Load example..." />
      </SelectTrigger>
      <SelectContent>
        {config.presets.map((preset) => (
          <SelectItem key={preset.name} value={preset.name}>
            <div className="flex flex-col items-start">
              <span>{preset.name}</span>
              <span className="text-xs text-muted-foreground">
                {preset.description}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
