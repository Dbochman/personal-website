import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import type { CommandExplanation, Mode } from './types';

interface WorkspaceProps {
  input: string;
  output: string;
  error?: string;
  isLoading: boolean;
  mode: Mode;
  explanation: CommandExplanation | null;
  hideStdin?: boolean;
  emptyStatePrompt?: string; // Lesson-aware prompt for empty output
  onInputChange: (value: string) => void;
  onTryCommand: (command: string) => void;
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

type OutputTab = 'output' | 'explain';

export function Workspace({
  input,
  output,
  error,
  isLoading,
  mode,
  explanation,
  hideStdin,
  emptyStatePrompt,
  onInputChange,
  onTryCommand,
}: WorkspaceProps) {
  const [copied, setCopied] = useState(false);
  const [inputCollapsed, setInputCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<OutputTab>('output');

  const inputLines = input.split('\n').length;
  const outputLines = (error || output || '').split('\n').length;

  const handleCopy = async () => {
    const text = error || output;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showTabs = mode === 'learn';
  // In playground mode, always show output regardless of activeTab state
  const effectiveTab = showTabs ? activeTab : 'output';

  return (
    <div className={`grid gap-3 ${hideStdin ? '' : 'lg:grid-cols-2'} min-h-[200px]`}>
      {/* Input (stdin) Panel - hidden for kubectl */}
      {!hideStdin && (
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
      )}

      {/* Output Panel with tabs in Learn mode */}
      <div className="flex flex-col border rounded-lg overflow-hidden bg-muted/20">
        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b">
          {showTabs ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('output')}
                className={`text-xs font-medium px-2 py-0.5 rounded transition-colors ${
                  effectiveTab === 'output'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {error ? 'Error' : 'Output'}
              </button>
              <button
                onClick={() => setActiveTab('explain')}
                className={`text-xs font-medium px-2 py-0.5 rounded transition-colors ${
                  effectiveTab === 'explain'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Explain
              </button>
            </div>
          ) : (
            <span className="text-xs font-medium text-muted-foreground">
              {error ? 'Error' : 'Output'}
            </span>
          )}
          {effectiveTab === 'output' && (
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
          )}
        </div>

        {/* Output content */}
        {effectiveTab === 'output' && (
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
                <span className="text-muted-foreground/50">
                  {emptyStatePrompt || 'Output will appear here...'}
                </span>
              )}
            </pre>
          </div>
        )}

        {/* Explain content */}
        {effectiveTab === 'explain' && (
          <div className="flex-1 p-4 overflow-auto min-h-[150px] space-y-4">
            {explanation ? (
              <>
                {/* Summary */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    What it does
                  </h4>
                  <p className="text-sm">{explanation.summary}</p>
                </div>

                {/* Flags */}
                {explanation.flags.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Flags used
                    </h4>
                    <div className="space-y-1.5">
                      {explanation.flags.map((f) => (
                        <div key={f.flag} className="flex items-start gap-2 text-sm">
                          <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono shrink-0">
                            {f.flag}
                          </code>
                          <span className="text-muted-foreground">{f.meaning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Try next */}
                {explanation.tryNext.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Try next
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {explanation.tryNext.map((item) => (
                        <Button
                          key={item.label}
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => {
                            onTryCommand(item.command);
                            setActiveTab('output');
                          }}
                        >
                          {item.label}
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Enter a command to see an explanation.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
