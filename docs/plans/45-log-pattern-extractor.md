# Log Pattern Extractor

## Goal
Detect recurring log patterns from raw log lines and output structured parsing templates.

## Non-Goals
- Streaming log ingestion.
- ML-based classification or provider-specific integrations.

## Users & Use Cases
- Engineers onboarding unknown log formats.
- Teams creating initial parsing rules quickly.

## Functional Requirements
- Paste 10-100 log lines.
- Auto-detect patterns and group by template.
- Show pattern match counts and percentages.
- Allow manual edits to pattern templates and field names.
- Export patterns to regex/grok/logstash format.

## UX Requirements
- Pattern cards with examples and match stats.
- Field summary with inferred types.
- Unmatched lines section with guidance.

## Async Implementation
- Tokenization and pattern detection run in a Web Worker.
- Debounce analysis (250ms) on input changes.
- Provide progress indicator for large inputs.
- Cancel stale analyses when inputs change.

## Data Model
```typescript
interface Pattern {
  id: string;
  template: string;
  fields: Field[];
  matchCount: number;
  percentage: number;
}

interface Field {
  name: string;
  type: 'timestamp' | 'ip' | 'number' | 'word' | 'uuid' | 'unknown';
}
```

## Error Handling & Empty States
- Empty input shows example logs and tips.
- Too many lines shows a warning and enforces a limit.

## Performance Targets
- Analyze 1k lines under 500ms in a worker.

## Test Plan
- Unit tests for tokenization and grouping heuristics.
- UI tests for editing and export.

## Dependencies
- Existing UI components.
