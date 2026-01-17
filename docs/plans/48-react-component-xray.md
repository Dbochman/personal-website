# React Component X-ray

## Goal
Analyze pasted React component code to visualize component trees and flag common render/performance anti-patterns.

## Non-Goals
- Execute or render user code.
- Provide full TypeScript type checking.

## Users & Use Cases
- Engineers reviewing component performance issues.
- Learners understanding component structure.

## Functional Requirements
- Paste React component code (TS/JSX).
- Parse into AST and derive component tree.
- Visualize tree with props and render frequency hints.
- Detect common issues (inline functions, missing keys, unstable deps).
- Provide suggested fixes and examples.

## UX Requirements
- Split view: code editor + tree + analysis panel.
- Issue list with line references and severity.
- Suggested fix panel with copyable snippets.

## Async Implementation
- Parse code in a Web Worker (Babel/TS parser).
- Debounce parse on input (200-300ms).
- Cancel stale parses on new edits.
- Update tree and issues via `startTransition`.

## Data Model
```typescript
interface Issue {
  id: string;
  name: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
}

interface TreeNode {
  id: string;
  component: string;
  props: string[];
  issues: Issue[];
  children: TreeNode[];
}
```

## Error Handling & Empty States
- Syntax errors are shown with parser error location.
- Empty input shows a sample component.

## Performance Targets
- Parse and analyze 500 lines of code under 300ms in a worker.

## Test Plan
- Unit tests for AST-based issue detection.
- UI tests for tree rendering and issue navigation.

## Dependencies
- `@babel/parser` or `typescript` parser.
- Existing UI components.
