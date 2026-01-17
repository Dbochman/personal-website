import { useState, useCallback, useEffect, useTransition } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ToolSelector } from './ToolSelector';
import { PresetSelector } from './PresetSelector';
import { InputEditor } from './InputEditor';
import { CommandEditor } from './CommandEditor';
import { OutputPanel } from './OutputPanel';
import { executeCommand } from './engines';
import type { Tool, ToolPreset, ToolState } from './types';
import { TOOL_CONFIGS, DEFAULT_STATE } from './types';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw } from 'lucide-react';

export default function CliPlayground() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Initialize state from URL params or defaults
  const [state, setState] = useState<ToolState>(() => {
    const tool = (searchParams.get('tool') as Tool) || DEFAULT_STATE.tool;
    const input = searchParams.get('input') || TOOL_CONFIGS[tool].presets[0].input;
    const command = searchParams.get('cmd') || TOOL_CONFIGS[tool].presets[0].command;

    return {
      ...DEFAULT_STATE,
      tool,
      input,
      command,
    };
  });

  // Sync state to URL params (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      params.set('tool', state.tool);
      if (state.input !== TOOL_CONFIGS[state.tool].presets[0].input) {
        params.set('input', state.input);
      }
      if (state.command !== TOOL_CONFIGS[state.tool].presets[0].command) {
        params.set('cmd', state.command);
      }
      setSearchParams(params, { replace: true });
    }, 500);

    return () => clearTimeout(timeout);
  }, [state.tool, state.input, state.command, setSearchParams]);

  const handleToolChange = useCallback((tool: Tool) => {
    const preset = TOOL_CONFIGS[tool].presets[0];
    setState({
      tool,
      input: preset.input,
      command: preset.command,
      output: '',
      error: undefined,
      isLoading: false,
    });
  }, []);

  const handlePresetSelect = useCallback((preset: ToolPreset) => {
    setState((prev) => ({
      ...prev,
      input: preset.input,
      command: preset.command,
      output: '',
      error: undefined,
    }));
  }, []);

  const handleInputChange = useCallback((input: string) => {
    setState((prev) => ({ ...prev, input }));
  }, []);

  const handleCommandChange = useCallback((command: string) => {
    setState((prev) => ({ ...prev, command }));
  }, []);

  const handleRun = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const result = await executeCommand(state.tool, state.input, state.command);
      startTransition(() => {
        setState((prev) => ({
          ...prev,
          output: result,
          error: undefined,
          isLoading: false,
        }));
      });
    } catch (err) {
      startTransition(() => {
        setState((prev) => ({
          ...prev,
          output: '',
          error: err instanceof Error ? err.message : 'Unknown error',
          isLoading: false,
        }));
      });
    }
  }, [state.tool, state.input, state.command]);

  const handleClear = useCallback(() => {
    setState((prev) => ({ ...prev, output: '', error: undefined }));
  }, []);

  const handleReset = useCallback(() => {
    const preset = TOOL_CONFIGS[state.tool].presets[0];
    setState({
      tool: state.tool,
      input: preset.input,
      command: preset.command,
      output: '',
      error: undefined,
      isLoading: false,
    });
  }, [state.tool]);

  // Run on Enter key in command input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleRun();
      }
    },
    [handleRun]
  );

  return (
    <div className="space-y-6" onKeyDown={handleKeyDown}>
      {/* Tool selector and presets */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <ToolSelector value={state.tool} onChange={handleToolChange} />
        </div>
        <div className="flex gap-2">
          <PresetSelector tool={state.tool} onSelect={handlePresetSelect} />
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Input and command editors */}
      <div className="grid gap-4 lg:grid-cols-2">
        <InputEditor
          value={state.input}
          onChange={handleInputChange}
          tool={state.tool}
        />
        <div className="space-y-4">
          <CommandEditor
            tool={state.tool}
            value={state.command}
            onChange={handleCommandChange}
          />
          <Button
            onClick={handleRun}
            disabled={state.isLoading || isPending}
            className="w-full sm:w-auto"
          >
            <Play className="h-4 w-4 mr-1" />
            Run
          </Button>
        </div>
      </div>

      {/* Output */}
      <OutputPanel
        output={state.output}
        error={state.error}
        isLoading={state.isLoading || isPending}
        onClear={handleClear}
      />
    </div>
  );
}
