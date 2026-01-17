import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Copy, Check, Trash2, Loader2 } from 'lucide-react';

interface OutputPanelProps {
  output: string;
  error?: string;
  isLoading: boolean;
  onClear: () => void;
}

export function OutputPanel({ output, error, isLoading, onClear }: OutputPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const textToCopy = error || output;
    if (!textToCopy) return;

    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasContent = output || error;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Output</Label>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={!hasContent || isLoading}
            className="h-7 px-2"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span className="sr-only">Copy output</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={!hasContent || isLoading}
            className="h-7 px-2"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">Clear output</span>
          </Button>
        </div>
      </div>
      <div
        className={`font-mono text-sm min-h-[150px] p-3 rounded-md border bg-muted/50 overflow-auto whitespace-pre-wrap ${
          error ? 'text-destructive border-destructive/50' : ''
        }`}
      >
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Running...</span>
          </div>
        ) : error ? (
          error
        ) : output ? (
          output
        ) : (
          <span className="text-muted-foreground">
            Output will appear here...
          </span>
        )}
      </div>
    </div>
  );
}
