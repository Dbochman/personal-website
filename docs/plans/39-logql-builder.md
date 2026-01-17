# LogQL / CloudWatch Insights Builder

## Goal
Provide a visual builder for LogQL and CloudWatch Insights queries that produces valid, copyable queries without executing them.

## Non-Goals
- Execute queries against Loki or CloudWatch.
- Provide full parsing of arbitrary existing queries.

## Users & Use Cases
- Engineers who know the intent but not the syntax.
- Teams standardizing log query templates.

## Functional Requirements
- Language toggle (LogQL vs CloudWatch Insights).
- LogQL stream selector with label matchers.
- Pipeline stage builder (filters, parsers, label filters, formatters).
- CloudWatch command builder (fields, filter, stats, sort, limit, parse).
- Query preview with syntax highlighting and copy.
- Presets for common queries.

## UX Requirements
- Staged builder with clear ordering and add/remove controls.
- Compact summary of each stage/command.
- Mobile stacked layout with preview below.

## Async Implementation
- Debounced query generation (150-250ms).
- Async validation for stage input and regex patterns.
- Use cancellation tokens to avoid stale preview updates.
- Preview updates via `startTransition` to keep inputs responsive.

## Data Model
```typescript
interface LogQLState {
  labels: LabelMatcher[];
  stages: LogQLStage[];
}

interface CloudWatchState {
  commands: CWCommand[];
}
```

## Error Handling & Empty States
- Missing labels or stages show example suggestions.
- Invalid regex patterns show inline errors.
- Preview still renders with best-effort formatting.

## Performance Targets
- Query generation under 16ms for typical stage counts.

## Test Plan
- Unit tests for LogQL and CloudWatch query generation.
- UI tests for stage add/remove and language toggle.

## Dependencies
- Existing UI components.
- Optional syntax highlighting library.
