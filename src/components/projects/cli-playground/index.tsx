import { useState, useCallback, useEffect, useTransition, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TopBar } from './TopBar';
import { CommandRow } from './CommandRow';
import { Workspace } from './Workspace';
import { ExplainDrawer } from './ExplainDrawer';
import { LearnHeader } from './LearnHeader';
import { executeCommand } from './engines';
import { explainCommand } from './explainer';
import type { Tool, Mode, ToolPreset, ToolState, PersistedToolState } from './types';
import { TOOL_CONFIGS, DEFAULT_STATE } from './types';

// Store per-tool state when switching tools
const toolStateCache = new Map<Tool, PersistedToolState>();

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

  const [mode, setMode] = useState<Mode>(() => {
    return (searchParams.get('mode') as Mode) || 'learn';
  });

  const [currentPresetIndex, setCurrentPresetIndex] = useState(0);
  const [explainOpen, setExplainOpen] = useState(true);

  // Current preset for Learn mode hints
  const currentPreset = useMemo(() => {
    return TOOL_CONFIGS[state.tool].presets[currentPresetIndex] || null;
  }, [state.tool, currentPresetIndex]);

  // Generate explanation for current command
  const explanation = useMemo(() => {
    if (!state.command.trim()) return null;
    return explainCommand(state.tool, state.command);
  }, [state.tool, state.command]);

  // Sync state to URL params (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      params.set('tool', state.tool);
      params.set('mode', mode);
      if (state.input !== TOOL_CONFIGS[state.tool].presets[0].input) {
        params.set('input', state.input);
      }
      if (state.command !== TOOL_CONFIGS[state.tool].presets[0].command) {
        params.set('cmd', state.command);
      }
      setSearchParams(params, { replace: true });
    }, 500);

    return () => clearTimeout(timeout);
  }, [state.tool, state.input, state.command, mode, setSearchParams]);

  // Global keyboard shortcut for Cmd/Ctrl+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleRun();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun]);

  const handleToolChange = useCallback((tool: Tool) => {
    // Save current tool state
    toolStateCache.set(state.tool, {
      input: state.input,
      command: state.command,
      presetIndex: currentPresetIndex,
    });

    // Restore cached state or use first preset
    const cached = toolStateCache.get(tool);
    if (cached) {
      setState({
        tool,
        input: cached.input,
        command: cached.command,
        output: '',
        error: undefined,
        isLoading: false,
      });
      setCurrentPresetIndex(cached.presetIndex);
    } else {
      const preset = TOOL_CONFIGS[tool].presets[0];
      setState({
        tool,
        input: preset.input,
        command: preset.command,
        output: '',
        error: undefined,
        isLoading: false,
      });
      setCurrentPresetIndex(0);
    }
  }, [state.tool, state.input, state.command, currentPresetIndex]);

  const handleModeChange = useCallback((newMode: Mode) => {
    setMode(newMode);
    // Auto-expand explain in learn mode
    if (newMode === 'learn') {
      setExplainOpen(true);
    }
  }, []);

  const handlePresetSelect = useCallback((preset: ToolPreset) => {
    const index = TOOL_CONFIGS[state.tool].presets.findIndex(p => p.name === preset.name);
    setCurrentPresetIndex(index >= 0 ? index : 0);
    setState((prev) => ({
      ...prev,
      input: preset.input,
      command: preset.command,
      output: '',
      error: undefined,
    }));
  }, [state.tool]);

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
    setCurrentPresetIndex(0);
  }, [state.tool]);

  const handleTryCommand = useCallback((command: string) => {
    setState((prev) => ({ ...prev, command }));
  }, []);

  return (
    <div className="space-y-4">
      {/* Top bar: tool tabs, examples, mode toggle, actions */}
      <TopBar
        tool={state.tool}
        mode={mode}
        onToolChange={handleToolChange}
        onModeChange={handleModeChange}
        onPresetSelect={handlePresetSelect}
        onReset={handleReset}
      />

      {/* Learn mode: Goal and Hint */}
      {mode === 'learn' && <LearnHeader preset={currentPreset} />}

      {/* Command row */}
      <CommandRow
        tool={state.tool}
        command={state.command}
        isLoading={state.isLoading || isPending}
        onCommandChange={handleCommandChange}
        onRun={handleRun}
      />

      {/* Workspace: Input | Output side-by-side */}
      <Workspace
        input={state.input}
        output={state.output}
        error={state.error}
        isLoading={state.isLoading || isPending}
        onInputChange={handleInputChange}
      />

      {/* Explain drawer (Learn mode only) */}
      {mode === 'learn' && (
        <ExplainDrawer
          explanation={explanation}
          isOpen={explainOpen}
          onOpenChange={setExplainOpen}
          onTryCommand={handleTryCommand}
        />
      )}
    </div>
  );
}
