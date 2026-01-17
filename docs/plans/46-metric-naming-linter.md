# Metric Naming Linter

## Goal
Lint metric names against Prometheus and OpenTelemetry conventions with actionable fixes.

## Non-Goals
- Validate against a live metrics registry.
- Enforce team-specific policies beyond provided rules.

## Users & Use Cases
- Engineers standardizing metric naming.
- Teams auditing metric inventories.

## Functional Requirements
- Paste metric names (one per line) with optional type hints.
- Select standard (Prometheus, OTel, custom).
- Run linting and show issues by severity.
- Provide suggested fixes and bulk apply for auto-fixable rules.
- Export results as text/JSON report.

## UX Requirements
- Color-coded severity (error/warning/info).
- Before/after diff for auto-fix suggestions.
- Summary stats for total issues.

## Async Implementation
- Linting runs asynchronously with debounced input (150ms).
- Use a worker for large metric lists (>1k names).
- Cancel stale lint runs when inputs change.
- Update results via `startTransition`.

## Data Model
```typescript
interface LintRule {
  id: string;
  severity: 'error' | 'warning' | 'info';
  check: (name: string, type?: string) => boolean;
  message: string;
  fix?: (name: string) => string;
}
```

## Error Handling & Empty States
- Empty input shows examples and quick-start guidance.
- Invalid characters are highlighted in context.

## Performance Targets
- Lint 5k names under 200ms in a worker.

## Test Plan
- Unit tests for each rule and fix output.
- UI tests for auto-fix and export.

## Dependencies
- Existing UI components.
