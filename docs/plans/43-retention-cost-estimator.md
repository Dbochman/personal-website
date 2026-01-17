# Retention Cost Estimator

## Goal
Estimate monthly observability costs based on usage volumes, retention, and provider pricing models.

## Non-Goals
- Connect to provider APIs.
- Provide exact billing or contract-specific pricing.

## Users & Use Cases
- Engineering leaders comparing providers.
- SREs exploring retention/cost tradeoffs.

## Functional Requirements
- Provider selector (Datadog, Grafana Cloud, New Relic, Self-hosted).
- Inputs for metrics, logs, traces, and optional infra.
- Monthly cost breakdown by category.
- Side-by-side comparison view across providers.
- Preset usage profiles and cost optimization tips.

## UX Requirements
- Clear units and helper tooltips.
- Breakdown chart with category percentages.
- "Last updated" pricing date and disclaimer.

## Async Implementation
- Pricing models loaded asynchronously from JSON.
- Debounced recalculation (150ms) on input changes.
- Use a Web Worker for heavy comparison calculations.
- Cancel stale computations on rapid input changes.

## Data Model
```typescript
interface UsageInput {
  metrics: {
    activeSeries: number;
    customMetrics: number;
    dataPointsPerMinute: number;
  };
  logs: {
    dailyIngestionGB: number;
    indexedGB: number;
    retentionDays: number;
  };
  traces: {
    spansPerMonth: number;
    indexedSpansPerMonth: number;
    retentionDays: number;
  };
  infrastructure?: {
    hosts: number;
    containers: number;
  };
}

interface CostBreakdown {
  metrics: number;
  logs: number;
  traces: number;
  infrastructure: number;
  total: number;
}
```

## Error Handling & Empty States
- Missing or invalid numeric input shows field-level errors.
- Provider with missing pricing data is disabled with a note.

## Performance Targets
- Recompute under 50ms for a single provider.
- Comparison of 4 providers under 200ms.

## Test Plan
- Unit tests for provider pricing formulas.
- UI tests for comparison mode and presets.

## Dependencies
- Optional chart library for breakdown visualization.
- Existing UI components.
