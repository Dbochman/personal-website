# CLI Tool Playground

## Goal
Provide interactive, in-browser demos for common CLI tools with live input/output and explanations, designed as a learning-first experience with tight feedback loops.

## Non-Goals
- Execute arbitrary system commands.
- Provide a full terminal emulator or file system access.
- Use WASM for tool execution (pure JS implementations for simplicity).

## Users & Use Cases
- Learners experimenting with jq/grep/sed/awk.
- Teams building interactive training content.
- Users exploring commands before running them on real data.

## UI Architecture

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ [jq] [grep] [sed] [awk]  Examples▼  [Learn][Play]  ↺ Share │  TopBar
├─────────────────────────────────────────────────────────────┤
│ Goal: Extract the user's name from JSON                     │  LearnHeader
│ Hint: Try the command: .name                                │  (Learn mode only)
├─────────────────────────────────────────────────────────────┤
│ $ jq [ .name                                  ] [ Run ⌘↵ ]  │  CommandRow
├─────────────────────────────────────────────────────────────┤
│  stdin                     │  stdout                        │
│ ┌─────────────────────────┐│┌──────────────────────────────┐│  Workspace
│ │ 1│ {"name": "Alice"}    │││ 1│ "Alice"                   ││
│ │  │                      │││  │                           ││
│ └─────────────────────────┘│└──────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│ ▼ Explain this command                                      │  ExplainDrawer
│  What it does: Extracts the "name" field from the object    │  (Learn mode only)
│  Try next: [Get all keys →] [Get type →]                    │
└─────────────────────────────────────────────────────────────┘
```

### Components

#### TopBar (`TopBar.tsx`)
- **Tool Tabs**: Toggle group for jq/grep/sed/awk selection
- **Examples Dropdown**: Preset selector using Select component
- **Mode Toggle**: Learn/Play switch (Learn shows educational scaffolding)
- **Actions**: Reset and Share buttons

#### CommandRow (`CommandRow.tsx`)
- **Terminal-style prefix**: Shows `$ jq` with the current tool name
- **Command input**: Full-width text input
- **Run button**: Shows `Run ⌘↵` hint, triggers execution
- **Keyboard shortcut**: Cmd/Ctrl+Enter runs command globally

#### Workspace (`Workspace.tsx`)
- **Side-by-side panels**: stdin (editable) | stdout (read-only)
- **Line numbers**: Both panels show line numbers
- **Copy button**: Copy output to clipboard
- **Error state**: Shows stderr in red with "stderr" label
- **Mobile responsive**: Input panel collapsible on small screens

#### LearnHeader (`LearnHeader.tsx`)
- **Goal**: Shows preset description
- **Hint**: Shows suggested command to try
- Only visible in Learn mode

#### ExplainDrawer (`ExplainDrawer.tsx`)
- **Collapsible**: Uses Radix Collapsible component
- **What it does**: Plain English summary of command
- **Flags used**: Explains each flag with meaning
- **Try next**: Clickable suggestions to explore related commands

### State Management

#### Tool State (`types.ts`)
```typescript
export type Tool = 'jq' | 'grep' | 'sed' | 'awk';
export type Mode = 'learn' | 'playground';

export interface ToolState {
  tool: Tool;
  input: string;
  command: string;
  output: string;
  error?: string;
  isLoading: boolean;
}

