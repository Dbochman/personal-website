# CLI Tool Playground

## Goal
Provide interactive, in-browser demos for common CLI tools with live input/output and explanations.

## Non-Goals
- Execute arbitrary system commands.
- Provide a full terminal emulator or file system access.

## Users & Use Cases
- Learners experimenting with jq/grep/sed/awk.
- Teams building interactive training content.

## Functional Requirements
- Tool selector with jq, grep, sed, awk (phase 1).
- Input editor with sample data and presets.
- Command editor with syntax highlighting.
- Run command and show output with errors.
- Explanation panel that breaks down command parts.
- Shareable URL state (input + command).

## UX Requirements
- Clear separation of input, command, and output.
- Safe defaults and reset to example.
- Output panel supports copy and clear.

## Async Implementation
- Run tool execution asynchronously via WASM or JS workers.
- Load WASM modules lazily with progress indication.
- Cancel in-flight executions when inputs change.
- Use `startTransition` for output updates to keep typing responsive.

## Data Model
```typescript
interface ToolState {
  tool: 'jq' | 'grep' | 'sed' | 'awk';
  input: string;
  command: string;
  output: string;
  error?: string;
}
```

## Error Handling & Empty States
- Invalid JSON or command errors show in output with guidance.
- Empty input shows a tool-specific example.

## Performance Targets
- Command execution under 300ms for typical examples.
- WASM load under 1s on first use (cached after).

## Test Plan
- Unit tests for example library and URL encoding.
- Integration tests for jq execution and error handling.

## Dependencies
- `jq-web` (WASM) or similar.
- Existing UI components.
