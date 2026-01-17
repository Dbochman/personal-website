import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Tool } from './types';
import { TOOL_CONFIGS } from './types';

interface CommandEditorProps {
  tool: Tool;
  value: string;
  onChange: (value: string) => void;
}

export function CommandEditor({ tool, value, onChange }: CommandEditorProps) {
  const config = TOOL_CONFIGS[tool];

  return (
    <div className="space-y-2">
      <Label htmlFor="command-editor">Command</Label>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-1.5 rounded">
          {tool}
        </span>
        <Input
          id="command-editor"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder}
          className="font-mono text-sm flex-1"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