export interface PersistedToolState {
  input: string;
  command: string;
  presetIndex: number;
}
```

#### Per-Tool State Caching
- When switching tools, current state is cached in a Map
- Returning to a tool restores previous input/command/preset
- Fresh sessions start with first preset for each tool

#### URL State Persistence
- Parameters: `?tool=jq&mode=learn&input=...&cmd=...`
- Debounced sync (500ms) to avoid URL churn
- Non-default values only stored (reduces URL length)

### Tool Implementations (`engines/`)

All tools are implemented in pure JavaScript for simplicity:

#### jq-lite
- Field access: `.name`, `.user.email`
- Array iteration: `.[]`, `.[0]`, `.items[]`
- Filters: `select(.age > 21)`, `select(.active == true)`
- Built-ins: `keys`, `values`, `length`, `type`
- Pipes: `.items[] | .name`

#### grep-lite
- Pattern matching: `pattern`
- Flags: `-i` (case-insensitive), `-v` (invert), `-n` (line numbers), `-E` (extended regex)
- Combination: `-in pattern`

#### sed-lite
- Substitution: `s/pattern/replacement/`, `s/pattern/replacement/g`
- Flags: `g` (global), `i` (case-insensitive)
- Delete: `/pattern/d`

#### awk-lite
- Print fields: `{print $1}`, `{print $1, $3}`
- Field separator: `-F: {print $1}`
- Conditions: `$1 > 100 {print $0}`
- Built-in variables: NR, NF, $0

### Command Explainer (`explainer.ts`)

Generates contextual explanations based on command analysis:

```typescript
export interface CommandExplanation {
  summary: string;                          // "Extracts the 'name' field..."
  flags: { flag: string; meaning: string }[]; // ["-i", "Case-insensitive"]
  tryNext: { label: string; command: string }[]; // ["Get keys", "keys"]
}
```

Each tool has custom parsing logic:
- **jq**: Recognizes `.field`, `.[]`, `select()`, `keys`, etc.
- **grep**: Parses flag combinations and pattern
- **sed**: Identifies substitution vs delete patterns
- **awk**: Detects field printing, separators, conditions

## Functional Requirements
- [x] Tool selector with jq, grep, sed, awk tabs
- [x] Input editor with sample data and presets
- [x] Command editor with terminal-style prefix
- [x] Run command with Cmd/Ctrl+Enter shortcut
- [x] Side-by-side stdin/stdout with line numbers
- [x] Explanation panel that breaks down command parts
- [x] "Try next" suggestions for progressive learning
- [x] Shareable URL state (tool + mode + input + command)
- [x] Per-tool state persistence when switching

## UX Requirements
- [x] Learn/Play mode toggle for educational scaffolding
- [x] Clear visual hierarchy: command → output
- [x] Safe defaults and reset to example
- [x] Output panel supports copy
- [x] Mobile responsive with collapsible input panel

## Async Implementation
- Run tool execution asynchronously via pure JS functions
- Use `startTransition` for output updates to keep typing responsive
- Loading state shows "Running..." in output panel

## Error Handling & Empty States
- Invalid JSON or command errors show in stderr panel (red text)
- Empty input shows a tool-specific example
- Explanation panel provides guidance for common mistakes

## Performance Targets
- Command execution under 100ms for typical examples (pure JS is fast)
- No WASM loading delays

## Test Plan
- Unit tests for example library and URL encoding
- Integration tests for each tool engine
- Visual testing of responsive layouts

## Dependencies
- `@radix-ui/react-collapsible` - ExplainDrawer
- `@radix-ui/react-toggle-group` - Tool tabs
- `@radix-ui/react-select` - Examples dropdown
- Existing UI components (Button, etc.)

## Files Structure
```
src/components/projects/cli-playground/
├── index.tsx           # Main component orchestration
├── types.ts            # Types and tool configs
├── TopBar.tsx          # Tool tabs, examples, mode toggle
├── CommandRow.tsx      # Terminal-style command input
├── Workspace.tsx       # Side-by-side stdin/stdout panels
├── LearnHeader.tsx     # Goal and Hint display
├── ExplainDrawer.tsx   # Collapsible command explanation
├── explainer.ts        # Command explanation generator
└── engines/
    ├── index.ts        # Command router
    ├── jq.ts           # jq-lite implementation
    ├── grep.ts         # grep-lite implementation
    ├── sed.ts          # sed-lite implementation
    └── awk.ts          # awk-lite implementation
```
