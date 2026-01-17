# Prometheus Recording Rules Generator

## Goal
Generate Prometheus recording rules from a raw PromQL query with consistent naming conventions and exportable YAML.

## Non-Goals
- Validate against a live Prometheus server.
- Support every PromQL edge case or AST rewrite.

## Users & Use Cases
- Engineers optimizing expensive dashboard queries.
- Teams standardizing recording rule naming.

## Functional Requirements
- Input PromQL query with syntax highlighting.
- Analyze query for rate/aggregation/grouping hints.
- Configure naming (level:metric:operations).
- Configure evaluation interval and extra labels.
- Export YAML for rule groups.
- Presets for common HTTP and Kubernetes rules.

## UX Requirements
- Show analysis summary with clear recommendations.
- Inline preview of generated rule name and YAML.
- Bulk entry mode for multiple queries.

## Async Implementation
- Parse/analyze PromQL asynchronously with debounced input (200ms).
- Use a Web Worker for analysis to avoid blocking.
- Cancel stale analysis runs when query changes.
- YAML generation runs in background and updates preview via `startTransition`.

## Data Model
```typescript
interface QueryAnalysis {
  hasRate: boolean;
  hasAggregation: boolean;
  aggregationType?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  groupByLabels: string[];
  rangeVector?: string;
  estimatedCardinality: 'low' | 'medium' | 'high';
  recommendation: 'strongly recommended' | 'recommended' | 'optional';
  baseMetric: string;
}
```

## Error Handling & Empty States
- Invalid PromQL shows errors and disables export.
- Empty input shows example queries.

## Performance Targets
- Analysis under 150ms for typical queries.

## Test Plan
- Unit tests for query parsing heuristics.
- Unit tests for naming rules and YAML output.
- UI tests for presets and bulk mode.

## Dependencies
- `js-yaml` for YAML output.
- Existing UI components.
