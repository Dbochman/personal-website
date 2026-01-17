# Regex Log Parser

## Goal
Build regex-based log parsing rules interactively with live matching and export to common formats.

## Non-Goals
- Execute parsing against live log streams.
- Provide full grok libraries or vendor-specific parsers.

## Users & Use Cases
- Engineers creating grok or regex parsing rules.
- Teams documenting log formats and field extraction.

## Functional Requirements
- Paste sample log lines (1-20 suggested).
- Highlight and name fields in the log text.
- Provide pattern templates (timestamp, IP, UUID, etc.).
- Live preview of matches across all sample lines.
- Export to regex, grok, Logstash, Fluent Bit, and Vector snippets.

## UX Requirements
- Color-coded field highlights with consistent names.
- Clear indication of lines that do not fully match.
- One-click copy for export output.

## Async Implementation
- Live matching runs asynchronously with debounced input (150ms).
- Use a Web Worker to run regex matching for multi-line samples.
- Cancel stale match jobs when fields or logs change.
- Show a progress indicator for large inputs.

## Data Model
```typescript
interface ExtractedField {
  id: string;
  name: string;
  pattern: string;
  color: string;
}

interface MatchResult {
  line: string;
  matches: Record<string, string>;
  isFullMatch: boolean;
}
```

## Error Handling & Empty States
- Invalid regex shows the error and disables export until fixed.
- Empty log input shows example logs and templates.

## Performance Targets
- Match preview under 100ms for up to 100 lines.

## Test Plan
- Unit tests for export formatters.
- Unit tests for field-to-regex assembly.
- UI tests for field selection and match preview.

## Dependencies
- Existing UI components.
