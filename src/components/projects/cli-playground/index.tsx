import { useState, useCallback, useEffect, useTransition, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TopBar } from './TopBar';
import { CommandRow } from './CommandRow';
import { Workspace } from './Workspace';
import { LearnHeader } from './LearnHeader';
import { executeCommand } from './engines';
import { explainCommand } from './explainer';
import { trackToolEvent } from '@/lib/trackToolEvent';
import type { Tool, Mode, ToolPreset, ToolState, PersistedToolState } from './types';
import { TOOL_CONFIGS, DEFAULT_STATE } from './types';

// Valid tool and mode values for URL param validation
const VALID_TOOLS = Object.keys(TOOL_CONFIGS) as Tool[];
const VALID_MODES: Mode[] = ['learn', 'playground'];

function isValidTool(value: string | null): value is Tool {
  return value !== null && VALID_TOOLS.includes(value as Tool);
}

function isValidMode(value: string | null): value is Mode {
  return value !== null && VALID_MODES.includes(value as Mode);
}

// Store per-tool state when switching tools
const toolStateCache = new Map<Tool, PersistedToolState>();

export default function CliPlayground() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const runIdRef = useRef(0); // Track run ID to prevent stale results

  // Initialize state from URL params or defaults (with validation)
  const [state, setState] = useState<ToolState>(() => {
    const toolParam = searchParams.get('tool');
    const tool = isValidTool(toolParam) ? toolParam : DEFAULT_STATE.tool;
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
    const modeParam = searchParams.get('mode');
    return isValidMode(modeParam) ? modeParam : 'learn';
  });

  const isRunning = state.isLoading || isPending;

  const [currentPresetIndex, setCurrentPresetIndex] = useState(0);

  // Current preset for Learn mode hints
  const currentPreset = useMemo(() => {
    return TOOL_CONFIGS[state.tool].presets[currentPresetIndex] || null;
  }, [state.tool, currentPresetIndex]);

  // Generate explanation for current command
  const explanation = useMemo(() => {
    if (!state.command.trim()) return null;
    return explainCommand(state.tool, state.command);
  }, [state.tool, state.command]);

  // Generate lesson-aware empty state prompt
  const emptyStatePrompt = useMemo(() => {
    if (mode !== 'learn' || !currentPreset) return undefined;

    // For kubectl, create a specific prompt based on the lesson
    if (state.tool === 'kubectl' && currentPreset.namespace) {
      const action = state.command.split(' ')[0] || 'get';
      return `Press ⌘+Enter to ${action} resources in ${currentPreset.namespace}`;
    }

    // For other tools, use the preset description
    return `Press ⌘+Enter to run the command`;
  }, [mode, currentPreset, state.tool, state.command]);

  const goalStatus = useMemo(() => {
    if (mode !== 'learn' || !currentPreset) return undefined;
    const expectedIncludes = currentPreset.expectedOutputIncludes;
    const expectedRegex = currentPreset.expectedOutputRegex;
    if (!expectedIncludes && !expectedRegex) return undefined;

    if (state.isLoading || isRunning) {
      return { status: 'pending' as const, label: 'Checking...' };
    }
    if (!state.output && !state.error) {
      return { status: 'pending' as const, label: 'Run to check' };
    }
    if (state.error) {
      return { status: 'fail' as const, label: 'Goal not met' };
    }

    let pass = true;
    if (expectedIncludes) {
      pass = pass && state.output.includes(expectedIncludes);
    }
    if (expectedRegex) {
      try {
        pass = pass && new RegExp(expectedRegex).test(state.output);
      } catch {
        pass = false;
      }
    }

    return { status: pass ? 'pass' as const : 'fail' as const, label: pass ? 'Goal met' : 'Goal not met' };
  }, [mode, currentPreset, state.output, state.error, state.isLoading, isRunning]);

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

  const handleRun = useCallback(async () => {
    // Increment run ID to track this specific execution
    const currentRunId = ++runIdRef.current;

    trackToolEvent({ tool_name: 'cli_playground', action: 'command_run', event_label: state.tool });

    setState((prev) => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const result = await executeCommand(state.tool, state.input, state.command, {
        fixture: currentPreset?.fixture,
        namespace: currentPreset?.namespace,
      });

      // Ignore stale results if user switched tools/commands while running
      if (runIdRef.current !== currentRunId) return;

      startTransition(() => {
        setState((prev) => ({
          ...prev,
          output: result,
          error: undefined,
          isLoading: false,
        }));
      });
    } catch (err) {
      // Ignore stale errors if user switched tools/commands while running
      if (runIdRef.current !== currentRunId) return;

      startTransition(() => {
        setState((prev) => ({
          ...prev,
          output: '',
          error: err instanceof Error ? err.message : 'Unknown error',
          isLoading: false,
        }));
      });
    }
  }, [state.tool, state.input, state.command, currentPreset?.fixture, currentPreset?.namespace]);

  // Auto-run command in Learn mode when lesson loads
  const hasAutoRun = useRef(false);
  useEffect(() => {
    if (mode === 'learn' && !hasAutoRun.current && !state.output && !state.isLoading) {
      hasAutoRun.current = true;
      handleRun();
    }
  }, [mode, state.output, state.isLoading, handleRun]);

  // Reset auto-run flag when preset changes
  useEffect(() => {
    hasAutoRun.current = false;
  }, [currentPresetIndex, state.tool]);

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
    // Invalidate any in-flight requests
    runIdRef.current++;

    trackToolEvent({ tool_name: 'cli_playground', action: 'tool_select', event_label: tool });

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
    trackToolEvent({ tool_name: 'cli_playground', action: 'mode_switch', event_label: newMode });
  }, []);

  const handlePresetSelect = useCallback((preset: ToolPreset) => {
    // Invalidate any in-flight requests
    runIdRef.current++;

    trackToolEvent({ tool_name: 'cli_playground', action: 'preset_select', event_label: preset.name });

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
      {/* Top bar: tool tabs, lesson selector, mode toggle, actions */}
      <TopBar
        tool={state.tool}
        mode={mode}
        currentPreset={currentPreset}
        onToolChange={handleToolChange}
        onModeChange={handleModeChange}
        onPresetSelect={handlePresetSelect}
        onReset={handleReset}
      />

      {/* Learn mode: Goal and command chips */}
      {mode === 'learn' && (
        <LearnHeader
          tool={state.tool}
          preset={currentPreset}
          onTryCommand={handleTryCommand}
        />
      )}

      {/* Command row */}
      <CommandRow
        tool={state.tool}
        command={state.command}
        isLoading={state.isLoading || isPending}
        onCommandChange={handleCommandChange}
        onRun={handleRun}
      />

      {/* Workspace: Input | Output (with Explain tab in Learn mode) */}
      <Workspace
        input={state.input}
        output={state.output}
        error={state.error}
        isLoading={state.isLoading || isPending}
        mode={mode}
        tool={state.tool}
        command={state.command}
        goalStatus={goalStatus}
        explanation={explanation}
        hideStdin={TOOL_CONFIGS[state.tool].hideStdin}
        emptyStatePrompt={emptyStatePrompt}
        onInputChange={handleInputChange}
        onTryCommand={handleTryCommand}
      />
    </div>
  );
}
