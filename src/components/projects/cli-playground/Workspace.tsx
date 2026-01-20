import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import type { CommandExplanation, Mode, Tool } from './types';

interface WorkspaceProps {
  input: string;
  output: string;
  error?: string;
  isLoading: boolean;
  mode: Mode;
  tool: Tool;
  command: string;
  goalStatus?: {
    status: 'pass' | 'fail' | 'pending';
    label: string;
  };
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

type OutputTab = 'output' | 'diff' | 'explain';

export function Workspace({
  input,
  output,
  error,
  isLoading,
  mode,
  tool,
  command,
  goalStatus,
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

  const availableTabs = useMemo<OutputTab[]>(() => {
    const tabs: OutputTab[] = ['output'];
    if (tool === 'sed') {
      tabs.push('diff');
    }
    if (mode === 'learn') {
      tabs.push('explain');
    }
    return tabs;
  }, [tool, mode]);
  const showTabs = availableTabs.length > 1;
  const shouldHighlightGrep = tool === 'grep' && !error && !!output && !isLoading;

  const getGrepHighlightRegex = (command: string): RegExp | null => {
    const parts = command.match(/^(-[invE]+\s+)?(.+)$/);
    if (!parts) return null;

    const flags = parts[1]?.trim() || '';
    if (flags.includes('v')) return null;

    let pattern = parts[2].trim();
    if ((pattern.startsWith('"') && pattern.endsWith('"')) ||
        (pattern.startsWith("'") && pattern.endsWith("'"))) {
      pattern = pattern.slice(1, -1);
    }

    const caseInsensitive = flags.includes('i');
    const extendedRegex = flags.includes('E');
    const regexFlags = caseInsensitive ? 'gi' : 'g';
    const regexPattern = extendedRegex
      ? pattern
      : pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    try {
      return new RegExp(regexPattern, regexFlags);
    } catch {
      return null;
    }
  };

  const renderHighlightedLine = (line: string, regex: RegExp, lineIndex: number) => {
    regex.lastIndex = 0;
    const parts: ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line)) !== null) {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      if (start > lastIndex) {
        parts.push(line.slice(lastIndex, start));
      }
      parts.push(
        <mark
          key={`${lineIndex}-${start}`}
          className="bg-amber-200/40 text-foreground rounded-sm px-0.5"
        >
          {line.slice(start, end)}
        </mark>
      );
      lastIndex = end;
    }

    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }

    return parts.length > 0 ? parts : line;
  };

  const highlightRegex = shouldHighlightGrep ? getGrepHighlightRegex(command) : null;
  const shouldRenderHighlights = highlightRegex && output.trim() !== '(no matches)';
  const highlightedOutput = shouldRenderHighlights
    ? output.split('\n').map((line, index, arr) => (
        <span key={`${index}`}>
          {renderHighlightedLine(line, highlightRegex, index)}
          {index < arr.length - 1 ? '\n' : null}
        </span>
      ))
    : output;

  const getDiffLines = () => {
    const before = input.split('\n');
    const after = output.split('\n');
    const maxLines = Math.max(before.length, after.length);
    const diff: { type: 'same' | 'add' | 'remove'; text: string }[] = [];

    for (let i = 0; i < maxLines; i += 1) {
      const left = before[i] ?? '';
      const right = after[i] ?? '';
      if (left === right) {
        diff.push({ type: 'same', text: left });
      } else {
        if (left) diff.push({ type: 'remove', text: left });
        if (right) diff.push({ type: 'add', text: right });
      }
    }

    return diff;
  };

  // In single-tab mode, always show output regardless of activeTab state
  const effectiveTab = showTabs ? activeTab : 'output';

  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab('output');
    }
  }, [availableTabs, activeTab]);

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
              {availableTabs.map((tab) => {
                const label = tab === 'output'
                  ? (error ? 'Error' : 'Output')
                  : tab === 'diff'
                    ? 'Diff'
                    : 'Explain';
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-xs font-medium px-2 py-0.5 rounded transition-colors ${
                      effectiveTab === tab
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="text-xs font-medium text-muted-foreground">
              {error ? 'Error' : 'Output'}
            </span>
          )}
          <div className="flex items-center gap-2">
            {goalStatus && (
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                  goalStatus.status === 'pass'
                    ? 'border-green-500/30 text-green-600 bg-green-500/10'
                    : goalStatus.status === 'fail'
                      ? 'border-red-500/30 text-red-500 bg-red-500/10'
                      : 'border-amber-500/30 text-amber-600 bg-amber-500/10'
                }`}
              >
                {goalStatus.label}
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
                highlightedOutput
              ) : (
                <span className="text-muted-foreground/50">
                  {emptyStatePrompt || 'Output will appear here...'}
                </span>
              )}
            </pre>
          </div>
        )}

        {/* Diff content (sed only) */}
        {effectiveTab === 'diff' && (
          <div className="flex flex-1">
            <LineNumbers count={Math.max(outputLines, inputLines)} />
            <pre className="flex-1 font-mono text-sm leading-5 p-3 pl-0 overflow-auto whitespace-pre-wrap min-h-[150px]">
              {isLoading ? (
                <span className="text-muted-foreground animate-pulse">Running...</span>
              ) : error ? (
                <span className="text-red-400">{error}</span>
              ) : output ? (
                getDiffLines().map((line, index) => (
                  <span
                    key={`${line.type}-${index}`}
                    className={
                      line.type === 'add'
                        ? 'text-emerald-500'
                        : line.type === 'remove'
                          ? 'text-red-500'
                          : 'text-muted-foreground'
                    }
                  >
                    {line.type === 'add' ? '+ ' : line.type === 'remove' ? '- ' : '  '}
                    {line.text}
                    {'\n'}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground/50">
                  Run the command to see a diff.
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
