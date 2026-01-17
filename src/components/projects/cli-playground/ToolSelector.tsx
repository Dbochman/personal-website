import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Tool } from './types';
import { TOOL_CONFIGS } from './types';

interface ToolSelectorProps {
  value: Tool;
  onChange: (tool: Tool) => void;
}

const TOOLS: Tool[] = ['jq', 'grep', 'sed', 'awk'];

export function ToolSelector({ value, onChange }: ToolSelectorProps) {
  return (
    <div className="space-y-2">
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => v && onChange(v as Tool)}
        className="justify-start"
      >
        {TOOLS.map((tool) => (
          <ToggleGroupItem
            key={tool}
            value={tool}
            aria-label={`Select ${tool}`}
            className="font-mono px-4"
          >
            {tool}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className="text-sm text-muted-foreground">
        {TOOL_CONFIGS[value].description}
      </p>
    </div>
  );
}
