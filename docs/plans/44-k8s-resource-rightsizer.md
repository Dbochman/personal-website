# K8s Resource Right-Sizer

## Goal
Recommend Kubernetes CPU/memory requests and limits based on observed utilization and risk preference.

## Non-Goals
- Connect to live clusters or metrics endpoints.
- Provide guaranteed safe values for every workload.

## Users & Use Cases
- Platform teams tuning resource requests/limits.
- Developers evaluating safe right-sizing steps.

## Functional Requirements
- Input current requests/limits and replicas.
- Input utilization percentiles (P50/P95/P99/Max).
- Goal slider (efficiency <-> safety).
- Recommendations with reasoning and risk indicators.
- Savings/impact calculation and YAML snippet output.
- Preset profiles (web server, worker, db).

## UX Requirements
- Side-by-side current vs recommended values.
- Warnings for risky configurations.
- Clear units with auto-conversion (m, Mi, Gi).

## Async Implementation
- Debounced calculations (100-150ms) on input changes.
- Use a Web Worker for unit parsing and recommendation logic.
- Cancel stale calculations when inputs change.
- Updates via `startTransition` to avoid UI jank.

## Data Model
```typescript
interface ResourceUsage {
  p50: number;
  p95: number;
  p99: number;
  max: number;
}

interface CurrentConfig {
  requests: number;
  limits: number;
}

interface Recommendation {
  requests: number;
  limits: number;
  reasoning: string;
  savings: number;
  risk: 'low' | 'medium' | 'high';
}
```

## Error Handling & Empty States
- Invalid unit input highlights field and blocks export.
- Missing utilization data shows guidance for required percentiles.

## Performance Targets
- Recommendations computed under 50ms for typical inputs.

## Test Plan
- Unit tests for unit parsing and calculations.
- UI tests for slider behavior and YAML export.

## Dependencies
- Existing UI components.
