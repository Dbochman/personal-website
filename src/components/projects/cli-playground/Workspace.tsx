import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface WorkspaceProps {
  input: string;
  output: string;
  error?: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
}

function LineNumbers({ count }: { count: number }) {
  return (
    <div className="select-none text-right pr-2 text-muted-foreground/50 font-mono text-xs leading-5 pt-3 pb-3">
      {Array.from({ length: Math.max(count, 1) }, (_, i) => (
        <div key={i}>{i + 1}</div>
      ))}
    </div>
  );
}

export function Workspace({
  input,
  output,
  error,
  isLoading,
  onInputChange,
}: WorkspaceProps) {
  const [copied, setCopied] = useState(false);
  const [inputCollapsed, setInputCollapsed] = useState(false);

  const inputLines = input.split('\n').length;
  const outputLines = (error || output || '').split('\n').length;

  const handleCopy = async () => {
    const text = error || output;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid gap-3 lg:grid-cols-2 min-h-[200px]">
      {/* Input (stdin) Panel */}
      <div className="flex flex-col border rounded-lg overflow-hidden bg-muted/20">
        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b">
          <span className="text-xs font-medium text-muted-foreground">stdin</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 lg:hidden"
            onClick={() => setInputCollapsed(!inputCollapsed)}
          >
            {inputCollapsed ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        <div className={`flex flex-1 ${inputCollapsed ? 'hidden lg:flex' : ''}`}>
          <LineNumbers count={inputLines} />
          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Paste or type input data..."
            className="flex-1 bg-transparent border-none outline-none resize-none font-mono text-sm leading-5 p-3 pl-0 min-h-[150px]"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Output (stdout) Panel */}
      <div className="flex flex-col border rounded-lg overflow-hidden bg-muted/20">
        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b">
          <span className="text-xs font-medium text-muted-foreground">
            {error ? 'stderr' : 'stdout'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 gap-1"
            onClick={handleCopy}
            disabled={!output && !error}
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span className="text-xs">Copy</span>
          </Button>
        </div>
        <div className="flex flex-1">
          <LineNumbers count={outputLines} />
          <pre
            className={`flex-1 font-mono text-sm leading-5 p-3 pl-0 overflow-auto whitespace-pre-wrap min-h-[150px] ${
              error ? 'text-red-400' : ''
            }`}
          >
            {isLoading ? (
              <span className="text-muted-foreground animate-pulse">Running...</span>
            ) : error ? (
              error
            ) : output ? (
              output
            ) : (
              <span className="text-muted-foreground/50">Output will appear here...</span>
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
