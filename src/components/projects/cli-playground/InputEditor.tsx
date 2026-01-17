import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface InputEditorProps {
  value: string;
  onChange: (value: string) => void;
  tool: string;
}

export function InputEditor({ value, onChange, tool }: InputEditorProps) {
  const placeholder =
    tool === 'jq'
      ? '{"key": "value"}'
      : 'Enter text data, one line per record...';

  return (
    <div className="space-y-2">
      <Label htmlFor="input-editor">Input Data</Label>
      <Textarea
        id="input-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-mono text-sm min-h-[150px] resize-y"
        spellCheck={false}
      />
    </div>
  );
}
